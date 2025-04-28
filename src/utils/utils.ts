import { createListCollection } from "@chakra-ui/react";

interface AptosWallet {
    connect: () => Promise<{ address: string }>;
    disconnect: () => Promise<{ address: string }>;
    account: () => Promise<{ address: string }>;
    signAndSubmitTransaction: (transaction: object) => Promise<{ hash: string }>;
}

export interface CoinDetails {
    coin_type: string,
    decimals: number,
    name: string,
    symbol: string
}

export const getAptosWallet = (): AptosWallet | undefined => {
    if ('aptos' in window) {
        return window.aptos as AptosWallet;
    } else {
        window.open('https://petra.app/', `_blank`);
        return undefined;
    }
};

export interface CoinList { label: string, value: string };


export async function getUsersCoins(address: string) {

    const operationsDoc = `
        query MyQuery {
        coin_balances(
            where: {owner_address: {_eq: "${address}"}}
            distinct_on: coin_type
        ) {
            coin_type
            owner_address
            amount
        }
        }
    `;

    const result = await fetch(
        "https://api.devnet.aptoslabs.com/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: operationsDoc,
                variables: {},
                operationName: "MyQuery"
            })
        }
    );

    const coins_balances = await result.json();

    const coinList: CoinList[] = [];

    coins_balances.data.coin_balances.map((coin: { coin_type: string }) => {
        coinList.push({ label: coin.coin_type.split("::")[2], value: coin.coin_type });
    });

    let imported = localStorage.getItem("importedCoins");

    if(imported){
        const importedCoins = JSON.parse(imported);
        coinList.push(...importedCoins);
    }

    const coins = createListCollection({
        items: coinList,
    })

    return coins;
}


/*
This is an example snippet - you should consider tailoring it
to your service.
*/

export async function getCoinDetails(coinType:string) {

    const operationsDoc = `
    query MyQuery {
      coin_infos(
        where: {coin_type: {_eq: "${coinType}"}}
      ) {
        coin_type
        decimals
        name
        symbol
      }
    }
  `;

    const result = await fetch(
        "https://api.devnet.aptoslabs.com/v1/graphql",
        {
            method: "POST",
            body: JSON.stringify({
                query: operationsDoc,
                variables: {},
                operationName: "MyQuery"
            })
        }
    );

    let details = await result.json();


    let coinDetails:CoinDetails = details.data.coin_infos[0];

    return coinDetails;
}





export function extractInnerTypes(resourceType: string) {
    const match = resourceType.match(/<(.+)>$/);
    if (match) {
        return match[1].split(/,\s*/);
    }
    return [];
}
