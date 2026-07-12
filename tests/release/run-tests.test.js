"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const runnerPath = path.resolve(__dirname, "..", "run-tests.cjs");
const {
  SUITE_ORDER,
  buildSuiteCommand,
  collectTestFiles,
  parseRequestedSuites,
  prepareSpawnCommand,
  validateSuiteFiles,
} = require(runnerPath);

test("runner exposes the five suites in execution order", () => {
  assert.deepEqual(SUITE_ORDER, [
    "frontend",
    "runtime",
    "extension",
    "backend",
    "release",
  ]);
  assert.deepEqual(parseRequestedSuites([]), SUITE_ORDER);
  assert.deepEqual(parseRequestedSuites(["all"]), SUITE_ORDER);
  assert.deepEqual(parseRequestedSuites(["backend"]), ["backend"]);
});

test("unknown suite prints usage and exits with status 2", () => {
  const result = spawnSync(process.execPath, [runnerPath, "unknown-suite"], {
    encoding: "utf8",
    shell: false,
  });

  assert.equal(result.status, 2);
  assert.match(`${result.stdout}\n${result.stderr}`, /Usage:/);
  assert.match(`${result.stdout}\n${result.stderr}`, /unknown-suite/);
});

test("collectTestFiles recursively returns a deterministic sorted file list", (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "asc-run-tests-"));
  t.after(() => fs.rmSync(tempRoot, { force: true, recursive: true }));

  fs.mkdirSync(path.join(tempRoot, "nested"), { recursive: true });
  fs.writeFileSync(path.join(tempRoot, "nested", "z.test.js"), "");
  fs.writeFileSync(path.join(tempRoot, "a.test.js"), "");
  fs.writeFileSync(path.join(tempRoot, "nested", "b.test.js"), "");
  fs.writeFileSync(path.join(tempRoot, "nested", "ignored.txt"), "");

  const relativeFiles = collectTestFiles(tempRoot, [".test.js"])
    .map((filePath) => path.relative(tempRoot, filePath).replaceAll("\\", "/"));

  assert.deepEqual(relativeFiles, [
    "a.test.js",
    "nested/b.test.js",
    "nested/z.test.js",
  ]);
});

test("every suite rejects an empty file list before spawning a test process", () => {
  for (const suite of SUITE_ORDER) {
    assert.throws(
      () => validateSuiteFiles(suite, []),
      new RegExp(`${suite}.*no test files`, "i")
    );
  }
});

test("frontend suite accepts a fourteenth test file", () => {
  const files = Array.from(
    { length: 14 },
    (_, index) => `frontend-${index + 1}.test.js`
  );

  assert.deepEqual(validateSuiteFiles("frontend", files), files);
});

test("Windows npm.cmd execution uses an explicit command processor with shell disabled", () => {
  const npmCommand = buildSuiteCommand("frontend", [], "win32");
  const prepared = prepareSpawnCommand(npmCommand, {
    platform: "win32",
    comSpec: "C:\\Windows\\System32\\cmd.exe",
  });

  assert.equal(npmCommand.command, "npm.cmd");
  assert.deepEqual(prepared, {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: [
      "/d",
      "/s",
      "/c",
      `npm.cmd --prefix ${path.join("frontend", "options-app")} test`,
    ],
  });
});

test("Vitest keeps its cache inside the ignored Options node_modules directory", async () => {
  const configPath = resolveRepo("frontend", "options-app", "vitest.config.js");
  const { default: config } = await import(pathToFileURL(configPath).href);

  assert.equal(
    config.cacheDir,
    resolveRepo("frontend", "options-app", "node_modules", ".vite")
  );
});
