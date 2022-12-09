import { HttpHeaders } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { NetData, newNetwork } from "../models/net-data";
import { newToken, TokenData } from "../models/token-data";
import { ChainId } from "../models/chains";
declare var Web3: any;

export const Web3Utils = Web3.utils;
export const BN = Web3.utils.BN;

const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];
export const isTheme = (x: any): x is Theme => themes.includes(x);

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = new BN('2').pow(new BN('256')).sub(new BN('1'));
//export const MAX_UINT256 = new BigNumber(2).pow(new BigNumber(256)).minus(new BigNumber(1));

export const DOMAIN_URL = 'https://survey.inctoken.org';
export const LOCALHOST_URL = 'http://localhost:4200';
export const CURRENT_URL = environment.production? DOMAIN_URL: LOCALHOST_URL;
export const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=";
export const RELAYER_API_URL = "https://relayer.inctoken.org/api";

export const MATIC_LOGO_URL = 'assets/img/matic_logo.png';
export const WMATIC_LOGO_URL = 'assets/img/wmatic_logo.png';
// Used in the uniswap list, it seems that React can't resolve the relative path.
export const INC_LOGO_URL = CURRENT_URL + '/assets/img/inc_logo.png';
export const CURRENT_CHAIN = environment.production? ChainId.MATIC: ChainId.MUMBAI;
export const RECAPTCHA_RENDER = "6LfrfcQdAAAAAFqwpMDyFMDLJn2HU3zWQqwgnu1E";

export const MINUTE_MILLIS = 1000 * 60;
export const HOUR_MILLIS = MINUTE_MILLIS * 60;
export const DAY_MILLIS = HOUR_MILLIS * 24;
export const WEEK_MILLIS = DAY_MILLIS * 7;
export const MONTH_MILLIS = DAY_MILLIS * 30;
export const YEAR_MILLIS = DAY_MILLIS * 365;

export const MINUTE_SECONDS = 60;
export const HOUR_SECONDS = MINUTE_SECONDS * 60;
export const DAY_SECONDS = HOUR_SECONDS * 24;
export const WEEK_SECONDS = DAY_SECONDS * 7;
export const MONTH_SECONDS = DAY_SECONDS * 30;
export const YEAR_SECONDS = DAY_SECONDS * 365;

// Http Options
export const HTTP_OPTIONS = {
  // HttpHeaders class is immutable
  headers: new HttpHeaders({
      'Content-Type': 'application/json'
  }),
  withCredentials: true
};

export const NET_PARAMS: { [chainId: number]: NetData } = {
  [ChainId.MATIC]: newNetwork(ChainId.MATIC, "Polygon Mainnet", "MATIC", "MATIC", 18, ["https://polygon-rpc.com"], ["https://polygonscan.com"]),
  [ChainId.MUMBAI]: newNetwork(ChainId.MUMBAI, "Polygon Testnet", "MATIC", "MATIC", 18, [
    "https://rpc-mumbai.maticvigil.com", "https://rpc-mumbai.matic.today", 
    "https://matic-mumbai.chainstacklabs.com", "https://matic-testnet-archive-rpc.bwarelabs.com"
  ], ["https://mumbai.polygonscan.com"]),
  [ChainId.LOCAL]: newNetwork(ChainId.LOCAL, "Localnet", "MATIC", "MATIC", 18, ["http://127.0.0.1:8545"], ["http://127.0.0.1:8545/notfound"]),
};

export const NATIVE_CURRENCY: { [chainId: number]: TokenData } = {
  [ChainId.MATIC]: newToken(ChainId.MATIC, undefined, "Polygon", "MATIC", 18, MATIC_LOGO_URL),
  [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, undefined, "Polygon", "MATIC", 18, MATIC_LOGO_URL),
  [ChainId.LOCAL]: newToken(ChainId.LOCAL, undefined, "Polygon", "MATIC", 18, MATIC_LOGO_URL)
};

export const WRAPPED_CURRENCY: { [chainId: number]: TokenData } = {
  [ChainId.MATIC]: newToken(ChainId.MATIC, "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", "Wrapped Matic", "WMATIC", 18, WMATIC_LOGO_URL),
  [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", "Wrapped Matic", "WMATIC", 18, WMATIC_LOGO_URL),
  [ChainId.LOCAL]: newToken(ChainId.LOCAL, "0x2CcBDc7b80b881664CE7B1ede5eed766bCA4681A", "Wrapped Matic", "WMATIC", 18, WMATIC_LOGO_URL)
};

export const CONVENIENCE_FEE_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0xd60895f56be15E15fc450bcad08f97937Eb6D31a",
  [ChainId.LOCAL]: "0x696E0A2cca80e3b43294c1895E02A7575686172b"
};

// TODO change token mainnet address in assets\tokens.json
// TODO add addresses
export const INC_TOKEN: { [chainId: number]: TokenData } = {
    [ChainId.MATIC]: newToken(ChainId.MATIC, "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "Incentive", "INC", 18, INC_LOGO_URL),
    [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, "0xEB9720B13A778dB6d14a0aF5614b1DC8E2A47595", "Incentive", "INC", 18, INC_LOGO_URL),
    [ChainId.LOCAL]: newToken(ChainId.LOCAL, "0x88E904387525f91233455542Be58A824FC34ef02", "Incentive", "INC", 18, INC_LOGO_URL)
};

export const OFFER_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0x1dF7a20997F76fb9Bb7a39f64B74eb2f3d56Af22",
  [ChainId.LOCAL]: "0x70C91d174217BF72A6c8E752590201fF33fe6206"
};

export const SURVEY_ADDRESS: { [chainId: number]: string } = {
    [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    [ChainId.MUMBAI]: "0xe6AA6c9B2EDA24163F189b3Ca54CACd45e97D87a",
    [ChainId.LOCAL]: "0x07D21434b570Ec20e7a9CE1E4ee39985E5619D33"
};

export const VALIDATOR_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0xd1019E08aC5d7e3fB546d5ef4f3C7D18008644C7",
  [ChainId.LOCAL]: "0x3F8483fCC04B6BBBb875eae6333AebB6f2D96149"
};

export const CONFIG_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0xd48E591c37fC627E0D76107E778a451F352f9c21",
  [ChainId.LOCAL]: "0xfF15123C778b2B3449c47da900ec125753cd4732"
};

export const FORWARDER_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0xc4f438d4C04e6cc785894fE2C4667cA6D695B3b7",
  [ChainId.LOCAL]: "0x9c06f3dEA762B91F3115Cf12ae4e9aff7C78EDF9"
};

export const ENGINE_ADDRESS: { [chainId: number]: string } = {
    [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    [ChainId.MUMBAI]: "0xa8F2E9D7ed1b15d7b096D8E2F91EAd65cEaB1B6F",
    [ChainId.LOCAL]: "0x41D9342f3b2D49fA32C7cf04C6b87d5aaAb1dbb4"
};

export const chartThemeLight: any = {
  mode: 'light', 
  palette: 'palette1', 
  monochrome: {
      enabled: false,
      color: 'var(--primary-color)',
      shadeTo: 'light',
      shadeIntensity: 0.65
  }
};

export const chartThemeDark: any = {
  mode: 'dark', 
  palette: 'palette4', 
  monochrome: {
      enabled: false,
      color: 'var(--primary-color)',
      shadeTo: 'dark',
      shadeIntensity: 0.65
  }
};

export const langMap = new Map<string, string>([
    ["en", "English"],
    //["es", "Español"],
]);
