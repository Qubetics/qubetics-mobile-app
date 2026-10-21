import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getAllProviders = async (params: any = {}) => {
  const token = await getAccessToken();

  return await VPNApiClient("/api/provider"+ (params.isRecent ? "/recent" : ""), "GET", null, token);
};

export const getActiveroviders = async () => {
  const token = await getAccessToken();

  return await VPNApiClient("/api/provider?isUserSubscribed=true", "GET", null, token);
};

