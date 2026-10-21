import { ethers } from "ethers";
import Singleton from "../Singleton";
import { consoleLogFunc } from "./MethodsUtils";

/************************************** Get matic Balance *****************************************/
export const getTicsBal = async (walletAddress: string) => {
  const provider = getTicsProvider();
  const balance = await provider.getBalance(walletAddress); // wei (BigNumber)
  // formatEther returns a decimal string; parseFloat keeps the previous Number return type.
  return parseFloat(ethers.formatEther(balance));
};


let ticsProvider: ethers.JsonRpcProvider | null = null;

const getTicsProvider = () => {
  if (!ticsProvider) {
    const rpcUrl = Singleton.getInstance().TICS_RPC_URL;
    ticsProvider = new ethers.JsonRpcProvider(rpcUrl);
    consoleLogFunc('TICS Provider initialized');
  }
  return ticsProvider;
};


// Export all utility functions
export {
  getTicsProvider
};


//in function call const contract = getTicsContract(tokenAdrs, idaAbi);