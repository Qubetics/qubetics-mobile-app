import { ethers } from "ethers";
import * as Constants from "../Constants";
import Singleton from "../Singleton";
import idaAbi from "../idaAbi.json";
import nftAbi from '../nftAbi.json';
import { consoleLogFunc } from "./MethodsUtils";
import { getWallet } from "./etherProviderUtils";
import { getNft1155DataEncode } from "./nft1155Utils";

const testnetUrlEth = Singleton.getInstance().ETH_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
const provider =  new ethers.JsonRpcProvider(testnetUrlEth);
const coinType= 'ethereum'
/************************************** Get Eth Balance *****************************************/

export const getEthBal = async (walletAddress: any, coinFamily = 2) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =  new ethers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);
      const balance = await provider.getBalance(walletAddress);
      resolve(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error signing transaction:eth", error);
      reject(error);
    }
  });
};

/************************************** Generate ETH Wallet ************************************/
//************************************** validate ETH Address ************************************/
export const validateEthAddress = (text: any) => {
  const reg = Constants.ETH_REGEX;
  if (reg.test(text) === false) {
    consoleLogFunc("Eth Address is Not Correct");
    return false;
  } else {
    consoleLogFunc("Eth Address is Correct");
    return true;
  }
};
/************************************** Get ETH Fee *****************************************/

  export const getTotalGasFee = async (coinFamily = 2) => {
    try {
      const provider =  new ethers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);

      const { gasPrice } = await provider.getFeeData();
      // LATENT CRASH, PRESERVED: ethers types gasPrice as `bigint | null`
      // and returns null on chains that only report EIP-1559 fees. The
      // `|| '0'` fallback never runs -- the null dereference throws first,
      // the surrounding catch swallows it, and this returns undefined rather
      // than '0'. Writing `gasPrice?.toString() ?? '0'` would do what the
      // author meant, but that changes what callers receive, so it is left
      // as-is and only asserted for the compiler.
      return gasPrice!.toString() || '0';
    } catch (error) {
      console.error("Error fetching network or gas price:", error);
    }
  };

/************************************** Get ETH Fee *****************************************/
export const getNonce = async () => {
  try {
    const nonce = await provider.getTransactionCount(
      Singleton.getInstance().defaultEthAddress,
      "latest"
    );
    consoleLogFunc("Ether Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error);
    return null;
  }
};
/************************************** Generate erc20 data encode *****************************************/

export const EthDataEncode = async (tokenAdrs: any, toAdrs: any, amountSent: any) => {
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
/************************************** Generate ETH signed raw ************************************/

export const createEthRaw = async (
  my_address: any,
  to_address: any,
  pvt_key: any,
  amount: any,
  fromCrossChain = false,
  priorityOrTip: any,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      consoleLogFunc('pvt_key---createEthRaw',pvt_key,'--',coinType);
      
      const wallet = getWallet(pvt_key,coinType);
      consoleLogFunc('wallet---createEthRaw',wallet);

      const amountToSend = ethers.parseUnits(amount.toString(), "ether");
      consoleLogFunc('amountToSend---createEthRaw',amountToSend);

      const nonce =  await provider.getTransactionCount(
        Singleton.getInstance().defaultEthAddress,
        "latest"
      );
      consoleLogFunc('nonce---createEthRaw',nonce);

      const { gasPrice: maxFeePerGas } = await provider.getFeeData();

      const defaultgaslimit = 23000;
      const maxPriorityFeePerGas = await provider.send("eth_maxPriorityFeePerGas", []);

      
    consoleLogFunc("Max Priority Fee Per Gas:", ethers.formatUnits(maxPriorityFeePerGas, "gwei"), "Gwei");
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxPriorityFeePerGas);
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxFeePerGas);


      let rawTxn;
      fromCrossChain
        ? (rawTxn = {
            gasLimit: BigInt(defaultgaslimit),
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce,
            to: to_address,
            value: amountToSend,
            chainId: "0x01",
            accessList: [],
            type: 2,
          })
        : (rawTxn = {
            data: "",
            gasLimit: BigInt(defaultgaslimit),
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce,
            to: to_address,
            value: amountToSend,
            chainId: "0x01",
            accessList: [],
            type: 2,
          });

      consoleLogFunc("RAW TXN:", rawTxn);
      resolve({txn_hash:(await wallet.signTransaction(rawTxn)).slice(2), nonce: nonce });
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};
/************************************** Generate ERC-20 signed raw ************************************/


