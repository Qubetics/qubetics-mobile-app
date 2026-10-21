import bs58 from 'bs58';
import { createSolAddress } from "./MnemonicsUtils";
import Singleton from "../Singleton";
import { bigNumberSafeMath, consoleLogFunc } from "./MethodsUtils";

const { derivePath } = require('ed25519-hd-key');
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token')
const bip39 = require('bip39');
const {
    Connection,
} = require('@solana/web3.js');
import nacl from 'tweetnacl';





export const validateSolanaAddress = (text: any) => {
    try {
        new solanaWeb3.PublicKey(text);
        return true;
    } catch (error: any) {
        return false;
    }
};


export const sendSOLANA = async (
    recipientPublicKey: any,
    recipientAmount: any,
    mnemonics: any,
) => {
    return new Promise(async (resolve, reject) => {
        try {
            consoleLogFunc('sendSOLANA start recipientPublicKey:', recipientPublicKey, 'recipientAmount:', recipientAmount);
            const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;

            let amount = bigNumberSafeMath(recipientAmount, '*', LAMPORTS_PER_SOL);
            consoleLogFunc('sendSOLANA lamports:', amount);

            const fromAccount = await createSolAddress(mnemonics);
            consoleLogFunc('sendSOLANA fromPubkey:', fromAccount.publicKey.toBase58());

            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: fromAccount.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
                    lamports: Number(amount),
                }),
            );
            consoleLogFunc('sendSOLANA transaction built');

            let solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
            consoleLogFunc('sendSOLANA solRpcUrl:', solRpcUrl);
            const connection = new Connection(solRpcUrl, 'confirmed');

            consoleLogFunc('sendSOLANA sending transaction...');
            let res = await solanaWeb3.sendAndConfirmTransaction(
                connection,
                transaction,
                [fromAccount],
            );
            consoleLogFunc('sendSOLANA success txid:', res);
            return resolve(res);
        } catch (err: any) {
            consoleLogFunc('sendSOLANA error:', err?.message || err);

            let message = err?.message ? err?.message : err
            let arr = message.split(' ');
            let findIndex = arr?.indexOf("signature") == -1 ? arr?.indexOf("Signature") : arr?.indexOf("signature")
            consoleLogFunc('sendSOLANA err arr:', arr, 'findIndex:', findIndex);
            if (findIndex != -1 && arr.length >= findIndex + 1) {
                arr[findIndex + 1];
                let res = arr[findIndex + 1];
                consoleLogFunc('sendSOLANA resolving with sig from error:', res);
                return resolve(res);
            } else if (message?.includes('Too Many Requests')) {
                consoleLogFunc('sendSOLANA rate limited');
                return reject('Txn cannot send. Please try again.');
            } else {
                return reject(err);
            }
        }
    });
};


