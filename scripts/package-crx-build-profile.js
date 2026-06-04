"use strict";

const BETA_HOST_PERMISSIONS = ["https://label-cloud.lightwheel.net/*"];

function normalizeReleaseChannel(value) {
  return String(value || "").trim().toLowerCase() === "beta" ? "beta" : "public";
}

function buildReleaseProfile(channel, version) {
  const normalizedChannel = normalizeReleaseChannel(channel);
  if (normalizedChannel === "beta") {
    return {
      channel: normalizedChannel,
      crxFilename: "annotation-script-center-beta.crx",
      zipFilename: "",
      includeZip: false,
      includeUpdateXml: false,
      includeLatestJson: false,
    };
  }
  return {
    channel: normalizedChannel,
    crxFilename: `annotation-script-center-v${version}.crx`,
    zipFilename: `annotation-script-center-v${version}.zip`,
    includeZip: true,
    includeUpdateXml: true,
    includeLatestJson: true,
  };
}

function buildManifestForChannel(manifest, channel) {
  const normalizedChannel = normalizeReleaseChannel(channel);
  const source = manifest && typeof manifest === "object" ? manifest : {};
  const nextManifest = JSON.parse(JSON.stringify(source));
  const hostPermissions = Array.isArray(nextManifest.host_permissions)
    ? nextManifest.host_permissions.slice()
    : [];
  if (normalizedChannel === "beta") {
    nextManifest.version_name = "beta";
    delete nextManifest.update_url;
    nextManifest.host_permissions = hostPermissions;
    return nextManifest;
  }
  delete nextManifest.version_name;
  nextManifest.host_permissions = hostPermissions.filter(function (pattern) {
    return BETA_HOST_PERMISSIONS.indexOf(String(pattern || "").trim()) < 0;
  });
  return nextManifest;
}

function buildBuildMetaContent(input) {
  const config = input && typeof input === "object" ? input : {};
  const releaseChannel = normalizeReleaseChannel(config.releaseChannel);
  const betaUnlockPasswordSha256 = String(config.betaUnlockPasswordSha256 || "")
    .trim()
    .toLowerCase();
  const betaBackendBaseUrl = String(config.betaBackendBaseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  return [
    "(function () {",
    "  globalThis.ASREdgeBuildMeta = {",
    `    releaseChannel: ${JSON.stringify(releaseChannel)},`,
    `    betaUnlockPasswordSha256: ${JSON.stringify(betaUnlockPasswordSha256)},`,
    `    betaBackendBaseUrl: ${JSON.stringify(betaBackendBaseUrl)},`,
    "  };",
    "})();",
    "",
  ].join("\n");
}

module.exports = {
  BETA_HOST_PERMISSIONS,
  buildBuildMetaContent,
  buildManifestForChannel,
  buildReleaseProfile,
  normalizeReleaseChannel,
};
