"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("ByteDance AIDP options source exposes the suzhou helper base panel", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");
  const combinedSource = html + "\n" + script;

  assert.match(html, /id="detail-bytedance-aidp-suzhou-panel"/);
  assert.match(html, /id="bytedance-aidp-platform-ai-enabled"/);
  assert.match(html, /id="bytedance-aidp-segment-context-padding-seconds"/);
  assert.match(html, /id="bytedance-aidp-segment-silence-threshold-dbfs"/);
  assert.match(
    html,
    /id="bytedance-aidp-merge-contiguous-suggested-segments-enabled"/
  );
  assert.match(html, /id="bytedance-aidp-segment-preview-auto-apply-enabled"/);
  assert.match(html, /id="bytedance-aidp-default-playback-rate"/);
  assert.match(html, /id="bytedance-aidp-fixed-wave-zoom"/);
  assert.match(html, /id="detail-bytedance-aidp-shortcuts-panel"/);
  assert.match(html, /id="bytedance-aidp-shortcut-grid"/);
  assert.match(html, /id="bytedance-aidp-recording-status"/);
  assert.match(html, /<select\s+id="bytedance-aidp-default-playback-rate"/);
  assert.match(html, /<option value="1">1\.00倍速<\/option>/);
  assert.match(html, /<option value="2">2<\/option>/);
  assert.doesNotMatch(
    html,
    /<input[^>]*id="bytedance-aidp-default-playback-rate"[^>]*type="number"/
  );
  assert.doesNotMatch(
    html,
    /<input[^>]*id="bytedance-aidp-fixed-wave-zoom"[^>]*type="number"/
  );
  assert.match(html, /id="save-bytedance-aidp-settings"/);
  assert.match(html, /隐藏平台AI功能/);
  assert.match(html, /前后静音时长/);
  assert.match(html, /静音阈值/);
  assert.match(html, /连续相接自动合并/);
  assert.match(html, /生成后自动应用当前建议/);
  assert.match(html, /默认播放倍数/);
  assert.match(html, /固定缩放倍数/);
  assert.match(combinedSource, /播放\/暂停切换/);
  assert.match(combinedSource, /区间播放/);
  assert.match(combinedSource, /回到首帧/);
  assert.match(combinedSource, /删除当前选区/);
  assert.match(combinedSource, /清空画段/);
  assert.match(combinedSource, /生成分段建议/);
  assert.match(combinedSource, /应用分段建议/);
  assert.match(html, /默认勾选后隐藏平台原生 AI 洞察面板和猫形浮动入口/);
  assert.match(html, /勾选后在 `mark-v3` 详情页隐藏平台 AI 原生板块/);
  assert.match(html, /只在应用分段建议写回时默认带上“目标方言”/);
  assert.match(html, /工具栏里的“填充语言种类”按钮/);
  assert.match(html, /0s ~ 0\.5s/);
  assert.match(html, /-31 dBFS/);
  assert.match(script, /function getBytedanceAidpSuzhouConfig\(/);
  assert.match(script, /function applyBytedanceAidpForm\(/);
  assert.match(script, /async function saveBytedanceAidpSettings\(/);
  assert.match(script, /function ensureBytedanceAidpShortcutDraft\(/);
  assert.match(script, /function renderBytedanceAidpShortcutGrid\(/);
  assert.match(script, /platformAiEnabled/);
  assert.match(script, /segmentContextPaddingMs/);
  assert.match(script, /segmentSilenceThresholdDbfs/);
  assert.match(script, /mergeContiguousSuggestedSegmentsEnabled/);
  assert.match(script, /segmentPreviewAutoApplyEnabled/);
  assert.match(script, /defaultPlaybackRate/);
  assert.match(script, /fixedWaveZoom/);
  assert.match(script, /detail-bytedance-aidp-shortcuts-panel/);
  assert.match(script, /bytedance-aidp-shortcut-grid/);
  assert.match(
    script,
    /renderFixedModelOptions\(\s*"bytedance-aidp-default-playback-rate"/
  );
  assert.match(
    script,
    /renderFixedModelOptions\(\s*"bytedance-aidp-fixed-wave-zoom"/
  );
  assert.match(script, /platformAiNode\.checked = config\.platformAiEnabled === false;/);
  assert.match(
    script,
    /mergeContiguousSegmentsNode\.checked =\s*config\.mergeContiguousSuggestedSegmentsEnabled !== false;/
  );
  assert.match(
    script,
    /platformAiEnabled:\s*!getElement\("bytedance-aidp-platform-ai-enabled"\)\.checked/
  );
  assert.match(script, /segmentSilenceThresholdDbfs:\s*segmentSilenceThresholdDbfs/);
  assert.match(
    script,
    /mergeContiguousSuggestedSegmentsEnabled:\s*mergeContiguousSuggestedSegmentsEnabled/
  );
  assert.match(
    script,
    /segmentPreviewAutoApplyEnabled:\s*segmentPreviewAutoApplyEnabled/
  );
  assert.match(script, /detail-bytedance-aidp-suzhou-panel/);
  assert.doesNotMatch(html, /当前不新增快捷键/);
  assert.doesNotMatch(html, /默认只有“播放\/暂停切换 = Space”/);
  assert.doesNotMatch(html, /脚本新生成或新出现且仍为空的画段/);
});
