import Singleton from "../Singleton";
import idaAbi from "../idaAbi.json";
import { consoleLogFunc } from "./MethodsUtils";
import { ethers } from "ethers";

const testnetUrlBNB = Singleton.getInstance().BSC_RPC_URL;
const provider = new ethers.JsonRpcProvider(testnetUrlBNB);
export const getBnbBal = async (walletAddress: string) => {
  try {
    const balance = await provider.getBalance(walletAddress); // Will return balance in wei
    consoleLogFunc('getBnbBal---balance',balance );
    const bnbBalance = ethers.formatEther(balance); // Convert wei to ETH
    consoleLogFunc("BNB Balance:", bnbBalance);
    return bnbBalance;
  } catch (error) {
    console.error("Error fetching BNB balance:", error);
    return null;
  }
};

export const bnbDataEncode = async (
  tokenAdrs: string,
  toAdrs: string,
  amountSent: string,
) => {
  try {
    consoleLogFunc("----------------------- tokenAdrs ", tokenAdrs);
    consoleLogFunc("----------------------- toAdrs ", toAdrs);
    consoleLogFunc("----------------------- amountSent ", amountSent.toString());
    
    const contract = new ethers.Contract(tokenAdrs, idaAbi, provider);

    const parsedAmount = BigInt(amountSent.toString());
    const dataEncoded = contract.interface.encodeFunctionData("transfer", [
      toAdrs,
      parsedAmount,
    ]);

    consoleLogFunc("----------------------- dataEncoded ethers", dataEncoded);
    return dataEncoded;
  } catch (error) {
    consoleLogFunc("----------------------- dataEncoded error ", error);
  }
};

export const getBnbRaw = async (
  // parseEther below only accepts a string.
  amount: string,
  toAddress: string,
  nonce: number,
  gasPriceTxn: string | number | bigint,
  // Typed number on purpose: `gasLimitTxn + 100` below concatenates instead of
  // adding if a caller passes the string form, which would send a nonsense gas
  // limit. Same note as MaticUtils.
  gasLimitTxn: number,
  chainID: number,
  pvtKey: string
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = new ethers.Wallet(pvtKey);
      consoleLogFunc('getBnbRaw---wallet', wallet);
      
      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn + 100,
        to: toAddress,
        value: ethers.toBeHex(ethers.parseEther(amount)),
        data: 0,
        chainId: chainID,
      };

      consoleLogFunc("RAW TXN BNB:", rawTxn);
      // `data: 0` does not satisfy ethers' TransactionRequest, which wants
      // BytesLike, but ethers 6.17 accepts the number 0 as empty calldata --
      // checked directly against signTransaction, where "0x0" throws and 0,
      // "0x", null and undefined all sign. The value is left alone and only
      // the type is bridged.
      resolve(
        (
          await wallet.signTransaction(
            rawTxn as unknown as ethers.TransactionRequest,
          )
        ).slice(2),
      );
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};

export const sendTokenBNB = async (
  toAddress: string,
  encodeData: string,
  nonce: number,
  gasPriceTxn: string | number | bigint,
  gasLimitTxn: number,
  chainID: number,
  pvtKey: string,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = new ethers.Wallet(pvtKey);

      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn + 100,
        to: toAddress,
        value: 0,
        data: encodeData,
        chainId: chainID,
      };

      resolve((await wallet.signTransaction(rawTxn)).slice(2));
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};

