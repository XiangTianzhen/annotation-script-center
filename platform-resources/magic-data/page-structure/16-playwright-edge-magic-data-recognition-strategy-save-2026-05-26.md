# Playwright-Edge 复测记录（Magic Data 识别策略保存回滚热修）

## 时间

- 2026-05-26

## 背景

- 问题：在 options 中把识别策略切为 `direct_dialect` 后，保存会回滚为 `mandarin_to_dialect`（legacy `recognition_convert`）。
- 目标：只要用户明确保存 `aiReviewRecognitionStrategy=direct_dialect`，不允许 legacy 字段覆盖。

## 本轮复核方式

- 按用户要求，本轮不做真实业务页浏览器调试。
- 使用代码链路 + storage 字段优先级复核：
  - `extension/options/options.js`
  - `extension/shared/storage.js`

## 核心修复点

1. 新字段优先级提升（options）
- 新增/使用 `resolveMagicDataRecognitionStrategyFromSource(...)`：
  - 优先 `aiReviewRecognitionStrategy`
  - 次优 `recognitionStrategy`
  - 再 fallback
  - 最后才使用 legacy `aiReviewRecognitionMode/recognitionMode/pipelineMode`
- 避免 `direct_dialect` 被 `recognition_convert` 抢回。

2. legacy 字段显式覆盖（options 保存）
- 保存时同步写入：
  - `aiReviewRecognitionStrategy`
  - `aiReviewRecognitionMode`
  - `recognitionStrategy`
  - `recognitionMode`
  - `pipelineMode`
- `direct_dialect` 时 legacy 强制写 `two_stage`（或对应 modelMode），不保留旧 `recognition_convert` 残留。

3. storage 显式策略判定补全
- `hasExplicitStrategy` 增加兼容字段判断：
  - `sourceCurrent.recognitionStrategy`
  - `sourceLegacy.recognitionStrategy`
- 避免 `aiReviewRecognitionStrategy` 缺失但兼容字段已明确时，仍被 legacy 回写。

4. 平台路径与 legacy 路径一致性
- normalize 后统一写回：
  - `platforms.magicData.scripts.hakkaHelper/minnanHelper`
  - `scriptCenter.projects.magicDataAnnotator/magicDataMinnanAssistant`
- 两路径的策略字段保持一致，避免 UI 二次回显冲突。

## 预期保存矩阵（人工复测用）

### Hakka

1. `two_stage + direct_dialect` 保存后刷新仍为 `direct_dialect`
2. `two_stage + mandarin_to_dialect` 保存后刷新仍为 `mandarin_to_dialect`
3. 从 `mandarin_to_dialect` 切回 `direct_dialect` 后，刷新仍为 `direct_dialect`

### Minnan

1. `two_stage + direct_dialect` 保存后刷新不回滚
2. `two_stage + mandarin_to_dialect` 保存后刷新不丢失
3. 从 `mandarin_to_dialect` 切回 `direct_dialect` 后保持

## storage 关键字段检查口径（脱敏）

```js
settings.platforms.magicData.scripts.hakkaHelper.aiReviewRecognitionStrategy
settings.platforms.magicData.scripts.hakkaHelper.aiReviewRecognitionMode
settings.platforms.magicData.scripts.hakkaHelper.recognitionStrategy
settings.platforms.magicData.scripts.hakkaHelper.recognitionMode
settings.platforms.magicData.scripts.hakkaHelper.pipelineMode

settings.scriptCenter.projects.magicDataAnnotator.aiReviewRecognitionStrategy
settings.scriptCenter.projects.magicDataAnnotator.aiReviewRecognitionMode
settings.scriptCenter.projects.magicDataAnnotator.recognitionStrategy
settings.scriptCenter.projects.magicDataAnnotator.recognitionMode
settings.scriptCenter.projects.magicDataAnnotator.pipelineMode
```

## 安全说明

- 本记录未包含 token/cookie/authorization。
- 未记录完整签名音频 URL。
