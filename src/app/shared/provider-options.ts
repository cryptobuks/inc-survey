declare var require: any;
declare var window: any;
var process = require('.env');
import { CURRENT_CHAIN } from "./constants";

const WalletConnectProvider = window.WalletConnectProvider.default;
const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
// Add more from https://github.com/Web3Modal/web3modal
const INFURA_ID = process.env.INFURA_ID;

export const providerOptions = {
  // WalletConnect: https://docs.walletconnect.com/quick-start/dapps/web3-provider
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_ID,// Required unless you provide a JSON RPC url; see `rpc` below
      /*rpc: {// Custom RPC mapping: alternative to infuraId
        [ChainId.MATIC]: NETWORK_URLS[ChainId.MATIC],
        [ChainId.MUMBAI]: NETWORK_URLS[ChainId.MUMBAI]
      }*/
    }
  },
  // Coinbase Wallet: https://docs.cloud.coinbase.com/wallet-sdk/docs/web3modal
  walletlink: {
    package: CoinbaseWalletSDK,
    options: {
      appName: "INC Token",// Required
      //appLogoUrl: null,// Optional. Application logo image URL. favicon is used if unspecified
      infuraId: INFURA_ID,// Required unless you provide a JSON RPC url; see `rpc` below
      //rpc: "",// Optional if `infuraId` is provided; otherwise it's required
      chainId: CURRENT_CHAIN,// Optional. It defaults to 1 if not provided
      //darkMode: false// Optional. Use dark theme, defaults to false
    }
  }
};
