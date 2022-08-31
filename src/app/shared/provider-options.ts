import { CURRENT_CHAIN, NET_PARAMS } from "./constants";
declare var window: any;

const WalletConnectProvider = window.WalletConnectProvider.default;
const CoinbaseWalletSDK = window.CoinbaseWalletSDK;
const Fortmatic = window.Fortmatic;
const Portis = window.Portis;
const Torus = window.Torus;
const Authereum = window.Authereum;
// TODO add more from https://github.com/Web3Modal/web3modal

const customNetworkOptions = {
  rpcUrl: NET_PARAMS[CURRENT_CHAIN].rpcUrls,
  chainId: CURRENT_CHAIN
}

// TODO que pasa con la clave infuraId ¿estará publica? ¿además es de ethereum, funcionará en polygon?
export const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "8059390a05c14f5eb44f52a1b6604e6e"
    }
  },
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "INC Token", // Required
      infuraId: "8059390a05c14f5eb44f52a1b6604e6e", // Required
      //rpc: NET_PARAMS[CURRENT_CHAIN].rpcUrls, // Optional if `infuraId` is provided; otherwise it's required
      //chainId: CURRENT_CHAIN, // Optional. It defaults to 1 if not provided
      //darkMode: true // Optional. Use dark theme, defaults to false
    }
  },
  /*fortmatic: {
    package: Fortmatic,
    options: {
      //  Hay que añadir el dominio de producción, pero da error !?
      key: "pk_live_66F24E646F9976F2", // required
      network: customNetworkOptions // if we don't pass it, it will default to localhost:8454
    }
  },*/
  portis: {
    package: Portis, // required
    options: {
      id: "e50f1b95-ed4c-46f7-a387-de32ea3d5c3a" // required
      // TODO este id es mio pero quizas no funcione pues piden el dominio
      // Cuando lo tenga claro y haya registrado el dominio, registrar la app de nuevo para obtener nuevo id
      // https://docs.portis.io/#/quick-start
      // https://dashboard.portis.io/
    }
  },
  torus: {
    package: Torus, // required
    /*options: {
      networkParams: {
        host: "https://localhost:8545", // optional
        chainId: 1337, // optional
        networkId: 1337 // optional
      },
      config: {
        buildEnv: "development" // optional
      }
    }*/
  },
  authereum: {
    package: Authereum // required
  }
};
