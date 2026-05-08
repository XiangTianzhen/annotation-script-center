"use strict";

const { loadDefaultEnvFiles } = require("./env-loader");
const { createPlatformResourcesServer } = require("./app");
const { getServerConfig } = require("./config");

loadDefaultEnvFiles();

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
  console.info(
    "[Platform Resources][backend] ASR transcription upload: " +
      baseUrl +
      "/api/alibaba-labelx/asr-transcription/statistics/upload"
  );
  console.info(
    "[Platform Resources][backend] ASR transcription CSV: " +
      baseUrl +
      "/api/alibaba-labelx/asr-transcription/statistics/download"
  );
  console.info(
    "[Platform Resources][backend] ASR judgement AI health: " +
      baseUrl +
      "/api/alibaba-labelx/asr-judgement/ai/health"
  );
  console.info(
    "[Platform Resources][backend] ASR judgement AI suggest: " +
      baseUrl +
      "/api/alibaba-labelx/asr-judgement/ai/suggest"
  );
  console.info(
    "[Platform Resources][backend] DataBaker AI health: " +
      baseUrl +
      "/api/data-baker/round-one-quality/ai/recommend/health"
  );
  console.info(
    "[Platform Resources][backend] DataBaker AI recommend: " +
      baseUrl +
      "/api/data-baker/round-one-quality/ai/recommend"
  );
});

module.exports = server;