export const sendTokenSOLANA = async (
    recipientPublicKey: any,
    recipientAmount: any,
    mnemonics: any,
    contractAddress: any,
    decimal: any,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        consoleLogFunc('sendTokenSOLANA start recipientPublicKey:', recipientPublicKey, 'recipientAmount:', recipientAmount, 'contractAddress:', contractAddress, 'decimal:', decimal);
        let decimals = decimal?.toString()?.length - 1 || 0;
        consoleLogFunc('sendTokenSOLANA parsed decimals:', decimals);

        const fromWallet = await createSolAddress(mnemonics);
        consoleLogFunc('sendTokenSOLANA fromWallet:', fromWallet.publicKey.toBase58());

        const mint = new solanaWeb3.PublicKey(contractAddress);
        const receipentKey = new solanaWeb3.PublicKey(recipientPublicKey);
        consoleLogFunc('sendTokenSOLANA mint:', mint.toBase58(), 'recipient:', receipentKey.toBase58());

        let solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
        consoleLogFunc('sendTokenSOLANA solRpcUrl:', solRpcUrl);
        const modifyComputeUnits = solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 });
        const addPriorityFee = solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 450000 });
        const connection = new Connection(solRpcUrl, 'confirmed');

        consoleLogFunc('sendTokenSOLANA fetching mint account info...');
        const mintAccountInfo = await connection.getAccountInfo(mint);
        if (!mintAccountInfo) {
          consoleLogFunc('sendTokenSOLANA mint account not found for:', contractAddress);
          throw new Error('Mint account not found');
        }
        const owner = mintAccountInfo.owner?.toBase58?.() ?? '';
        const isToken2022 = owner === splToken.TOKEN_2022_PROGRAM_ID.toBase58();
        consoleLogFunc('sendTokenSOLANA mint owner:', owner, 'isToken2022:', isToken2022);

        const tokenProgramId = isToken2022 ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID;

        consoleLogFunc('sendTokenSOLANA getting/creating fromTokenAccount...');
        const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
          connection,
          fromWallet,
          mint,
          fromWallet.publicKey,
          false,
          undefined,
          undefined,
          tokenProgramId);
        consoleLogFunc('sendTokenSOLANA fromTokenAccount:', fromTokenAccount.address.toBase58());

        // Derive recipient ATA without a separate creation transaction to avoid
        // TokenAccountNotFoundError caused by the confirmation race in getOrCreateAssociatedTokenAccount.
        const toTokenAccountAddress = await splToken.getAssociatedTokenAddress(
          mint,
          receipentKey,
          false,
          tokenProgramId,
        );
        const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccountAddress);
        const needsCreateToAccount = toTokenAccountInfo === null;
        consoleLogFunc('sendTokenSOLANA toTokenAccountAddress:', toTokenAccountAddress.toBase58(), 'needsCreate:', needsCreateToAccount);

        // Balance checks — diagnose silent failures before broadcast
        const solBalance = await connection.getBalance(fromWallet.publicKey);
        consoleLogFunc('sendTokenSOLANA fromWallet SOL balance (lamports):', solBalance);
        // Rent-exempt min for a system account is 890880 lamports; need at least ~50k on top for fees
        const RENT_EXEMPT_MIN = 890880;
        const MIN_FEE_BUFFER = 50000;
        if (solBalance < RENT_EXEMPT_MIN + MIN_FEE_BUFFER) {
            const solStr = (solBalance / 1e9).toFixed(6);
            consoleLogFunc('sendTokenSOLANA insufficient SOL:', solBalance, 'lamports');
            throw new Error(`Insufficient SOL to pay transaction fees. Current balance: ${solStr} SOL. Please add at least 0.001 SOL to your wallet.`);
        }
        const tokenBalance = await connection.getTokenAccountBalance(fromTokenAccount.address);
        consoleLogFunc('sendTokenSOLANA fromTokenAccount balance:', tokenBalance?.value?.uiAmount, tokenBalance?.value?.amount);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        consoleLogFunc('sendTokenSOLANA blockhash:', blockhash, 'lastValidBlockHeight:', lastValidBlockHeight);

        const transaction = new solanaWeb3.Transaction({
            blockhash,
            lastValidBlockHeight,
            feePayer: fromWallet.publicKey,
        })
          .add(modifyComputeUnits)
          .add(addPriorityFee);

        if (needsCreateToAccount) {
          consoleLogFunc('sendTokenSOLANA adding createAssociatedTokenAccount instruction for recipient');
          transaction.add(splToken.createAssociatedTokenAccountInstruction(
            fromWallet.publicKey,
            toTokenAccountAddress,
            receipentKey,
            mint,
            tokenProgramId,
          ));
        }

        transaction.add(splToken.createTransferCheckedInstruction(
                fromTokenAccount.address,
                mint,
                toTokenAccountAddress,
                fromWallet.publicKey,
                recipientAmount,
                decimals,
                [],
                tokenProgramId,
              ));

        consoleLogFunc('sendTokenSOLANA transaction built, signing...');
        transaction.sign(fromWallet);
        const signature = getSignature(transaction);
        consoleLogFunc('sendTokenSOLANA signature:', signature);

        // Serialize once and reuse for both simulation and send
        const serializedTransaction = transaction.serialize();
        consoleLogFunc('sendTokenSOLANA serialized tx length:', serializedTransaction.length);

        // Simulate using the non-deprecated VersionedTransaction API
        const simResult = await connection.simulateTransaction(
          solanaWeb3.VersionedTransaction.deserialize(serializedTransaction),
          { sigVerify: false },
        );
        consoleLogFunc('sendTokenSOLANA simulate err:', simResult?.value?.err, 'logs:', simResult?.value?.logs);
        if (simResult?.value?.err) {
            const simErr = simResult.value.err;
            if (simErr?.InsufficientFundsForRent !== undefined) {
                throw new Error('Insufficient SOL to pay transaction fees. Please add SOL to your wallet.');
            }
            if (simErr?.InstructionError) {
                const [idx, detail] = simErr.InstructionError;
                throw new Error(`Transaction instruction ${idx} failed: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
            }
            throw new Error('Transaction simulation failed: ' + JSON.stringify(simErr));
        }
        consoleLogFunc('sendTokenSOLANA simulation passed, sending...');

        const transactionResponse = await transactionSenderAndConfirmationWaiterNew({
            connection,
            serializedTransaction,
            blockhash,
            lastValidBlockHeight,
        });
        consoleLogFunc('sendTokenSOLANA transactionResponse:', transactionResponse);

        if (!transactionResponse) {
          consoleLogFunc('sendTokenSOLANA transactionResponse is null — not confirmed');
          return reject({message: "Transaction not confirmed"});
        }

        if (transactionResponse.meta?.err) {
          consoleLogFunc('sendTokenSOLANA meta error:', transactionResponse?.meta?.err);
          return reject({message: getSolanaError(transactionResponse)});
        }

        consoleLogFunc('sendTokenSOLANA success signature:', signature);
        return resolve(signature);
      } catch (err: any) {
        consoleLogFunc('sendTokenSOLANA caught error:', err?.message || err);
        return reject({message: err?.message || "Transaction not confirmed"});
      }
    });
  };

function getSolanaError(txResult: any) {
    const logs = txResult?.meta?.logMessages || [];
    const errorLog = logs.find((l: any) => l.includes("Program log: Error:"));
    consoleLogFunc("ERROR_LOG>>>", errorLog);

    if (errorLog) {
        return errorLog.split("Error:")[1].trim();
    }

    const customErr = logs.find((l: any) => l.includes("custom program error"));
    if (customErr) {
        const match = customErr.match(/custom program error: (0x[0-9a-f]+)/);
        if (match) {
            return `Custom program error ${match?.[1]}`;
        }
    }

    if (typeof txResult.meta.err === "string") {
        return txResult.meta.err;
    }

    return "Transaction not confirmed";
}
function getSignature(transaction: any) {
    const signature =
        'signature' in transaction
            ? transaction.signature
            : transaction.signatures[0];
    if (!signature) {
        throw new Error(
            'Missing transaction signature, the transaction was not signed by the fee payer',
        );
    }
    return bs58.encode(signature);
}
  
const SEND_OPTIONS = {
    skipPreflight: true,
    maxRetries: 0
  };

async function transactionSenderAndConfirmationWaiterNew({
    connection,
    serializedTransaction,
}: {
    connection: any;
    serializedTransaction: any;
    // Accepted and ignored. Callers still pass blockhash and
    // lastValidBlockHeight from when confirmation used blockhash expiry; this
    // polls getSignatureStatus for 60s instead (see the comment below), so
    // neither value has any effect. Declared here so the call sites keep
    // type-checking without implying the expiry is honoured.
    blockhash?: any;
    lastValidBlockHeight?: any;
}) {
    const txid = await connection.sendRawTransaction(serializedTransaction, SEND_OPTIONS);
    consoleLogFunc('transactionSenderAndConfirmationWaiterNew txid:', txid);

    // Poll getSignatureStatus every 2s for up to 60s, resending each cycle to
    // keep the transaction alive. getTransaction() is a one-shot query and
    // returns null immediately if not yet confirmed — do not use it for waiting.
    for (let attempt = 0; attempt < 30; attempt++) {
        await wait(2000);

        try {
            await connection.sendRawTransaction(serializedTransaction, SEND_OPTIONS);
        } catch (_: any) {}

        try {
            const status = await connection.getSignatureStatus(txid, { searchTransactionHistory: false });
            const val = status?.value;
            consoleLogFunc(`transactionSenderAndConfirmationWaiterNew attempt ${attempt + 1} status:`, val?.confirmationStatus, 'err:', val?.err);

            if (val?.err) {
                throw val.err;
            }

            if (val?.confirmationStatus === 'confirmed' || val?.confirmationStatus === 'finalized') {
                const response = await connection.getTransaction(txid, {
                    commitment: 'confirmed',
                    maxSupportedTransactionVersion: 0,
                });
                consoleLogFunc('transactionSenderAndConfirmationWaiterNew confirmed, response:', !!response);
                return response;
            }
        } catch (e: any) {
            // Propagate on-chain errors (InstructionError, string codes, etc.)
            if (e && (e.InstructionError !== undefined || typeof e === 'string' || typeof e === 'number')) {
                consoleLogFunc('transactionSenderAndConfirmationWaiterNew on-chain error:', e);
                throw e;
            }
            consoleLogFunc('transactionSenderAndConfirmationWaiterNew status check error:', e?.message);
        }
    }

    throw new Error('Transaction confirmation timeout after 60s');
}

export const sendSOLANAFromJupiterSwapLegacyTxn = async (swapTransaction: any, mnemonics: any, solAddress: any) => {
    const fromAccount = await createSolAddress(mnemonics);
    const txnBytes = Buffer.from(swapTransaction, 'base64');

    const numSigs = txnBytes[0]; // compact-u16, 1 byte for realistic counts
    const messageStart = 1 + numSigs * 64;
    const isVersioned = (txnBytes[messageStart] & 0x80) !== 0;
    consoleLogFunc("DBG numSigs:", numSigs, "isVersioned:", isVersioned, "txnLen:", txnBytes.length);

    // compact-u16 decoder
    const readCU16 = (off: any) => {
        const b0 = txnBytes[off];
        if ((b0 & 0x80) === 0) return { value: b0, size: 1 };
        const b1 = txnBytes[off + 1];
        if ((b1 & 0x80) === 0) return { value: (b1 << 7) | (b0 & 0x7F), size: 2 };
        const b2 = txnBytes[off + 2];
        return { value: (b2 << 14) | ((b1 & 0x7F) << 7) | (b0 & 0x7F), size: 3 };
    };

    // Parse the account list to find which sig slot belongs to the user.
    // For gasless: slot[0]=relayer(fee payer), slot[1]=user — both start as zeros,
    // so we CANNOT rely on "find first empty slot"; we must match by pubkey.
    let userSlot = 0;
    try {
        // v0 message: [0x80][numReqSigs, numROSigned, numROUnsigned][CU16 numAccts][32-byte pubkeys...]
        // legacy:     [numReqSigs, numROSigned, numROUnsigned][CU16 numAccts][32-byte pubkeys...]
        const headerOff = isVersioned ? messageStart + 1 : messageStart;
        const numRequiredSigs = txnBytes[headerOff];
        const { size: cu16Size } = readCU16(headerOff + 3);
        const accountsOff = headerOff + 3 + cu16Size;

        const userKey = fromAccount.publicKey.toBytes();
        for (let i = 0; i < numRequiredSigs; i++) {
            const pkOff = accountsOff + i * 32;
            const pk = txnBytes.subarray(pkOff, pkOff + 32);
            consoleLogFunc(`DBG signer[${i}]:`, new solanaWeb3.PublicKey(pk).toBase58());
            if (pk.every((b, idx) => b === userKey[idx])) {
                userSlot = i;
                break;
            }
        }
    } catch (e: any) {
        consoleLogFunc("DBG slot parse err:", e?.message);
    }

    const sigOffset = 1 + userSlot * 64;
    consoleLogFunc("DBG userSlot:", userSlot, "sigOffset:", sigOffset);

    const messageBytes = txnBytes.subarray(messageStart);
    const sigBytes = Buffer.from(nacl.sign.detached(messageBytes, fromAccount.secretKey));
    consoleLogFunc("DBG selfValid:", nacl.sign.detached.verify(messageBytes, sigBytes, fromAccount.publicKey.toBytes()));
    consoleLogFunc("DBG signature:", bs58.encode(sigBytes));

    sigBytes.copy(txnBytes, sigOffset, 0, 64);
    const serializedTransaction = txnBytes.toString('base64');
        consoleLogFunc("DBG serializedTransaction:", serializedTransaction);

    return { signature: bs58.encode(sigBytes), signedTransaction: serializedTransaction };
};

// After returning a signed tx to Jupiter via WalletConnect, Jupiter co-signs slot 0
// and submits. The actual Solana tx hash = slot-0 signature, which we don't know yet.
// This polls getSignaturesForAddress until the submitted tx appears, then confirms by
// fetching the transaction via raw RPC (needed for versioned v0 txns which @solana/web3.js
// 1.36 cannot parse). Falls back to the user's own signature on timeout/error.
export const resolveActualTxHash = async (userSignature: any, solAddress: any) => {
    try {
        const solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
        const connection = new Connection(solRpcUrl, 'confirmed');
        const pubkey = new solanaWeb3.PublicKey(solAddress);

        // Initial wait: give Jupiter time to co-sign slot 0 and broadcast
        await new Promise(resolve => setTimeout(resolve, 3000));

        for (let attempt = 0; attempt < 4; attempt++) {
            if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                const recentSigs = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
                for (const sigInfo of recentSigs) {
                    if (sigInfo.err) continue;
                    try {
                        // Raw RPC call so we can pass maxSupportedTransactionVersion: 0
                        // for Jupiter's versioned (v0) transactions — web3.js 1.36 doesn't
                        // support VersionedTransaction in getTransaction().
                        const resp = await fetch(solRpcUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                id: 1,
                                method: 'getTransaction',
                                params: [
                                    sigInfo.signature,
                                    { encoding: 'json', maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
                                ],
                            }),
                        });
                        const json = await resp.json();
                        const txSigs = json?.result?.transaction?.signatures || [];
                        consoleLogFunc('resolveActualTxHash check:', sigInfo.signature, 'sigs:', txSigs);
                        if (txSigs.includes(userSignature)) {
                            consoleLogFunc('resolveActualTxHash found real txid:', sigInfo.signature);
                            return sigInfo.signature;
                        }
                    } catch (_: any) {}
                }
            } catch (_: any) {}
        }
    } catch (e: any) {
        consoleLogFunc('resolveActualTxHash error:', e?.message);
    }
    consoleLogFunc('resolveActualTxHash fallback to user sig:', userSignature);
    return userSignature;
};

const wait = (time: any) =>
    new Promise((resolve) => setTimeout(resolve, time));

export const validSolanaTokenAddress = async (tokenAddress: any) => {
    try {
        const publicKey = new solanaWeb3.PublicKey(tokenAddress);
        const connection = new Connection(Singleton.getInstance().SOL_RPC_URL, 'confirmed');
        try {
            await splToken.getMint(connection, publicKey);
            return true;
        } catch (e: any) {
            // Token-2022 mints live under a different program id, so a miss on the
            // classic program is not proof the mint is invalid.
            await splToken.getMint(
                connection,
                publicKey,
                undefined,
                splToken.TOKEN_2022_PROGRAM_ID,
            );
            return true;
        }
    } catch (error: any) {
        // An error will be thrown if the address is not a valid token address
        return false;
    }
}

export async function deriveSolanaPrivateKey(mnemonic: any) {

  try {
    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const path = `m/44'/501'/0'`;
    // ed25519-hd-key v2 requires a hex string (v1 accepted a Buffer).
    const derivedSeed = derivePath(path, Buffer.from(seed).toString('hex')).key;
    var account = new solanaWeb3.Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
    return account.secretKey;
  } catch (error: any) {
    return null;
  }

}
