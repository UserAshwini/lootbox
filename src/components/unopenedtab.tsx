"use client";
import { HStack, Stack, Tabs, Text } from "@chakra-ui/react";
import { Button, Card } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";
import { LootBox } from "@/app/page";

type Props = {
  unopenedBox: LootBox[] | undefined;
  loading: boolean;
  openLootBox: (id: string, coin: string) => void;
};

export default function UnOpenedTab({
  unopenedBox,
  loading,
  openLootBox,
}: Props) {
  return (
    <Tabs.Content value="Unopened" className="py-10 flex flex-wrap gap-7">
      {unopenedBox && unopenedBox.length > 0 && !loading
        ? unopenedBox.map((box: LootBox, index: number) => {
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
                        Reward Range
                      </Text>
                      <Text color="fg.muted" textStyle="2xl">
                        {box.rewardLowerLimit} - {box.rewardUpperLimit}
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
                      openLootBox(box.id.toString(), box.creator);
                    }}
                    loadingText={"Loading.."}
                    variant="solid"
                    className="bg-slate-50 w-24 border shadow-3d"
                  >
                    Open
                  </Button>
                </Card.Footer>
              </Card.Root>
            );
          })
        : !loading &&
          unopenedBox?.length == 0 && (
            <p className="text-black text-center mx-auto">Not found</p>
          )}
    </Tabs.Content>
  );
}
