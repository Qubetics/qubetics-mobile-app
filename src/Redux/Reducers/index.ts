import AsyncStorage from '@react-native-async-storage/async-storage';
import {applyMiddleware, combineReducers, createStore} from 'redux';
// redux-thunk v3 removed the default export; it is a named export now.
import {thunk as ReduxThunk} from 'redux-thunk';
// redux-persist declares the two es/ paths below as ambient modules inside its
// own types/, which TypeScript only loads once something references the
// package root. This type-only import does that and is erased at compile time,
// so the deep imports keep resolving exactly as before at runtime.
import type {PersistConfig} from 'redux-persist';
import persistReducer from 'redux-persist/es/persistReducer';
import persistStore from 'redux-persist/es/persistStore';

import SendCoinReducer from './SendCoinReducer';
import WalletReducer from './WalletReducer';

const appReducer = combineReducers({
  walletReducer: WalletReducer,
  sendCoinReducer: SendCoinReducer,
});

/**
 * The shape `useSelector` sees. Derived from the reducers rather than written
 * out, so it cannot drift from them.
 *
 * This is the pre-persist shape: redux-persist adds its own `_persist` key at
 * runtime, which nothing in the app reads.
 */
export type RootState = ReturnType<typeof appReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['walletReducer'],
  // redux-persist types this as `number | undefined`, but it only ever checks
  // the value for truthiness, so null is the idiom for "no rehydrate timeout".
  // Changing it to undefined would re-enable the default 5000ms timeout, so
  // the value stays and the type is widened here instead.
  timeout: null as unknown as number,
};

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = createStore(
  persistedReducer,
  // Deliberately empty: every reducer supplies its own initial state and
  // redux-persist rehydrates over it. Cast because redux types preloadedState
  // as the complete tree, which an empty object is not.
  {} as ReturnType<typeof persistedReducer>,
  applyMiddleware(ReduxThunk),
);

export const persistor = persistStore(store);

/** Typed `dispatch`, so thunks are accepted without a cast at call sites. */
export type AppDispatch = typeof store.dispatch;
