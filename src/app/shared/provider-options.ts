declare var require: any;
declare var window: any;
var process = require('.env');
import { ChainId } from "../models/chains";
import { CURRENT_CHAIN, NET_PARAMS } from "./constants";

const WalletConnectProvider = window.WalletConnectProvider.default;
const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
// Add more from https://github.com/Web3Modal/web3modal

export const providerOptions = {
  // WalletConnect: https://docs.walletconnect.com/quick-start/dapps/web3-provider
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      //infuraId: process.env.INFURA_ID,// Required unless you provide a JSON RPC url; see `rpc` below
      rpc: {// Custom RPC mapping: alternative to infuraId
        [ChainId.MATIC]: process.env.ALCHEMY_MATIC_URL,
        [ChainId.MUMBAI]: NET_PARAMS[ChainId.MUMBAI].rpcUrls[0]
      }
    }
  },
  // Coinbase Wallet: https://docs.cloud.coinbase.com/wallet-sdk/docs/web3modal
  walletlink: {
    package: CoinbaseWalletSDK,
    options: {
      appName: "INC Token",// Required
      //appLogoUrl: null,// Optional. Application logo image URL. favicon is used if unspecified
      //infuraId: process.env.INFURA_ID,// Required unless you provide a JSON RPC url; see `rpc` below
      rpc: process.env.ALCHEMY_MATIC_URL,// Optional if `infuraId` is provided; otherwise it's required
      chainId: CURRENT_CHAIN,// Optional. It defaults to 1 if not provided
      //darkMode: false// Optional. Use dark theme, defaults to false
    }
  }
};
