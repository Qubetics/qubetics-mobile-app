import {APIClient} from '../../APIClient';
import * as Constants from '../../../../Constants';
import {getData} from '../../../../Utils/MethodsUtils';
import { POST_WALLET_VERSIONS } from '../../../../EndPoint';

export const postWalletVersions = async ({version, platform}: {version: any; platform: any}) => {
  const token = await getData(Constants.ACCESS_TOKEN);
  const body = {version, platform};
  return await APIClient.getInstance().post(POST_WALLET_VERSIONS, body, token);
};
