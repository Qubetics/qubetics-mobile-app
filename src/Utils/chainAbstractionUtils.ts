import {  CHAIN_ABSTRACTION_API_KEY, CHAIN_ABSTRACTION_BASE_URL } from '@env'; 
import { consoleLogFunc, getEncryptedData } from './MethodsUtils';
import { CA_PLATFORM_FEES_URL, CHAIN_ABSTRACTION_INTENT_RESOLVE_URL } from '../EndPoint';
import { ethers } from 'ethers';
import { getTicsProvider, getTicsBal } from './TicsUtils';
import {pinnedFetch, type PinnedFetchOptions} from './pinnedFetch';

const SATOSHI_PER_BTC = 1e8;

/**
 * Common API request handler with SSL pinning and error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */


const makeApiRequest = async (
  endpoint: string,
  options: PinnedFetchOptions = {},
) => {
  try {
    const url = `${CHAIN_ABSTRACTION_BASE_URL}${endpoint}`;
    consoleLogFunc("URL>>", url)
    const response = await pinnedFetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(CHAIN_ABSTRACTION_API_KEY && { 'X-API-KEY': CHAIN_ABSTRACTION_API_KEY }),
        ...options.headers,
      },
      ...options,
    });
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    consoleLogFunc(`ChainAbstraction API Error: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Register a new user for MPC address generation
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - Registration response
 */
const registerUser = async (ethereumAddress: any, pin: any) => {
  const privateKey = await getEncryptedData(`${ethereumAddress}_pk`, pin);
  const provider = getTicsProvider();

  const message = `register:${ethereumAddress}:${Math.floor(Date.now()/1000)}`;
  const wallet = new ethers.Wallet(privateKey).connect(provider);

  const signature = await wallet.signMessage(message);

  const data = {
    tics_address: ethereumAddress,
    signature: signature,
    message: message,
  };
  
  return await makeApiRequest('/register_user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get user information including derived addresses
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - User information response
 */
const getUserInfo = async (ethereumAddress: any) => {
  return await makeApiRequest(`/user_info/${ethereumAddress}`, {
    method: 'GET'
  });
};

/**
 * Create a swap order for chain abstraction
 * @param {Object} swapData - Swap order data
 * @param {string} swapData.signature - Transaction signature
 * @param {Object} swapData.msg - Swap message object
 * @returns {Promise<Object>} - Swap order response
 */
export const createMpcSwapOrder = async (swapData: any) => {
  return await makeApiRequest('/user_mpc_deposit', {
    method: 'POST',
    body: JSON.stringify(swapData)
  });
};

/**
 * Get or register user with fallback mechanism
 * This method tries to register first, and if it fails, fetches existing user info
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - User data with derived addresses
 */
export const getOrRegisterUser = async (ethereumAddress: any, pin: any) => {
  try {
    // First try to register the user
    const registerResponse = await registerUser(ethereumAddress, pin);

    consoleLogFunc('registerResponse>>', registerResponse?.message, registerResponse?.status);
    
    if (registerResponse?.status === 'error') {
      consoleLogFunc('User registration failed, fetching existing user info');
      // If registration fails, get existing user info
      return await getUserInfo(ethereumAddress);
    }
    
    return registerResponse;
  } catch (error) {
    consoleLogFunc('Registration failed, trying to get existing user info', error);
    // If registration fails completely, try to get existing user info
    try {
      return await getUserInfo(ethereumAddress);
    } catch (getUserError) {
      consoleLogFunc('Both registration and getUserInfo failed', getUserError);
      throw new Error('Failed to register or retrieve user information');
    }
  }
};

/**
 * Validate API response structure
 * @param {Object} response - API response
 * @param {string} endpoint - API endpoint name for logging
 * @returns {boolean} - Whether response is valid
 */
export const validateApiResponse = (response: any, endpoint: any) => {
  consoleLogFunc("validateApiResponse response", response);
  if (!response) {
    return false;
  } else if (response.status === 'error') {
    return false;
  } else if (response.status === 'timeout') {
    return false;
  } else if (response.status === 'failed') {
    return false;
  }else{
    return true;
  }
};

/**
 * Extract derived addresses from user response
 * @param {Object} userResponse - User API response
 * @returns {Object} - Derived addresses object
 */
export const extractDerivedAddresses = (userResponse: any) => {
  if (!userResponse) {
    throw new Error('User response is null or undefined');
  }
  
  return {
    derived_eth_address: userResponse.derived_eth_address,
    derived_btc_address: userResponse.derived_btc_address,
    status: userResponse.status || 'success',
  };
};

export const getPlatformFeeFunction = async () => {
  try {
    // Asserted because babel.config.js sets allowUndefined: true, so a key
    // missing from .env becomes undefined rather than failing the build, and
    // this would call pinnedFetch(undefined). The assumption that the var is
    // always set is left as-is; the assertion only makes it visible.
    const response = await pinnedFetch(CA_PLATFORM_FEES_URL!);
    const data = await response.json();
    return {
      solver: data?.data?.solver,
      platform: data?.data?.platform,
    };
    } catch (error) {
      return {
        solver: 1.5,
        platform: 1.5,
      };
  }
};

/**
 * Resolve an intent by intent_id (intent hash)
 * @param {string} intentId - Intent ID / intent hash
 * @returns {Promise<Object>} - Resolve response
 */
export const resolveIntent = async (intentId: any) => {
  try {
    // Same unchecked env assumption as getPlatformFeeFunction above.
    const response = await pinnedFetch(CHAIN_ABSTRACTION_INTENT_RESOLVE_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent_id: intentId }),
    });
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    consoleLogFunc('resolveIntent error:', error);
    throw error;
  }
};


export const getIntentDetails = async (intentHash: any) => {
  return await makeApiRequest(`/intent_details/${intentHash}`, {
    method: 'GET'
  });
};

/**
 * Fetch network addresses (pool and liquidity operator addresses)
 * @returns {Promise<Object>} - { network_addresses: { eth_address, btc_address }, liquidity_operator_addresses }
 */
export const getNetworkAddresses = async () => {
  const data = await makeApiRequest('/get_network_addresses', { method: 'GET' });
  if (data?.status !== 'success' || !data?.network_addresses) {
    throw new Error(data?.error_message || 'Failed to get network addresses');
  }
  return data;
};

/**
 * Get ETH/TICS pool balance for an address (uses TICS RPC)
 * @param {string} ethAddress - Pool eth_address
 * @returns {Promise<number>} - Balance in TICS/ETH (same decimals as getTicsBal)
 */
export const getNetworkAddressEthBalance = async (ethAddress: any) => {
  return await getTicsBal(ethAddress);
};

/**
 * Convert requestUnspent response to BTC balance
 * @param {Object} unspentResponse - Response from requestUnspent (has .data array with .satoshis)
 * @returns {number} - Balance in BTC
 */
export const btcBalanceFromUnspentResponse = (unspentResponse: any) => {
  const list = unspentResponse?.data ?? [];
  const totalSatoshis = list.reduce((sum: any, el: any) => sum + Math.floor(Number(el.satoshis || 0)), 0);
  return totalSatoshis / SATOSHI_PER_BTC;
};
