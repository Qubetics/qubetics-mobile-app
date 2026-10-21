import {consoleLogFunc} from '../../../../Utils/MethodsUtils';
import { getAccessToken } from './authWithCosmosWallet';
import {VPNApiClient} from './VPNApiClient';

/**
 * Fetches a list of VPN nodes (plans) with optional query filters.
 */
export const getVpnNodes = async ({
  limit = 10,
  page = 1,
  order = 'DESC',
  reverse = false,
  planId = '',
  country = '',
  city = '',
  protocol = '',
}: any = {}) => {
  const token = await getAccessToken();

  let queryParams: any = {
    limit,
    page,
    order,
    reverse,
  };
  if (protocol !== '') {
    queryParams = {
      ...queryParams,
      protocol: "wireguard",
    };
  }

  if (country !== '') {
    queryParams = {
      ...queryParams,
      country: country,
    };
  }
  if (city !== '') {
    queryParams = {
      ...queryParams,
      city: city,
    };
  }
  consoleLogFunc('queryParams--->', planId);
  if (planId) {
    queryParams = {
      ...queryParams,
      plan_id: planId,
    };
  }

  return await VPNApiClient('/api/nodes', 'GET', queryParams, token);
};
