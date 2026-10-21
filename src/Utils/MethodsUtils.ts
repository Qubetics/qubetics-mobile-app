import EncryptedStorage from 'react-native-encrypted-storage';
import * as Constants from '../Constants';
import Singleton from '../Singleton';
import { Keyboard, NativeModules, Platform } from 'react-native';
import { BigNumber } from "bignumber.js";
import Aes from 'react-native-aes-crypto';
import { ethers } from 'ethers';
import Toast from 'react-native-simple-toast';
import { LanguageManager } from '../../LanguageManager';
import { getUtcServerTime } from '../Redux/Actions';
import { MORALIS_GRAPH_URL } from '../EndPoint';

const { CreateWallet, UntrustedKeyboard } = NativeModules;
const generateKey = (password: any, salt: any, cost: any, length: any) => {
  // react-native-aes-crypto v3 requires an explicit digest as the 5th argument.
  // v2 hardcoded SHA512Digest, so 'sha512' reproduces the identical key and keeps
  // previously-encrypted data decryptable. Do NOT change this value.
  return Aes.pbkdf2(password, salt, cost, length, 'sha512');
};

export const saveEncryptedData = (key: any, value: any, pin: any) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const encryptData = await encryptDataAES(value.toString(), pin)
      let response = await EncryptedStorage.setItem(
        key.toLowerCase(),
        encryptData as string
      );
      resolve(response);
    } catch (err: any) {
      consoleLogFunc('-----------------save reject', err)
      reject(err);
    }
  });
};

export const getEncryptedData = (key: any, pin: any) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      let response = await EncryptedStorage.getItem(key.toLowerCase());
      if (response == undefined) {
        reject({ message: 'No record' });
      }
      const decryptData = await decryptDataAES(response, pin, key);
      resolve(decryptData);
    } catch (err: any) {
      consoleLogFunc('TAG', err);
      reject(err);
    }
  });
};


const encryptDataAES = async (data: any, pin: any) => {
  try {
    let iv = await getData(Constants.AES_KEY);
    if (!iv) {
      iv = await Aes.randomKey(16);
      saveData(Constants.AES_KEY, iv);
    }
    let ciphertext;

    ciphertext = await generateKey(pin, Constants.PROJECT_NAME, 5000, 256).then(
      async key => {
        // v2 ignored this argument and always used AES/CBC/PKCS7Padding, so all
        // existing data is CBC. v3 honours the string: anything without "cbc"
        // silently selects AES/CTR, which cannot decrypt existing wallets.
        return await Aes.encrypt(data, key, iv, 'aes-256-cbc');
      },
    );
    return ciphertext;
  } catch (error: any) {
    console.error('Encryption failed:', error);
    return null;
  }
};

// The caller passes a third `key` argument that was never declared and is
// never read here; accepted as unused so the call type-checks.
const decryptDataAES = async (data: any, pin: any, _key?: any) => {
  try {
    const iv = await getData(Constants.AES_KEY);
    if (!!iv) {
      return generateKey(pin, Constants.PROJECT_NAME, 5000, 256).then(
        async key => {
          // Must match the encrypt path: v2 always used AES/CBC/PKCS7Padding.
          return await Aes.decrypt(data, key, iv, 'aes-256-cbc');
        },
      );
    }
  } catch (error: any) {
    return null;
  }
};

//******************************************* save Data **********************************************/
export const saveData = (key: any, value: any) => {
  EncryptedStorage.setItem(key, value?.toString()).then((res) => {
    consoleLogFunc('saveDataInStorage success');
  }).catch(err => {
    consoleLogFunc('newSaveData err::::', err);
  })
}

export const saveDataInStorage = (key: any, value: any) => {
  return new Promise<any>(async (resolve, reject) => {
    EncryptedStorage.setItem(key, value?.toString())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        consoleLogFunc("saveDataInStorage err::::", key, err);
        reject(err)
      });
  });
};
//******************************************* get Data **********************************************/
export const getData = (key: any) => {
  return new Promise<any>(async (resolve, reject) => {
    EncryptedStorage.getItem(key).then((res) => {
      resolve(res);
    }).catch(err => {
      reject(err);
      consoleLogFunc('newGetData err::::', err);
    })
  });
}

//******************************************* Remove Item **********************************************/
export const removeStorageItem = (key: any) => {
  return new Promise<any>((resolve, reject) => {
    EncryptedStorage.removeItem(key).then(response => {
      resolve(response);
    }).catch(error => {
      consoleLogFunc('clearStorage error $$$$$', error);
      reject(error);
    });
  });
}

