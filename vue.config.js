module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "./" : "./",
  outputDir: "dist",
  assetsDir: "./",
  productionSourceMap: false,
  filenameHashing: false,
  lintOnSave: true,
  devServer: {
    /* 自动打开浏览器 */
    open: true,
    host: "0.0.0.0",
    port: 8082,
    https: false,
    hotOnly: false,
    /* 使用代理 */
    proxy: {
      "/api": {
        target: "http://localhost:9000/",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "/"
        }
      }
    }
  }
};
