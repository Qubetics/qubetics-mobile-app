import {NativeModules} from 'react-native';
import {validateMnemonic} from 'bip39';
import * as Constants from '../Constants';
import {consoleLogFunc} from './MethodsUtils';
const {derivePath} = require('ed25519-hd-key');
import bip39 from 'react-native-bip39';
import nacl from 'tweetnacl';
const solanaWeb3 = require('@solana/web3.js');

import {Slip10, Slip10Curve, Keccak256} from '@cosmjss/crypto';
import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
} from '@cosmjss/crypto';
import {toBase64} from '@cosmjs/encoding';
import secp256k1 from 'secp256k1';
import {
  createAddressFromMnemonic,
} from './MnemonicsUtilsCosmos';
import {serializeSignDoc} from '@cosmjs/launchpad';

const {stringToPath} = require('@cosmjss/crypto');

const {CreateWallet} = NativeModules;
/************************************************** validate Mnemonics ***************************************************/
export const validateMnemonics = (mnemonics: any) => {
  return new Promise((resolve, reject) => {
    try {
      const validMnemonics = validateMnemonic(mnemonics);
      resolve(validMnemonics);
    } catch (e: any) {
      reject(Constants.INVALID_MNEMONICS);
    }
  });
};
/************************************************** create wallet ***************************************************/
export const createWallet = async () => {
    return new Promise((resolve, reject) => {
        try {
            CreateWallet.generateMnemonics(async (obj: any) => {
                consoleLogFunc('---------Obj111', JSON.parse(obj));
                let data = JSON.parse(obj);
                let mnemonics = data?.mnemonics;
                let mnemonicsArray = mnemonics?.split(' ')
                const duplicates = mnemonicsArray.filter((item: any, index: any) => mnemonicsArray.some((elem: any, idx: any) => elem === item && idx !== index));
                if (duplicates?.length > 0) {
                    resolve({retry: true})
                }
                let ethWallet = data?.eth;
                let BTC_obj = data?.btc;
                let solObj;
                let cosmos_obj;
                
                if (ethWallet.pvtKey?.length < 66) {
                    let suffix = '0x' + '0'.repeat(66 - ethWallet.pvtKey?.length);
                    ethWallet.pvtKey = suffix + ethWallet.pvtKey.substring(2);
                }
                // Solana + Tron now derive natively (wallet-core), same as ETH/BTC.
                // Paths are pinned in WalletHandler.java to match the previous JS
                // implementations; verified byte-identical (address AND private key)
                // against scripts/derivation-check.js. See docs/UPGRADE_PLAN.md s13.
                let tronObj = {
                    address: data?.trx?.address,
                    privateKey: data?.trx?.pvtKey,
                };
                solObj = {
                    address: data?.sol?.address,
                    pvtKey: data?.sol?.pvtKey,
                };
                cosmos_obj = await createAddressFromMnemonic(mnemonics);
                consoleLogFunc("cosmos_obj-------Obj11", cosmos_obj);

                return resolve({
                    mnemonics,
                    eth_address: ethWallet.address,
                    ethObj: ethWallet,
                    btc_address: BTC_obj.address,
                    btcObj: BTC_obj,
                    trx_address: tronObj.address,
                    tronObj,
                    sol_address: solObj.address,
                    solObj,
                    cosmos_address: cosmos_obj?.address,
                    cosmos_obj,
                });
            });
        } catch (e: any) {
            console.warn('MM', 'create wallet error ', e);
            return reject(e);
        }
      });
};

/************************************************** sol address generation ***************************************************/

export const createSolAddress = async (mnemonics: any) => {
  try {
    const seed = await bip39.mnemonicToSeed(mnemonics);
    const path = `m/44'/501'/0'`;

    // ed25519-hd-key v2 requires a hex string (v1 accepted a Buffer).
    // Verified: v1(Buffer) and v2(hex) derive byte-identical keys.
    const derivedSeed = derivePath(path, Buffer.from(seed).toString('hex')).key;

    var account = new solanaWeb3.Account(
      nacl.sign.keyPair.fromSeed(derivedSeed).secretKey,
    );
    consoleLogFunc(
      'account----::::::::::::::::::::publicKey',
      account.publicKey.toString(),
    );
    return account;
  } catch (error: any) {
    consoleLogFunc('createSolAddress error==', error);
  }
};

/************************************************** import wallet ***************************************************/

