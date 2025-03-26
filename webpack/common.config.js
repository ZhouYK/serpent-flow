import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ESLintWebpackPlugin from 'eslint-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import reactRefreshBabel from 'react-refresh/babel';
import reactRefreshTs from 'react-refresh-typescript';
import ArcoWebpackPlugin from '@arco-plugins/webpack-react';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const isDevelopment = process.env.NODE_ENV === 'development';
export const contentPath = path.resolve(__dirname, '../dist');
// 这里可以路径前一个名称作为页面区分
const entry = {
  index: ['./src/index.ts'],
};
const rules = [{
  test: /\.module\.less$/,
  exclude: /node_modules/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: true,
        sourceMap: false,
      },
    },
    'postcss-loader',
    {
      loader: 'less-loader',
      options: {
        lessOptions: {
          javascriptEnabled: true,
        },
        sourceMap: false,
      },
    },
  ],
}, {
  test: /\.less$/,
  exclude: /\.module\.less/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        sourceMap: false,
      },
    },
    'postcss-loader',
    {
      loader: 'less-loader',
      options: {
        lessOptions: {
          javascriptEnabled: true,
        },
        sourceMap: false,
      },
    },
  ],
},
{
  test: /\.css$/,
  use: ['style-loader', {
    loader: 'css-loader',
    options: {
      sourceMap: false,
    },
  }],
}, {
  test: /\.(ts|js)x?$/,
  include: [
    path.resolve(__dirname, '../src'),
  ],
  use: [{
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      cacheCompression: false,
      plugins: [
        isDevelopment && reactRefreshBabel,
      ].filter(Boolean),
    },
  }, {
    loader: 'ts-loader',
    options: {
      transpileOnly: true, // 不做类型校验，交给插件做
      getCustomTransformers: () => ({
        before: isDevelopment ? [reactRefreshTs()] : [],
      }),
    },
  }],
}];
const plugins = [
  isDevelopment && new HtmlWebpackPlugin({
    template: './webpack/index.html',
    filename: 'index.html',
    templateParameters: {
      title: 'MeowLink',
    },
    chunksSortMode: 'manual',
    chunks: ['runtime', 'base', 'uis', 'style', 'index'],
    favicon: './public/favicon.ico',
  }),
  new ESLintWebpackPlugin({
    extensions: ['js', 'jsx', 'tsx', 'ts'],
    threads: true,
    emitError: true,
    emitWarning: true,
    failOnError: true,
  }),
  isDevelopment && new ArcoWebpackPlugin({
    // theme: path.resolve('src/theme/theme-meowlink-ui-v3'),
    theme: '@arco-themes/react-meowlink',
  }),
  isDevelopment && new ReactRefreshWebpackPlugin({
    overlay: false,
  }),
  new ForkTsCheckerWebpackPlugin(),
].filter(Boolean);
const config = {
  entry,
  target: 'web',
  output: {
    filename: 'js/[name].js',
    // 这个会影响externals的配置
    libraryTarget: 'umd',
  },
  cache: {
    type: 'filesystem', // memory,
    buildDependencies: {
      config: [__filename],
    },
    maxAge: 5184000000 * 12, // 允许未使用的缓存留在文件系统缓存中的时间：一年
  },
  module: {
    rules,
  },
  resolve: {
    mainFiles: ['index'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts', '.less'],
    symlinks: false,
    cacheWithContext: false,
  },
  plugins,
};
export default config;
