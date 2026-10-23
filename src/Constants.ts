import { BASE_IMAGE_URL, IS_PRODUCTION } from './EndPoint';
import { DVPN_BASE_URL, COSMO_RPC_URL as ENV_COSMO_RPC_URL } from '@env';
import Singleton from './Singleton';
export const network = (IS_PRODUCTION as number) == 0 ? 'testnet' : 'mainnet';

export const prefix = 'qubetics';
export const hdPathString = "m/44'/60'/0'/0/0";
export const COSMO_RPC_URL = ENV_COSMO_RPC_URL
export const VPN_BASE_URL = DVPN_BASE_URL
export const ETH_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const TWO_DECIMAL_REGEX = /^\d*\.?\d{0,2}$/;
export const ALPHANUMERIC_WITH_SPACE_REGEX = /^[a-zA-Z0-9\s]*$/;
export const NO_SPACE_REGEX = /^\S*$/;
export const NOT_ONLY_NUMBER_REGEX = /^(?!\d+$).*/;
export const VPN_ACCESS_TOKEN = 'VPNAccessToken';
export const VPN_REFRESH_TOKEN = 'VPNRefreshToken';
export const CONNECTED_VPN_SESSION_ID = "ConnectedVpnSessionId"
export const IP_V4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
export const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{1F191}-\u{1F251}]|[\u{1F004}]/u

/************************************** Error messages ****************************************************/
export const NO_NETWORK = 'Please check your network connection';
export const SOMETHING_WRONG = 'Something went wrong';
export const INVALID_MNEMONICS = 'Invalid mnemonics';
/*************************************Async Storage Constants******************************* */
export const BIOMETRIC_MODE = 'biometricMode';
export const BIOMETRIC_SUPPORTED = 'biometricSupported';
export const DARK_MODE_STATUS = 'DarkModeStatus';
export const ACCESS_TOKEN = 'AccessToken';
export const REFRESH_TOKEN = 'RefreshToken';
export const DEVICE_TOKEN = 'DeviceToken';
export const WALLET_NAME = 'WalletName';
export const ACTIVE_ADDRESS_LIST = 'active_address_list';
export const PIN_LOCK = 'pinLock';
export const LOGIN_DATA = 'login_data';
export const SELECTED_CURRENCY = 'selected_currency';
export const SELECTED_LANGUAGE = 'selected_language';
export const SELECTED_SYMBOL = 'selected_symbol';
export const FAVORITE = 'favorite';
export const DOWN_MODAL = 'DOWN_MODAL';
export const HIDE_BALANCE = 'hide_balance';
export const ONCHAIN_LIST = 'onchain_list';
export const FIAT_DECIMALS = 2;
export const PIN_TIMEOUT = 'pin_timeout';
export const LAST_TIME = 'last_time';
export const ADDRESS_LIST = 'address_list';
export const MY_COIN_LIST = 'myCoinList';
export const COIN_FAMILY_LIST = 'coin_family_list';
export const MULTI_WALLET_LIST = 'multi_wallet_list';
export const USER_ID = 'user_id';
export const NEW_USER = 'newUser'
export const DAPP_HISTORY = 'dapp_history'
export const ON_CHAIN_LAST_PAIRS = 'on_chain_last_pairs';
export const CROSS_CHAIN_LAST_PAIRS = 'cross_chain_last_pairs';
export const MPC_ADDRESS = 'mpc_address_';
export const LAST_PLAN_ID_USED = 'last_plan_id_used';
export const PIN_STATE = 'pin_state';

export const COSMOS_ADDRESS = 'CosmosAddress';
/******************************************************************/


