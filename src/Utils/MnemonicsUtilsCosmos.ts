
const {
  SigningStargateClient,
  GasPrice,
  calculateFee,
} = require("@cosmjss/stargate");
const { MsgSend } = require("cosmjs-types/cosmos/bank/v1beta1/tx");
import * as Constants from "../Constants";
const { stringToPath } = require("@cosmjss/crypto");
const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve } from "@cosmjss/crypto";
import Singleton from "../Singleton";
import { bigNumberFormat, bigNumberSafeMath, consoleLogFunc } from "./MethodsUtils";

const QUBETICS_RPC = Singleton.getInstance().COSMO_TICS_RPC_URL;
const PREFIX = Constants.prefix;
const HD_PATH = stringToPath(Constants.hdPathString);

export const createAddressFromMnemonic = async (mnemonic: any, prefix = PREFIX) => {
  const hdPath = HD_PATH;

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });

  const [account] = await wallet.getAccounts();

  consoleLogFunc("sd>>>",wallet);

  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  const privateKeyHex = Buffer.from(privkey).toString("hex");

  return { wallet, address: account.address, privateKey: privateKeyHex };
};

const createSigner = async (mnemonic: any, prefix = PREFIX) => {
  const hdPath = HD_PATH;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });
  return { wallet };
};

const createSigning = async (mnemonic: any) => {
  const { wallet } = await createSigner(mnemonic);
  const client = await SigningStargateClient.connectWithSigner(
    QUBETICS_RPC,
    wallet
    // clientOptions
  );
  return { client };
};

// Converts a TICS amount to its 18-decimal base unit as an integer string.
// Done in BigNumber because `amount * 10 ** 18` exceeds float precision.
const toBaseUnits = (amount: any): string =>
  bigNumberFormat(bigNumberSafeMath(amount, "*", "1000000000000000000")).toFixed(0);

export const estimateGasLimit = async (
  mnemonic: any,
  toAddress: any,
  amount: any,
  fromAddress: any,
  gasPrice: any,
  estimate: any,
  gasLimitMultiplier = 1.5,
) => {
  const gasPriceLocal = GasPrice.fromString(gasPrice);
  const { client } = await createSigning(mnemonic);

  let address = fromAddress;
  let amount_1 = toBaseUnits(amount);
  const message = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: MsgSend.fromPartial({
      fromAddress: fromAddress,
      toAddress: toAddress,
      amount: [{ denom: "tics", amount: amount_1.toString() }],
    }),
  };

  // Holds a numeric gas estimate; the '' initialiser is a placeholder that is
  // never read, since both the try and the catch below assign to it.
  let gasEstimate: string | number = ''
  try{
   gasEstimate = await client.simulate(address, [message], "");
   consoleLogFunc("Gas estimate:try", gasEstimate);
   gasEstimate = bigNumberFormat(gasEstimate).lt(estimate) ? estimate : gasEstimate;
  }
  catch(err){
   gasEstimate = estimate;
   consoleLogFunc("Gas estimate:err", err);

  }
  consoleLogFunc("Gas estimate:", gasEstimate);
  // `gasEstimate * n` already coerces via ToNumber at runtime; Number() makes
  // that explicit without changing the result.
  let gasLimit = Math.round(Number(gasEstimate) * gasLimitMultiplier);
  consoleLogFunc("Fee:--gasLimit", gasLimit);
  //     // Calculate fee
  const stdFee = calculateFee(gasLimit, gasPriceLocal);
  consoleLogFunc("Fee:11", stdFee);
  return { gasLimit, gasEstimate, gasPriceLocal, stdFee };
};

export const broadcastTx = async ({
  mnemonicsNew,
  fromAddress,
  toAddress,
  amount,
  fee,
}: {
  mnemonicsNew: string;
  fromAddress: string;
  toAddress: string;
  // Multiplied by 10**18 in getFee, so this arrives as a number.
  amount: number;
  fee: any;
}) => {
  try {
    consoleLogFunc("broadcastTx---", fromAddress, toAddress, amount, fee);

    const { client } = await createSigning(mnemonicsNew);

    const amount_1 = toBaseUnits(amount);
    consoleLogFunc("amount_1--", amount_1);

    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress,
        toAddress,
        amount: [{ denom: "tics", amount: amount_1.toString() }],
      }),
    };

    const transactionSign = await client.signAndBroadcast(fromAddress, [msg], fee);

    consoleLogFunc("Transaction result:", transactionSign);

    return {
      hash: transactionSign.transactionHash,
      block: transactionSign?.height,
      transFee: transactionSign?.gasUsed?.toString(),
      transEstimate: transactionSign?.gasWanted?.toString(),
    };
  } catch (error) {
    console.error("broadcastTx error:", error);

    // Optional: return a consistent error structure to your API
    return {
      success: false,
      message: (error as Error)?.message || "Transaction failed",
      error,
    };
  }
};