//******************************************* ClearStorage **********************************************/
export const clearStorage = () => {
  return new Promise<any>((resolve, reject) => {
    EncryptedStorage.clear().then(response => {
      resolve(response);
    }).catch(error => {
      consoleLogFunc('clearStorage error $$$$$', error);
      reject(error);
    });
  });
}

/************************************************** ToFixed **************************************************************/
export const toFixed = (num: any, fixed: any) => {
  if (num) {
    num = num.toString(); //If it's not already a String
    if (num.includes('.')) {
      num = num.slice(0, num.indexOf('.') + (fixed + 1));
    }
    return Number(num);
  }
  else return Number(0);
}
/************************************************** getCryptoAddress **************************************************************/
export const getCryptoAddress = (coin_family: any, isFromChainAbstraction = false) => {
  const address =
    coin_family == 3
      ? (isFromChainAbstraction ? Singleton.getInstance().defaultMpcBtcAddress : Singleton.getInstance().defaultBtcAddress)
      : coin_family == 5
        ? Singleton.getInstance().defaultSolAddress
        : coin_family == 6
          ? Singleton.getInstance().defaultTrxAddress
          : coin_family == 1
            ? Singleton.getInstance().defaultBnbAddress
            : coin_family == 4
              ? Singleton.getInstance().defaultMaticAddress
              : coin_family == 7
                ? (isFromChainAbstraction ? Singleton.getInstance().defaultMpcEthAddress : Singleton.getInstance().defaultTicsAddress) || Singleton.getInstance().defaultCosmosAddress
                : Singleton.getInstance().defaultEthAddress;
  return address;
};
/************************************************** toFixedExp **************************************************************/
export function toFixedExp(num: any, fixed: any, value?: any) {
  if (num) {
    num = exponentialToDecimal(num);
    let re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num?.toString()?.match?.(re)?.[0];
  }
  else return '0.00';
}

export function toFixedExpCA(num: any, fixed: any, value?: any) {
  if (num) {
    num = exponentialToDecimal(num);
    let re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num?.toString()?.match?.(re)?.[0];
  }
  else return '';
}
/************************************************** exponentialToDecimal ***************************************************/
export const exponentialToDecimal = (exponential: any) => {
  let decimal = exponential?.toString().toLowerCase();
  if (decimal.includes('e+')) {
    const exponentialSplitted = decimal.split('e+');
    let postfix = '';
    for (let i = 0; i < +exponentialSplitted[1] - (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0); i++) {
      postfix += '0';
    }
    const addCommas = (text: any) => {
      let j = 3;
      let textLength = text.length;
      while (j < textLength) {
        text = `${text.slice(0, textLength - j)}${text.slice(textLength - j, textLength,)}`;
        textLength++;
        j += 3 + 1;
      }
      return text;
    };
    decimal = addCommas(exponentialSplitted[0].replace('.', '') + postfix);
  }
  if (decimal.toLowerCase().includes('e-')) {
    const exponentialSplitted = decimal.split('e-');
    let prefix = '0.';
    for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
      prefix += '0';
    }
    decimal = prefix + exponentialSplitted[0].replace('.', '');
  }
  return decimal;
}
export const bigNumberFormat = (number: any) => {
  return new BigNumber(number)
}
export const bigNumberSafeMath = function (c: any, operation: any, d: any, precision?: any) {
  BigNumber.config({ DECIMAL_PLACES: 18 });
  // Callers can pass a value that hasn't been fetched yet (null gas fee, missing
  // tx value). BigNumber throws on undefined, so treat those as zero.
  let a = new BigNumber((c ?? 0).toString());
  let b = new BigNumber((d ?? 0).toString());
  let rtn;
  // Figure out which operation to perform.
  switch (operation?.toLowerCase()) {
    case "-":
      rtn = a.minus(b);
      break;
    case "+":
      rtn = a.plus(b);
      break;
    case "*":
      rtn = a.multipliedBy(b);
    case "x":
      rtn = a.multipliedBy(b);
      break;
    case "÷":
    case "/":
      rtn = a.dividedBy(b);
      break;
    default:
      break;
  }
  return rtn ? rtn.toString() : '0';
};
/************************************************** exponentialToDecimalWithoutComma ***************************************************/
export const exponentialToDecimalWithoutComma = (exponential: any) => {
  let decimal = exponential.toString().toLowerCase();
  if (decimal.includes('e+')) {
    const exponentialSplitted = decimal.split('e+');
    let postfix = '';
    for (let i = 0; i < +exponentialSplitted[1] - (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0); i++) {
      postfix += '0';
    }
    return exponentialSplitted[0].replace('.', '') + postfix;
  }
  if (decimal.toLowerCase().includes('e-')) {
    const exponentialSplitted = decimal.split('e-');
    let prefix = '0.';
    for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
      prefix += '0';
    }
    decimal = prefix + exponentialSplitted[0].replace('.', '');
  }
  return decimal.toString();
};
/************************************************** getFirstDecimalNumber ***************************************************/
export const getFirstDecimalNumber = (value: any, altDecimal = 10) => {
  if (isNaN(Math.floor(Math.log10(value)))) {
    return exponentialToDecimal(toFixedExp(value, altDecimal))
  }
  return exponentialToDecimal(toFixedExp(value, - Math.floor(Math.log10(value) || altDecimal)))
}
/************************************************** currencyFormat ***************************************************/
export const currencyFormat = (num: any, toFixed: any) => {
  return num.toFixed(toFixed).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}
