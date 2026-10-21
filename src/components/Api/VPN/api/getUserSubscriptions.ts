import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getUserSubscriptions = async ({
  limit = 10,
  page = 1,
  order = "ASC",
} = {}) => {
  const token = await getAccessToken();
  const queryParams = {
    limit,
    page,
    order,
  };

  return await VPNApiClient("/api/subscription", "GET", queryParams, token);
};

export const getRenewPlanListApi = async ({order = "ASC"} = {}) => {
  const token = await getAccessToken();
  const queryParams = {
  
  };
  return await VPNApiClient("/api/subscription/renew", "GET", queryParams, token);
};