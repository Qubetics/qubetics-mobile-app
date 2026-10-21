import {
  BASE_URL as ENV_BASE_URL,
  BASE_IMAGE_URL as ENV_IMAGE_URL,
  MORALIS_GRAPH_URL as ENV_MORALIS_URL,
  SWFT_BASE_URL,
  CHAIN_ABSTRACTION_INTENT_RESOLVE,
  CHAIN_ABSTRACTION_PRICE,
  CA_PLATFORM_FEES

} from "@env";

export const IS_PRODUCTION = 1;
export const MAIN_URL = ENV_BASE_URL;
export const BASE_URL = `${MAIN_URL}/api/v1/`;
export const BASE_IMAGE_URL = ENV_IMAGE_URL;
export const CHAIN_ABSTRACTION_INTENT_RESOLVE_URL = CHAIN_ABSTRACTION_INTENT_RESOLVE
export const CHAIN_ABSTRACTION_PRICE_URL = CHAIN_ABSTRACTION_PRICE
export const CA_PLATFORM_FEES_URL = CA_PLATFORM_FEES
export const MORALIS_GRAPH_URL = ENV_MORALIS_URL;
export const SCREENSHOT_PREVENT_URL = BASE_IMAGE_URL + "/qubeticSecureView.png";

/**************************************DVPN APIs****************************************************/
export const TICS_EXPLORER_URL_LINK = ("https://ticsscan.com/tx/").replace(/\/?$/, "/");
export const DVPN_EXPLORER_URL_LINK = ("https://ticsscan.com/txn/").replace(/\/?$/, "/");

/**************************************USER APIs****************************************************/
export const GET_CURRENT_UTC = 'user/current_timestamp';
export const LOGIN_API = 'user/create/wallet2';
export const API_ADD_ADDRESS = 'user/add_address_book';
export const API_SEARCH_WALLET_NAME = 'user/get_wallet_name';
export const API_SEARCH_CONTACT_NAME = 'user/search';
export const API_GET_ADDRESS = 'user/address_book';
export const API_NOTIFICATIONS_LIST = 'user/notification/list';
export const API_DELETE_ADDRESS_BOOK = 'user/delete_address_book_wallet_address';
export const API_DELETE_CONTACT = 'user/delete_address_book';
export const API_LOGOUT = 'user/logout';
export const API_ANNOUNCEMENTS_STATUS = 'user/announcement/view_status';
export const API_ANNOUNCEMENTS_STATUS_NEW = 'user/announcements';
export const API_ANNOUNCEMENTS_BANNER = 'user/banners';


/**************************************WALLET APIs****************************************************/
export const SAVE_DEVICE_TOKEN = 'wallet/save/device/token';
export const GET_COIN_LIST_API = 'wallet/portfolio';
export const TOOGLE_COIN_LIST = 'wallet/toggleCoinList';
export const ACTIVE_INACTIVE_COIN = 'wallet/activeinactive';
export const TRANSACTION_LIST_API = 'wallet/transaction/list';
export const DVPNS_LIST_API = 'dvpnPlans/plans';
export const SEARCH_CUSTOM_TOKEN_API = 'wallet/search';
export const ADD_CUSTOM_TOKEN_API = 'wallet/addtoken';
export const API_MANAGE_WALLET = 'wallet/order/update';
export const API_CURRENCY = 'wallet/currencyfiatlist';
export const NATIVE_PRICE = 'wallet/nativeCoinFiatPrice';
export const GET_WATCH_LIST = 'wallet/getWatchlist';
export const UPDATE_WATCH_LIST = 'wallet/updateWatchlist';
export const GET_REALTIME_BAL = 'wallet/rpcBalance';
export const COIN_DETAILS = 'wallet/coinWalletDetail';
export const COIN_GRAPH = 'wallet/coin/graph/data';
export const GET_FEE_LIMIT = 'wallet/fee';
export const NATIVE_COIN_BALANCE = 'wallet/nativeCoinBalance';
export const WALLET_SYNC_BALANCE = 'wallet/sync/balance';

/**************************************SWFT APIs****************************************************/
export const API_SWFT_GET_COINLIST = 'swftc/queryCoinList';
export const API_SWFT_LAST_PAIRS = 'swftc/queryCoinData';
export const API_SWFT_COININFO = 'swftc/getBaseInfo';
export const API_SWFT_ACCOUNT_EXCHANGE = 'swftc/accountExchange';
export const API_GET_ORDER_DETAIL = SWFT_BASE_URL + '/api/v2/queryOrderState';

/**************************************REFRESHTOKEN APIs****************************************************/
export const API_REFRESHTOKEN = 'auth/authorisation';

//*******************************************ON_CHAIN_SWAP_LIST**********************************************/
export const ON_CHAIN_SWAP_LIST = 'wallet/swap_coinlist';
export const GET_SWAP_AMOUNT_DIFF_URL = 'wallet/fetchValue';

//******************************************* RPC Url API's **********************************************/
export const API_GET_RPC_URL = 'wallet/rpcUrl';


//*****************************************LANGUAGE****************************************************/
export const UPDATE_LANGUAGE = 'user/update_language';

//*****************************************Referral****************************************************/
export const UPDATE_REF_CODE = 'referral/update_referral_code';
//*****************************************1inch****************************************************/

export const INCH_COMMISSION_DATA = 'on-chain/commision_data';
export const INCH_GET_QUOTE = 'on-chain/quote';
export const INCH_CHECK_ALLOWANCE = 'on-chain/allowance';
export const INCH_SWAP = 'on-chain/swap';
export const INCH_SPENDER = 'on-chain/spender';

//*****************************************matcha (0x)****************************************************/
export const API_ALL_WALLET_BALANCE = 'wallet/allBalances';

//*****************************************Sol****************************************************/

export const API_SAVE_SOL_TRANSACTION_ID = 'solana/'
//*****************************************NFT****************************************************/
export const GET_NFT_LIST = 'wallet/nfts'

//*****************************************COSMOS****************************************************/

export const COSMOS_GAS_ESTIMATE = 'qubetics/gas_estimation/nativeAddress';
export const COSMOS_SEND = 'qubetics/send/nativeAddress';
export const COSMOS_NATIVE_WALLET = 'user/create/wallet/native';

//*****************************************chain abstraction****************************************************/

export const CHAIN_ABSTRACTION_GET_COIN_LIST = 'chainAbstraction/getCoinList';
export const SAVE_MPC_WALLETS = 'mpc/saveMpcWallets';
export const GET_MPC_WALLETS = 'mpc/getMpcWallets';

//***************************************** dvpn ****************************************************/
export const GET_SESSION_HISTORY = 'dvpn/sessionHistory';
export const POST_WALLET_VERSIONS = 'wallet/versions';