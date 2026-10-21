import type {Dispatch} from 'redux';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { UPDATE_REF_CODE } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/*************************************************** updateRefCode API***********************************************************/
export const updateRefCode = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPDATE_REF_CODE, data, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response updateRefCode --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error updateRefCode -- ****', error);
        reject(error.message || error);
      });
    })
  })
};
