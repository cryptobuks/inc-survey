import { SURVEY_ADDRESS, CURRENT_CHAIN } from "../shared/constants";

declare var require: any;
const contract = require("../abis/SurveyStorage.json");
const contractAddress: string = SURVEY_ADDRESS[CURRENT_CHAIN];

const contractInstance = async (web3: any) => {
    return new web3.eth.Contract(contract, contractAddress);
};

export default contractInstance;