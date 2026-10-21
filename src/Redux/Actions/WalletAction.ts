import type {Dispatch} from 'redux';
import moment from "moment";
import {
  ACTIVE_INACTIVE_COIN,
  API_ALL_WALLET_BALANCE,
  API_ANNOUNCEMENTS_BANNER,
  API_ANNOUNCEMENTS_STATUS,
  API_ANNOUNCEMENTS_STATUS_NEW,
  API_CURRENCY,
  API_GET_RPC_URL,
  API_LOGOUT,
  API_MANAGE_WALLET,
  API_NOTIFICATIONS_LIST,
  API_SAVE_SOL_TRANSACTION_ID,
  API_SWFT_ACCOUNT_EXCHANGE,
  API_SWFT_COININFO,
  API_SWFT_GET_COINLIST,
  API_SWFT_LAST_PAIRS,
  BASE_IMAGE_URL,
  CHAIN_ABSTRACTION_GET_COIN_LIST,
  COIN_DETAILS,
  COIN_GRAPH,
  COSMOS_GAS_ESTIMATE,
  COSMOS_NATIVE_WALLET,
  COSMOS_SEND,
  GET_COIN_LIST_API,
  GET_CURRENT_UTC,
  GET_FEE_LIMIT,
  GET_MPC_WALLETS,
  GET_NFT_LIST,
  GET_REALTIME_BAL,
  GET_SWAP_AMOUNT_DIFF_URL,
  INCH_CHECK_ALLOWANCE,
  INCH_COMMISSION_DATA,
  INCH_GET_QUOTE,
  INCH_SPENDER,
  INCH_SWAP,
  NATIVE_PRICE,
  ON_CHAIN_SWAP_LIST,
  SAVE_DEVICE_TOKEN,
  SAVE_MPC_WALLETS,
  TOOGLE_COIN_LIST,
  WALLET_SYNC_BALANCE
} from "../../../src/EndPoint";
import { APIClient } from "../../components/Api";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import {
  bigNumberSafeMath,
  consoleLogFunc,
  getData,
  saveData,
  toFixedExp,
} from "../../Utils/MethodsUtils";
import {
  GET_COIN_LIST,
  GET_COIN_LIST_FAIL,
  GET_COIN_LIST_SUCCESS,
  GET_NATIVE_CURRENCY_LIST,
} from "./types";

/************************************** themeAction ****************************************************/



export const getUtcServerTime = (data: any) => {
  return new Promise((resolve, reject)=>{
    APIClient.getInstance()
    .post(GET_CURRENT_UTC, data, null)
    .then((response) => {
      consoleLogFunc("RESPONSE>>", response);
      
      resolve(response?.data?.current_timestamp);
    })
    .catch((error) => {
      consoleLogFunc("ERR>>>>", error);
      
      resolve(moment.utc().format('YYYY-MM-DD HH:mm:ss'));
    });
  })
}

