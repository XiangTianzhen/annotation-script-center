"use strict";

const fs = require("fs");
const path = require("path");

function createAuditStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const dataDir = config.dataDir || path.join(__dirname, "audit-data");
  const logPath = path.join(dataDir, "project-data-download-audit.jsonl");

  function ensureDataDir() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  function append(entry) {
    ensureDataDir();
    fs.appendFileSync(logPath, JSON.stringify(entry || {}) + "\n", "utf8");
  }

  function getPaths() {
    return {
      dataDir: dataDir,
      logPath: logPath,
    };
  }

  return {
    append,
    ensureDataDir,
    getPaths,
  };
}

module.exports = {
  createAuditStore,
};