export const ETH_Img = BASE_IMAGE_URL + '/ETH.png';
export const TRX_Img = BASE_IMAGE_URL + '/Tron.png';
export const BTC_Img = BASE_IMAGE_URL + '/BTC.png';
export const BSC_Img = BASE_IMAGE_URL + '/BNB.png';
export const SOL_Img = BASE_IMAGE_URL + '/Solana.png';
export const MATIC_Img = BASE_IMAGE_URL + '/MATIC.png';
export const TICS_Img = BASE_IMAGE_URL + '/tics_logo.png';
export const PRIVACY_POLICY_LINK = 'https://www.qubetics.com/privacy-policy' ///MAIN_URL + '/privacy';
export const DVPN_PRIVACY_POLICY_LINK = 'https://www.qubetics.com/privacy-policy'
export const DVPN_TERM_LINK = 'https://www.qubetics.com/terms-of-use'

export const KEYCHAIN_SERVICE_NAME = 'qubeticsKeychain';
export const KEYCHAIN_DATA_KEY = 'pin'
// versionCode 6
// versionName "1.0.5"
export const CURRENT_ANDROID_VERSION = "1.1.7";
export const CURRENT_IOS_VERSION = "1.0.2";
export const APP_STORE_LINK = "https://apps.apple.com/us/app/qubetics-wallet/id6746333540";
export const ANDROID_STORE_LINK = "https://play.google.com/store/apps/details?id=com.qubetics.wallet&pcampaignid=web_share";
export const DAPP_COIN_LIST = [
  {
    chainId: 56,
    coin_name: 'Binance',
    coin_symbol: 'bnb',
    coin_image: 'bnb.png',
    decimals: 10 ** 18,
    rpcUrl: Singleton.getInstance().BSC_RPC_URL,
    coin_family: 1,
  },
  {
    chainId: 1,
    coin_name: 'Ethereum',
    coin_symbol: 'eth',
    coin_image: 'eth.png',
    decimals: 10 ** 18,
    rpcUrl: Singleton.getInstance().ETH_DAPP_RPC_URL,
    coin_family: 2,
  },
  {
    chainId: 137,
    coin_name: 'Polygon',
    coin_symbol: 'matic',
    coin_image: 'matic.png',
    decimals: 10 ** 18,
    rpcUrl: Singleton.getInstance().MATIC_RPC_URL,
    coin_family: 4,
  },
  {
    chainId: 9030,
    coin_name: 'Qubetics',
    coin_symbol: 'tics',
    coin_image: 'tics.png',
    decimals: 10 ** 18,
    rpcUrl: Singleton.getInstance().TICS_RPC_URL,
    coin_family: 7,
  },
];

export const DAPP_CHAIN_META = {
  Ethereum: {
    txSymbol: "eth",
    backendCoinType: "ethereum",
    displaySymbol: "ETH",
    coinFamily: 2,
  },
  Binance: {
    txSymbol: "bnb",
    backendCoinType: "binancesmartchain",
    displaySymbol: "BNB",
    coinFamily: 1,
  },
  Qubetics: {
    txSymbol: "tics",
    backendCoinType: "qubetics",
    displaySymbol: "TICS",
    coinFamily: 7,
  },
  Polygon: {
    txSymbol: "pol",
    backendCoinType: "polygon",
    displaySymbol: "POL",
    coinFamily: 4,
  },
};

export const COIN_INFO_BY_FAMILY = {
  1: {
    coin_name: "Bnb Smart Chain",
    coin_symbol: "bnb",
    coin_image: BSC_Img,
    coin_family: 1,
  },
  2: {
    coin_name: "Ethereum",
    coin_symbol: "eth",
    coin_image: ETH_Img,
    id: 1,
  },
  3: {
    coin_name: "Bitcoin",
    coin_symbol: "btc",
    coin_image: BTC_Img,
    id: 4,
  },
  4: {
    coin_name: "Polygon",
    coin_symbol: "Pol",
    coin_image: MATIC_Img,
    id: 5,
  },
  5: {
    coin_name: "Solana",
    coin_symbol: "sol",
    coin_image: SOL_Img,
    id: 6,
  },
  6: {
    coin_name: "Tron",
    coin_symbol: "trx",
    coin_image: TRX_Img,
    id: 1,
  },
  7: {
    coin_name: "Qubetics",
    coin_symbol: "tics",
    coin_image: TICS_Img,
    id: 1,
  },
}
export const COIN_IMAGE_BY_SYMBOL = {
  btc: BTC_Img,
  eth: ETH_Img,
  bnb: BSC_Img,
  pol: MATIC_Img,
  sol: SOL_Img,
  trx: TRX_Img,
  tics: TICS_Img,
}
export const CHAIN_ID_TO_NAME = {
  1: { name: "Ethereum", img: ETH_Img },
  56: { name: "Binance", img: BSC_Img },
  137: { name: "Polygon", img: MATIC_Img },
}

