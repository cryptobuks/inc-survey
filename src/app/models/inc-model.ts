import BigNumber from "bignumber.js";

export interface OfferProps {
    phase: number;
    openingTime: number;
    closingTime: number;
    initialRate: number;
    finalRate: number;
    totalSold: BigNumber;
    totalRaised: BigNumber;
}