/************************************** get coin list Api request ****************************************************/
export const requestCoinList =
  ({ data1 }: {data1: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      consoleLogFunc('data1:::::', data1);
      dispatch({ type: GET_COIN_LIST });
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.SELECTED_CURRENCY).then((symbol) => {
          getData(Constants.ADDRESS_LIST).then((addrs_list) => {
            getData(Constants.COIN_FAMILY_LIST).then(async (coin_family_list) => {
              const addressListKeys = JSON.parse(addrs_list);
              const CoinFamilyKeys = JSON.parse(coin_family_list);
              const data = {
                coin_family: CoinFamilyKeys,
                addressListKeys: addressListKeys,
                page: data1?.page || 1,
                limit: data1?.limit || 20,
                search:  data1?.search || "",
                fiat_type: symbol ? symbol : "USD",
              };
              // bigNumberSafeMath returns a string, so this starts as a number
              // and becomes a string after the first addition. Typed as the
              // union rather than changed, since callers read it as-is.
              let totalBalance: string | number = 0;
              consoleLogFunc(">>>>>", data);
              if(data?.page == 1){
                try{
                const multiWallet = await getData(Constants.MULTI_WALLET_LIST);
                const multiWalletData = JSON.parse(multiWallet);
                const currentWallet = multiWalletData.find((el: any) => el?.defaultWallet == true);
                const balanceRequestData = {
                  userIds: [currentWallet?.login_data?.userId],
                  fiatType: symbol ? symbol : "USD"
                }
                consoleLogFunc("balanceRequestData>>>>>>>>>>>>>>", balanceRequestData);
                
                const balanceResponse = await APIClient.getInstance()
                .post(API_ALL_WALLET_BALANCE, balanceRequestData, access_token)
                consoleLogFunc("balanceResponse>>>>>>>>>>>>>>", balanceResponse);
                
                await balanceResponse?.data?.map((coin: any, index: any) => {
                  coin?.user_wallet_relation?.map((coin: any, index: any) => {
                    totalBalance = bigNumberSafeMath(totalBalance, "+", bigNumberSafeMath(coin?.coin?.fiat_price_data?.value || 0, "*", coin?.balance || 0))
                  })
                })
                }catch(err){
                  consoleLogFunc("error in balanceResponse>>>>>>>>>>>>>>", err);
                }
              }

              APIClient.getInstance()
                .post(GET_COIN_LIST_API, data, access_token)
                .then((response) => {
                  let coinArray = response.data;
                  let isSorted;
                  let haveBalance;
                  if (coinArray.length > 0) {
                    coinArray.map((item: any, index: any) => {
                      const Item = item.coin;
                      const value =
                        Item?.fiat_price_data == null
                          ? "0.00"
                          : Item?.fiat_price_data.value;

                      const fiatPrice = value;
                      item["fiatBal"] = toFixedExp(item.balance, 8) * fiatPrice;
                      item["selectedCurrencySymbol"] = symbol ? symbol : "USD";
                      item["currentPriceInMarket"] = fiatPrice;
                      item["price_change_percentage_24h"] =
                        Item?.fiat_price_data == null
                          ? 0.0
                          : Item?.fiat_price_data.price_change_percentage_24h;
                      item["coin_family"] = Item?.coin_family;
                      item["coin_image"] =
                        Item?.coin_image == null || Item?.coin_image == ""
                          ? Item?.coin_image
                          : Item.coin_image?.includes("https") ||
                            Item?.coin_image?.includes("http")
                          ? Item?.coin_image
                          : BASE_IMAGE_URL + Item?.coin_image;
                      item["coin_name"] = Item?.coin_name;
                      item["coin_symbol"] = Item?.coin_symbol;
                      item["decimals"] = Item?.decimals;
                      item["is_token"] = Item?.is_token;
                      item["token_address"] = Item?.token_address;
                      item["coin_id"] = Item?.coin_id;
                      item["graphData"] =
                        Item?.fiat_price_graph_data == null ||
                        !Array.isArray(
                          Item?.fiat_price_graph_data?.sparkline
                        ) ||
                        Item?.fiat_price_graph_data?.sparkline?.length < 5
                          ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                          : Item?.fiat_price_graph_data?.sparkline.map((ele: any) =>
                              parseFloat(toFixedExp(ele.price, 8))
                            );
                    });
                  }
                  isSorted = coinArray.find(
                    (item: any, index: any) => item.sort_order != null
                  );
                  haveBalance = coinArray.find(
                    (item: any, index: any) => item.fiatBal > 0
                  );
                  // BUG, PRESERVED DELIBERATELY: `!undefined` is `true`, so this
                  // reads `haveBalance == true`, and haveBalance is an
                  // object-or-undefined from .find() above. An object is never
                  // loosely equal to true, so this branch is dead and coins are
                  // never sorted by fiat balance. The same mistake on the
                  // isSorted branch below kills the saved sort order from
                  // sortManageWallet. Both were meant to be `!== undefined`.
                  // Left as-is because correcting it changes the coin ordering
                  // users see, which does not belong in a type migration. The
                  // casts only silence the compiler and `!undefined` is written
                  // as its exact value `true`; runtime behaviour is identical.
                  if (isSorted == undefined && (haveBalance as any) == true) {
                    coinArray = coinArray.sort((a: any, b: any) => b.fiatBal - a.fiatBal);
                  } else if (
                    isSorted == undefined &&
                    haveBalance == undefined
                  ) {
                    coinArray = coinArray.sort((a: any, b: any) =>
                      a.coin.coin_name.localeCompare(b.coin.coin_name)
                    );
                  } else if ((isSorted as any) == true) {
                    coinArray = coinArray.sort(
                      (a: any, b: any) => a.sort_order - b.sort_order
                    );
                  }
                  response.data = coinArray;
                  let newArray: unknown[] = [];
                  coinArray.map((data: any) => {
                    newArray.push(data);
                  });
                  saveData(Constants.MY_COIN_LIST, JSON.stringify(newArray));
                  getCoinListSuccess(dispatch, newArray, data.page);
                  resolve({...response, totalBalance: totalBalance});
                })
                .catch((error) => {
                  let errorMessage = error.message;
                  consoleLogFunc("my wallet api failed::::::", error);
                  getCoinListFail(dispatch, errorMessage);
                  reject(errorMessage);
                });
            });
          });
        });
      });
    });
  };

