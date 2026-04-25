"use strict";

const path = require("path");
const { CONFIG_PATH, UPLOAD_PATH, createLocalServer } = require("./http-server");
const { createStatisticsStore } = require("./file-store");

const host = process.env.ASR_JUDGEMENT_SERVER_HOST || "127.0.0.1";
const port = Number(process.env.ASR_JUDGEMENT_SERVER_PORT || 3333);
const dataDir =
  process.env.ASR_JUDGEMENT_STATS_DIR || path.join(__dirname, "..", "statistics-data");

const store = createStatisticsStore({ dataDir });
store.ensureDataDir();

const server = createLocalServer({ dataDir });

server.listen(port, host, function () {
  console.info(
    "[ASR Edge][judgement-stats-server] listening on http://" +
      host +
      ":" +
      String(port) +
      UPLOAD_PATH
  );
  console.info(
    "[ASR Edge][judgement-stats-server] config on http://" +
      host +
      ":" +
      String(port) +
      CONFIG_PATH
  );
  console.info("[ASR Edge][judgement-stats-server] csv:", store.getPaths().csvPath);
});

module.exports = server;
