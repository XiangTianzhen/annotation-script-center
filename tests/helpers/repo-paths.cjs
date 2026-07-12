"use strict";

const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..", "..");

function resolveRepo(...segments) {
  return path.resolve(repoRoot, ...segments);
}

module.exports = { repoRoot, resolveRepo };
