import * as Constants from './Constants'
import { Dimensions, NativeModules, Platform } from 'react-native';
import { hasDynamicIsland, hasNotch } from 'react-native-device-info';
import Singleton from './Singleton';
import { consoleLogFunc, getData, saveData } from './Utils/MethodsUtils';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import moment from 'moment';
import * as ScreenshotPrevent from 'react-native-screenshot-prevent';

const ScreenshotPreventAny: any = ScreenshotPrevent;
const screenshotEnabled = (() => {
    if (typeof ScreenshotPreventAny.enabled === 'function') return ScreenshotPreventAny.enabled;
    if (typeof ScreenshotPreventAny.default?.enabled === 'function') return ScreenshotPreventAny.default.enabled;
    if (typeof ScreenshotPreventAny === 'function') return ScreenshotPreventAny;
    return undefined;
})();

// BUG PRESERVED: `nacl` is never imported; the coinFamily == 4 branch of signPersonalMessage throws ReferenceError at runtime
declare const nacl: any;

export const { width: screenWidth } = Dimensions.get("screen");

export const getDimensionPercentage = (dimension: any) => {
    let height = 926;
    let width = 428;
    let percentage = (dimension / (2 * (height + width))) * 100;
    let screenHeight = Dimensions.get('screen').height;
    let screenWidth = Dimensions.get('screen').width;
    let actualDImension = 2 * (screenHeight + screenWidth) * (percentage / 100);
    return actualDImension;
};
export { getDimensionPercentage as dimen };
export const heightDimen = (dimension: any) => {
    let height = 926;
    let percentage = (dimension / height) * 100;
    let screenHeight = Dimensions.get('screen').height;
    let actualDImension = screenHeight * (percentage / 100);
    return actualDImension;
};
export const widthDimen = (dimension: any) => {
    let width = 428;
    let percentage = (dimension / width) * 100;
    let screenWidth = Dimensions.get('screen').width;
    let actualDImension = screenWidth * (percentage / 100);
    return actualDImension;
};

export const dynamicFontNew = (text: any) => {
    const length = text?.length;
    return length > 8 ? getDimensionPercentage(12) : getDimensionPercentage(14)
};

export const hasNotchWithIOS = () => {
    return Platform.OS === 'ios' && (hasDynamicIsland() || hasNotch());
}



export const roundToDecimal = (input: any, decimalPlaces = 8, roundingMethod = 'floor') => {
    // Ensure the input is treated as a number
    let num = typeof input === 'string' ? parseFloat(input) : input;

    // Multiply by 10^decimalPlaces to shift the decimal point
    const factor = Math.pow(10, decimalPlaces);

    // Apply rounding based on the specified method
    let rounded: any;
    if (roundingMethod === 'floor') {
        rounded = Math.floor(num * factor) / factor;
    } else if (roundingMethod === 'ceiling') {
        rounded = Math.ceil(num * factor) / factor;
    } else {
        // Default to rounding normally
        rounded = Math.round(num * factor) / factor;
    }

    // Convert the result back to a number to remove unnecessary trailing zeros
    return parseFloat(rounded.toFixed(decimalPlaces));
}


export const getGasLimitFromData = async (from: any, to: any, data: any, coinFamily: any) => {
    return new Promise<any>(async (resolve, reject) => {
        let provider = await web3BNBfn(coinFamily);

        provider
            .estimateGas({
                from: from,
                data: data,
                to: to,
            })
            .then((res: any) => {
                // web3 returned a Number here; keep that shape for callers.
                const gas = res?.toNumber ? res.toNumber() : Number(res);
                consoleLogFunc('resget_getlimitConnect=== ', gas);
                resolve(gas);
            })
            .catch((error: any) => {
                reject(error);
            });
    });
};
export const getGasPriceForWc = async (coinFamily: any) => {
    return new Promise<any>(async (resolve, reject) => {
        let provider = await web3BNBfn(coinFamily);
        provider.getFeeData().then(({ gasPrice: res }: any) => {
            // web3 returned a decimal string; callers do arithmetic (gasPrice / 1e9).
            const gasPrice = res?.toString ? res.toString() : res;
            consoleLogFunc('resget_getlimitConnect=== ', gasPrice);
            resolve(gasPrice);
        }).catch((error: any) => {
            reject(0);
        });
    });
};


