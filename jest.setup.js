/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

// Reanimated 4 needs no explicit mock: jest/resolver.js (see jest.config.js)
// resolves it to the web build under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

// Generic stand-in for any other native module: every property is a no-op
// function that resolves, so module-level setup code can run under Jest.
const makeNativeStub = name =>
  new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        if (prop === 'getConstants') return () => ({});
        if (prop === 'then' || typeof prop === 'symbol') return undefined;
        if (prop === 'addListener' || prop === 'removeListeners') return jest.fn();
        return jest.fn(() => Promise.resolve(null));
      },
    },
  );

const { TurboModuleRegistry } = require('react-native');
const realGet = TurboModuleRegistry.get;
TurboModuleRegistry.getEnforcing = name => realGet(name) || makeNativeStub(name);
TurboModuleRegistry.get = name => realGet(name) || makeNativeStub(name);

const { NativeModules } = require('react-native');
// Missing native modules fall through to the stub via the prototype chain.
Object.setPrototypeOf(
  NativeModules,
  new Proxy({}, { get: (t, prop) => (typeof prop === 'string' ? makeNativeStub(prop) : undefined) }),
);
NativeModules.ReactLocalization = { language: 'en-US', getLanguage: jest.fn(() => 'en-US') };
NativeModules.RNRandomBytes = {
  seed: require('crypto').randomBytes(4096).toString('base64'),
  randomBytes: (size, cb) => cb(null, require('crypto').randomBytes(size).toString('base64')),
};