export const syncBalanceWithChain = () => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((access_token) => {
      APIClient.getInstance()
        .post(WALLET_SYNC_BALANCE, {}, access_token)
        .then((response) => {
          consoleLogFunc("syncBalanceWithChain response", response);
          resolve(response);
        })
    });
  })
}   

  /************************************** get btc and Tics ****************************************************/
export const requestBtcAndTicsCoinList = (coinFamily: any, adddress: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    dispatch({ type: GET_COIN_LIST });
    getData(Constants.ACCESS_TOKEN).then((access_token) => {
      getData(Constants.SELECTED_CURRENCY).then((symbol) => {
            const data = {
              coin_family: [coinFamily],
              addressListKeys: [adddress],
              page: 1,
              limit: 20,
              search: "",
              fiat_type: symbol ? symbol : "USD",
            };;
            APIClient.getInstance()
              .post(GET_COIN_LIST_API, data, access_token)
              .then((response) => {
                let coinArray = response.data;

                if (coinArray.length > 0) {
                  coinArray.map((item: any, index: any) => {
                    const Item = item.coin;
                    const value =
                      Item?.fiat_price_data == null
                        ? "0.00"
                        : Item?.fiat_price_data.value;

                  
                    const fiatPrice = value;
                    item["fiatBal"] = toFixedExp(item.balance, 8) * fiatPrice;
                    item["selectedCurrencySymbol"] = symbol ? symbol : "USD";
                    item["currentPriceInMarket"] = fiatPrice;
                    item["price_change_percentage_24h"] =
                      Item?.fiat_price_data == null
                        ? 0.0
                        : Item?.fiat_price_data.price_change_percentage_24h;
                    item["coin_family"] = Item?.coin_family;
                    item["coin_image"] =
                      Item?.coin_image == null || Item?.coin_image == ""
                        ? Item?.coin_image
                        : Item.coin_image?.includes("https") ||
                          Item?.coin_image?.includes("http")
                        ? Item?.coin_image
                        : BASE_IMAGE_URL + Item?.coin_image;
                    item["coin_name"] = Item?.coin_name;
                    item["coin_symbol"] = Item?.coin_symbol;
                    item["decimals"] = Item?.decimals;
                    item["is_token"] = Item?.is_token;
                    item["token_address"] = Item?.token_address;
                    item["coin_id"] = Item?.coin_id;
                    item["graphData"] =
                      Item?.fiat_price_graph_data == null ||
                      !Array.isArray(
                        Item?.fiat_price_graph_data?.sparkline
                      ) ||
                      Item?.fiat_price_graph_data?.sparkline?.length < 5
                        ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        : Item?.fiat_price_graph_data?.sparkline.map((ele: any) =>
                            parseFloat(toFixedExp(ele.price, 8))
                          );
                  });
                }
               
                resolve(coinArray);
              })
              .catch((error) => {
                let errorMessage = error.message;
                consoleLogFunc("my wallet api failed::::::", error);
                getCoinListFail(dispatch, errorMessage);
                reject(errorMessage);
              });
      
      });
    });
  });
};

