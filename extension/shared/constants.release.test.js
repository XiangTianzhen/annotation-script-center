"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

function loadConstantsWithBuildMeta(buildMeta) {
  const modulePath = path.resolve(__dirname, "constants.js");
  delete require.cache[modulePath];
  globalThis.ASREdgeBuildMeta = buildMeta;
  const constants = require(modulePath);
  delete globalThis.ASREdgeBuildMeta;
  return constants;
}

test("public build never enables beta visibility or beta backend mode", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "public",
    betaFeaturesVisibleByDefault: true,
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const settings = {
    meta: {
      betaUnlocked: true,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
    platforms: {
      lightwheel: {
        enabled: true,
        scripts: {
          viewPanel: {
            enabled: true,
          },
        },
      },
    },
  };

  assert.equal(constants.RELEASE_CHANNEL, "public");
  assert.equal(constants.canUseBetaFeatures(settings), false);
  assert.equal(constants.getBackendEndpointModeFromSettings(settings), "server");
  assert.equal(constants.isPlatformVisible("lightwheel", settings), false);
  assert.equal(constants.isScriptVisible("lightwheelViewPanel", settings), false);
});

test("beta build exposes beta platform by default for test builds", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaFeaturesVisibleByDefault: true,
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const settings = {
    meta: {
      betaUnlocked: false,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
    platforms: {
      lightwheel: {
        enabled: true,
        scripts: {
          viewPanel: {
            enabled: true,
          },
        },
      },
    },
  };

  assert.equal(constants.canUseBetaFeatures(settings), true);
  assert.equal(constants.isPlatformVisible("lightwheel", settings), true);
  assert.equal(constants.isScriptVisible("lightwheelViewPanel", settings), true);
  assert.equal(constants.getBackendEndpointModeFromSettings(settings), "beta");
  assert.equal(
    constants.buildBackendUrl("/api/example", settings),
    "https://beta.example.test/api/example"
  );
});

test("beta build still supports hidden unlock fallback when default visibility is off", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaFeaturesVisibleByDefault: false,
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const lockedSettings = {
    meta: {
      betaUnlocked: false,
      backendEndpointMode: "server",
      betaBackendBaseUrl: "https://beta.example.test",
    },
  };
  const unlockedSettings = {
    meta: {
      betaUnlocked: true,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
    platforms: {
      lightwheel: {
        enabled: true,
        scripts: {
          viewPanel: {
            enabled: true,
          },
        },
      },
    },
  };

  assert.equal(constants.canUseBetaFeatures(lockedSettings), false);
  assert.equal(constants.isPlatformVisible("lightwheel", lockedSettings), false);
  assert.equal(constants.canUseBetaFeatures(unlockedSettings), true);
  assert.equal(constants.isPlatformVisible("lightwheel", unlockedSettings), true);
});

test("beta build hides disabled beta script from effective runtime access", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaFeaturesVisibleByDefault: true,
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.example.test",
  });
  const settings = {
    meta: {
      betaUnlocked: true,
      backendEndpointMode: "beta",
      betaBackendBaseUrl: "https://beta.example.test",
    },
    platforms: {
      lightwheel: {
        enabled: false,
        scripts: {
          viewPanel: {
            enabled: false,
          },
        },
      },
    },
  };

  assert.equal(constants.isPlatformVisible("lightwheel", settings), true);
  assert.equal(constants.isScriptVisible("lightwheelViewPanel", settings), true);
  assert.equal(constants.isScriptRuntimeAccessible("lightwheelViewPanel", settings), false);
});
