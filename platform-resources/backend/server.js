"use strict";

const { createPlatformResourcesServer } = require("./app");
const { getServerConfig } = require("./config");

const config = getServerConfig();
const server = createPlatformResourcesServer();

server.listen(config.port, config.host, function () {
  const baseUrl = "http://" + config.host + ":" + String(config.port);
  console.info("[Platform Resources][backend] listening on " + baseUrl);
  console.info(
    "[Platform Resources][backend] ASR judgement upload: " +
      baseUrl +
      "/api/alibaba-labelx/asr-judgement/statistics/upload"
  );
  console.info(
    "[Platform Resources][backend] ASR judgement CSV: " +
      baseUrl +
      "/api/alibaba-labelx/asr-judgement/statistics/download"
  );
});

module.exports = server;
