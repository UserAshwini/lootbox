"use client";
import {
  Input,
  NativeSelectField,
  NativeSelectRoot,
  Tabs,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CoinDetails,
  CoinList,
  extractInnerTypes,
  getAptosWallet,
  getCoinDetails,
  getUsersCoins,
} from "@/utils/utils";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import UnOpenedTab from "@/components/unopenedtab";
import OpenedTab from "@/components/openedtab";
import { toaster } from "@/components/ui/toaster";
import { InputGroup } from "@/components/ui/input-group";
import { LuSearch } from "react-icons/lu";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { wagmiConfig } from "./provider/WalletProvider";
import {
  LOOTBOX_MANAGER_ABI,
  LOOTBOX_MANAGER_ADDRESS,
  LOOTBOX_TOKEN_ABI,
} from "@/constants/contracts";
import { log } from "console";
import { formatEther, parseEther } from "viem";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Modal from "@/components/ui/modal";
import { PinataSDK } from "pinata-web3";
import ImageUpload from "@/components/ui/ImageUpload";

// interface AptosWallet {
//   signAndSubmitTransaction: (transaction: object) => Promise<{ hash: string }>;
// }

// declare global {
//   interface Window {
//     aptos?: AptosWallet;
//   }
// }
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

export interface LootBox {
  id: number;
  creator: string;
  rewardLowerLimit: number;
  rewardToken: string;
  rewardUpperLimit: number;
  totalRemainingReward: number;
  tokenName: string;
  tokenSymbol: string;
  image: string;
}

