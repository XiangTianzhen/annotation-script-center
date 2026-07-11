"use strict";

function buildReleaseProfile(version) {
  const normalizedVersion = String(version || "").trim();
  return {
    crxFilename: `annotation-script-center-v${normalizedVersion}.crx`,
    zipFilename: `annotation-script-center-v${normalizedVersion}.zip`,
    includeZip: true,
    includeUpdateXml: true,
    includeLatestJson: true,
  };
}

function buildReleaseProfiles(version) {
  return [buildReleaseProfile(version)];
}

function buildManifestForRelease(manifest) {
  const source = manifest && typeof manifest === "object" ? manifest : {};
  const nextManifest = JSON.parse(JSON.stringify(source));
  delete nextManifest.version_name;
  return nextManifest;
}

module.exports = {
  buildManifestForRelease,
  buildReleaseProfile,
  buildReleaseProfiles,
};