export const AssetList = [
  {
    coin_name: "BNB Smart Chain",
    coin_symbol: "bnb",
    coin_image: BSC_Img,
    id: 2,
    coin_family: 1,
  },
  {
    coin_name: "Ethereum",
    coin_symbol: "eth",
    coin_image: ETH_Img,
    id: 1,
    coin_family: 2,
  },
  {
    coin_name: "Bitcoin",
    coin_symbol: "btc",
    coin_image: BTC_Img,
    id: 4,
    coin_family: 3,
  },
  {
    coin_name: "Polygon",
    coin_symbol: "Pol",
    coin_image: MATIC_Img,
    id: 5,
    coin_family: 4,
  },
  {
    coin_name: "Solana",
    coin_symbol: "sol",
    coin_image: SOL_Img,
    id: 6,
    coin_family: 5,
  },
  {
    coin_name: "Tron",
    coin_symbol: "trx",
    coin_image: TRX_Img,
    id: 1,
    coin_family: 6,
  },
  {
    coin_name: "Qubetics",
    coin_symbol: "tics",
    coin_image: TICS_Img,
    id: 7,
    coin_family: 7,
  }
];
export const NODE_RSA_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr0HDIZ7CFADWa3tFbmxdQHzwFMZfTKvwVKJ9KKlwSZxVGGBP0dLx5xw3aijbRdzLpl9mAk7QaOVpsmhgXklgIa/IBK0MNEACliejQ19mt9cLYQWBO4Zg+QglGPSwjwcM3y648KGf5+6X/ALmnNaTOTh+zpWbnXcLTHPA8xvIYsofEanb7GOFlnVxA0yM49JijyqLMD0HBKfCJ0hIucC/L1m3/5f7DaGmMGQ9a9zFut8Nc71VZmtF8MTodyHsSr28qxTkU3BEhLgPV3qOUKPTNmlvAef7MN+5PbKQpJ3K+5RijSIbgeOnk4ZiYDnC0nAxyl3Oi4BofeO6yI603BYHdwIDAQAB-----END PUBLIC KEY-----";

/*******************************0x***********************************/
export const WALLET_NAME_ENCODE = "71756265746963732d77616c6c6574"; //Config.WALLET_NAME_ENCODE
export const CHAIN_ABSTRACTION_EXPLORER = "https://ticsscan.com/chain-abstraction/"
/*******************************ALCHEMY PAY***********************************/
export const AES_KEY = "aes_key";
export const PROJECT_NAME = 'qubeticWallet';
export const AUTO_LOCK_TIMEOUT = 'autoLockTimeOut'

export const QUBETICS_EVENTS = {
  SUBSCRIPTION_CREATE: "qubetics.subscription.v3.EventCreate",
  SESSION_UPDATE_STATUS: "qubetics.session.v3.EventUpdateStatus",
  SUBSCRIPTION_CREATE_SESSION: "qubetics.subscription.v3.EventCreateSession",
};

export const PIN_ATTEMPT_MODE = { attempts: 0, lastMono: 0, lockDuration: 0 }

export {APP_LOGO_BASE64} from "./appLogoBase64";