/************************************** updateDeviceToken APi request ****************************************************/
export const updateDeviceToken = (data: any) => (dispatch: Dispatch) => {
  consoleLogFunc("RequestWallet-------", data);
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((access_token) => {
      APIClient.getInstance()
        .post(SAVE_DEVICE_TOKEN, data, access_token)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
};

// ************************************** Toogle coin list Api request ****************************************************/
export const toogleCoinList =
  ({ dataObj }: {dataObj: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.SELECTED_CURRENCY).then((currency) => {
        getData(Constants.ACCESS_TOKEN).then((access_token) => {
          getData(Constants.ADDRESS_LIST).then((addrs_list) => {
            getData(Constants.COIN_FAMILY_LIST).then((coinFamilyList) => {
              let addressListKeys = JSON.parse(addrs_list);

              let data = {
                addrsListKeys: addressListKeys,
                coinFamilyKeys: JSON.parse(coinFamilyList),
                page: dataObj.page,
                limit: dataObj.limit,
                currency_code: currency.toLowerCase(),
                search: dataObj.search,
              };
              APIClient.getInstance()
                .post(TOOGLE_COIN_LIST, data, access_token)
                .then((response) => {
                  if (response.data.length > 0) {
                    response.data.map((item: any, index: any) => {
                      item.walletStatus =
                        item.wallet_data == null ? 0 : item.wallet_data.status;
                    });
                  }
                  resolve(response);
                })
                .catch((error) => {
                  let errorMessage = error.message;
                  consoleLogFunc("ERROR===>", error);

                  reject(errorMessage);
                });
            });
          });
        });
      });
    });
  };
// ************************************** active inactive Api request ****************************************************/
export const activeInactiveCoin =
  ({ token, coinId, walletAddress, isActive }: {token: any; coinId: any; walletAddress: any; isActive: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      let data = {
        coinId: coinId,
        walletAddress: walletAddress,
        isActive: isActive,
      };
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(ACTIVE_INACTIVE_COIN, data, access_token)
          .then((response) => {
            consoleLogFunc('-=-----ACTION-----activeInactiveCoin-=-=-', response);
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("error catch==>", error);
            reject(errorMessage);
          });
      });
    });
  };
/**************************************get ON_CHAIN_SWAP_COIN_LIST ****************************************************/
export const onChainSwapList = ({
  ACCESS_TOKEN,
  addrsListKeys,
  coin_family,
}: {
  ACCESS_TOKEN: string | null;
  addrsListKeys: unknown;
  coin_family: unknown;
}) => {
  return (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      const data = {
        addrsListKeys: addrsListKeys,
        coin_family: coin_family,
        fiat_type: Singleton.getInstance().CurrencySelected,
      };
      consoleLogFunc('ON_CHAIN_SWAP_LIST--data', data);
      
      APIClient.getInstance()
        .post(ON_CHAIN_SWAP_LIST, data, ACCESS_TOKEN)
        .then((response) => {
          const result = response.data;
          saveData(Constants.ONCHAIN_LIST, JSON.stringify(result));
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error onChainSwapList-- ", error);
          reject(error);
        });
    });
  };
};
/**************************************GET SWAP PRICE DIFFERENCES ****************************************************/
export const getSwapPriceDiff = () => {
  return (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .get(GET_SWAP_AMOUNT_DIFF_URL, access_token)
          .then((response) => {
            resolve(response?.data);
          })
          .catch((error) => {
            consoleLogFunc("error getSwapPriceDiff--", error);
            reject(error);
          });
      });
    });
  };
};
/************************************** logoutUser ****************************************************/
export const logoutUser =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_LOGOUT, data, token)
          .then((response) => {
            let res = response.data;
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("logoutUser", error);
            reject(errorMessage);
          });
      });
    });
  };

/************************************** logoutUser ****************************************************/
export const logoutSingleUser =
  ({ data, accessToken }: {data: any; accessToken: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_LOGOUT, data, accessToken)
          .then((response) => {
            let res = response.data;
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("logoutUser", error);
            reject(errorMessage);
          });
      });
    });
  };
/************************************** getFeeLimit ****************************************************/
export const getFeeLimit =
  ({}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(GET_FEE_LIMIT, null, token)
          .then((response) => {
            const res = response.fee;
            consoleLogFunc("res getFeeLimit:::::", res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("getFeeLimit failed", error);
            reject(errorMessage);
          });
      });
    });
  };
/************************************** update balance ****************************************************/
export const getCoinDetails =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(COIN_DETAILS, data, token)
          .then((response) => {
            let res = response;
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("Updatebalance api failed", error);
            reject(errorMessage);
          });
      });
    });
  };
