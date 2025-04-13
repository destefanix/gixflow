const { defineConfig } = require('@vue/cli-service');
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
   devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    client: {
      webSocketURL: 'wss://app.gixflow.cloud/ws', // WebSocket Secure (WSS)
    },
  }, 
  outputDir: path.resolve(__dirname, "../gixflow-fapp"),
  publicPath: "/",
});

