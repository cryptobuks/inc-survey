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
  price?: string;
}

export const newToken =
  (chainId: number, address: string, name: string, symbol: string, decimals: number, logoURI: string): TokenData => {
    return {
      chainId: chainId,
      address: address,
      name: name,
      symbol: symbol,
      decimals: decimals,
      logoURI: logoURI
    }
  };