export const getCoinGraph = (data: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(COIN_GRAPH, data, token)
        .then((response) => {
          let res = response;
          resolve(res);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("Updatebalance api failed", error);
          reject(errorMessage);
        });
    });
  });
};
export const getUserBalance =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(GET_REALTIME_BAL, data, token)
          .then((response) => {
            let res = response.data;
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("Updatebalance api failed", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap coin info ****************************************************/
export const getSwapCoinInfo =
  ({ depositCoinCode, receiveCoinCode }: {depositCoinCode: any; receiveCoinCode: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      let data = {
        depositCoinCode: depositCoinCode,
        receiveCoinCode: receiveCoinCode,
      };

      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_SWFT_COININFO, data, token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            consoleLogFunc("API_SWFT_COININFO errorrrr", error);

            let errorMessage = error.message;
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** ACCOUNT EXCHANGE ****************************************************/
export const accountExchange =
  ({
    depositCoinCode,
    receiveCoinCode,
    depositCoinAmt,
    receiveCoinAmt,
    destinationAddr,
    refundAddr,
  }: {
    depositCoinCode: string;
    receiveCoinCode: string;
    // Passed straight to parseFloat below, so these arrive as strings from
    // the amount inputs rather than numbers.
    depositCoinAmt: string;
    receiveCoinAmt: string;
    destinationAddr: string;
    refundAddr: string;
  }) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        let data = {
          depositCoinCode: depositCoinCode,
          receiveCoinCode: receiveCoinCode,
          depositCoinAmt: parseFloat(depositCoinAmt),
          receiveCoinAmt: parseFloat(receiveCoinAmt),
          destinationAddr: destinationAddr,
          refundAddr: refundAddr,
          equipmentNo: "123456568",
          sourceType: "iOS",
        };
        consoleLogFunc("accountExchange API ••••••••••••••••data===> ", data);
        APIClient.getInstance()
          .post(API_SWFT_ACCOUNT_EXCHANGE, data, token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("API_SWFT_ACCOUNT_EXCHANGE errorrrr");
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** sortManageWallet ****************************************************/
export const sortManageWallet =
  ({ token, data }: {token: any; data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      let dataObj = {
        wallets: data,
      };
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_MANAGE_WALLET, dataObj, token)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("sortManageWallet api failed");
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** getNotificationList ****************************************************/
export const getNotificationList =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.COIN_FAMILY_LIST).then((coinfamilyList) => {
          const coin_families = JSON.parse(coinfamilyList);
          data.coin_family = coin_families;
          APIClient.getInstance()
            .post(API_NOTIFICATIONS_LIST, data, access_token)
            .then((response) => {
              resolve(response);
            })
            .catch((error) => {
              let errorMessage = error.message;
              consoleLogFunc("API_NOTIFICATIONS_LIST api failed");
              reject(errorMessage);
            });
        });
      });
    });
  };

// ************************************** adminAnnouncements ****************************************************/
export const getAdminAnnouncements =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(API_ANNOUNCEMENTS_STATUS_NEW, data, access_token)
          .then((response) => {
            consoleLogFunc("getAdminAnnouncements res::::::", response);
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("getAdminAnnouncements api failed");
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** adminAnnouncements ****************************************************/
export const getNotiStatus =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.ADDRESS_LIST).then((addrs_list) => {
          const addressListKeys = JSON.parse(addrs_list);
          data.addrsListKeys = addressListKeys;
          APIClient.getInstance()
            .post(API_ANNOUNCEMENTS_STATUS, data, access_token)
            .then((response) => {
              consoleLogFunc("getNotiStatus res::::::", response);
              resolve(response);
            })
            .catch((error) => {
              let errorMessage = error.message;
              consoleLogFunc("getNotiStatus api failed :::::");
              reject(errorMessage);
            });
        });
      });
    });
  };
/**************************************get Currency Api****************************************** */
export const getCurrencyPref = () => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance()
      .get(API_CURRENCY, "")
      .then((response) => {
        consoleLogFunc("getCurrencyPref api success :::::", response);
        let res = response.data;
        dispatch({ type: GET_NATIVE_CURRENCY_LIST, payload: res });
        resolve(res); 
      })
      .catch((error) => {
        let errorMessage = error.message;
        consoleLogFunc("getCurrencyPref api failed",error);
        reject(errorMessage);
      });
  });
};

