module.exports = {
  preset: '@react-native/jest-preset',
  // Reanimated 4 / worklets ship native-only modules that cannot initialise under
  // Jest. Their resolver redirects those to the web implementations.
  resolver: 'react-native-reanimated/jest/resolver.js',
  // Many dependencies ship untranspiled ESM/Flow, so transform node_modules too.
  // babel.config.js ignores every shim.js, so Jest must not transform them either.
  transformIgnorePatterns: ['/shim\\.js$'],
  // Some dependencies (e.g. @solana) ship .mjs/.cjs entry points.
  transform: { '\\.[mc]js$': 'babel-jest' },
  // Some packages only expose "node"/"default" export conditions.
  testEnvironmentOptions: { customExportConditions: ['require', 'react-native', 'node', 'default'] },
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Metro resolves @2x/@3x image variants; Jest does not, so stub media files.
  moduleNameMapper: {
    '\\.(png|jpe?g|gif|webp|bmp|mp4|mp3|wav|ttf|otf)$': '<rootDir>/__mocks__/fileStub.js',
  },
};
