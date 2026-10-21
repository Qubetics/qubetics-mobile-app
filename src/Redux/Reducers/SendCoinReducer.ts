import type {UnknownAction} from 'redux';

import {GET_GAS_PRICE} from '../Actions/types';

export type SendCoinState = {
  gasPriceList: Record<string, unknown>;
};

const INITIAL_STATE: SendCoinState = {
  gasPriceList: {},
};

const sendCoinReducer = (
  state: SendCoinState = INITIAL_STATE,
  action: UnknownAction,
): SendCoinState => {
  switch (action.type) {
    // Resets rather than stores the payload. Preserved as-is; GET_GAS_PRICE is
    // dispatched but its result is never read from this slice.
    case GET_GAS_PRICE:
      return {...state, gasPriceList: {}};
    default:
      return state;
  }
};

export default sendCoinReducer;
