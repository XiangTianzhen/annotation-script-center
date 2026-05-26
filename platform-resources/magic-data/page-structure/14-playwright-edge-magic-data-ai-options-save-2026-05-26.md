# Playwright-Edge 复核记录（Magic Data AI 面板保存）

- 日期：2026-05-26
- 范围：Magic Data ANNOTATOR 双助手（客家话 / 闽南语）Options AI 配置保存链路
- 目标：定位“保存后模型方案/识别策略被覆盖”的问题并给出复核清单
- 说明：
  - 已调用 `playwright-edge` MCP 进行页面可达性探测；
  - 访问 `https://work.magicdatatech.com/#/asrmarkCheck?formType=1&id=3373750` 被重定向到 `#/login`，当前会话无法直接完成登录后 options 实测；
  - 本记录保留代码修复点和人工复测矩阵，供扩展重载后逐项核对。

## 问题摘要

- 现象：
  - 保存后模型方案被回写为 `omni_single`
  - 保存后识别策略被回写为 `mandarin_to_dialect`
  - 客家话助手比较模型切换后刷新丢失
- 根因：
  - `storage` 中 legacy 字段 `recognition_convert` 的回填逻辑会无条件覆盖显式 `aiReviewModelMode/aiReviewRecognitionStrategy`
  - `options` 中 Magic Data 比较模型缺少专用联动更新，重渲染场景下易回退

## 修复点（代码级）

1. `extension/shared/storage.js`
   - `resolveMagicDataModeAndStrategy(...)` 新增显式字段优先判定：
     - 有显式 `aiReviewModelMode` 时，不再被 legacy `recognition_convert` 强制改为 `omni_single`
     - 有显式 `aiReviewRecognitionStrategy` 时，不再被 legacy 反推覆盖
   - legacy 仅在“无显式字段”时参与迁移推断

2. `extension/options/options.js`
   - 新增 `updateMagicDataCompareModelFields(scriptId, compareModel)`
   - 为 `magic-data-ai-compare-model-select` 绑定 change 事件
   - 移除 Magic Data 面板 `AI 质检模式` 字段展示与读取（legacy `reviewMode` 仅兼容保留）
   - 保持按当前 scriptId（客家话/闽南语）读取 defaults 与草稿配置

## MCP 探测结果（本轮）

- 已访问：
  - `chrome-extension://cdnkiookailoaheehghkolcgjpcidghe/options/options.html?script=magicDataAnnotatorAiReview`
  - `chrome-extension://cdnkiookailoaheehghkolcgjpcidghe/options/options.html?script=magicDataMinnanAssistant`
- 探测结果：
  - `#magic-data-review-mode` 未找到（符合“移除 AI 质检模式 UI”）
  - `#magic-data-ai-pipeline-mode-select` / `#magic-data-ai-recognition-strategy-select` / `#magic-data-ai-compare-model-select` 本轮探测未定位到
- 说明：
  - 当前 MCP 会话无法稳定复现“解锁 ASR 面板后的完整 DOM”（页面可能处于未展开状态或 UI 状态与本地运行实例不同）。
  - 因此完整“保存-刷新-回显”以人工矩阵复测为准。

## 保存复核矩阵（人工执行）

> 说明：以下矩阵为建议复测路径，执行时不得记录 token/cookie/authorization/完整签名 URL。

### 客家话助手

1. `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`
2. `two_stage + mandarin_to_dialect + qwen3.5-omni-flash + qwen3.5-plus`
3. `omni_single + direct_dialect + qwen3.5-omni-plus`
4. `omni_single + mandarin_to_dialect + qwen3.5-omni-flash`

每组均应满足：保存后刷新 options，模型方案/识别策略/模型值保持不变。

### 闽南语助手

1. `two_stage + direct_dialect`
2. `two_stage + mandarin_to_dialect`
3. `omni_single + mandarin_to_dialect`

每组均应满足：保存后刷新 options，值保持不变，且不被客家话默认值污染。

## 运行时请求复核点

- Hakka / Minnan 请求体需包含并保持与 options 一致：
  - `modelMode`
  - `recognitionStrategy`
  - `listenModel`
  - `compareModel`（兼容 `reviewModel`）
  - `singleModel`
  - `enable_thinking`（默认 `false`）

## 安全边界

- 本记录不包含真实用户数据、token、cookie、authorization、完整签名 URL。
- AI 建议只作辅助，不自动保存、不自动提交。
