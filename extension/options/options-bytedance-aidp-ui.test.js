"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("ByteDance AIDP options source exposes the suzhou helper base panel", function () {
  const script = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const html = fs.readFileSync(path.resolve(__dirname, "options.html"), "utf8");
  const combinedSource = html + "\n" + script;
  const aidpPanelStart = html.indexOf('id="detail-bytedance-aidp-suzhou-panel"');
  const aidpPanelEnd = html.indexOf('<section id="detail-aishell-tech-minnan-helper-panel"', aidpPanelStart);
  const aidpPanelHtml =
    aidpPanelStart >= 0 && aidpPanelEnd > aidpPanelStart
      ? html.slice(aidpPanelStart, aidpPanelEnd)
      : html;

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
  assert.match(html, /普通话听写稿 AI、批量识别、分段建议写回/);
  assert.match(html, /单段识别直填输入框/);
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
  assert.match(html, /id="detail-toggle-button"/);
  assert.match(html, />\s*保存设置\s*</);
  assert.doesNotMatch(html, /保存 ByteDance AIDP 设置/);
  assert.match(html, /隐藏平台AI功能/);
  assert.match(html, /前后静音时长/);
  assert.match(html, /静音阈值/);
  assert.match(html, /连续相接自动合并/);
  assert.match(html, /画段后自动应用建议/);
  assert.match(html, /默认播放倍数/);
  assert.match(html, /固定缩放倍数/);
  assert.match(
    aidpPanelHtml,
    /<div class="detail-grid two">[\s\S]*id="bytedance-aidp-platform-ai-enabled"[\s\S]*id="bytedance-aidp-segment-preview-auto-apply-enabled"[\s\S]*<\/div>/
  );
  assert.doesNotMatch(aidpPanelHtml, /当前隐藏目标/);
  assert.doesNotMatch(aidpPanelHtml, /语言种类补齐/);
  assert.doesNotMatch(
    aidpPanelHtml,
    /<span\s+class="inline-help-dot"[^>]*title=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>隐藏平台AI功能<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>画段后自动应用建议<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>前后静音时长<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>静音阈值<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>默认播放倍数<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>固定缩放倍数<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.match(
    aidpPanelHtml,
    /<strong class="field-title-row">\s*<span>连续相接自动合并<\/span>\s*<span\s+class="inline-help-dot"[^>]*data-help-text=/
  );
  assert.doesNotMatch(
    aidpPanelHtml,
    /<label class="field-card">\s*<strong>画段后自动应用建议<\/strong>\s*<span>默认开启/
  );
  assert.doesNotMatch(
    aidpPanelHtml,
    /<label class="field-card">\s*<strong>前后静音时长<\/strong>\s*<span>用于画段建议的前后静音补偿/
  );
  assert.doesNotMatch(
    aidpPanelHtml,
    /<label class="field-card">\s*<strong>静音阈值<\/strong>\s*<span>仅按 dBFS 数字配置分段静音阈值/
  );
  assert.match(combinedSource, /播放\/暂停切换/);
  assert.match(combinedSource, /区间播放/);
  assert.match(combinedSource, /回到首帧/);
  assert.match(combinedSource, /删除当前选区/);
  assert.match(combinedSource, /清空画段/);
  assert.match(combinedSource, /生成分段建议/);
  assert.match(combinedSource, /应用分段建议/);
  assert.match(html, /0s ~ 0\.5s/);
  assert.match(html, /无人声留白都不能超过 `500ms`/);
  assert.match(html, /-31 dBFS/);
  assert.doesNotMatch(aidpPanelHtml, /写入契约状态/);
  assert.doesNotMatch(aidpPanelHtml, /当前边界/);
  assert.doesNotMatch(
    aidpPanelHtml,
    /普通话听写识别的开关、自动填入、超时、听音模型和普通话听写收口模型已移动到右侧共享 `AI 设置` 面板/
  );
  assert.doesNotMatch(aidpPanelHtml, /这里继续只保留平台 AI 显隐、画段后自动应用建议、波形控件和当前边界说明/);
  assert.doesNotMatch(aidpPanelHtml, /工具栏里的“填充语言种类”按钮/);
  assert.match(script, /function getBytedanceAidpSuzhouConfig\(/);
  assert.match(script, /function applyBytedanceAidpForm\(/);
  assert.match(script, /async function saveBytedanceAidpSettings\(/);
  assert.match(script, /toggleButton\.textContent = enabled \? "关闭脚本" : "启用脚本"/);
  assert.match(script, /setStatus\("bytedance-aidp-status", "正在保存设置\.\.\."\)/);
  assert.match(script, /function showTopToast\(/);
  assert.match(script, /top-toast/);
  assert.match(script, /设置已保存；已打开的 mark-v3 页面如未同步，请刷新业务页。/);
  assert.match(script, /function renderBytedanceAidpSuzhouAiSettingsSection\(/);
  assert.match(script, /function getBytedanceAidpSuzhouStageDefaults\(/);
  assert.match(script, /function refreshBytedanceAidpSuzhouStageParamHelpText\(/);
  assert.match(script, /function ensureInlineHelpDots\(/);
  assert.match(script, /function setInlineHelpText\(/);
  assert.match(script, /当前为空，将使用后端默认值：/);
  assert.match(script, /data-help-text/);
  assert.match(script, /data-open/);
  assert.match(script, /inline-help-popover/);
  assert.match(script, /function getBytedanceAidpSuzhouSettingsDraftConfig\(/);
  assert.match(script, /function ensureBytedanceAidpShortcutDraft\(/);
  assert.match(script, /function renderBytedanceAidpShortcutGrid\(/);
  assert.match(script, /platformAiEnabled/);
  assert.match(script, /aiRecommendEnabled/);
  assert.match(script, /aiRecommendAutoFillEnabled/);
  assert.match(script, /aiRecommendRequestTimeoutMs/);
  assert.match(script, /aiRecommendListenModel/);
  assert.match(script, /aiRecommendRefineModel/);
  assert.match(script, /segmentContextPaddingMs/);
  assert.match(script, /segmentSilenceThresholdDbfs/);
  assert.match(script, /mergeContiguousSuggestedSegmentsEnabled/);
  assert.match(script, /segmentPreviewAutoApplyEnabled/);
  assert.match(script, /defaultPlaybackRate/);
  assert.match(script, /fixedWaveZoom/);
  assert.match(script, /bytedance-aidp-ai-recommend-enabled/);
  assert.match(script, /bytedance-aidp-ai-recommend-auto-fill-enabled/);
  assert.match(script, /bytedance-aidp-ai-timeout/);
  assert.match(script, /bytedance-aidp-ai-listen-model-select/);
  assert.match(script, /bytedance-aidp-ai-refine-model-select/);
  assert.match(script, /单段识别成功后直接填入对应输入框，不主动走平台暂存请求/);
  assert.match(script, /普通话不截取、未知实体用 `##名称##`、抖音音效和唱歌不截取/);
  assert.match(script, /限制为 `，。？！`、未知实体用 `##名称##`、阿拉伯数字转汉字数字/);
  assert.doesNotMatch(script, /bytedance-aidp-ai-listen-prompt" maxlength="8000"><\/textarea><span class="asr-ai-help">留空或恢复默认时，使用后端默认 Prompt/);
  assert.match(script, /普通话听写收口/);
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
  assert.match(
    script,
    /aiRecommendAutoFillEnabled:\s*aiRecommendAutoFillEnabled/
  );
  assert.match(
    script,
    /aiRecommendEnabled:\s*aiRecommendEnabled/
  );
  assert.match(
    script,
    /aiRecommendRequestTimeoutMs:\s*timeoutMs/
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
  assert.doesNotMatch(html, /当前只提供“隐藏平台AI功能”基础开关/);
});
