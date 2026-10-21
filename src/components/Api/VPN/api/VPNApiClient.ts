import { pinnedFetch } from "../../../../Utils/pinnedFetch";
import { getAccessToken, refreshTokenIfNeeded } from "./authWithCosmosWallet";
import * as Constants from "../../../../Constants";
import { consoleLogFunc } from "../../../../Utils/MethodsUtils";

// ---------------------------------------------------------------------------
// Response cache for GET requests
// Key = `${url}|${token_prefix}` so different users never share entries.
// TTL of 30 s avoids redundant back-to-back calls (multiple updateBalance
// triggers within the same session) while still keeping data fresh.
// ---------------------------------------------------------------------------
const _cache = new Map<any, any>();
const CACHE_TTL_MS = 30_000;

const _cacheKey = (url: any, token: any) => `${url}|${(token || '').slice(0, 20)}`;

const _getCached = (key: any) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.data;
};

const _setCache = (key: any, data: any) => _cache.set(key, { data, ts: Date.now() });

export const clearVpnApiCache = () => _cache.clear();

export const VPNApiClient = async (
  endpoint: any,
  method = "GET",
  data: any = null,
  token = ""
) => {
  let accessToken = token || (await getAccessToken());

  const headers: any = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  const isGet = method.toUpperCase() === "GET";
  const baseUrl = Constants.VPN_BASE_URL;
  
  const url =
    isGet && data
      ? `${baseUrl}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${baseUrl}${endpoint}`;
consoleLogFunc("data>>>>>>>>>>", data);
  const options: any = {
    method,
    headers,
    ...(isGet ? {} : { body: JSON.stringify(data) }),
  };

  consoleLogFunc("📡 Request →", url);

  // Return cached response for identical GET requests within the TTL window
  if (isGet) {
    const cached = _getCached(_cacheKey(url, accessToken));
    if (cached) {
      consoleLogFunc("⚡ Cache hit →", url);
      return cached;
    }
  }

  try {
    let response = await pinnedFetch(url, options);

    if (response.status === 401) {
      try {
        accessToken = await refreshTokenIfNeeded();
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        response = await pinnedFetch(url, options);
      } catch (refreshErr) {
        throw new Error("Session expired. Please login again.");
      }
    }

    const result = await response.json();

    if (response.status !== 200) {
      consoleLogFunc("❌ API Error:",endpoint, result);
      throw new Error(result?.message || "API request failed");
    }

    if (isGet) _setCache(_cacheKey(url, accessToken), result);

    return result;
  } catch (err: any) {
    if (err.name === "AbortError") {
      consoleLogFunc("❌ Fetch Error: Request timed out");
      throw new Error("Request timed out");
    } else {
      consoleLogFunc("❌ Fetch Error:", err);
      consoleLogFunc("❌ Fetch Error:", err.message);
      throw err?.message || "Something went wrong";
    }
  } finally {
  }
};

