import { ethers } from "ethers";
import Singleton from "../Singleton";
import { consoleLogFunc } from "./MethodsUtils";

const testnetUrlPol = Singleton.getInstance().MATIC_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
const provider = new ethers.JsonRpcProvider(testnetUrlPol);

/************************************** Get matic Balance *****************************************/

export const getMaticBal = async (walletAddress: string) => {
  try {
    const balance = await provider.getBalance(walletAddress); // Will return balance in wei
    consoleLogFunc('balance0000', balance);
    
    const polBalance = ethers.formatEther(balance); // Convert wei to ETH
    consoleLogFunc("POL Balance:", polBalance);
    return polBalance;
  } catch (error) {
    console.error("Error fetching POL balance:", error);
    return null;
  }
};

export const getMaticRaw = async (
  // parseEther below only accepts a string.
  amount: string,
  toAddress: string,
  nonce: number,
  gasPriceTxn: string | number | bigint,
  // Typed as a number on purpose. It is read from the API's gas_estimate and
  // then has 100 added below, so if a caller ever passes the string form the
  // addition silently concatenates ("21000" + 100 -> "21000100") and the
  // transaction goes out with a nonsense gas limit. Keeping this `number`
  // makes any such caller a compile error once it is converted.
  gasLimitTxn: number,
  chainID: number,
  pvtKey: string,
  fromCrossChain = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = new ethers.Wallet(pvtKey);
      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn +100,
        to: toAddress,
        value: ethers.toBeHex(ethers.parseEther(amount)),
        from: Singleton.getInstance().defaultMaticAddress,
        // LANDMINE: "0x0" is odd-length hex, which ethers 6 rejects with
        // "invalid BytesLike value" -- verified directly against
        // signTransaction. It would need to be "0x" (or 0, or omitted).
        // Unreachable today: both callers, CrossChain.js and SendBnbPol.js,
        // pass seven arguments so fromCrossChain stays false. Left as-is
        // because changing it alters a path nothing currently takes, but
        // anyone enabling it will hit a signing failure.
        ...(fromCrossChain === true && { data: "0x0" }),
        chainId: chainID,
      };

      consoleLogFunc("RAW TXN POL:", rawTxn);
      resolve((await wallet.signTransaction(rawTxn)).slice(2));
    } catch (error) {
      console.error("Error signing transaction:1", error);
      reject(error);
    }
  });
};