// ************************************** refresh token ****************************************************/

// ************************************** fetchNativePrice Api request ****************************************************/
export const fetchNativePrice =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(NATIVE_PRICE, data, access_token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("ERROR===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** fetchNativeCoinPrice Api request ****************************************************/
// ************************************** downloadcsv Api request ****************************************************/
// ************************************** rpc Api request ****************************************************/
export const getRpcUrl =
  ({}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      APIClient.getInstance()
        .get(API_GET_RPC_URL, "")
        .then((response) => {
          consoleLogFunc("chk rpc url res::::", response);
          Singleton.getInstance().ETH_RPC_URL = response.ETH_RPC_URL;
          Singleton.getInstance().BTC_RPC_URL = response.BTC_RPC_URL;
          Singleton.getInstance().BSC_RPC_URL = response.BNB_RPC_URL;
          Singleton.getInstance().SOL_RPC_URL = response.SOL_RPC_URL;
          Singleton.getInstance().MATIC_RPC_URL = response.POL_RPC_URL;
          Singleton.getInstance().ETH_DAPP_RPC_URL = response.ETH_DAPP_RPC_URL;
          Singleton.getInstance().TICS_RPC_URL = response.TICS_RPC_URL;
          Singleton.getInstance().COSMO_TICS_RPC_URL = response.TICS_NATIVE_RPC_URL;
          resolve(response);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("ERROR===>", error);
          reject(errorMessage);
        });
    });
  };
/************************************* Success/Fail Dispatches ***************************************************/
const getCoinListFail = (dispatch: Dispatch, errorMessage: any) => {
  dispatch({
    type: GET_COIN_LIST_FAIL,
    payload: errorMessage,
  });
};

const getCoinListSuccess = (dispatch: Dispatch, data: any, page: any) => {
  dispatch({
    type: GET_COIN_LIST_SUCCESS,
    payload: {data, page},
  });
};

// ************************************** 1Inch apis ****************************************************/
// ************************************** get commision data****************************************************/
export const getCommissionData = () => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .get(INCH_COMMISSION_DATA, token)
        .then((response) => {
          let res = response;
          consoleLogFunc("INCH_COMMISSION_DATA::::::successs******", res);
          resolve(res);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("INCH_COMMISSION_DATA failed:::::::::::", error);
          reject(errorMessage);
        });
    });
  });
};

// ************************************** get quote ****************************************************/
export const getInchQuote =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_GET_QUOTE, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_GET_QUOTE res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_GET_QUOTE err===>", error);
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** check allowance ****************************************************/
export const checkInchAllowance =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_CHECK_ALLOWANCE, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_CHECK_ALLOWANCE res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_CHECK_ALLOWANCE err===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap spender ****************************************************/
export const inchSwapSpender =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_SPENDER, data, access_token)
          .then((response) => {
            consoleLogFunc("inchSwapSpender res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("inchSwapSpender err===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap from 1inch ****************************************************/
export const inchSwap =
  ({ data }: {data: any}) =>
  (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_SWAP, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_SWAP res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_SWAP err===>", error);
            reject(errorMessage);
          });
      });
    });
  };

/**************************************get CROSS_CHAIN_SWAP_COIN_LIST ****************************************************/
export const getCrossChainLastPair = (data: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_SWFT_LAST_PAIRS, data, token)
        .then((response) => {
          const result = response?.data;
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error getCoinListChangelly-- ", error);
          reject(error);
        });
    });
  });
};
/**************************************get CROSS_CHAIN_SWAP_COIN_LIST ****************************************************/
export const getCrossChainCoinList = (data: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_SWFT_GET_COINLIST, data, token)
        .then((response) => {
          const result = response;
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error getCoinListChangelly-- ", error);
          reject(error);
        });
    });
  });
};

export const getAllWalletBal = (data: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_ALL_WALLET_BALANCE, data, token)
        .then((response) => {
          consoleLogFunc("getAllWalletBal Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getAllWalletBal Error ****");
          reject(error);
        });
    });
  });
};

