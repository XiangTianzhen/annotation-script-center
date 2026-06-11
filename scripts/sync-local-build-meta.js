"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildLocalBuildMetaContent,
  normalizeBetaBackendBaseUrl,
  normalizeBetaUnlockPasswordSha256,
} = require("./build-meta-local");

const REPO_ROOT = path.resolve(__dirname, "..");
const RELEASE_CONFIG_PATH = path.join(REPO_ROOT, "config", "package-crx-release.json");
const RELEASE_LOCAL_CONFIG_PATH = path.join(
  REPO_ROOT,
  "config",
  "secrets",
  "package-crx-release.local.json"
);
const LOCAL_BUILD_META_PATH = path.join(
  REPO_ROOT,
  "extension",
  "shared",
  "build-meta.local.js"
);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJsonConfigFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, "utf8");
  if (!String(raw || "").trim()) {
    return {};
  }
  const parsed = JSON.parse(raw);
  if (!isPlainObject(parsed)) {
    throw new Error(`配置文件必须是 JSON 对象：${filePath}`);
  }
  return parsed;
}

function loadReleaseConfig() {
  return Object.assign(
    {},
    readJsonConfigFile(RELEASE_CONFIG_PATH),
    readJsonConfigFile(RELEASE_LOCAL_CONFIG_PATH)
  );
}

function main() {
  const config = loadReleaseConfig();
  const betaUnlockPasswordSha256 = normalizeBetaUnlockPasswordSha256(
    config.betaUnlockPasswordSha256
  );
  const betaBackendBaseUrl = normalizeBetaBackendBaseUrl(config.betaBackendBaseUrl);

  if (!betaUnlockPasswordSha256) {
    throw new Error(
      "缺少 betaUnlockPasswordSha256。请先在 config/secrets/package-crx-release.local.json 中配置。"
    );
  }

  fs.mkdirSync(path.dirname(LOCAL_BUILD_META_PATH), { recursive: true });
  fs.writeFileSync(
    LOCAL_BUILD_META_PATH,
    buildLocalBuildMetaContent({
      betaUnlockPasswordSha256,
      betaBackendBaseUrl,
    }),
    "utf8"
  );

  console.log(`local build meta synced: ${LOCAL_BUILD_META_PATH}`);
}

try {
  main();
} catch (error) {
  console.error(`[sync-local-build-meta] ${error.message}`);
  process.exitCode = 1;
}
