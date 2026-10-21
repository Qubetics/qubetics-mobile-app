/**
 * Types for the `@env` module that react-native-dotenv generates from .env
 * (see the module:react-native-dotenv plugin in babel.config.js).
 *
 * These are the variables the app actually imports. .env.example additionally
 * lists NODE_RSA_PUBLIC_KEY and WALLET_NAME_ENCODE, but neither is read from
 * the environment -- both are hardcoded in src/Constants.js, so they are
 * deliberately absent here.
 *
 * babel.config.js sets allowUndefined: true, so a key missing from .env is
 * substituted as undefined at build time rather than failing the build. The
 * declarations below are therefore `string | undefined`: anything reading them
 * has to handle the missing case, which is the honest shape.
 */
declare module '@env' {
  export const BASE_URL: string | undefined;
  export const BASE_IMAGE_URL: string | undefined;
  export const MORALIS_GRAPH_URL: string | undefined;
  export const SWFT_BASE_URL: string | undefined;
  export const DVPN_BASE_URL: string | undefined;
  export const COSMO_RPC_URL: string | undefined;
  export const WALLETCONNECT_PROJECT_ID: string | undefined;
  export const CHAIN_ABSTRACTION_BASE_URL: string | undefined;
  export const CHAIN_ABSTRACTION_API_KEY: string | undefined;
  export const CHAIN_ABSTRACTION_INTENT_RESOLVE: string | undefined;
  export const CHAIN_ABSTRACTION_PRICE: string | undefined;
  export const CA_PLATFORM_FEES: string | undefined;
}
