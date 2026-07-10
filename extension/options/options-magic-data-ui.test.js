"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("Magic Data options source recognizes Hangzhou helper as a third script", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(
    script,
    /const magicDataHangzhouScriptId =\s*constants\.MAGIC_DATA_HANGZHOU_SCRIPT_ID \|\| "magicDataHangzhouAssistant";/
  );
  assert.match(script, /scriptId === magicDataHangzhouScriptId/);
  assert.match(script, /settings\?\.platforms\?\.magicData\?\.scripts\?\.hangzhouHelper/);
  assert.match(script, /settings\?\.scriptCenter\?\.projects\?\.magicDataHangzhouAssistant/);
  assert.match(script, /magicDataHangzhouAssistant:\s*"\/api\/magic-data\/hangzhou-helper\/ai\/defaults"/);
  assert.match(script, /const magicDataScriptDefinitions = \[/);
  assert.match(
    script,
    /scriptId: magicDataHangzhouScriptId,\s*scriptKey: "hangzhouHelper",\s*legacyKey: "magicDataHangzhouAssistant"/
  );
  assert.match(
    script,
    /platformScripts\[definition\.scriptKey\] = Object\.assign\(\s*\{ id: definition\.scriptId \},\s*payloadConfig\s*\)/
  );
  assert.match(script, /scriptCenterProjects\[definition\.legacyKey\] = payloadConfig/);
  assert.match(
    script,
    /candidate === magicDataAnnotatorScriptId\s*\|\|\s*candidate === magicDataMinnanScriptId\s*\|\|\s*candidate === magicDataHangzhouScriptId/
  );
});

test("Magic Data Hangzhou recognition strategy help distinguishes audio-first and conversion modes", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");

  assert.match(
    script,
    /直接识别：以音频实际读音为准，词表只辅助杭州话转普通话，不从普通话反推杭州话/
  );
  assert.match(
    script,
    /识别转换：会先识别普通话再按词表反推杭州话，结果可能不同于实际读音/
  );
});
