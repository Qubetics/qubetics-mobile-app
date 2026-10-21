import type {Dispatch} from 'redux';
import {
  LOGIN_API
} from "../../../src/EndPoint";
import { APIClient } from "../../components/Api";
import { consoleLogFunc } from "../../Utils/MethodsUtils";

/************************************** login APi request ****************************************************/
export const requestWalletLogin = ({ data }: {data: Record<string, unknown>}) => (dispatch: Dispatch) => {
  consoleLogFunc("RequestWallet-------", data);
  return new Promise((resolve, reject) => {
    APIClient.getInstance()
      .post(LOGIN_API, data)
      .then((response) => {
        let result = response;
        consoleLogFunc("Login Success", response);
        resolve(result);
      })
      .catch((error) => {
        let errorMessage = error.message;
        consoleLogFunc("Login Failed", error);
        reject(errorMessage);
      });
  });
};
