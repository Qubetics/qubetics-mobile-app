import type {Dispatch} from 'redux';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { UPDATE_LANGUAGE } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/*************************************************** updateLanguage API***********************************************************/
export const updateLanguage = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPDATE_LANGUAGE, data, token).then((response) => {
        let result = response;
        consoleLogFunc('response updateLanguage --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error updateLanguage -- ****', error);
        reject(error);
      });
    })
  })
};