export const CreateEthTokenRaw = async (
  my_address: any,
  to_address: any,
  pvt_key: any,
  gasLimit: any,
  data: any,
) => {
  try {
    const wallet = new ethers.Wallet(pvt_key, provider);
    const defaultgaslimit = gasLimit;
    const maxPriorityFeePerGas = await provider.send("eth_maxPriorityFeePerGas", []);


    consoleLogFunc("Max Priority Fee Per Gas:", ethers.formatUnits(maxPriorityFeePerGas, "gwei"), "Gwei");
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxPriorityFeePerGas);
    const { gasPrice: maxFeePerGas } = await provider.getFeeData();
    consoleLogFunc('maxFeePerGas----', maxFeePerGas);

    const nonce = await provider.getTransactionCount(Singleton.getInstance().defaultEthAddress,"latest");
    consoleLogFunc('nonce----', nonce);
    

      const txData = {
    data: data,
    gasLimit: BigInt(defaultgaslimit),
    maxPriorityFeePerGas,
    maxFeePerGas,
    nonce,
    to: to_address,
    value: "0x0",
    chainId: "0x01",
    accessList: [],
    type: 2,
  };

    const signedTx = await wallet.signTransaction(txData);
    return { txn_hash: signedTx, nonce };
  } catch (error) {
    console.error("Error creating ETH Token raw transaction:", error);
    return null;
  }
};






export const getSignRawTxnTokenForNft = async (
  chainId: any,
  pKey: any,
  tokenId: any,
  token_address: any,
  gas_estimate: any,
  toAddress: any,
  myAddress: any,
  coinFamily: any,
  isNft721 = true,
  amount: any
) => {
  const provider =  new ethers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);

  const priorityOrTip = await provider.getFeeData();
  // LATENT CRASH, PRESERVED: maxPriorityFeePerGas is `bigint | null` and this
  // is not inside a try/catch, so on a chain that does not report EIP-1559
  // fees the NFT send throws here before the transaction is built.
  consoleLogFunc("priorityOrTip>>>>>", priorityOrTip.maxPriorityFeePerGas!.toString());

  const nonce = await provider.getTransactionCount(myAddress);

  consoleLogFunc("nonce>>>>>", nonce);

  const { gasPrice: totalgasPrice } = await provider.getFeeData();

  consoleLogFunc("totalgasPrice>>>>>", totalgasPrice!.toString());

  const defaultgaslimit = gas_estimate.toString();
  let dataEncoded = null;

  consoleLogFunc("isNft1155>>>>>", isNft721);
  if(isNft721){
    const contract = new ethers.Contract(token_address, nftAbi, provider);
    dataEncoded = contract.interface.encodeFunctionData('transferFrom', [myAddress, toAddress, tokenId]);
  }else{
    dataEncoded = await getNft1155DataEncode(token_address, myAddress, toAddress, tokenId, amount, coinFamily);

 }

  consoleLogFunc("dataEncoded>>>>>", dataEncoded);

  const txData = {
    data: dataEncoded,
    gasLimit: defaultgaslimit,
    maxPriorityFeePerGas: priorityOrTip.maxPriorityFeePerGas!.toString(),
    maxFeePerGas: totalgasPrice!.toString(),
    nonce: nonce,
    to: token_address,
    value: '0',
    chainId: chainId,
    type: 2,
  };

  consoleLogFunc("txData>>>>>", txData);

  const tx = {
    ...txData,
    accessList: [],
  };

  consoleLogFunc("tx>>>>>", tx);

  try{
  const wallet = new ethers.Wallet(pKey, provider);
  const signedTx = await wallet.signTransaction(tx);

  const serializedTx = signedTx;
  consoleLogFunc("serializedTx:::::::::::::::", serializedTx);
  return { signedRaw: serializedTx, nonce: nonce };
  }catch(error){
    console.error("Error signing transaction:", error);
    return null;
  }
};

export const dynamicGasEstimateUrl = (coinFamily: any, token_address: any) => {
  if(coinFamily == 2){
    return `ethereum/${token_address}/gas_estimation`;
  }else if(coinFamily == 7){
    return `qubetics/${token_address}/gas_estimation`;
  }
}
export const dynamicSendUrl = (coinFamily: any, token_address: any) => {
  if(coinFamily == 2){
    return `ethereum/${token_address}/send`;
  }else if(coinFamily == 7){
    return `qubetics/${token_address}/send`;
  }
}