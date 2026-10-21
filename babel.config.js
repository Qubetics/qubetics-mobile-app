module.exports = function (api) {
  api.cache(() => process.env.NODE_ENV);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: ['module:@react-native/babel-preset'],

    // 🔥 GLOBAL IGNORE (prevents ALL plugins from touching shim.js)
    ignore: [
      "**/shim.js",
    ],

    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          safe: false,
          allowUndefined: true,
        },
      ],

      // Remove console.* only in production
      ...(isProduction
        ? [
            [
              "transform-remove-console",
              {
                exclude: ["error", "warn"],
              },
            ],
          ]
        : []),
      "react-native-worklets/plugin",
    ],
  };
};
