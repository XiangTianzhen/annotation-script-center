"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadProjectAssets } = require("../../../backend/ai-framework/loaders/project-assets");
const { validateBusinessLexiconDocument } = require("../../../backend/business-lexicon");
const adapter = require("./adapter");
const { toJinhuaPronunciationDisplay } = require("./pronunciation-display");

const ASSET_DIR = path.join(__dirname, "assets");
const DIFFERENCE_CSV_HEADER = ["分类", "普通话", "方言正字【标注参考这列】", "发音"];
const EXPECTED_DIFFERENCE_ENTRY_COUNT = 991;

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && quoted && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(value);
      value = "";
      continue;
    }
    value += char;
  }

  values.push(value);
  return values;
}

function parseCsv(text) {
  return String(text || "")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
}

function getDialectText(entry) {
  return String(entry.display || entry.normalized || "").trim();
}

function assertDisplayPronunciation(value, message) {
  assert.match(value, /^[A-Za-z.\-?,;:\/\s]+$/, message);
  assert.doesNotMatch(value, /[0-9ȵɕəɛɡɤɿʑʔʦʨŋǾɑ̃̄，。？…]/, message);
}

test("ByteDance AIDP Jinhua adapter exposes difference lexicon and pronunciation assets", function () {
  assert.equal(adapter.assets.lexiconJson.jsonPath, "assets/jinhua-lexicon.json");
  assert.equal(
    adapter.assets.lexiconReferenceCsv.path,
    "assets/jinhua-pronunciation-reference.csv"
  );

  const assets = loadProjectAssets(adapter);
  const lexicon = validateBusinessLexiconDocument(assets.lexiconJson);
  const pronunciationCsv = String(assets.lexiconReferenceCsv || "");
  const csvRows = parseCsv(pronunciationCsv);

  assert.equal(lexicon.language, "金华话");
  assert.equal(lexicon.mode, "rule_lexicon");
  assert.equal(lexicon.entries.length, EXPECTED_DIFFERENCE_ENTRY_COUNT);
  assert.deepEqual(csvRows[0], DIFFERENCE_CSV_HEADER);
  assert.equal(csvRows.length, EXPECTED_DIFFERENCE_ENTRY_COUNT + 1);

  for (const entry of lexicon.entries) {
    assert.notEqual(
      getDialectText(entry),
      entry.mandarin,
      `${entry.id} should keep only dialect differences`
    );
  }
  for (const row of csvRows.slice(1)) {
    assert.equal(row.length, DIFFERENCE_CSV_HEADER.length);
    assert.notEqual(row[2].trim(), row[1].trim(), `${row[2]} should differ from ${row[1]}`);
    assert.ok(row[3].trim(), `${row[2]} should keep Jinhua pronunciation`);
    assertDisplayPronunciation(row[3], `${row[2]} should expose display pronunciation`);
  }

  const rowsByDialect = new Map(csvRows.slice(1).map((row) => [row[2], row]));
  assert.equal(rowsByDialect.get("日头")?.[3], toJinhuaPronunciationDisplay("ȵiəʔ21diu14"));
  assert.equal(rowsByDialect.get("星")?.[3], toJinhuaPronunciationDisplay("ɕiŋ334"));
  assert.equal(rowsByDialect.get("天雷")?.[3], toJinhuaPronunciationDisplay("thia33lɛ55"));
});

test("ByteDance AIDP Jinhua exposes an xlsx difference reference table", function () {
  const xlsxPath = path.join(ASSET_DIR, "jinhua-pronunciation-reference.xlsx");
  assert.equal(fs.existsSync(xlsxPath), true);
  assert.ok(fs.statSync(xlsxPath).size > 0);
});

test("ByteDance AIDP Jinhua lexicon assets only expose meaning conversion fields", function () {
  const assets = loadProjectAssets(adapter);
  const lexicon = validateBusinessLexiconDocument(assets.lexiconJson);
  const pronunciationCsv = String(assets.lexiconReferenceCsv || "");
  const forbiddenAttributeKeys = [
    "audio",
    "video",
    "iid",
    "oid",
    "sourceType",
    "sourceSection",
    "sourceResourceIndex",
    "sourceItemIndex",
    "sourceRecordIndex",
  ];

  for (const entry of lexicon.entries) {
    for (const key of forbiddenAttributeKeys) {
      assert.equal(
        Object.hasOwn(entry.attributes || {}, key),
        false,
        `${entry.id} should not expose ${key}`
      );
    }
  }

  const csvHeader = pronunciationCsv.split(/\r?\n/)[0] || "";
  assert.doesNotMatch(csvHeader, /音频路径|audio|video|iid|oid/i);
  assert.doesNotMatch(pronunciationCsv, /浙江\/金华需交文件电子版|\.wav/i);
});
