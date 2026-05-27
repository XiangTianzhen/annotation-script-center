"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const {
  listHistoryCsvFiles,
  readLatestExportSnapshot,
} = require("./fetch");

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "asc-databaker-fetch-"));
}

test("DataBaker fetch script reads latest export snapshot paths and existence flags", function () {
  const tempDir = createTempDir();
  fs.writeFileSync(path.join(tempDir, "latest.csv"), "a,b\n1,2\n", "utf8");
  fs.writeFileSync(path.join(tempDir, "latest.json"), "{\"ok\":true}", "utf8");

  const snapshot = readLatestExportSnapshot({
    dataDir: tempDir,
  });

  assert.equal(snapshot.paths.latestCsvPath, path.join(tempDir, "latest.csv"));
  assert.equal(snapshot.exists.latestCsv, true);
  assert.equal(snapshot.exists.latestRawJson, false);
});

test("DataBaker fetch script lists only history csv files and sorts them by modifiedAt desc", function () {
  const tempDir = createTempDir();
  const historyDir = path.join(tempDir, "history");
  fs.mkdirSync(historyDir, { recursive: true });

  const firstCsv = path.join(historyDir, "20260528-first.csv");
  const secondCsv = path.join(historyDir, "20260528-second.csv");
  const ignoredRaw = path.join(historyDir, "20260528-second.raw.json");

  fs.writeFileSync(firstCsv, "a,b\n1,2\n", "utf8");
  fs.writeFileSync(secondCsv, "a,b\n3,4\n", "utf8");
  fs.writeFileSync(ignoredRaw, "{}", "utf8");

  fs.utimesSync(firstCsv, new Date("2026-05-28T09:00:00.000Z"), new Date("2026-05-28T09:00:00.000Z"));
  fs.utimesSync(secondCsv, new Date("2026-05-28T10:00:00.000Z"), new Date("2026-05-28T10:00:00.000Z"));

  const items = listHistoryCsvFiles({
    dataDir: tempDir,
  });

  assert.deepEqual(
    items.map(function (item) {
      return item.name;
    }),
    ["20260528-second.csv", "20260528-first.csv"]
  );
});
