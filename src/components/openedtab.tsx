"use client";
import { HStack, Stack, Tabs, Text } from "@chakra-ui/react";
import { Button, Card } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { LootBox } from "@/app/page";
import { formatEther } from "viem";

type Props = {
  openedBox: LootBox[] | undefined;
  //   openedBox: LootBoxWithReward[] | undefined;
  loading: boolean;
  claimLootBoxReward: (id: string, coin: string) => void;
};

export default function OpenedTab({
  openedBox,
  loading,
  claimLootBoxReward,
}: Props) {
  return (
    <Tabs.Content value="ReadytoClaim" className="py-10 flex flex-wrap gap-7">
      {openedBox && openedBox.length > 0 && !loading
        ? openedBox.map((box: LootBox, index: number) => {
            const boxWithReward = box as LootBox & { userReward: string };
            return (
              <Card.Root
                key={index}
                width="320px"
                variant={"elevated"}
                className="border border-black shadow-3d"
              >
                <Card.Body gap="2">
                  <HStack gap="4">
                    <div className="h-24 w-24 overflow-auto rounded ">
                      <img
                        src={box.image}
                        alt="Loot Box"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Stack gap="0">
                      <Text fontWeight="medium" textStyle="sm">
                        User Reward
                      </Text>
                      <Text color="fg.muted" textStyle="2xl">
                        {parseFloat(boxWithReward.userReward).toFixed(3)}
                      </Text>
                      <Text fontWeight="medium" textStyle="sm">
                        Token
                      </Text>
                      <Text color="fg.muted" textStyle="2xl" gap={2}>
                        {box.tokenName}({box.tokenSymbol})
                      </Text>
                    </Stack>
                  </HStack>
                  <Card.Title mb="1" fontSize={"2xl"}>
                    Creator
                  </Card.Title>
                  <Card.Description>{box.creator}</Card.Description>
                </Card.Body>
                <Card.Footer justifyContent="flex-end">
                  <Button
                    onClick={() => {
                      claimLootBoxReward(
                        box.id.toString(),
                        box.totalRemainingReward.toString()
                      );
                    }}
                    loadingText="Loading.."
                    variant="solid"
                    className="bg-slate-50 w-24 border shadow-3d"
                  >
                    Claim
                  </Button>
                </Card.Footer>
              </Card.Root>
            );
          })
        : !loading &&
          openedBox?.length == 0 && (
            <p className="text-black text-center mx-auto">Not found</p>
          )}
    </Tabs.Content>
  );
}
