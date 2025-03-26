import webpack from 'webpack';
import commonConfig, { contentPath } from './common.config';

const nodeEnv = process.env.NODE_ENV || 'development';
const devPort = process.env.PORT || '9999';
const publicPath = '/'; // 可自定义
const entry = { ...commonConfig.entry };
const config = {
  devtool: 'eval-cheap-module-source-map',
  mode: nodeEnv,
  entry,
  cache: commonConfig.cache,
  target: commonConfig.target,
  output: {
    ...commonConfig.output,
    path: contentPath,
    publicPath,
    globalObject: 'this',
  },
  module: {
    rules: [
      ...commonConfig.module.rules,
    ],
  },
  resolve: commonConfig.resolve,
  externals: commonConfig.externals,
  watchOptions: {
    aggregateTimeout: 400,
    poll: 3000,
    ignored: /node_modules/,
  },
  optimization: {
    ...commonConfig.optimization,
  },
  devServer: {
    hot: true,
    host: '0.0.0.0',
    port: devPort,
    allowedHosts: 'all',
    static: {
      directory: contentPath,
    },
    historyApiFallback: true,
    compress: true,
    // quiet: true,
    proxy: {
      '/api': {
        target: 'http://38.55.193.96:8080', // 服务器端接口地址
        secure: false,
        changeOrigin: true,
        timeout: 600000, // 10分钟
        proxyTimeout: 600000,
        maxContentLength: Infinity,
        onError: (err) => {
          console.error('Proxy error:', err);
        },
        onProxyReq: (proxyReq) => {
          // 删除请求超时时间
          proxyReq.removeHeader('timeout');
        },
      },
      buffer: {
        limit: '500mb',
      },
    },
    client: {
      overlay: false,
      progress: true,
      logging: 'error',
      webSocketTransport: 'ws',
    },
    webSocketServer: 'ws',
    open: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    }),
    ...commonConfig.plugins,
  ],
  stats: 'errors-warnings',
};
export default config;