/************************************************** removecomma ***************************************************/
/************************************************** CommaSeprator ***************************************************/
export const CommaSeprator1 = (num: any, fixed?: any) => {
  if (isNaN(num)) return 0.00;
  if (num) {
    num = num?.toString(); //If it's not already a String
    num = exponentialToDecimal(num)
    if (num.includes('.')) {
      num = num.slice(0, num.indexOf('.') + (fixed + 1));
    }
    let number = num;                       // Decimal number
    let string = number.toString();         // Convert it into a string
    let array = string.split('.');          // Split the dot
    let firstNumber = +array[0];            // Get both numbers// The '+' sign transforms the string into a number again
    let secondNumber = array[1] == undefined ? 0 : array[1]; // 2
    return (Number(firstNumber).toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '.' + secondNumber);
  } else return '0.00'
}
/************************************************** CommaSepratorNew ***************************************************/
export const CommaSeprator = (num: any, fixed?: any) => {
  if (isNaN(num)) return 0.00;
  var val = num.toString(); //If it's not already a String
  let decimal = val?.toLowerCase();
  if ((decimal?.includes('e+') || decimal?.includes('e-'))) {
    let expoVal = exponentialToDecimal(num)
    let finalVal = expoVal.toString().length >= 6 ? expoVal.substring(0, 3) + "..." + expoVal.substring(expoVal.toString().length - 4, expoVal.toString().length) : expoVal
    return finalVal
  }
  if (!val.includes('.')) {
    if (val?.length >= 4) {
      return val = val?.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    } else {
      return val
    }
  }
  else if (val.includes('.')) {
    val = val.slice(0, val.indexOf('.') + (fixed + 1));
    var str = val.split('.');
    if (str[0].length >= 4) {
      str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (parseFloat(str[0]) >= 1) {
      val = val.slice(0, val.indexOf('.') + (2 + 1));
      var str = val.split('.');
      if (str[0].length >= 4) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
      }
      return str.join('.')
    }
    return str.join('.');
  }

}

export const requestWalletApiData = async (data: any = {}) => {
  const { walletData, walletName, } = data;
  let privateKey = walletData?.ethObj?.pvtKey
  const walletETH = new ethers.Wallet(privateKey);
  let utcTime = await getUtcServerTime({ payload: Constants.WALLET_NAME_ENCODE }) //moment.utc().format('YYYY-MM-DD HH:mm:ss')
  let signMessage = await walletETH.signMessage(utcTime as string)

  const apiData = {
    device_id: Singleton.getInstance().unique_id,
    wallet_address: walletData.eth_address,
    device_token: (await getData(Constants.DEVICE_TOKEN)) || "abc",
    wallet_name: walletName || "Basic",
    referral_code: "",
    signature: signMessage,
    message: utcTime,
    addressList: [
      { symbol: "bnb", address: walletData.eth_address, coin_family: 1 },
      { symbol: "eth", address: walletData.eth_address, coin_family: 2 },
      { symbol: "btc", address: walletData.btc_address, coin_family: 3 },
      { symbol: "pol", address: walletData.eth_address, coin_family: 4 },
      { symbol: "sol", address: walletData.sol_address, coin_family: 5 },
      { symbol: "trx", address: walletData.trx_address, coin_family: 6 },
      { symbol: "tics", address: walletData.eth_address, coin_family: 7 },
      { symbol: "tics", address: walletData.cosmos_address, coin_family: 7 },

    ],
  };

  if (apiData.device_token == "abc") {
    saveData(`${walletData.eth_address}_FCM`, "notSaved")
  }
  return apiData;
};

