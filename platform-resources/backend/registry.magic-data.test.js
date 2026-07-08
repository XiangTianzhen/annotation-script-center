"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("backend registry imports and registers Magic Data Hangzhou routes", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "registry.js"), "utf8");

  assert.match(
    script,
    /registerRoutes: registerMagicDataHangzhouRoutes/
  );
  assert.match(
    script,
    /\.\.\/magic-data\/hangzhou-helper\/backend/
  );
  assert.match(
    script,
    /registerMagicDataHangzhouRoutes\(\s*router,\s*config\.magicDataHangzhouHelper \|\| \{\}\s*\)/
  );
});
