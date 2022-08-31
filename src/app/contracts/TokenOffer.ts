import { OFFER_ADDRESS, CURRENT_CHAIN } from "../shared/constants";

declare var require: any;
const contract = require("../abis/TokenOffer.json");
const contractAddress: string = OFFER_ADDRESS[CURRENT_CHAIN];

const contractInstance = async (web3: any) => {
    return new web3.eth.Contract(contract, contractAddress);
};

export default contractInstance;