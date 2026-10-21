import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getPlans = async ({
  limit = 10,
  page = 1,
  order = "ASC",
  reverse = false,
  prov_address,
  planId = "",
}: any = {}) => {
  const token = await getAccessToken();
  const queryParams: any = {
    limit,
    page,
    order,
    prov_address,
    reverse,
    protocol: "wireguard",
  };

  if (planId) {
    queryParams.planId = planId;
  }
  return await VPNApiClient("/api/plans", "GET", queryParams, token);
};
