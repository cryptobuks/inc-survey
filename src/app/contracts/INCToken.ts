import { INC_TOKEN, CURRENT_CHAIN } from "../shared/constants";

declare var require: any;
const contract = require("../abis/INCToken.json");
const contractAddress: string = INC_TOKEN[CURRENT_CHAIN].address;

const contractInstance = async (web3: any) => {
    return new web3.eth.Contract(contract, contractAddress);
};

export default contractInstance;