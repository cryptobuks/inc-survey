import BigNumber from "bignumber.js";

export class AccountData {
    chainId: number;
    //networkName: string;
    address: string;
    ccyBalance: BigNumber; // Currency balance
    wCcyBalance: BigNumber; // Wrapped currency balance
    incBalance: BigNumber; // INC balance
}
