/**
 * Declarations for dependencies that ship no types and have no @types package.
 *
 * Each is deliberately a bare `declare module`, which gives the module an
 * implicit `any`. That is the honest state: writing a hand-made interface for
 * these would type-check against a shape nobody has verified, which is worse
 * than an explicit any in crypto code.
 *
 * Several of these are on signing and derivation paths (secp256k1,
 * react-native-bip39, bitcore-lib, react-native-crypto, react-native-
 * randombytes), so they are the places where TypeScript gives the least help
 * and review has to carry the weight.
 */
declare module 'react-native-bip39';
declare module 'secp256k1';
declare module 'bitcore-lib';
declare module 'react-native-crypto';
declare module 'react-native-randombytes';
declare module 'lodash.debounce';
declare module 'react-native-svg-charts';