export const createUserWalletLocal = async (inputData: any = {}) => {
  const {
    resp,
    walletData,
    walletName,
    pin,
    walletAlreadyExist,
    onSuccess
  } = inputData;
  try {
  const data = await requestWalletApiData({
    walletData,
    walletName,
  });

  const addrsListKeys = [
    walletData.eth_address,
    walletData.eth_address,
    walletData.btc_address,
    walletData.eth_address,
    walletData.sol_address,
    walletData.trx_address,
    walletData.eth_address,
    walletData.cosmos_address
  ];
  const coinFamilyKeys = [1, 2, 3, 4, 5, 6, 7];

  Singleton.getInstance().defaultEthAddress = walletData.eth_address;
  Singleton.getInstance().defaultBnbAddress = walletData.eth_address;
  Singleton.getInstance().defaultMaticAddress = walletData.eth_address;
  Singleton.getInstance().defaultBtcAddress = walletData.btc_address;
  Singleton.getInstance().defaultSolAddress = walletData.sol_address;
  Singleton.getInstance().defaultTrxAddress = walletData.trx_address;
  Singleton.getInstance().defaultTicsAddress = walletData.eth_address;
  Singleton.getInstance().defaultCosmosAddress = walletData.cosmos_address;
  Singleton.getInstance().refCode = resp.data?.referral_code;

  const { ethObj, btcObj, tronObj, solObj, mnemonics, cosmos_obj } = walletData || {};
  if (ethObj) {
    await saveEncryptedData(ethObj.address + "_pk", ethObj.pvtKey, pin);
    await saveEncryptedData(ethObj.address, mnemonics, pin);
  }

  if (btcObj) {
    await saveEncryptedData(btcObj.address + "_pk", btcObj.pvtKey, pin);
    await saveEncryptedData(btcObj.address, mnemonics, pin);
  }
  if (tronObj) {
    await saveEncryptedData(tronObj.address + "_pk", tronObj.privateKey, pin);
    await saveEncryptedData(tronObj.address, mnemonics, pin);
  }
  if (solObj) {
    await saveEncryptedData(solObj.address, mnemonics, pin);
  }
  if (cosmos_obj) {
    consoleLogFunc("cosmos_obj ====INSIDE==", cosmos_obj?.address);
    saveData(Constants.COSMOS_ADDRESS, cosmos_obj?.address);
    await saveEncryptedData(cosmos_obj.address, mnemonics, pin);
  }

  const login_data = {
    access_token: resp.data.token,
    defaultEthAddress: walletData.eth_address,
    defaultBtcAddress: walletData.btc_address,
    defaultTrxAddress: walletData.trx_address,
    defaultSolAddress: walletData.sol_address,
    defaultBnbAddress: walletData.eth_address,
    defaultMaticAddress: walletData.eth_address,
    defaultTicsAddress: walletData.eth_address,
    defaultCosmosAddress: walletData.cosmos_address,
    walletName: walletName || "Basic",
    userId: resp.data.userId,
    refCode: "",
    tronPublicKey: walletData?.tronPublicKey,
  };
  const Wallet_Array = [
    {
      walletName: walletName || "Basic",
      loginRequest: data,
      defaultWallet: true,
      user_jwtToken: resp.data?.token,
      user_refreshToken: resp.data?.token,
      addrsListKeys: addrsListKeys,
      coinFamilyKeys: coinFamilyKeys,
      login_data: login_data,
    },
  ];

  // check wallet already exist
  if (walletAlreadyExist) {
    let MultiWalletArray = [];
    getData(Constants.MULTI_WALLET_LIST).then(async (multiWalletArray) => {
      MultiWalletArray = JSON.parse(multiWalletArray);
      MultiWalletArray?.map((item: any) => {
        item.defaultWallet = false;
      });
      MultiWalletArray?.push(Wallet_Array[0]);
      await saveDataInStorage(
        Constants.MULTI_WALLET_LIST,
        JSON.stringify(MultiWalletArray)
      );
    });
    saveData(Constants.FAVORITE, JSON.stringify([]));
  } else {
    await saveDataInStorage(
      Constants.MULTI_WALLET_LIST,
      JSON.stringify(Wallet_Array)
    );
    saveDataInStorage(Constants.SELECTED_CURRENCY, "USD");
    saveDataInStorage(Constants.SELECTED_LANGUAGE, "en");
    saveDataInStorage(Constants.SELECTED_SYMBOL, "$");
    Singleton.getInstance().CurrencySymbol = "$";
    Singleton.getInstance().CurrencySelected = "USD";
  }
  saveDataInStorage(Constants.USER_ID, resp.data.userId);
  await saveDataInStorage(Constants.ACCESS_TOKEN, resp.data.token);
  await saveDataInStorage(
    Constants.ACTIVE_ADDRESS_LIST,
    JSON.stringify(data.addressList)
  );
  await saveDataInStorage(
    Constants.ADDRESS_LIST,
    JSON.stringify(addrsListKeys)
  );
  await saveDataInStorage(
    Constants.COIN_FAMILY_LIST,
    JSON.stringify(coinFamilyKeys)
  );
  await saveDataInStorage(Constants.LOGIN_DATA, JSON.stringify(login_data));
  await saveDataInStorage(Constants.WALLET_NAME, walletName || "Basic");
  await saveDataInStorage(Constants.REFRESH_TOKEN, resp.data.refreshToken);
  Singleton.getInstance().walletName = walletName || "Basic";
  Singleton.getInstance().isMakerWallet = false;
  if (onSuccess) {
    onSuccess?.();
  }
  } catch (error: any) {
    consoleLogFunc('error createUserWalletLocal:::::', error);
    return;
  }
};