export const importWallet = (mnemonics: any, btcOnly = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!validateMnemonic(mnemonics)) {
                return reject('Invalid Mnemonics');
            }
            // ********************************  FOR ETH  ************************************
            CreateWallet.generateAddressFromMnemonics(mnemonics, async (obj: any) => {
                consoleLogFunc('---------Obj', JSON.parse(obj));
                let data = JSON.parse(obj);
                let ethWallet = data.eth;
                let tronObj;
                let solObj;
                let BTC_obj = data.btc;
                let cosmos_obj;

                if (ethWallet.pvtKey?.length < 66) {
                    let suffix = '0x' + '0'.repeat(66 - ethWallet.pvtKey?.length);
                    ethWallet.pvtKey = suffix + ethWallet.pvtKey.substring(2);
                }


                // Solana + Tron now derive natively (wallet-core), same as ETH/BTC.
                // Paths are pinned in WalletHandler.java to match the previous JS
                // implementations; verified byte-identical (address AND private key)
                // against scripts/derivation-check.js. See docs/UPGRADE_PLAN.md s13.
                tronObj = {
                    address: data?.trx?.address,
                    privateKey: data?.trx?.pvtKey,
                };
                solObj = {
                    address: data?.sol?.address,
                    pvtKey: data?.sol?.pvtKey,
                };

                cosmos_obj = await createAddressFromMnemonic(mnemonics);
                consoleLogFunc("cosmos_obj-------Obj", cosmos_obj);

                consoleLogFunc("btcTestnetObj-------Obj", {btc_address: BTC_obj.address,
                  btcObj: BTC_obj,});
                
                return resolve({
                    mnemonics,
                    eth_address: ethWallet.address,
                    ethObj: ethWallet,
                    btc_address: BTC_obj.address,
                    btcObj: BTC_obj,
                    trx_address: tronObj.address,
                    tronObj,
                    sol_address: solObj.address,
                    solObj,
                    cosmos_address: cosmos_obj?.address,
                    cosmos_obj,
                });


            });
        } catch (e: any) {
            return reject(e);
        }
  });
};
export const signCosmosMessage1 = async (
  mnemonic: any,
  signerAddress: any,
  rawMessage: any
) => {
  // 1. Derive private key using Secp256k1
consoleLogFunc('1')
  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  consoleLogFunc('2')

  const hdPath = stringToPath("m/44'/60'/0'/0/0");
  consoleLogFunc('3')

  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  consoleLogFunc('4')

  const privKeyBuffer = Buffer.from(privkey);
  consoleLogFunc('5')

  const pubkeyCompressed = secp256k1.publicKeyCreate(privKeyBuffer, true);
  consoleLogFunc('6')

  const pubKeyBase64 = toBase64(pubkeyCompressed);
  consoleLogFunc('7')

  const base64Data = Buffer.from(rawMessage).toString("base64");
  const aminoDoc = {
    chain_id: "",
    account_number: "0",
    sequence: "0",
    fee: {
      gas: "0",
      amount: [],
    },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer: signerAddress,
          data: base64Data,
        },
      },
    ],
    memo: "",
  };

  // 3. Serialize and hash (Keccak256 for ETH-style)
  const serialized = serializeSignDoc(aminoDoc);
  const hash = require("js-sha3").keccak_256(serialized); // hex string
  const hashBytes = Buffer.from(hash, "hex");
  const signature = await Secp256k1.createSignature(hashBytes, privkey);
  const signatureBytes = new Uint8Array([
    ...signature.r(32),
    ...signature.s(32),
  ]);
  const signatureBase64 = toBase64(signatureBytes);
  return {
    wallet_address: signerAddress,
    pubKey: pubKeyBase64,
    signature: signatureBase64,
  };
};

export const signCosmosMessage = async (
  mnemonic: any,
  signerAddress: any,
  rawMessage: any,
) => {
    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
    const hdPath = stringToPath("m/44'/60'/0'/0/0")//stringToPath("m/44'/118'/0'/0/0"); // Cosmos default
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
    const pubkey = await Secp256k1.makeKeypair(privkey);
    const compressedPubkey = Secp256k1.compressPubkey(pubkey.pubkey);

    consoleLogFunc('compressedPubkey>>>>', compressedPubkey);
    const pubKeyBase64 = toBase64(compressedPubkey);

    consoleLogFunc('pubKeyBase64>>>>', pubKeyBase64);
    const base64Data = Buffer.from(rawMessage).toString("base64");

    const aminoDoc = {
      chain_id: "",
      account_number: "0",
      sequence: "0",
      fee: {
        gas: "0",
        amount: [],
      },
      msgs: [
        {
          type: "sign/MsgSignData",
          value: {
            signer: signerAddress,
            data: base64Data,
          },
        },
      ],
      memo: "",
    };

    const serialized = serializeSignDoc(aminoDoc);
    const hash = new Keccak256(serialized).digest();
  
    const signature = await Secp256k1.createSignature(hash, privkey);
  
    const signatureBytes = new Uint8Array([
      ...signature.r(32),
      ...signature.s(32),
    ]);
    const signatureBase64 = toBase64(signatureBytes);

  return {
    wallet_address: signerAddress,
    pubKey: pubKeyBase64,
    signature: signatureBase64,
  };
};

