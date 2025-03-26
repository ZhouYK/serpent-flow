import getConfig from './webpack.config.prod.babel';

const publicPaths = {
  dev: '开发环境域名地址',
  test: '测试环境域名地址',
  stage: '预发环境域名地址',
  prod: '生产环境域名地址',
  local: './',
};

export default (env = { prod: true }) => {
  let publicPath = publicPaths.prod;
  if (env.dev) {
    publicPath = publicPaths.dev;
  } else if (env.test) {
    publicPath = publicPaths.test;
  } else if (env.stage) {
    publicPath = publicPaths.stage;
  } else if (env.prod) {
    publicPath = publicPaths.prod;
  } else if (env.local) {
    publicPath = publicPaths.local;
  }
  return getConfig(publicPath, env);
};
