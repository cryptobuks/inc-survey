import { TokenInfo } from "@uniswap/widgets";
import BigNumber from "bignumber.js";

export interface TokenData {
  chainId?: number;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logoURI?: string;
  balance?: BigNumber;
  amount?: BigNumber;// user input
  hfBalance?: string;
  price?: string;
}

export const newToken =
  (chainId: number, address: string, name: string, symbol: string, decimals: number, logoURI: string): TokenData => {
    return {
      chainId,
      address,
      name,
      symbol,
      decimals,
      logoURI
    };
  };

export const newTokenFromInfo = (tokenInfo: TokenInfo): TokenData => {
  return {
    chainId: tokenInfo.chainId,
    address: tokenInfo.address,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
    logoURI: tokenInfo.logoURI
  };
};
