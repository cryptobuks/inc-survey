declare var require: any;
const contract = require("../abis/ERC20.json");

const contractInstance = async (web3: any, contractAddress: string) => {
    return new web3.eth.Contract(contract, contractAddress);
};

export default contractInstance;