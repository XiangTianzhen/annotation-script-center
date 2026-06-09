"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadProjectAssets } = require("./project-assets");

test("loadProjectAssets allows optional json assets to be absent", function () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-project-assets-"));
  const assets = loadProjectAssets(
    {
      assets: {
        lexiconJson: {
          jsonPath: "missing-lexicon.json",
          optional: true,
        },
      },
    },
    {
      baseDir: tempDir,
    }
  );

  assert.equal(assets.lexiconJson, null);
});
