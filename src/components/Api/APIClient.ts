import NodeRSA from 'node-rsa';
import { API_REFRESHTOKEN, BASE_URL } from '../../../src/EndPoint';
import * as Constants from '../../Constants';
import { consoleLogFunc, getData, saveData } from '../../Utils/MethodsUtils';
import { pinnedFetch } from '../../Utils/pinnedFetch';

const APIClient = class APIClient {
     /** @type {APIClient | null} */
     static myInstance: APIClient | null = null;
     /**
      * The null branch always assigns, so this never returns null. TypeScript
      * cannot see that on its own -- the guard reads APIClient.myInstance while
      * the return reads this.myInstance, so narrowing does not carry across --
      * and without the annotation every call site has to null-check a value
      * that cannot be null.
      *
      * @returns {APIClient}
      */
     static getInstance(): APIClient {
          if (APIClient.myInstance == null) {
               APIClient.myInstance = new APIClient();
          }
          return this.myInstance as APIClient;
     }
     // ************************************************* Get **************************************************
     async get(endpoint: any, UserToken?: any) {
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>(async (resolve, reject) => {
                    pinnedFetch(`${BASE_URL}${endpoint}`, {
                         method: 'GET',
                         headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                    }).then(async res => {
                         try {
                              let jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const UserToken = await getData(Constants.ACCESS_TOKEN)
                                        const response = await this.get(endpoint, UserToken);
                                        return resolve(response);
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrrget', err);
                                   })
                              } else {
                                   if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('Json err 1: ', err);
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   // BUG PRESERVED: `data` is not in scope here (ReferenceError at runtime)
                                   // @ts-ignore
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(err);
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code == 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                    });
               });
          }
     }

     // ************************************************* Post **************************************************
     post(endpoint: any, data: any, UserToken?: any) {
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>(async (resolve, reject) => {
                    pinnedFetch(`${BASE_URL}${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: data != null ? this.encodeData(data) : '',

                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const response = await this.postToken(endpoint, data);
                                        return resolve(response);
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr post', err);
                                        return reject(handleReject(err));
                                   })
                              } else {
                                   consoleLogFunc('res Response else: ');
                                   if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {

                                        if (!!jsonVal?.data?.message) {
                                             return reject(handleReject(jsonVal));
                                        }
                                        if (jsonVal.message == undefined) {

                                             return reject({
                                                  message: Constants.SOMETHING_WRONG,
                                             });
                                        }
                                        return reject(handleReject(jsonVal));
                                   } else {
                                        return resolve(jsonVal);
                                   }
                              }
                         } catch (e) {
                              consoleLogFunc('api error99', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('Json err 1>>>>', err);
                         const errorResponse = JSON?.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code == 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(errorResponse || err));
                         }

                    });
               });
          }
     }

     // ************************************************* Post With URL **************************************************
     postWithFullUrl(endpoint: any, data: any, UserToken?: any) {
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>(async (resolve, reject) => {
                    pinnedFetch(`${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: (data != null ? JSON.stringify(data) : null) as any,
                    }).then(async res => {
                         try {
                              let jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const response = await this.postToken(endpoint, data);
                                        return resolve(response);
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr post full url', err);
                                   })
                              } else {
                                   if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              consoleLogFunc('api error333', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code === 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                    });
               });
          }
     }

     // *********************************************** Get GasPrice *********************************************
     getGasPrice(endpoint: any, UserToken?: any) {
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>(async (resolve, reject) => {
                    pinnedFetch(`${endpoint}`, {
                         method: 'GET',
                         headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              'api-access-token': UserToken,
                              'app-version': '1.1'
                         }
                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const UserToken = await getData(Constants.ACCESS_TOKEN)
                                        this.getGasPrice(endpoint, UserToken)
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr gas price', err);
                                   })
                              } else {
                                   if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   // BUG PRESERVED: `data` is not in scope here (ReferenceError at runtime)
                                   // @ts-ignore
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code === 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                    });
               });
          }
     }

     // ************************************************* refreshTheToken **************************************************
     refreshTheToken() {
          return new Promise<any>(async (resolve, reject) => {
               try {
                    const token = await getData(Constants.REFRESH_TOKEN);
                    const old_token = await getData(Constants.ACCESS_TOKEN);
                    // @ts-ignore postToken takes 2 params; the 3rd arg is ignored at runtime
                    const response = await this.postToken(API_REFRESHTOKEN, { token: old_token, refreshToken: token }, '');
                    if (response.status) {
                         getData(Constants.MULTI_WALLET_LIST).then(list => {
                              const Arr = JSON.parse(list);
                              const newMultiWalletArray = Arr.map((item: any, index: any) => {
                                   if (item?.defaultWallet) {
                                        item.user_jwtToken = response.token;
                                        item.user_refreshToken = response.refreshToken;
                                   }
                                   return item;
                              });
                              saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(newMultiWalletArray));
                              saveData(Constants.ACCESS_TOKEN, response.token);
                              saveData(Constants.REFRESH_TOKEN, response.refreshToken);
                              ;(resolve as any)()
                         })
                    } else {
                    }
               } catch (error: any) {
                    reject(handleReject(error))
               }
          })
     };

     // ************************************************* postToken **************************************************
     async postToken(endpoint: any, data: any) {
          const UserToken = await getData(Constants.ACCESS_TOKEN);
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>(async (resolve, reject) => {
                    pinnedFetch(`${BASE_URL}${endpoint}`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', Authorization: UserToken || '', 'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en', },
                         body: (data != null ? endpoint.includes('user/file_upload') ? data : this.encodeData(data) : null) as any,
                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                   if (jsonVal.message == undefined) {
                                        return reject({ message: Constants.SOMETHING_WRONG });
                                   }
                                   return reject(handleReject(jsonVal));
                              } else {
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              consoleLogFunc('api error99', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('chk post errr::::2', err);
                         reject(handleReject(err))
                    });
               });
          }
     }

     // ************************************************* PostSwap **************************************************
     postSwap(endpoint: any, data: any, UserToken?: any) {
          if (!(global as any).isConnected) {
               return new Promise<any>((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise<any>((resolve, reject) => {
                    pinnedFetch(`${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: (data != null ? JSON.stringify(data) : null) as any,
                    }).then(async res => {
                         try {
                              let jsonVal = await res.json();
                              if ((res.status as any) == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                   if (jsonVal.message == undefined) {
                                        return reject({ message: Constants.SOMETHING_WRONG });
                                   }
                                   return reject(handleReject(jsonVal));
                              }
                              return resolve(jsonVal);
                         } catch (e) {
                              consoleLogFunc('api error111', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    })
                         .catch(reject);
               });
          }
     }

     // ************************************************* encodeData **************************************************
     encodeData = (data: any) => {
          const second = new NodeRSA(Constants.NODE_RSA_PUBLIC_KEY);
          second.setOptions({ encryptionScheme: 'pkcs1' });
          const enc = second.encrypt(data, 'base64');
          const dataa = {
               dataString: enc,
          };
          return JSON.stringify(dataa);
     };

     // ************************************************* PostFile **************************************************
};

const handleReject = (errObj: any) => {
     consoleLogFunc(errObj, 'errObjerrObj')
     if (errObj?.message) {
          return errObj
     } else if (errObj?.toString()?.toLowerCase()?.includes("network")) {
          return { message: Constants.NO_NETWORK }
     } else {
          return { message: Constants.SOMETHING_WRONG }
     }
}
export { APIClient };