export const getNonceForWc = async (address: any, coinFamily: any) => {
    return new Promise<any>(async (resolve, reject) => {
        let provider = await web3BNBfn(coinFamily);
        provider.getTransactionCount(address, "latest").then((res: any) => {
            consoleLogFunc('resget_getlimitConnect=== ', res);
            resolve(res);
        }).catch((error: any) => {
            reject(0);
        });
    });
};
export const signPersonalMessage = async (data: any, pKey: any, coinFamily: any) => {
    return new Promise<any>(async (resolve, reject) => {
        try {
            let signature: any = null;
            if (coinFamily == 4) {
                let privateKeyBytes = bs58.decode(pKey);
                let keyPair = nacl.sign.keyPair.fromSecretKey(privateKeyBytes);
                const rawMessage = data;
                const encodedMessage = new TextEncoder().encode(rawMessage);
                let sig = nacl.sign.detached(encodedMessage, keyPair.secretKey);
                const uint8Array = new Uint8Array(sig);
                signature = bs58.encode(uint8Array);
            } else {
                const rpcUrl = coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().BSC_RPC_URL
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                let wallet = new ethers.Wallet(
                    pKey,
                    provider
                );
                signature = await wallet.signMessage(data);
            }
            resolve(signature);
        } catch (err) {
            consoleLogFunc("Err_signPersonalMessage::", err);
            reject(err);
        }
    });
};

const web3BNBfn = (coinFamily: any): any => {
    let rpcUrl;
    switch (coinFamily) {
        case 1: //BNB
            rpcUrl = Singleton.getInstance().BSC_RPC_URL; break;
        case 2: //ETH
            rpcUrl = Singleton.getInstance().ETH_DAPP_RPC_URL; break;
        case 4: //MATIC
            rpcUrl = Singleton.getInstance().MATIC_RPC_URL; break;
        case 7: //TICS
            rpcUrl = Singleton.getInstance().TICS_RPC_URL; break;
        default:
            return undefined;
    }
    return new ethers.JsonRpcProvider(rpcUrl);
};

export const getSymbolByCoinFamily = (coinFamily: any) => {
    const tempTarget = Constants.AssetList.find((val) => val.coin_family == coinFamily);
    return tempTarget!.coin_symbol?.toUpperCase();
};

export const getQubeticsEventLabel = (event: any, status: any) => {
    switch (event) {
        case Constants.QUBETICS_EVENTS.SUBSCRIPTION_CREATE:
            return { label: "Subscription", status: "Success" };
        case Constants.QUBETICS_EVENTS.SESSION_UPDATE_STATUS:
            return status == "inactive_pending" ? { label: "End Session", status: "Success" } : { label: "Unknown Event", status: "Failed" };
        case Constants.QUBETICS_EVENTS.SUBSCRIPTION_CREATE_SESSION:
            return { label: "Start Session", status: "Success" };
        default:
            return { label: "Unknown Event", status: "Failed" };
    }
};

export const getDaysLeftOnPlan = (expiryAt: any) => {
    const expiryDate = moment(new Date(expiryAt))
    const currentDate = moment(new Date());
    const diffInDays = expiryDate.diff(currentDate, 'days'); // get difference in days
    const diffInHours = expiryDate.diff(currentDate, 'hours'); // get difference in hours
    const diffInMins = expiryDate.diff(currentDate, 'minutes'); // get difference in minutes
    const diffInSeconds = expiryDate.diff(currentDate, 'seconds'); // get difference in seconds
    if (diffInMins <= 0 && diffInSeconds > 0) {
        return `${diffInSeconds} seconds left`;
    } else if (diffInHours <= 0 && diffInMins > 0) {
        return `${diffInMins} ${diffInMins > 1 ? "minutes" : "minute"} left`;
    } else if (diffInDays <= 0 && diffInHours > 0) {
        return `${diffInHours} ${diffInHours > 1 ? "hours" : "hour"} left`;
    } else if (diffInDays > 0) {
        return `${diffInDays} ${diffInDays > 1 ? "days" : "day"} left`;
    } else {
        return 'Expired';
    }
};

