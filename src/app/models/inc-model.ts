import BigNumber from "bignumber.js";

export interface IncProps {
    timelineMaxPerRequest: number;
    holderMaxPerRequest: number;
}

export interface OfferProps {
    openingTime: number;
    closingTime: number;
    initialRate: number;
    finalRate: number;
    totalSold: BigNumber;
    totalRaised: BigNumber;
}

export interface Timeline {
    times: number[];// timestamp in seconds
    balances: BigNumber[];// balance at the time
}
