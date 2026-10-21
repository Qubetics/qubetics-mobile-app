import { VPNApiClient } from "./VPNApiClient";
import * as Constants from "../../../../Constants";
import { getData, removeStorageItem, saveData } from "../../../../Utils/MethodsUtils";
import { pinnedFetch } from "../../../../Utils/pinnedFetch";
import Singleton from "../../../../Singleton";

export const loginWithCosmosWallet = async ({
  wallet_address,
  pubKey,
  signatureBase64,
}: {wallet_address: any; pubKey: any; signatureBase64: any}) => {
  return {data: {
    accessToken: "temp", 
    refreshToken: "temp"
  }}
  const body = {
    wallet_address,
    pubKey,
    signature: {
      pub_key: {
        type: "tendermint/PubKeySecp256k1",
        value: pubKey,
      },
      signature: signatureBase64,
    },
  };

  const result = await VPNApiClient("/api/user/login", "POST", body);
  if (result?.data?.accessToken) {
    await saveData(wallet_address+"_"+Constants.VPN_ACCESS_TOKEN, result.data.accessToken);
    await saveData(wallet_address+"_"+Constants.VPN_REFRESH_TOKEN, result?.data?.refreshToken);
  }

  return result;
};


export const refreshTokenIfNeeded = async () => {
  try {
    const address = await getData(Constants.COSMOS_ADDRESS);

    const refreshToken = await getData(address+"_"+Constants.VPN_REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }


    
    // Use domain URL directly - Android's system DNS is fast and cached
    const baseUrl = Constants.VPN_BASE_URL;

    const response = await pinnedFetch(`${baseUrl}/api/user/refresh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "refresh-token": refreshToken,
      },
    });

    const result = await response.json();

    if (response.status !== 200) {
      throw new Error(result?.message || "Failed to refresh token");
    }

    const newAccessToken = result?.data?.accessToken;
    const newRefreshToken =
      result?.data?.refreshToken || result?.data?.refershToken;

    if (newAccessToken && newRefreshToken) {
      await saveData(address+"_"+Constants.VPN_ACCESS_TOKEN, newAccessToken);
      await saveData(address+"_"+Constants.VPN_REFRESH_TOKEN, newRefreshToken);
      return newAccessToken;
    }

    throw new Error("Invalid token refresh response");
  } catch (error: any) {
    console.error("❌ Refresh token error:", error.message || error);
    throw new Error(`Unauthorized & refresh failed: ${error.message}`);
  }
};

export const logoutCosmosWallet = async (address?: any) => {
  try {
    const accessToken = await getAccessToken(address);
    const baseUrl = Constants.VPN_BASE_URL;
    const refreshToken = await getRefreshToken(address);
    const response = await pinnedFetch(`${baseUrl}/api/user/logout`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "refresh-token": refreshToken,
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    const result = await response.json();
    if (address) {
      await removeStorageItem(address + "_" + Constants.VPN_ACCESS_TOKEN);
      await removeStorageItem(address + "_" + Constants.VPN_REFRESH_TOKEN);
    }
    return { success: true, message: result?.message || "Logout successful" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export const getAccessToken = async (address?: any) => { 
  let wallet_address = address || Singleton.getInstance().defaultCosmosAddress;
  return await getData(wallet_address + "_" + Constants.VPN_ACCESS_TOKEN);
};

const getRefreshToken = async (address?: any) => { 
  let wallet_address = address || Singleton.getInstance().defaultCosmosAddress;
  return await getData(wallet_address + "_" + Constants.VPN_REFRESH_TOKEN);
};