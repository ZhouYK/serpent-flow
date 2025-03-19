const plugins = [
  ['@babel/plugin-transform-runtime', {
    corejs: 3,
  }],
];

module.exports = {
  presets: [
    ['@babel/preset-react', {
      runtime: 'automatic',
    }],
    [
      '@babel/preset-env',
      {
        modules: 'auto',
        useBuiltIns: 'usage',
        corejs: '3.9',
      },
    ],
  ],
  plugins,
};
