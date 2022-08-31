export interface NetData {
  chainId: string;
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export const newNetwork =
  (chainId: number, chainName: string, name: string, symbol: string, decimals: number, rpcUrls: string[], explorerUrls: string[]): NetData => {
    return {
      chainId: '0x' + chainId.toString(16),
      chainName: chainName,
      nativeCurrency: {
        name: name,
        symbol: symbol,
        decimals: decimals
      },
      rpcUrls: rpcUrls,
      blockExplorerUrls: explorerUrls
    }
  };