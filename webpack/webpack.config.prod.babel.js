import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import commonConfig, { contentPath } from './common.config';

const nodeEnv = process.env.NODE_ENV || 'production';
const getConfig = (publicPath, env) => ({
  mode: nodeEnv,
  cache: commonConfig.cache,
  entry: commonConfig.entry,
  output: {
    ...commonConfig.output,
    path: contentPath,
    publicPath,
  },
  module: {
    rules: [
      ...commonConfig.module.rules],
  },
  optimization: {
    minimize: true,
    ...commonConfig.optimization,
  },
  resolve: commonConfig.resolve,
  externals: commonConfig.externals,
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:16].css',
      chunkFilename: 'css/[id].[contenthash:16].css',
      ignoreOrder: true,
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      test: /\.(js|ts)x?$/,
      append: '\n//# sourceMappingURL=https://xxx/[url]',
    }),
    ...commonConfig.plugins,
  ],
  stats: 'errors-warnings',
});
export default getConfig;