export const createPrivateKeyWalletLocal = async (inputData: any = {}) => {
  const {
    resp,
    walletData,
    walletName,
    pin,
    walletAlreadyExist,
    onSuccess,
  } = inputData;
  const { address, privateKey, chain } = walletData

  const data = {
    device_id: Singleton.getInstance().unique_id,
    wallet_address: address,
    device_token: (await getData(Constants.DEVICE_TOKEN)) || "abc",
    wallet_name: walletName || "Basic",
    referral_code: "",
    addressList: [
      { symbol: chain?.symbol?.toLowerCase(), address: address, coin_family: chain?.coin_family },
    ],
  }

  const addrsListKeys = [address];
  const coinFamilyKeys = [chain?.coin_family];
  let login_data: any = {
    access_token: resp.data.token,
    walletName: walletName || "Basic",
    userId: resp.data.userId,
    refCode: ""
  }

  Singleton.getInstance().refCode = resp.data?.referral_code;
  if (chain?.coin_family == 1) {//bsc
    Singleton.getInstance().defaultEthAddress = address
    Singleton.getInstance().defaultBnbAddress = address
    await saveEncryptedData(address + "_pk", privateKey, pin);
    login_data = { ...login_data, defaultBnbAddress: address, }
  } else if (chain?.coin_family == 2) {//eth
    Singleton.getInstance().defaultEthAddress = address
    await saveEncryptedData(address + "_pk", privateKey, pin);
    login_data = { ...login_data, defaultEthAddress: address, }

  } else if (chain?.coin_family == 3) {//btc
    Singleton.getInstance().defaultBtcAddress = address
    await saveEncryptedData(address + "_pk", privateKey, pin);
    login_data = { ...login_data, defaultBtcAddress: address, }

  } else { //trx
    Singleton.getInstance().defaultTrxAddress = address
    await saveEncryptedData(address + "_pk", privateKey, pin);
    login_data = { ...login_data, defaultTrxAddress: address, }

  }
  Singleton.getInstance().isMakerWallet = false;


  const Wallet_Array = [
    {
      walletName: walletName || "Basic",
      loginRequest: data,
      defaultWallet: true,
      user_jwtToken: resp.data?.token,
      user_refreshToken: resp.data?.token,
      addrsListKeys: addrsListKeys,
      coinFamilyKeys: coinFamilyKeys,
      login_data: login_data,
      isPrivateKey: true,
      coinFamily: chain?.coin_family,
      walletAddress: address
    },
  ];

  // check wallet already exist
  if (walletAlreadyExist) {
    let MultiWalletArray = [];
    getData(Constants.MULTI_WALLET_LIST).then(async (multiWalletArray) => {
      MultiWalletArray = JSON.parse(multiWalletArray);
      MultiWalletArray?.map((item: any) => {
        item.defaultWallet = false;
      });
      MultiWalletArray?.push(Wallet_Array[0]);
      await saveDataInStorage(
        Constants.MULTI_WALLET_LIST,
        JSON.stringify(MultiWalletArray)
      );
    });
    saveData(Constants.FAVORITE, JSON.stringify([]));
  } else {
    await saveDataInStorage(
      Constants.MULTI_WALLET_LIST,
      JSON.stringify(Wallet_Array)
    );
    saveDataInStorage(Constants.SELECTED_CURRENCY, "USD");
    saveDataInStorage(Constants.SELECTED_LANGUAGE, "en");
    saveDataInStorage(Constants.SELECTED_SYMBOL, "$");
    Singleton.getInstance().CurrencySymbol = "$";
    Singleton.getInstance().CurrencySelected = "USD";
  }
  saveDataInStorage(Constants.USER_ID, resp.data.userId);
  await saveDataInStorage(Constants.ACCESS_TOKEN, resp.data.token);
  await saveDataInStorage(
    Constants.ACTIVE_ADDRESS_LIST,
    JSON.stringify(data.addressList)
  );
  await saveDataInStorage(
    Constants.ADDRESS_LIST,
    JSON.stringify(addrsListKeys)
  );
  await saveDataInStorage(
    Constants.COIN_FAMILY_LIST,
    JSON.stringify(coinFamilyKeys)
  );
  await saveDataInStorage(Constants.LOGIN_DATA, JSON.stringify(login_data));
  await saveDataInStorage(Constants.WALLET_NAME, walletName || "Basic");
  await saveDataInStorage(Constants.REFRESH_TOKEN, resp.data.refreshToken);
  Singleton.getInstance().walletName = walletName || "Basic";

  if (onSuccess) {
    onSuccess?.();
  }
};

