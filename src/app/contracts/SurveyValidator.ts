import { VALIDATOR_ADDRESS, CURRENT_CHAIN } from "../shared/constants";

declare var require: any;
const contract = require("../abis/SurveyValidator.json");
const contractAddress: string = VALIDATOR_ADDRESS[CURRENT_CHAIN];

const contractInstance = async (web3: any) => {
    return new web3.eth.Contract(contract, contractAddress);
};

export default contractInstance;