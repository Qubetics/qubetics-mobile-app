const reactNativeConfig = require('@react-native/eslint-config/flat');
const jestPlugin = require('eslint-plugin-jest');

const nodeGlobals = {
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
  exports: 'writable',
  module: 'writable',
  process: 'readonly',
  require: 'readonly',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'vendor/**',
      'patches/**',
      'src/generated/**',
      'shim.js',
    ],
  },

  ...reactNativeConfig,

  // Globals the app polyfills at startup in index.js (buffer,
  // text-encoding-polyfill) rather than importing per module.
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'index.js'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
      },
    },
  },

  // Build tooling and standalone Node scripts run outside the RN bundle.
  {
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {globals: nodeGlobals},
  },

  // jest.setup.js runs in the Jest environment but isn't matched by the
  // upstream config's test-file globs.
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: {...nodeGlobals, ...jestPlugin.environments.globals.globals},
    },
  },
];
