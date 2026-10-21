import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getSessions = async ({
  limit = 20,
  page = 1,
  order = "DESC",
} = {}) => {
  const token = await getAccessToken();

  let queryParams = {
    limit,
    page,
    order,
  };

  return await VPNApiClient("/api/user-sessions", "GET", queryParams, token);
};
