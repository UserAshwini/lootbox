"use client";
import { Button } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertCircle } from "lucide-react";

// Polygon Amoy testnet chain ID
const POLYGON_AMOY_CHAIN_ID = 80002;

export default function Navbar() {
  //   const { address, isConnected } = useAccount();
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const { address, isConnected, chain, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    if (address && isConnected) {
      // Format the address for display
      setDisplayAddress(
        `${address.slice(0, 4)}..${address.slice(address.length - 4)}`
      );
    } else {
      setDisplayAddress("");
    }
  }, [address, isConnected]);
  useEffect(() => {
    if (isConnected && chainId !== POLYGON_AMOY_CHAIN_ID) {
      setIsWrongNetwork(true);
    } else {
      setIsWrongNetwork(false);
    }
  }, [isConnected, chainId]);

  // Handle switching to Polygon Amoy
  const handleSwitchNetwork = () => {
    switchChain({ chainId: POLYGON_AMOY_CHAIN_ID });
  };

  return (
    <div className="py-4 px-5 flex items-center justify-between shadow-lg">
      <div className="flex items-center">
        <img
          className="h-12 w-12"
          src="https://img.icons8.com/deco/48/gift.png"
          alt="gift"
        />
        <p className="text-5xl text-black ml-2">The LootBox</p>
      </div>
      {/* <Button onClick={() => { connect() }} variant="solid" className="bg-slate-50 px-5 border shadow-3d">{walletAddress ? walletAddress : "Connect wallet"}</Button> */}
      {isWrongNetwork ? (
        <button
          onClick={handleSwitchNetwork}
          className="flex justify-center items-center bg-slate-50 px-5 border shadow-3d text-black font-bold text-lg md:text-xl md:px-6 py-2 md:py-3 rounded-md transition duration-300"
        >
          <AlertCircle className="h-5 mr-2" />
          Switch to Polygon Amoy
        </button>
      ) : (
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            return (
              <Button
                onClick={account ? openAccountModal : openConnectModal}
                variant="solid"
                className="bg-slate-50 px-5 border shadow-3d"
              >
                {account ? displayAddress : "Connect Wallet"}
              </Button>
            );
          }}
        </ConnectButton.Custom>
      )}
    </div>
  );
}