export const swapToFixed = (amount: any, fixed?: any) => {
  if (!fixed) {
    if (amount < 1) {
      fixed = 8
    } else if (amount < 100) {
      fixed = 6
    } else if (amount < 1000) {
      fixed = 4
    } else {
      fixed = 2
    }
  }
  return toFixedExp(amount, fixed)?.toString()
}



export const tradingWebView = (theme: any, colorCode: any, graphData: any, coinFamily: any) => {
  let chainId = ""
  switch (coinFamily.toString()) {
    case "1":
      chainId = "0x38"
      break;
    case "2":
      chainId = "0x1"
      break;
    case "4":
      chainId = "0x89"
      break;
    case "5":
      chainId = "solana"
      break;
    case "6":
      chainId = "0x2b6653dc"
      break;
    default:
      break;
  }
  consoleLogFunc('tradingWebView---chainId', chainId);
  if (graphData.pair_address) {
    return { uri: `${MORALIS_GRAPH_URL}?pairAddress=${graphData.pair_address}&chainId=${chainId}` }
  }
  return {
    html: `
    <html>
    <head>
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=0.75, maximum-scale=1.0, user-scalable=no">
    <style>
       html, body {
            margin: 0;
            padding: 0;
            background-color: ${colorCode};
            width: 100vw;
            height: 100vh;
            overflow: hidden;
          }
          #price-chart-widget-container, #tradingview_e7702 {
            width: 100vw;
            height: 100vh;
          }
    </style>
  </head>
    <body>
      <div class="tradingview-widget-container">
      <div class="tradingview-widget-copyright"><a href="https://in.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js">
      {
      "autosize": true,
      "symbol": "${graphData?.graph_source}:${graphData?.graph_pair}",
      "interval": "D",
      "theme": "${theme}",
      "style": "1",
      "locale": "in",
      "toolbar_bg": "${colorCode}",
      "enable_publishing": true,
      "withdateranges": true,
      "hide_side_toolbar": true,
      "allow_symbol_change": true,
      "range": "YTD",
      "container_id": "tradingview_96183"
    }
      </script>
    </div> 
    </body>
    </html>`,
  }
};