export default function Home() {
  // const resource_account =
  //   "0xfe66adce60bc8f5836874671650abd3ed7415b4a0dc4fcb11043d27abe49c3b0";

  const [lootBoxes, setLootBoxes] = useState<LootBox[] | null>(null);
  const [openedBox, setOpenedBox] = useState<LootBox[]>();
  const [claimedBox, setClaimedBox] = useState<LootBox[]>();
  const [currentID, setCurrentID] = useState<number>(0);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [coinsList, setCoinsList] = useState<CoinList[]>([]);
  const [minCoinLimit, setMinCoinLimit] = useState<number>(0);
  const [maxCoinLimit, setMaxCoinLimit] = useState<number>(10);
  const [selectedCoin, setSelectedCoin] = useState<string>();
  const [invalidCoin, setInvalidCoin] = useState<boolean>(false);
  const [invalidRange, setInvalidRange] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("Unopened");

  const [search, setSearch] = useState<string>();
  const [coinDetails, setCoinDetails] = useState<CoinDetails>();

  const config = new AptosConfig({ network: Network.DEVNET });
  const aptos = new Aptos(config);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenButtonModalOpen, setIsOpenButtonModalOpen] = useState(false);
  const [isClaimButtonModalOpen, setIsClaimButtonModalOpen] = useState(false);
  const [createLootboxTransactionStatus, setCreateLootboxTransactionStatus] =
    useState("");
  const [createLootboxTransactionHash, setCreateLootboxTransactionHash] =
    useState("");
  const [openLootboxTransactionStatus, setOpenLootboxTransactionStatus] =
    useState("");
  const [openLootboxTransactionHash, setOpenLootboxTransactionHash] =
    useState("");
  const [claimLootboxTransactionStatus, setClaimLootboxTransactionStatus] =
    useState("");
  const [claimLootboxTransactionHash, setClaimLootboxTransactionHash] =
    useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalRewards, setTotalRewards] = useState<number | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState(null);

  const { address } = useAccount();

  const isAddressEntered =
    tokenAddress.trim().length > 0 &&
    tokenAddress !== "0x0000000000000000000000000000000000000000";
  const isNameOrSymbolEntered =
    tokenName.trim().length > 0 || tokenSymbol.trim().length > 0;
  const isInvalid = isAddressEntered && isNameOrSymbolEntered;

  if (isNameOrSymbolEntered && tokenAddress === "") {
    setTokenAddress("0x0000000000000000000000000000000000000000");
  }

  const handleTotalRewardsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTotalRewards(value);

    if (value < maxCoinLimit) {
      setRewardError(
        "Total rewards should be greater than the max coin limit."
      );
    } else {
      setRewardError(null);
    }
  };

  useEffect(() => {
    getLootBoxData();

    getCoinList();
  }, []);

  const getCoinList = async () => {
    const wallet = getAptosWallet();
    const account = await wallet?.account();

    if (account?.address) {
      const coinsList = await getUsersCoins(account.address);
      setCoinsList(coinsList.items);
    }
  };

  const getLootBoxData = async () => {
    try {
      setLoading(true);
      let lastId = 0;

      const lastCount: any = await readContract(wagmiConfig, {
        abi: LOOTBOX_MANAGER_ABI,
        address: LOOTBOX_MANAGER_ADDRESS,
        functionName: "getCurrentLootBoxCount",
      });
      lastId = parseInt(lastCount);

      const lootBoxesData = await Promise.all(
        Array.from({ length: lastId }, (_, i) =>
          readContract(wagmiConfig, {
            abi: LOOTBOX_MANAGER_ABI,
            address: LOOTBOX_MANAGER_ADDRESS,
            functionName: "getLootBox",
            args: [i],
          })
        )
      );

      // First filter out lootboxes with no remaining rewards
      const activeLootBoxes = lootBoxesData.filter(
        (lootboxData: any) => lootboxData.totalRemainingReward > 0n
      );

      // Then process each active lootbox
      const processedLootBoxes = await Promise.all(
        activeLootBoxes.map(
          async (lootboxData: any, index: number): Promise<LootBox | null> => {
            try {
              console.log(lootboxData.rewardToken);
              const [tokenName, tokenSymbol, tokenUri] = await Promise.all([
                readContract(wagmiConfig, {
                  abi: LOOTBOX_TOKEN_ABI,
                  address: lootboxData.rewardToken,
                  functionName: "name",
                }),
                readContract(wagmiConfig, {
                  abi: LOOTBOX_TOKEN_ABI,
                  address: lootboxData.rewardToken,
                  functionName: "symbol",
                }),
                readContract(wagmiConfig, {
                  abi: LOOTBOX_TOKEN_ABI,
                  address: lootboxData.rewardToken,
                  functionName: "s_tokenURI",
                }),
              ]);

              console.log(tokenUri);
              return {
                id: index,
                creator: lootboxData.creator,
                rewardLowerLimit: Number(
                  formatEther(lootboxData.rewardLowerLimit)
                ),
                rewardToken: lootboxData.rewardToken,
                rewardUpperLimit: Number(
                  formatEther(lootboxData.rewardUpperLimit)
                ),
                totalRemainingReward: Number(
                  formatEther(lootboxData.totalRemainingReward)
                ),
                tokenName: String(tokenName),
                tokenSymbol: String(tokenSymbol),
                image: String(tokenUri),
              };
            } catch (error: any) {
              console.error("Error fetching token data:", error);
              return null; // This can return null
            }
          }
        )
      );

      console.log("processedLootBoxes", processedLootBoxes);

      // Filter out null values and ensure type safety
      const validLootBoxes: LootBox[] = processedLootBoxes.filter(
        (box): box is LootBox => box !== null
      );

      setLootBoxes(validLootBoxes);
      setCurrentID(lastId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const getLootBoxData = async () => {
  //   try {
  //     setLoading(true);
  //     let lastId = 0;

  //     const lastCount: any = await readContract(wagmiConfig, {
  //       abi: LOOTBOX_MANAGER_ABI,
  //       address: LOOTBOX_MANAGER_ADDRESS,
  //       functionName: "getCurrentLootBoxCount",
  //     });
  //     lastId = parseInt(lastCount);

  //     const lootBoxesData = await Promise.all(
  //       Array.from({ length: lastId }, (_, i) =>
  //         readContract(wagmiConfig, {
  //           abi: LOOTBOX_MANAGER_ABI,
  //           address: LOOTBOX_MANAGER_ADDRESS,
  //           functionName: "getLootBox",
  //           args: [i],
  //         })
  //       )
  //     );
  //     const filteredLootBoxes: LootBox[] = await Promise.all(
  //       lootBoxesData
  //         .filter((lootboxData: any) => lootboxData.totalRemainingReward > 0n)
  //         .map(async (lootboxData: any, index: number) => {
  //           try {
  //             console.log(lootboxData.rewardToken);
  //             const [tokenName, tokenSymbol, tokenUri] = await Promise.all([
  //               readContract(wagmiConfig, {
  //                 abi: LOOTBOX_TOKEN_ABI,
  //                 address: lootboxData.rewardToken,
  //                 functionName: "name",
  //               }),
  //               readContract(wagmiConfig, {
  //                 abi: LOOTBOX_TOKEN_ABI,
  //                 address: lootboxData.rewardToken,
  //                 functionName: "symbol",
  //               }),

  //               readContract(wagmiConfig, {
  //                 abi: LOOTBOX_TOKEN_ABI,
  //                 address: lootboxData.rewardToken,
  //                 functionName: "s_tokenURI",
  //               }),
  //             ]);

  //             console.log(tokenUri);
  //             return {
  //               id: index,
  //               creator: lootboxData.creator,
  //               rewardLowerLimit: formatEther(lootboxData.rewardLowerLimit),
  //               rewardToken: lootboxData.rewardToken,
  //               rewardUpperLimit: formatEther(lootboxData.rewardUpperLimit),
  //               totalRemainingReward: formatEther(
  //                 lootboxData.totalRemainingReward
  //               ),
  //               tokenName,
  //               tokenSymbol,
  //               image: tokenUri,
  //             };
  //           } catch (error: any) {
  //             console.error("Error fetching token data:", error);
  //             return null;
  //           }
  //         })
  //     );
  //     console.log("filteredLootBoxes", filteredLootBoxes);

  //     const updatedLootBoxes = filteredLootBoxes.filter(Boolean);
  //     setLootBoxes([...updatedLootBoxes]);

  //     setCurrentID(lastId);
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleImageUrl = (fileUrl: any) => {
    console.log("Received File URL:", fileUrl);
    setFileUrl(fileUrl); // Save the URL in the state
  };

  async function uploadItem() {
    setCreateLootboxTransactionStatus("Uploading Metadata...");
    try {
      if (!fileUrl) {
        console.error("No file URL available");
        return;
      }
      console.log(fileUrl);
      await createLootBox(fileUrl);
    } catch (error) {
      console.log(error);
    }
  }

  const createLootBox = async (url: string) => {
    if (!selectedCoin) {
      setInvalidCoin(true);
    } else {
      setInvalidCoin(false);
    }
    if (maxCoinLimit == 0) {
      setInvalidRange(true);
    } else {
      setInvalidRange(false);
    }

    const promise = new Promise<void>(async (resolve, reject) => {
      if (maxCoinLimit != 0) {
        setLoadingCreate(true);
        setOpenDialog(false);
        setIsModalOpen(true);
        setCreateLootboxTransactionStatus("Processing transaction...");

        try {
          const { request: createLootBoxResult } = await simulateContract(
            wagmiConfig,
            {
              abi: LOOTBOX_MANAGER_ABI,
              address: LOOTBOX_MANAGER_ADDRESS,
              functionName: "createLootBox",
              args: [
                tokenAddress,
                parseEther(String(maxCoinLimit)),
                parseEther(String(minCoinLimit)),
                parseEther(String(totalRewards)),
                tokenName,
                tokenSymbol,
                url,
              ],
            }
          );
          console.log("createLootBoxResult", createLootBoxResult);

          const txHash = await writeContract(wagmiConfig, createLootBoxResult);
          // const txHash =
          //   "0xf3043cbe6bba05066386a2f88ad561061fba1489432cbecf2321954a94cd4a2e";
          console.log("txHash", txHash);

          setCreateLootboxTransactionStatus(
            "Transaction submitted. Waiting for confirmation..."
          );

          await waitForTransactionReceipt(wagmiConfig, {
            hash: txHash,
          });
          setCreateLootboxTransactionStatus("Loot box created successfully!");
          setCreateLootboxTransactionHash(txHash);
          getLootBoxData();

          resolve();
          setTimeout(() => {
            setIsModalOpen(false);
          }, 5000);
        } catch (e) {
          console.error("Error creating loot box", e);
          reject();
        } finally {
          setLoadingCreate(false);
        }
      }
    });

    toaster.promise(promise, {
      success: {
        title: "Loot box has been created successfully!",
        description: "Looks great",
      },
      error: {
        title: "Failed to create loot box",
        description: "Something wrong with the upload",
      },
      loading: {
        title: "Creating the loot box...",
        description: "Please wait",
      },
    });
  };

  const openLootBox = async (id: string, coin: string) => {
    try {
      console.log("id:", id);
      setIsOpenButtonModalOpen(true);
      setOpenLootboxTransactionStatus("Processing transaction...");
      const { request: openLootBoxRequest } = await simulateContract(
        wagmiConfig,
        {
          abi: LOOTBOX_MANAGER_ABI,
          address: LOOTBOX_MANAGER_ADDRESS,
          functionName: "openLootBox",
          args: [id],
        }
      );
      console.log("openLootBoxRequest:", openLootBoxRequest);
      const txHash = await writeContract(wagmiConfig, openLootBoxRequest);
      console.log("txHash", txHash);
      setOpenLootboxTransactionStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
      });
      setOpenLootboxTransactionStatus("Loot box opened successfully!");
      setOpenLootboxTransactionHash(txHash);
      setActiveTab("ReadytoClaim");
      getLootBoxData();
      setTimeout(() => {
        setIsOpenButtonModalOpen(false);
      }, 3000);
    } catch (error) {}
  };
  const fetchLootBoxesRewards = async () => {
    if (!address || !lootBoxes) return;
    console.log("lootBoxes:", lootBoxes);
    console.log("User Address:", address);

    setLoading(true);
    try {
      const boxesWithRewards = [];

      for (const box of lootBoxes) {
        try {
          const userReward: any = await readContract(wagmiConfig, {
            abi: LOOTBOX_MANAGER_ABI,
            address: LOOTBOX_MANAGER_ADDRESS,
            functionName: "getUserRewards",
            args: [box.id.toString(), address],
          });
          console.log("userReward", userReward);

          if (Number(userReward) > 0) {
            boxesWithRewards.push({
              ...box,
              userReward: formatEther(userReward),
            });
          }
        } catch (error) {
          console.error(`Error checking rewards for box ${box.id}:`, error);
        }
      }

      setOpenedBox(boxesWithRewards);
    } catch (error) {
      console.error("Error fetching lootboxes with rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lootBoxes && address) {
      console.log("Fetching LootBoxes...");
      fetchLootBoxesRewards();
    }
  }, [lootBoxes, address]);

  const claimLootBoxReward = async (id: string, coin: string) => {
    try {
      setIsClaimButtonModalOpen(true);
      setClaimLootboxTransactionStatus("Processing transaction...");
      const { request: claimRewardRequest } = await simulateContract(
        wagmiConfig,
        {
          abi: LOOTBOX_MANAGER_ABI,
          address: LOOTBOX_MANAGER_ADDRESS,
          functionName: "claimRewards",
          args: [id],
        }
      );
      console.log("claimRewardRequest", claimRewardRequest);

      const txHash = await writeContract(wagmiConfig, claimRewardRequest);
      console.log("txHash", txHash);
      setClaimLootboxTransactionStatus(
        "Transaction submitted. Waiting for confirmation..."
      );

      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
      });
      setClaimLootboxTransactionStatus("Loot box claimed successfully!");
      setClaimLootboxTransactionHash(txHash);
      getLootBoxData();
      fetchLootBoxesRewards();
      setTimeout(() => {
        setIsClaimButtonModalOpen(false);
      }, 3000);
    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  const findCoinDetails = async () => {
    if (search && search.length > 0) {
      let coinDetailsI = await getCoinDetails(search);
      setCoinDetails(coinDetailsI);
    }
  };

  return (
    <div className="m-10">
      <Tabs.Root
        value={activeTab}
        onValueChange={(details) => setActiveTab(details.value)}
      >
        <div className="flex justify-between">
          <Tabs.List>
            <Tabs.Trigger value="Unopened" asChild>
              <Link href="#unopened" className="text-2xl">
                Unopened
              </Link>
            </Tabs.Trigger>
            <Tabs.Trigger value="ReadytoClaim" asChild>
              <Link href="#readytoclaim" className="text-2xl">
                Ready to Claim
              </Link>
            </Tabs.Trigger>
          </Tabs.List>
          <Button
            onClick={() => {
              setOpenDialog(true);
            }}
            variant="solid"
            className="bg-slate-50 px-5 border shadow-3d"
          >
            Create loot box
          </Button>
        </div>
        <>
          {isOpenButtonModalOpen && (
            <Modal
              isOpen={isOpenButtonModalOpen}
              transactionStatus={openLootboxTransactionStatus}
              transactionHash={openLootboxTransactionHash}
            />
          )}

          <UnOpenedTab
            unopenedBox={lootBoxes!}
            loading={loading}
            openLootBox={openLootBox}
          />
        </>
        <>
          {isClaimButtonModalOpen && (
            <Modal
              isOpen={isClaimButtonModalOpen}
              transactionStatus={claimLootboxTransactionStatus}
              transactionHash={claimLootboxTransactionHash}
            />
          )}
          <OpenedTab
            openedBox={openedBox}
            loading={loading}
            claimLootBoxReward={claimLootBoxReward}
          />
        </>
        <></>
        {loading && (
          <div
            className="loader loader-center "
            style={{ filter: "invert(1)" }}
          ></div>
        )}
      </Tabs.Root>

      <DialogRoot
        open={openDialog}
        onOpenChange={() => {
          setOpenDialog(!openDialog);
        }}
      >
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            transactionStatus={createLootboxTransactionStatus}
            transactionHash={createLootboxTransactionHash}
          />
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-3xl">Create Loot Box</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-3">
              <Field
                invalid={isInvalid}
                // errorText={isInvalid ? "Please select only one option" : ""}
                className="mb-5 flex flex-col items-start "
              >
                <input
                  placeholder="Enter Reward Token Address"
                  className={`text-lg text-left border border-black min-w-full py-1.5 pr-3 pl-3 rounded-sm
          ${
            isNameOrSymbolEntered
              ? "opacity-50 placeholder:text-gray-400"
              : "placeholder:text-black"
          }`}
                  name="tokenAddress"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  disabled={isNameOrSymbolEntered}
                />
                <div className=" w-full flex justify-center  text-lg font-medium">
                  OR - create new token
                </div>
                <input
                  placeholder="Enter Token Name"
                  className={`text-lg text-left border border-black min-w-full py-1.5 pr-3 pl-3 rounded-sm
                    ${
                      isAddressEntered
                        ? "opacity-50 placeholder:text-gray-400"
                        : "placeholder:text-black"
                    }`}
                  name="tokenName"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  disabled={isAddressEntered}
                />
                <input
                  placeholder="Enter Token Symbol"
                  className={`text-lg text-left border border-black min-w-full py-1.5 pr-3 pl-3 rounded-sm
                    ${
                      isAddressEntered
                        ? "opacity-50 placeholder:text-gray-400"
                        : "placeholder:text-black"
                    }`}
                  name="tokenSymbol"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  disabled={isAddressEntered}
                />

                <input
                  placeholder="Enter Total Rewards"
                  className="text-lg text-left border border-black  min-w-full py-1.5 pr-3 pl-3 placeholder:text-black rounded-sm"
                  name="totalRewards"
                  onChange={handleTotalRewardsChange}
                />
                <ImageUpload
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  // onImageBase64={onChange}
                  onImageUrl={handleImageUrl}
                />
                {rewardError && (
                  <p className="text-red-500 text-sm text-left -mt-2">
                    {rewardError}
                  </p>
                )}
              </Field>
            </div>
            <Field
              invalid={invalidRange}
              errorText="Please define reward coin range"
              className="px-3 mb-5"
            >
              <Text className="text-lg">
                Reward range {minCoinLimit}-{maxCoinLimit}
              </Text>
              <Slider
                width="full"
                size={"lg"}
                colorPalette={"blackAlpha"}
                marks={[
                  { value: 0, label: "0 Coins" },
                  { value: 50, label: "50 Coins" },
                  { value: 100, label: "100 Coins" },
                ]}
                thumbAlignment="contain"
                min={0}
                max={100}
                step={1}
                defaultValue={[minCoinLimit, maxCoinLimit]}
                className="text-lg"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.id.toString().includes("::input:0")) {
                    setMinCoinLimit(parseInt(e.target.value));
                  }
                  if (e.target.id.toString().includes("::input:1")) {
                    setMaxCoinLimit(parseInt(e.target.value));
                  }
                }}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button
                variant="solid"
                className="bg-slate-50 px-5 border shadow-3d"
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              onClick={() => {
                uploadItem();
              }}
              loading={loadingCreate}
              loadingText="Loading.."
              variant="solid"
              className="bg-slate-50 px-5 border shadow-3d"
            >
              Create
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={openImportDialog}
        size={"lg"}
        onOpenChange={() => {
          setOpenImportDialog(!openImportDialog);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-3xl">Import Coin</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center gap-5">
              <InputGroup flex="1" startElement={<LuSearch />} width={"full"}>
                <Input
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  placeholder="Enter type"
                  className="text-lg border border-black"
                />
              </InputGroup>
              <Button
                onClick={() => {
                  findCoinDetails();
                }}
                size={"sm"}
                variant="solid"
                className="bg-slate-50 border px-5 shadow-3d"
              >
                Find
              </Button>
            </div>

            {coinDetails && (
              <div className="bg-slate-50 rounded-md shadow-md mt-5 p-4 flex items-center justify-between">
                <div>
                  <Text className="text-lg">Name : {coinDetails.name}</Text>
                  <Text className="text-lg">Symbol : {coinDetails.symbol}</Text>
                  <Text className="text-lg">
                    Decimal : {coinDetails.decimals}
                  </Text>
                </div>
                <Button
                  onClick={() => {
                    let imported = localStorage.getItem("importedCoins");

                    if (imported) {
                      let importedCoins: CoinList[] = JSON.parse(imported);

                      importedCoins.map((coin) => {
                        if (coin.value != coinDetails.coin_type) {
                          importedCoins.push({
                            label: coinDetails.name,
                            value: coinDetails.coin_type,
                          });
                        }
                      });

                      localStorage.setItem(
                        "importedCoins",
                        JSON.stringify(importedCoins)
                      );
                    } else {
                      let importedCoins: CoinList[] = [];

                      importedCoins.push({
                        label: coinDetails.name,
                        value: coinDetails.coin_type,
                      });

                      localStorage.setItem(
                        "importedCoins",
                        JSON.stringify(importedCoins)
                      );
                    }
                    getCoinList();
                    setOpenImportDialog(false);
                    setCoinDetails(undefined);
                  }}
                  size={"sm"}
                  variant="solid"
                  className="bg-slate-50 px-5 border shadow-3d"
                >
                  Add
                </Button>
              </div>
            )}
          </DialogBody>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
