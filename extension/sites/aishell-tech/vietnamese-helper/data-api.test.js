const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const dataApiModulePath = path.resolve(__dirname, "data-api.js");

function loadApi() {
  delete require.cache[dataApiModulePath];
  delete globalThis.__ASREdgeAishellTechVietnameseDataApiInstalled;
  delete globalThis.__ASREdgeAishellTechVietnameseDataApi;
  const api = require(dataApiModulePath);
  return {
    api,
    cleanup: function () {
      delete require.cache[dataApiModulePath];
      delete globalThis.__ASREdgeAishellTechVietnameseDataApiInstalled;
      delete globalThis.__ASREdgeAishellTechVietnameseDataApi;
    },
  };
}

test("Aishell Vietnamese text normalization keeps words and fixes punctuation spacing", function () {
  const harness = loadApi();

  try {
    const normalize = harness.api.normalizeVietnameseTranscriptionText;
    assert.equal(normalize("  Tiếng   từ máy chiếu  . "), "Tiếng từ máy chiếu.");
    assert.equal(normalize("Xin chào ,tôi là AI"), "Xin chào, tôi là AI.");
    assert.equal(normalize(" ( xin  chào ) "), "(xin chào).");
  } finally {
    harness.cleanup();
  }
});
