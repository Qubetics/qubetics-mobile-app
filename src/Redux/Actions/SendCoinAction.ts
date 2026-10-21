import type {Dispatch} from 'redux';
import { API_GET_ORDER_DETAIL, DVPNS_LIST_API, NATIVE_COIN_BALANCE, TRANSACTION_LIST_API } from '../../../src/EndPoint';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import Singleton from '../../Singleton';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';
import { GET_GAS_PRICE } from './types';

/*************************************Get gas estimation api*********************************************** */
export const requestGasEstimation = ({ url, gasEstimationReq, token }: {url: string; gasEstimationReq: Record<string, unknown>; token: string | null}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    consoleLogFunc("url >>>>>>>", url);

    dispatch({ type: GET_GAS_PRICE });
    APIClient.getInstance().post(url, gasEstimationReq, token).then(response => {
      let result = response;
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('Req Gas Estimation Error ****', error);
      reject(errorMessage);
    });
  });
};
/*************************************Get nonce APi*********************************************** */
export const requestNonce = ({ url, coinSymbol, nonceReq, token }: {url: string; coinSymbol: string; nonceReq: Record<string, unknown>; token: string | null}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    dispatch({ type: GET_GAS_PRICE });
    let nonceReq1 = {
      amount: '',
      wallet_address: Singleton.getInstance().defaultEthAddress,
    };
    consoleLogFunc('requestGasLimitForDapp ****', nonceReq1);

    APIClient.getInstance().post(url, nonceReq1, token).then(response => {
      let result = response;
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('Nonce request  Error ****', error);
      reject(errorMessage);
    });
  });
};
/*************************************Get Gas Limit for DAPP*********************************************** */
export const requestGasLimitForDapp = ({ url, data }: {url: string; data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    let dataLimit = data;
    delete dataLimit.gasPrice;
    let nonceReq1 = {
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [dataLimit],
      id: 1,
    };
    consoleLogFunc('requestGasLimitForDapp ****', url, nonceReq1);

    APIClient.getInstance().postWithFullUrl(url, nonceReq1).then(response => {
      let result = response;
      consoleLogFunc('Gas Limit for Dapp  Success **** ' + JSON.stringify(result));
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('Gas Limit for Dapp  Error ****', error);
      reject(errorMessage);
    });
  });
};

export const requestCoinBalance = (data: Record<string, unknown>) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(NATIVE_COIN_BALANCE, data, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {

      })
    })
  })
}
/*************************************Send Coin APi*********************************************** */
export const requestSendCoin = ({ url, sendCoinReq, token }: {url: string; sendCoinReq: Record<string, unknown>; token: string | null}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    dispatch({ type: GET_GAS_PRICE });
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(url, sendCoinReq, token).then(response => {
        let result = response;
        consoleLogFunc('Send Coin Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        if (errorMessage.includes("overshot")) {
          errorMessage = "Insufficient Balance";
        }
        consoleLogFunc('Send Coin Error ****', error);
        reject(errorMessage);
      });
    });
  });
};

/************************************** getBTCprice Api request ****************************************************/
export const requestBTCgasprice = () => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance().getGasPrice(`https://api.blockchain.info/mempool/fees`).then(response => {
      let result = response;
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('Get BTC fees price  Error ****', error);
      reject(errorMessage);
    });
  });
};
/************************************** getUnspent BTC Api request ****************************************************/
export const requestUnspent = (address: string, token: string | null, coin: string) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance().get(`bitcoin/unspent/${address}`, token).then(response => {
      let result = response;
      consoleLogFunc('BTCUNSPENT Success **** ' + JSON.stringify(result));
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('BTCUNSPENT Error ****', error);
      reject(errorMessage);
    });
  });
};

/*************************************Transaction List*********************************************** */
export const getTransactionList = ({ getTxnReq }: {getTxnReq: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    consoleLogFunc('getTransactionList---req', getTxnReq);

    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(TRANSACTION_LIST_API, getTxnReq, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('TransactionList Error ****', error);
        reject(errorMessage);
      });
    });
  });
};

/*************************************dVPNS List*********************************************** */
export const getDVPNList = ({ getTxnReq }: {getTxnReq: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    consoleLogFunc('getDVPNList---req', getTxnReq);

    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(DVPNS_LIST_API, getTxnReq, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getDVPNList Error ****', error);
        reject(errorMessage);
      });
    });
  });
};

/*************************************OREDR Detail*********************************************** */
export const getOrderState = (order_id: string) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    const data = {
      equipmentNo: '123456568',
      orderId: order_id,
      sourceType: 'iOS',
    };
    APIClient.getInstance().postSwap(API_GET_ORDER_DETAIL, data, '').then(response => {
      let result = response;
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('get API_GET_ORDER_DETAIL Error ****', error);
      reject(errorMessage);
    });
  });
};


/************************************* Update Intent Status *********************************************** */

export const updateIntentStatus = (url: string, data: Record<string, unknown>) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      consoleLogFunc('updateIntentStatus data**** ' + JSON.stringify(data));
      APIClient.getInstance().post(`${url}/updateTransactionStatus`, data, token).then(response => {
        let result = response;
        consoleLogFunc('updateIntentStatus **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('updateIntentStatus Error ****', error);
        reject(errorMessage);
      });
    });
  });
};