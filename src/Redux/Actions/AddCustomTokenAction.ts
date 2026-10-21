import type {Dispatch} from 'redux';
import { ADD_CUSTOM_TOKEN_API, SEARCH_CUSTOM_TOKEN_API } from '../../../src/EndPoint';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/****************************Search Token Api********************************** */
export const searchToken = ({ searchTokenReq, token }: {searchTokenReq: Record<string, unknown>; token: string | null}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(SEARCH_CUSTOM_TOKEN_API, searchTokenReq, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        if (!errorMessage)
          errorMessage = 'Something Went Wrong '
        consoleLogFunc('search token Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/****************************Add Custom Token Api********************************** */
export const addToken = ({ addTokenReq, token }: {addTokenReq: Record<string, unknown>; token: string | null}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(ADD_CUSTOM_TOKEN_API, addTokenReq, token).then(response => {
        let result = response;
        resolve(result);
      }).catch(error => {
        consoleLogFunc('add token Error ****', error);
        let errorMessage = error.message;
        if (!errorMessage)
          errorMessage = 'Something Went Wrong '
        reject(errorMessage);
      });
    });
  });
};