export const saveSolTransactionId = (coin: any, data: any, chain = API_SAVE_SOL_TRANSACTION_ID) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(chain + `${coin}/send`, data, token)
        .then((response) => {
          consoleLogFunc("saveSolTransactionId Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getAllWalletBal Error ****");
          reject(error);
        });
    });
  });
};

export const saveChainAbstractionTrxId = (coin: any, data: any, chain = API_SAVE_SOL_TRANSACTION_ID) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(chain + `${coin}/saveTransaction`, data, token)
        .then((response) => {
          consoleLogFunc("saveSolTransactionId Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getAllWalletBal Error ****");
          reject(error);
        });
    });
  });
};


export const getNFtList = (data: any) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(GET_NFT_LIST, data, token)
        .then((response) => {
          consoleLogFunc("getNFtList Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getNFtList Error ****");
          reject(error);
        });
    });
  });
};

export const getBannerList = () => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .get(API_ANNOUNCEMENTS_BANNER, token)
        .then((response) => {
          consoleLogFunc("getBannerList Success **** ", response);
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getBannerList Error ****",error );
          reject(error);
        });
    });
  })
};


// ************************************** COSMOS FEE ****************************************************/

  export const getCosmosGasEstimate = () => (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .get(COSMOS_GAS_ESTIMATE, token)
          .then((response) => {
            consoleLogFunc("getCosmosGasEstimate Success **** ", response);
            resolve(response);
          })
          .catch((error) => {
            consoleLogFunc("getCosmosGasEstimate Error ****",error );
            reject(error);
          });
      });
    })
  }

  // ************************************** COSMOS SEND  ****************************************************/

  export const sendCosmos = (data: any) => (dispatch: Dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(COSMOS_SEND, data, token)
          .then((response) => {
            consoleLogFunc("sendCosmos Success **** ", response);
            resolve(response);
          })
          .catch((error) => {
            consoleLogFunc("sendCosmos Error ****", error);
            reject(error);
          });
      });
    });
  };

    // ************************************** COSMOS ADDRESS  ****************************************************/

    export const sendCosmosAddress = (data: any) => (dispatch: Dispatch) => {
      return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then((token) => {
          APIClient.getInstance()
            .post(COSMOS_NATIVE_WALLET, data, token)
            .then((response) => {
              consoleLogFunc("sendCosmosAddress Success **** ", response);
              resolve(response);
            })
            .catch((error) => {
              consoleLogFunc("sendCosmosAddress Error ****", error);
              reject(error);
            });
        });
      });
    };

    // ************************************** SAVE MPC WALLETS  ****************************************************/

    export const saveMpcWallets = (data: any) => (dispatch: Dispatch) => {
      return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then((token) => {
          APIClient.getInstance()
            .post(SAVE_MPC_WALLETS, data, token)
            .then((response) => {
              consoleLogFunc("saveMpcWallets Success **** ", response);
              resolve(response);
            })
            .catch((error) => {
              consoleLogFunc("saveMpcWallets Error ****", error);
              reject(error);
            });
        });
      });
    };


    // ************************************** CHAIN ABSTRACTION GET COIN LIST  ****************************************************/

    export const getChainAbstractionCoinList = (data: any) => (dispatch: Dispatch) => {
      return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then((token) => {
          APIClient.getInstance()
            .post(CHAIN_ABSTRACTION_GET_COIN_LIST, data, token)
            .then((response) => {
              consoleLogFunc("getChainAbstractionCoinList Success **** ", response);
              resolve(response);
            })
            .catch((error) => {
              consoleLogFunc("getChainAbstractionCoinList Error ****", error);
              reject(error);
            });
        });
      });
    };
    // ************************************** CHAIN ABSTRACTION GET COIN LIST  ****************************************************/

    export const getMpcWalletBalance = (data: any) => (dispatch: Dispatch) => {
      return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then((token) => {
          APIClient.getInstance()
            .post(GET_MPC_WALLETS, data, token)
            .then((response) => {
              consoleLogFunc("getMpcWalletBalance Success **** ", response);
              resolve(response?.data?.data || response?.data?.updatedMpcWallets);
            })
            .catch((error) => {
              consoleLogFunc("getMpcWalletBalance Error ****", error);
              reject(error);
            });
        });
      });
    };

    // ************************************** CHAIN ABSTRACTION SAVE  ****************************************************/

