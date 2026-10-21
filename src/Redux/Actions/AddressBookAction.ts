import type {Dispatch} from 'redux';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { API_ADD_ADDRESS, API_DELETE_ADDRESS_BOOK, API_DELETE_CONTACT, API_GET_ADDRESS, API_SEARCH_CONTACT_NAME, API_SEARCH_WALLET_NAME } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/*************************************************** Add Address API***********************************************************/
export const addAddress = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_ADD_ADDRESS, data, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('addAddress Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** searchWalletName API***********************************************************/
export const searchWalletName = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_SEARCH_WALLET_NAME, data, token).then(response => {
        let result = response?.wallet_name;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('searchWalletName Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** searchContactName API***********************************************************/
export const searchContactName = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_SEARCH_CONTACT_NAME, data, token).then(response => {
        let result = response.contact_name;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('searchContactName Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** Get AddressBook API***********************************************************/
export const getAddressBook = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_GET_ADDRESS, data, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        let errorMessage = error?.message;
        consoleLogFunc('getAddressBook Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** Delete AddressBook API***********************************************************/
export const deleteAddressBookId = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_DELETE_ADDRESS_BOOK, data, token).then(response => {
        let result = response.data;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getAddressBook Error ****bfgjhgyguyg', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** Delete AddressBook API***********************************************************/
export const deleteContact = (rowKey: string) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_DELETE_CONTACT, { id: rowKey }, token).then(response => {
        let result = response.data;
        consoleLogFunc('deleteContact Success **** ' + result);
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('deleteContact Error **** ', error);
        reject(errorMessage);
      });
    });
  });
};
