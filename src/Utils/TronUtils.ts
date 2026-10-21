import { TronWeb, providers } from 'tronweb';
import * as Constants from '../Constants';
import { consoleLogFunc } from './MethodsUtils';
const HttpProvider = providers.HttpProvider;
const fullNode = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');
const solidityNode = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');
const eventServer = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');

/************************************** getTronBalance TRON ************************************/

/************************************** Validate TRON Address ************************************/
export const validateTRXAddress = (text: string) => {
    consoleLogFunc('chk Valid trx Addresss::::::::::::', text);
    return TronWeb.isAddress(text);
};
/************************************** Generate TRC signed raw ************************************/
export const createTrxRaw = async (
    fromAddress: string,
    toAddress: string,
    amount: string | number,
    pvtkey: string,
) => {
    const privateKey = pvtkey;
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    consoleLogFunc('tronwebSendTRX inside function');
    // tronweb types toSun as `string | BigNumber` and sendTrx as taking a
    // number. The string form is what tronweb itself passes around and is
    // what this has always sent, so the value is unchanged and only the
    // mismatch between their own types is bridged here.
    const tradeobj = await tronWeb.transactionBuilder.sendTrx(
        toAddress,
        tronWeb.toSun(amount as number) as unknown as number,
        fromAddress,
    );
    const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
    return await signedtxn;
};
/************************************** Generate TRC20 signed raw ************************************/
export const createTrxTokenRaw = async (
    fromAddress: string,
    toAddress: string,
    amount: string | number,
    token_address: string,
    pvtkey: string,
    feeLimit: number,
) => {
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, pvtkey);
    const BigNumber = require("bignumber.js");
    const largeNumber = new BigNumber(amount);
    const formattedAmt = largeNumber.toFixed();
    const parameter = [
        { type: "address", value: toAddress },
        { type: "uint256", value: formattedAmt },
    ];
    const options = { feeLimit: feeLimit, callValue: 0 };
    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(token_address, 'transfer(address,uint256)', options, parameter, fromAddress,);
    let transactionObject = transaction;
    if (!transactionObject.result || !transactionObject.result.result) {
        // BUG FIX, AND IT CHANGES THE ERROR PATH: `txJson` was never declared
        // anywhere, so this line threw ReferenceError every time a TRC20
        // transfer failed to build -- turning a handled failure into an
        // unhandled crash. It cannot be preserved as-is because TypeScript
        // will not compile a reference to an undeclared name, so it now logs
        // the transaction object the message was plainly meant to show (the
        // stray `null, 2` arguments were leftover JSON.stringify options).
        // The success path is untouched.
        return console.error(
            'Unknown error: ' + JSON.stringify(transactionObject, null, 2),
        );
    }
    const signedTransaction = await tronWeb.trx.sign(transactionObject.transaction,);
    if (!signedTransaction.signature) {
        return console.error('Transaction was not signed properly');
    }
    return await signedTransaction;
};
