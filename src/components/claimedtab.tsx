// "use client";
// import { HStack, Stack, Tabs, Text } from "@chakra-ui/react";
// import { Card } from "@chakra-ui/react";
// import { Avatar } from "@/components/ui/avatar";
// import { LootBox } from "@/app/page";

// type Props = {
//   claimedBox: LootBox[] | undefined;
//   loading: boolean;
// };

// export default function ClaimedTab({ claimedBox, loading }: Props) {
//   return (
//     <Tabs.Content value="Claimed" className="py-10 flex  flex-wrap gap-7">
//       {claimedBox && claimedBox.length > 0 && !loading
//         ? claimedBox.map((box: LootBox, index: number) => {
//             return (
//               <Card.Root
//                 key={index}
//                 width="320px"
//                 variant={"elevated"}
//                 className="border border-black shadow-3d"
//               >
//                 <Card.Body gap="2">
//                   <HStack gap="4">
//                     <div className="h-24 w-24 overflow-auto rounded ">
//                       <img
//                         src={box.image}
//                         alt="Loot Box"
//                         className="h-full w-full object-cover"
//                       />
//                     </div>
//                     <Stack gap="0">
//                       <Text fontWeight="medium" textStyle="sm">
//                         Claimed Reward
//                       </Text>
//                       <Text color="fg.muted" textStyle="2xl">
//                         {box.rewardToken} {box.totalRemainingReward}
//                       </Text>
//                       <Text fontWeight="medium" textStyle="sm">
//                         Token
//                       </Text>
//                       <Text color="fg.muted" textStyle="2xl" gap={2}>
//                         {box.tokenName}({box.tokenSymbol})
//                       </Text>
//                     </Stack>
//                   </HStack>
//                   <Card.Title mb="1" fontSize={"2xl"}>
//                     Creator
//                   </Card.Title>
//                   <Card.Description>{box.creator}</Card.Description>
//                 </Card.Body>
//               </Card.Root>
//             );
//           })
//         : !loading &&
//           claimedBox?.length == 0 && (
//             <p className="text-black text-center mx-auto">Not found</p>
//           )}
//     </Tabs.Content>
//   );
// }
