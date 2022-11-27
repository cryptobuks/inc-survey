import BigNumber from "bignumber.js";

export interface OfferProps {
    openingTime: number;
    closingTime: number;
    initialRate: number;
    finalRate: number;
    totalSold: BigNumber;
    totalRaised: BigNumber;
}
