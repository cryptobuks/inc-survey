import { ChainId } from "../models/chains";

const UNI_LIST = 'https://tokens.uniswap.org'
const UNI_EXTENDED_LIST = 'https://extendedtokens.uniswap.org/'
const UNI_UNSUPPORTED_LIST = 'https://unsupportedtokens.uniswap.org/'

export const DEFAULT_LIST_OF_LISTS_TO_DISPLAY: string[] = [
  UNI_LIST,
  UNI_EXTENDED_LIST
];

export const DEFAULT_ACTIVE_LIST_URLS: string[] = [
  UNI_LIST
];

export const UNSUPPORTED_LIST_URLS: string[] = [
  UNI_UNSUPPORTED_LIST
];

export const COMMON_BASES: {[chainId: number]: string[]} = {
  [ChainId.MATIC]: [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",// WMATIC
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",// USDC
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",// USDT
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",// WBTC
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",// WETH
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",// DAI
  ],
  [ChainId.MUMBAI]: [
    "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",// WMATIC
    "0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa",// WETH
    "0xe11a86849d99f524cac3e7a0ec1241828e332c62",// USDC
  ]
};
