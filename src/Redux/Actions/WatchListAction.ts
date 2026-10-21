import type {Dispatch} from 'redux';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { GET_WATCH_LIST, UPDATE_WATCH_LIST } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/*************************************************** getWatchList API***********************************************************/
export const getWatchList = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      getData(Constants.COIN_FAMILY_LIST).then(coinfamilyList => {
        const coin_families = JSON.parse(coinfamilyList);
        data.coin_family = coin_families
        APIClient.getInstance().post(GET_WATCH_LIST, data, token).then(response => {
          let result = response;
          resolve(result);
        }).catch(error => {
          let errorMessage = error.message;
          consoleLogFunc('getWatchList Error ****', error);
          reject(errorMessage);
        });
      });
    });
  });
};
/*************************************************** Update WatchList API***********************************************************/
export const updateWatchList = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  consoleLogFunc("data receive>>>>>>", data);

  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPDATE_WATCH_LIST, data, token).then(response => {
        let result = response;
         consoleLogFunc('getWatchList Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getWatchList Error ****', error);
        reject(errorMessage);
      });
    });
  });
};

