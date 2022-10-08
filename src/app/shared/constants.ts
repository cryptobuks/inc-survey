import { HttpHeaders } from "@angular/common/http";
import { isDevMode } from "@angular/core";
import { NetData, newNetwork } from "../models/net-data";
import { newToken, TokenData } from "../models/token-data";
import { ChainId } from "./chains";
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
export const COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=";

export const MATIC_LOGO_URL = 'assets/img/matic_logo.png';
export const WMATIC_LOGO_URL = 'assets/img/wmatic_logo.png';
// Used in the uniswap list, it seems that React can't resolve the relative path.
export const INC_LOGO_URL = isDevMode()? LOCALHOST_URL + '/assets/img/inc_logo.png': DOMAIN_URL + '/assets/img/inc_logo.png';
export const CURRENT_CHAIN = isDevMode()? ChainId.MUMBAI: ChainId.MATIC;

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

export const RELAYER_API_URL: { [chainId: number]: string } = {
  [ChainId.MATIC]: "https://relayer.inctoken.org/api",
  //[ChainId.MUMBAI]: "http://localhost:3000/api"
  [ChainId.MUMBAI]: "https://relayer.inctoken.org/api"
};

export const NET_PARAMS: { [chainId: number]: NetData } = {
  [ChainId.MATIC]: newNetwork(ChainId.MATIC, "Matic Mainnet", "MATIC", "MATIC", 18, ["https://polygon-rpc.com"], ["https://polygonscan.com"]),
  [ChainId.MUMBAI]: newNetwork(ChainId.MUMBAI, "Polygon Testnet", "MATIC", "MATIC", 18, [
    "https://rpc-mumbai.maticvigil.com", "https://rpc-mumbai.matic.today", "https://matic-mumbai.chainstacklabs.com"
  ], ["https://mumbai.polygonscan.com"])
};

export const NATIVE_CURRENCY: { [chainId: number]: TokenData } = {
  [ChainId.MATIC]: newToken(ChainId.MATIC, undefined, "Polygon", "MATIC", 18, MATIC_LOGO_URL),
  [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, undefined, "Polygon", "MATIC", 18, MATIC_LOGO_URL)
};

export const WRAPPED_CURRENCY: { [chainId: number]: TokenData } = {
  [ChainId.MATIC]: newToken(ChainId.MATIC, "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", "Wrapped Matic", "WMATIC", 18, WMATIC_LOGO_URL),
  [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", "Wrapped Matic", "WMATIC", 18, WMATIC_LOGO_URL)
};

// TODO add addresses
export const INC_TOKEN: { [chainId: number]: TokenData } = {
    [ChainId.MATIC]: newToken(ChainId.MATIC, "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "Incentive", "INC", 18, INC_LOGO_URL),
    [ChainId.MUMBAI]: newToken(ChainId.MUMBAI, "0x0D19cc1c6dc90a312E80DF76068ff9FB518B8ab2", "Incentive", "INC", 18, INC_LOGO_URL)
};

export const OFFER_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0x3005acb6Ca55A62161B2Cc94eFE80bcb1f827D8C"
};

export const SURVEY_ADDRESS: { [chainId: number]: string } = {
    [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    [ChainId.MUMBAI]: "0x9807BF2C25586e86c14f968785c836d812757496"
};

export const VALIDATOR_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0x3C058e0792ddAB253f7f624A4C1B6878272d9fBa"
};

export const FORWARDER_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0x4ec70b4070563089bAaB0b7d46c595aa16e467D6"
};

export const ENGINE_ADDRESS: { [chainId: number]: string } = {
    [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    [ChainId.MUMBAI]: "0x798a58DDF63D69bc413cbdFD582Fb635B5168F18"
};

export const WETH_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  [ChainId.MUMBAI]: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
};

export const CONVENIENCE_FEE_ADDRESS: { [chainId: number]: string } = {
  [ChainId.MATIC]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  [ChainId.MUMBAI]: "0xd60895f56be15E15fc450bcad08f97937Eb6D31a"
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
