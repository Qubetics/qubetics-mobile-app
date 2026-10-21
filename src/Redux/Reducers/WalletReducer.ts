import type {UnknownAction} from 'redux';

import {
  GET_COIN_LIST_SUCCESS,
  GET_COIN_LIST_FAIL,
  GET_COIN_LIST,
  GET_NATIVE_CURRENCY_LIST,
} from '../Actions/types';

/**
 * Coins and currencies are stored exactly as the API returns them and are read
 * all over the app, so they are `unknown[]` rather than a guessed shape. Narrow
 * at the point of use until the API response is modelled properly.
 */
export type WalletState = {
  coinList: unknown[];
  currencyList: unknown[];
};

const INITIAL_STATE: WalletState = {
  coinList: [],
  currencyList: [],
};

/** `page` arrives as a number from some callers and a string from others. */
type CoinListPayload = {
  page: number | string;
  data: unknown[];
};

const walletReducer = (
  state: WalletState = INITIAL_STATE,
  action: UnknownAction,
): WalletState => {
  switch (action.type) {
    case GET_COIN_LIST_SUCCESS: {
      const {page, data} = action.payload as CoinListPayload;
      // Loose equality is deliberate: `page` may be the string "1".
      return {
        ...state,
        coinList: page == 1 ? data : [...state.coinList, ...data],
      };
    }
    case GET_NATIVE_CURRENCY_LIST:
      return {...state, currencyList: action.payload as unknown[]};
    case GET_COIN_LIST_FAIL:
      return {...state, coinList: []};
    case GET_COIN_LIST:
      return {...state};
    default:
      return state;
  }
};

export default walletReducer;
