"use strict";

function normalizeBetaUnlockPasswordSha256(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeBetaBackendBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function buildLocalBuildMetaContent(input) {
  const config = input && typeof input === "object" ? input : {};
  const betaUnlockPasswordSha256 = normalizeBetaUnlockPasswordSha256(
    config.betaUnlockPasswordSha256
  );
  const betaBackendBaseUrl = normalizeBetaBackendBaseUrl(config.betaBackendBaseUrl);

  return [
    "(function () {",
    "  globalThis.ASREdgeBuildMeta = Object.assign({}, globalThis.ASREdgeBuildMeta || {}, {",
    '    releaseChannel: "beta",',
    "    betaFeaturesVisibleByDefault: false,",
    `    betaUnlockPasswordSha256: ${JSON.stringify(betaUnlockPasswordSha256)},`,
    `    betaBackendBaseUrl: ${JSON.stringify(betaBackendBaseUrl)},`,
    "  });",
    "})();",
    "",
  ].join("\n");
}

function buildEmptyLocalBuildMetaContent() {
  return [
    "(function () {",
    "  globalThis.ASREdgeBuildMeta = globalThis.ASREdgeBuildMeta || {};",
    "})();",
    "",
  ].join("\n");
}

module.exports = {
  buildEmptyLocalBuildMetaContent,
  buildLocalBuildMetaContent,
  normalizeBetaBackendBaseUrl,
  normalizeBetaUnlockPasswordSha256,
};