/** Monotonic clock in ms from native (nanoseconds / 1e6); falls back to Date.now() if module missing. */
const getMonotonicTimeMs = async () => {
    const mod = NativeModules.SystemClockModule;
    if (mod && typeof mod.getSystemClocks === 'function') {
        const rawNs = Number(await mod.getSystemClocks());
        return rawNs / 1_000_000;
    }
    return Date.now();
};

export const updatePinState = async () => {
    let stored = null;
    try {
        stored = await getData(Constants.PIN_STATE);
        const state = stored
            ? JSON.parse(stored)
            : Constants.PIN_ATTEMPT_MODE;
        let updated = { ...state };
        consoleLogFunc(updated)
        const nowMillis = await getMonotonicTimeMs();
        consoleLogFunc("pinState nowMillis", nowMillis)

        const newAttempts = state.attempts + 1;
        updated.attempts = newAttempts;
        if (newAttempts > 1 && newAttempts % 10 === 0) {
            const block = newAttempts / 10;
            // 2. Calculate the lock duration:
            //    block 1 * 60,000 ms = 60,000 ms (1 minute)
            //    block 2 * 60,000 ms = 120,000 ms (2 minutes)
            //    block 3 * 60,000 ms = 180,000 ms (3 minutes)
            const ONE_MINUTE_IN_MS = 60 * 1000;
            const lockDuration = block * ONE_MINUTE_IN_MS; // milliseconds
            // 3. Update the state:
            updated.lockDuration = lockDuration;
            updated.lastMono = nowMillis; // store milliseconds timestamp
        }

        if (newAttempts > 0 && newAttempts % 10 === 0) {
            // Number of block cycles (10 attempts each)
            const block = newAttempts / 10;
            let lockDurationMinutes = 0;
            switch (block) {
                case 1:
                    lockDurationMinutes = 1;
                    break;
                case 2:
                    lockDurationMinutes = 2;
                    break;
                case 3:
                    lockDurationMinutes = 3;
                    break;
                default:
                    lockDurationMinutes = 4;
            }
            updated.lockDuration = lockDurationMinutes * 60 * 1000; // convert to ms
            updated.lastMono = nowMillis;
            updated.blocksLeft = block;

        }
        saveData(Constants.PIN_STATE, JSON.stringify(updated));
        const status = (updated.attempts > 1 && updated.attempts % 10 == 0) ? 'updated' : 'not updated';
        const attemptsLeft = (((updated?.blocksLeft || 0) + 1) * 10) - updated.attempts;
        updated = null;
        return { status, attemptsLeft };
    } catch (err) {
        consoleLogFunc("Err_updatePinState::", err);
        return null;
    }
    finally {
        stored = null;
    }
};

export const resetPinAttempts = async () => {
    let stored = await getData(Constants.PIN_STATE);
    if (stored) {
        stored = Constants.PIN_ATTEMPT_MODE;
        saveData(Constants.PIN_STATE, JSON.stringify(stored));
    }
};

export const shouldTriggerLockout = async () => {
    let stored = null;
    try {
        stored = await getData(Constants.PIN_STATE);
        if (!stored) {
            return null;
        }
        const state = JSON.parse(stored);
        let { attempts, lastMono, lockDuration } = state;
        const numAttempts = Number(attempts || 0);
        if (numAttempts >= 10) {
            const nowMs = await getMonotonicTimeMs();
            const expiry = lastMono + lockDuration;
            if (nowMs < lastMono) {
                await saveData(Constants.PIN_STATE, JSON.stringify({
                    ...state,
                    lastMono: nowMs
                }));
                consoleLogFunc("lastMono updated", lastMono)

                return null
            }

            if (nowMs >= expiry) {
                consoleLogFunc("expiry reached")
                return null;
            }
            const remaining = expiry - nowMs;

            return { ...state, remaining };
        }
        return null;
    } catch (error) {
        return null;
    } finally {
        stored = null;
    }
};


export const enableScreenshotPrevent = () => {
    try {
        if (typeof screenshotEnabled === 'function') {
            screenshotEnabled(true);
        }
    } catch (e) {
        console.warn('enableScreenshotPrevent failed:', e);
    }
}

export const disableScreenshotPrevent = () => {
    try {
        if (typeof screenshotEnabled === 'function') {
            screenshotEnabled(false);
        }
    } catch (e) {
        console.warn('disableScreenshotPrevent failed:', e);
    }
}