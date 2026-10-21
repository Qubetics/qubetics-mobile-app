const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    blockList: [/\.claude\/worktrees\/.*/],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs','json', 'cjx'],
    extraNodeModules: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('react-native-crypto'),
      '@noble/hashes': require.resolve('@noble/hashes'),
      stream: require.resolve("stream-browserify"),
      events: require.resolve("events/"),
      http: require.resolve('@tradle/react-native-http'),
      // libsodium >=0.7.16 is WASM-only and Hermes has no WebAssembly, so it
      // rejects at import time. Nothing in this app uses its primitives --
      // see src/polyfills/libsodium-stub.js.
      'libsodium-wrappers-sumo': require.resolve('./src/polyfills/libsodium-stub.js'),
      'libsodium-wrappers': require.resolve('./src/polyfills/libsodium-stub.js'),
      'libsodium-sumo': require.resolve('./src/polyfills/libsodium-stub.js'),
      libsodium: require.resolve('./src/polyfills/libsodium-stub.js'),
    },
  },
};

// Merge with default config
module.exports = mergeConfig(getDefaultConfig(__dirname), config);