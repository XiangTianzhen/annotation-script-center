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
  };

  assert.equal(constants.RELEASE_CHANNEL, "public");
  assert.equal(constants.canUseBetaFeatures(settings), false);
  assert.equal(constants.getBackendEndpointModeFromSettings(settings), "server");
  assert.equal(constants.isPlatformVisible("dataBakerCvpc", settings), false);
  assert.equal(
    constants.isScriptVisible("dataBakerCvpcLiuzhouAssistant", settings),
    false
  );
});

test("beta build keeps beta platform hidden until unlock", function () {
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
      dataBakerCvpc: {
        enabled: true,
        scripts: {
          liuzhouAssistant: {
            enabled: true,
          },
        },
      },
      bytedanceAidp: {
        enabled: true,
        scripts: {
          suzhouHelper: {
            enabled: true,
          },
        },
      },
      haitianUtrans: {
        enabled: true,
        scripts: {
          audioDownloadHelper: {
            enabled: true,
          },
        },
      },
    },
  };

  assert.equal(constants.canUseBetaFeatures(lockedSettings), false);
  assert.equal(constants.isPlatformVisible("dataBakerCvpc", lockedSettings), false);
  assert.equal(
    constants.isScriptVisible("dataBakerCvpcLiuzhouAssistant", lockedSettings),
    false
  );
  assert.equal(constants.isPlatformVisible("bytedanceAidp", lockedSettings), false);
  assert.equal(
    constants.isScriptVisible("bytedanceAidpSuzhouHelper", lockedSettings),
    false
  );

  assert.equal(constants.canUseBetaFeatures(unlockedSettings), true);
  assert.equal(constants.isPlatformVisible("dataBakerCvpc", unlockedSettings), true);
  assert.equal(
    constants.isScriptVisible("dataBakerCvpcLiuzhouAssistant", unlockedSettings),
    true
  );
  assert.equal(constants.isPlatformVisible("bytedanceAidp", unlockedSettings), true);
  assert.equal(
    constants.isScriptVisible("bytedanceAidpSuzhouHelper", unlockedSettings),
    true
  );
  assert.equal(constants.isPlatformVisible("haitianUtrans", unlockedSettings), true);
  assert.equal(
    constants.isScriptVisible("haitianUtransAudioDownloadHelper", unlockedSettings),
    true
  );
  assert.equal(constants.getBackendEndpointModeFromSettings(unlockedSettings), "beta");
  assert.equal(
    constants.buildBackendUrl("/api/example", unlockedSettings),
    "https://beta.example.test/api/example"
  );
  assert.equal(
    constants.buildDownloadUrl("/annotation-script-center-crx-latest.json", unlockedSettings),
    "https://beta.example.test/downloads/annotation-script-center-crx-latest.json"
  );
});

test("beta build hides disabled beta script from effective runtime access", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaFeaturesVisibleByDefault: false,
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
      dataBakerCvpc: {
        enabled: false,
        scripts: {
          liuzhouAssistant: {
            enabled: false,
          },
        },
      },
      bytedanceAidp: {
        enabled: false,
        scripts: {
          suzhouHelper: {
            enabled: false,
          },
        },
      },
      haitianUtrans: {
        enabled: false,
        scripts: {
          audioDownloadHelper: {
            enabled: false,
          },
        },
      },
    },
  };

  assert.equal(constants.isPlatformVisible("dataBakerCvpc", settings), true);
  assert.equal(constants.isScriptVisible("dataBakerCvpcLiuzhouAssistant", settings), true);
  assert.equal(
    constants.isScriptRuntimeAccessible("dataBakerCvpcLiuzhouAssistant", settings),
    false
  );
  assert.equal(constants.isPlatformVisible("bytedanceAidp", settings), true);
  assert.equal(constants.isScriptVisible("bytedanceAidpSuzhouHelper", settings), true);
  assert.equal(
    constants.isScriptRuntimeAccessible("bytedanceAidpSuzhouHelper", settings),
    false
  );
  assert.equal(constants.isPlatformVisible("haitianUtrans", settings), true);
  assert.equal(
    constants.isScriptVisible("haitianUtransAudioDownloadHelper", settings),
    true
  );
  assert.equal(
    constants.isScriptRuntimeAccessible("haitianUtransAudioDownloadHelper", settings),
    false
  );
});

test("backend base urls prefer new settings.meta.backendBaseUrls and keep beta legacy fallback", function () {
  const constants = loadConstantsWithBuildMeta({
    releaseChannel: "beta",
    betaFeaturesVisibleByDefault: true,
    betaUnlockPasswordSha256: "abc",
    betaBackendBaseUrl: "https://beta.build-meta.test",
  });
  const settings = {
    meta: {
      backendEndpointMode: "local",
      backendBaseUrls: {
        server: "https://server.custom.test/",
        local: "http://127.0.0.1:9333/",
        beta: "",
      },
      betaBackendBaseUrl: "https://beta.legacy.test/",
      betaUnlocked: true,
    },
  };

  assert.deepEqual(constants.getBackendBaseUrlsFromSettings(settings), {
    server: "https://server.custom.test",
    local: "http://127.0.0.1:9333",
    beta: "https://beta.legacy.test",
  });
  assert.equal(
    constants.buildBackendUrl("/api/example", settings),
    "http://127.0.0.1:9333/api/example"
  );
});