export const areaChartView = (chartData: any) => {
  const graphHtml = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"></script>
      <style>
          body {
              background-color: #18171F;
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
          }
  
          canvas {
              max-width: 90%;
              max-height: 80%;
          }
  
          .custom-tooltip {
              position: absolute;
              background-color: rgba(97,70,230,1);
              color: white;
              padding: 8px 12px;
              border-radius: 15px;
              pointer-events: none;
              font-size: 12px;
              transform: translate(-50%, -100%);
              white-space: nowrap;
              z-index: 1000;
              display: none;
          }
          .custom-tooltip::after {
            content: "";
            position: absolute;
            bottom: -5px;
            /* Adjust to position the tail below the tooltip */
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 6px 6px 0 6px;
            /* Adjust the triangle size */
            border-color: rgba(97,70,230,1) transparent transparent transparent;
          }
      </style>
  </head>
  
  <body>
      <canvas id="myChart"></canvas>
      <div id="tooltip" class="custom-tooltip"></div>
      <script>
          let touchTimeoutRef = null
          const canvas = document.getElementById('myChart');
          const tooltipEl = document.getElementById('tooltip');
          const ctx = canvas.getContext('2d');
  
          // Gradient for the chart
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(97,70,230,0.5)'); // Purple gradient
          gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
  
          const data = {
              labels: ${JSON.stringify(chartData.data)},
              datasets: [{
                  label: 'Price',
                  data: ${JSON.stringify(chartData.label)},
                  fill: true,
                  backgroundColor: gradient,
                  borderColor: 'rgba(97,70,230,1)', // Purple line
                  tension: 0.3,
                  pointBackgroundColor: 'rgba(97,70,230,1)',
                  pointRadius: 0,
                  pointHitRadius: 1,
                  hoverPointRadius: 1,
                  borderWidth: 1.5
              }]
          };
      const sortTimestamp = () => {
        let selectedIndex = ${chartData.index}
        let format = selectedIndex == 0 ? { hour: '2-digit', minute: '2-digit', hour12: true } :
            selectedIndex == 1 ? { weekday: 'short' } :
                selectedIndex == 2 ? { day: '2-digit', month: 'short' } : { month: 'short' };
        return format
       }
      const sortPrice = (price) => {
       let sortPriceValue;
       if (price >= 1_000_000) {
       sortPriceValue = (price / 1_000_000).toFixed(2) + "M";
       } else if (price >= 1_000) {
        sortPriceValue = (price / 1_000).toFixed(2) + "K";
        } else if (price > 1) {
         sortPriceValue = price.toFixed(2);
         } else if (price > 0.00001) {
          sortPriceValue = price.toFixed(5);
          } else {
           sortPriceValue = price.toFixed(7);
          }
           if(sortPriceValue == 0){
           sortPriceValue = "0.00"
           }
           return sortPriceValue
           }

  
          const options = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      display: false,
                  },
                  tooltip: {
                      enabled: false, // Disable the default tooltip
                  },
              zoom: {
                  pan: {enabled: false},
                  zoom: {wheel: 
                  { enabled: false  },
                  pinch: {enabled: false },
                  mode: 'x',}
                  }                
              },
              scales: {
                  x: {
                      ticks: {
                          color: 'rgba(255, 255, 255, 0.7)',
                           maxTicksLimit: 4,
                           callback: function (value) {
                           const date = new Date(data.labels[value]); // Parse the date
                           return date.toLocaleString('en-US', sortTimestamp());
              }
                      },
                      grid: {
                          display: false,
                      },

                  },
                  y: {
                    border: { display: false, },
                    ticks: {
                          color: 'rgba(255, 255, 255, 0.7)',
                          callback: function (value) {
                              return "${Singleton.getInstance().CurrencySymbol}"+sortPrice(value);
                          }
                      },
                      grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                      },
                  }
              },
              hover: {animationDuration: 0 },
              responsiveAnimationDuration: 0,
              hover: {mode: null},
          };
  
          // Variables for crosshair
          let crosshairX = null;
          let activeIndex = null;
  
          // Custom tooltip function to update position and value
       const formatToNumber = (num) => {

      let formattedValue;
      if (num > 1) {
          formattedValue = Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
           } else if (num > 0.0001) {
          formattedValue = Number(num).toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
          } else {
          formattedValue = num.toString().includes('e') ? Number(num).toFixed(12) : num.toString();
          }
        return formattedValue;
        };


        
        function updateTooltip(chart, positionX) {
          const scales = chart.scales;
          const xScale = scales.x;

          // Get the index of the closest data point
          const closestIndex = Math.round(xScale.getValueForPixel(positionX));
          if (closestIndex >= 0 && closestIndex < data.datasets[0].data.length) {
              activeIndex = closestIndex;

              // Get the tooltip data
              const label = data.labels[closestIndex];
              const value = data.datasets[0].data[closestIndex];
              const date = new Date(label);
              const day = date.getUTCDate().toString().padStart(2, '0'); // Ensure two digits
              const month = date.toLocaleString('en-US', { month: 'short' }); // Abbreviated month
              const hours = date.getUTCHours() % 12 || 12; // Convert to 12-hour format
              const minutes = date.getUTCMinutes().toString().padStart(2, '0'); // Ensure two digits
              const ampm = date.getUTCHours() >= 12 ? 'PM' : 'AM';
              const formattedDate = day + "-" + month + " " + hours + ":" + minutes + ampm;
              const price = formatToNumber(value)

              // Calculate tooltip position
              const canvasRect = chart.canvas.getBoundingClientRect();
              const pageScrollX = window.scrollX; // Horizontal scroll offset
              let tooltipX = canvasRect.left + crosshairX + pageScrollX;

              // Ensure tooltip stays within the chart bounds
              const tooltipWidth = tooltipEl.offsetWidth;
              const chartRight = canvasRect.right + pageScrollX;

              if (tooltipX + tooltipWidth / 2 > chartRight) {
                  tooltipX = chartRight - tooltipWidth / 2;
              } else if (tooltipX - tooltipWidth / 2 < canvasRect.left + pageScrollX) {
                  tooltipX = canvasRect.left + pageScrollX + tooltipWidth / 2;
              }

              // Update tooltip styles
              tooltipEl.style.left = tooltipX+"px";
              tooltipEl.style.top = '60px'; // Adjust vertical positioning as needed
              tooltipEl.style.display = 'block';
          } else {
              tooltipEl.style.display = 'none';
          }
      }
  
          // Plugin for crosshair
          const smoothCrosshairPlugin = {
              id: 'smoothCrosshair',
              afterDraw(chart) {
                  const ctx = chart.ctx;
                  const topY = chart.scales.y.top;
                  const bottomY = chart.scales.y.bottom;
  
                  if (crosshairX !== null) {
                      // Draw the dotted crosshair line
                      ctx.save();
                      ctx.setLineDash([5, 5]); // Dotted line
                      ctx.beginPath();
                      ctx.moveTo(crosshairX, topY);
                      ctx.lineTo(crosshairX, bottomY);
                      ctx.lineWidth = 1;
                      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                      ctx.stroke();
                      ctx.restore();
                  }
              }
          };
  
          // Register the plugin
          Chart.register(smoothCrosshairPlugin);
  
          // Create the chart
          const chart = new Chart(ctx, {
              type: 'line',
              data: data,
              options: options,
          });
  
          // Add touchstart and touchmove event listeners to update crosshair and tooltip
         canvas.addEventListener('touchstart', (event) => {
              event.preventDefault();
              const rect = canvas.getBoundingClientRect();
              let touchX = event.touches[0].clientX - rect.left;
  
              // Ensure crosshair doesn't overlap with the Y-axis
              const xScale = chart.scales.x;
              const minX = xScale.getPixelForValue(data.labels[0]);
              const maxX = xScale.getPixelForValue(data.labels[data.labels.length - 1]);
              touchX = Math.max(minX, Math.min(touchX, maxX)); // Clamp touchX within the chart's X axis
  
              crosshairX = touchX;
  
              // Update the tooltip position and value
              updateTooltip(chart, touchX);
  
              // Redraw the chart to show the crosshair
              chart.update();
          });
  
          canvas.addEventListener('touchmove', (event) => {
              event.preventDefault();
              const rect = canvas.getBoundingClientRect();
              let touchX = event.touches[0].clientX - rect.left;
  
              // Ensure crosshair doesn't overlap with the Y-axis
              const xScale = chart.scales.x;
              const minX = xScale.getPixelForValue(data.labels[0]);
              const maxX = xScale.getPixelForValue(data.labels[data.labels.length - 1]);
              touchX = Math.max(minX, Math.min(touchX, maxX)); // Clamp touchX within the chart's X axis
  
              crosshairX = touchX;
  
              // Update the tooltip position and value
              updateTooltip(chart, touchX);
  
              // Redraw the chart to show the crosshair
              chart.update();
          });
  
          // Add touchend event listener to hide crosshair and tooltip
          canvas.addEventListener('touchend', () => {
              touchTimeoutRef = setTimeout(() => {
                  crosshairX = null;
                  activeIndex = null;
                  tooltipEl.style.display = 'none';
                  chart.update();
              }, 2000);
          });
      </script>
  </body>
  
  </html>`
  return { html: graphHtml }
}


export function maskAddress(address: any, visibleChars = 4) {
  const start = address.slice(0, visibleChars + 2); // Include "0x" in the start
  const end = address.slice(-visibleChars);
  return `${start}...${end}`;
}


export const clearGarbageCollection = () => {
  if (Platform.OS == 'android') {
    try {
      CreateWallet.clearGarbageCollection();
    } catch (error: any) {
      consoleLogFunc('-------------------error clearGarbageCollection', error)
    }
  }
};



export const checkKeyboards = async () => {
  const isUntrusted = await checkForUntrustedKeyboards();
  if (!isUntrusted) {
    Toast.showWithGravity(
      LanguageManager.alertMessages.pleaseSwitchKeyBoard,
      Toast.SHORT,
      Toast.BOTTOM,
    );
    Keyboard.dismiss();
  }
};

const checkForUntrustedKeyboards = async () => {
  try {
    const isUntrusted = await UntrustedKeyboard.checkForUntrustedKeyboards();
    return isUntrusted;
  } catch (error: any) {
    consoleLogFunc("isUntrusted---error-", error);
    return true;
  }
};

export const consoleLogFunc = (...args: any[]) => {
  if (__DEV__) {
    try {
      console.log(...args);
    } catch (e: any) {
      try {
        const safeArgs = args.map(arg => {
          try {
            return (arg !== null && typeof arg === 'object') ? String(arg) : arg;
          } catch (err: any) {
            return '[Unprintable Object]';
          }
        });
        console.log('[Safe Log]', ...safeArgs);
      } catch (finalErr: any) {
        console.log('[Log Error]');
      }
    }
  }
};