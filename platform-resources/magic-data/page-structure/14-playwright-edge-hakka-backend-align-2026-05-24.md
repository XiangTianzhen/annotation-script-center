# Playwright-Edge 复测记录（客家话后端输出结构对齐）

## 记录时间

- 2026-05-26

## 执行范围

- 任务目标：修复客家话助手后端输出不完整问题，使其与闽南语后端结构对齐。
- 本轮按用户要求未执行真实浏览器调试与 MCP 交互操作，仅记录后端字段对齐结果与人工复核清单。

## 后端对齐结果

- 客家话 `review-current` 响应已补齐以下字段：
  - `service/scriptId/component`
  - `speakerCheck.gender`
  - `speakerCheck.ageRange`
  - `dialectTextCheck`
  - `mandarinTextCheck`
  - `overall`
  - `recommendations`（含兜底）
  - `rawAiDebug/rawModelText/rawJson`（脱敏）
- legacy 字段继续保留：
  - `listen`
  - `comparison`
  - `verdict`
- 兼容路径继续有效：
  - `/api/magic-data/hakka-helper/ai/review-current`
  - `/api/magic-data/annotator/ai/review-current`

## Prompt 与 Schema 修复点

- compare Prompt 改为强制三项质检 JSON 结构输出，避免仅返回摘要。
- schema 增加 tri-state 归一与 fallback，模型字段不完整时使用听音/平台文本兜底，避免前端全空。
- `reviewConclusion` 集合增加 `invalid_audio`。

## 默认配置口径（客家话）

- `modelMode=two_stage`
- `recognitionStrategy=direct_dialect`
- `listenModel=qwen3.5-omni-flash`
- `compareModel=qwen3.5-flash`
- `enable_thinking=false`

## 脱敏要求确认

- raw/debug 输出已做脱敏，不记录以下敏感信息：
  - token
  - cookie
  - authorization
  - 完整签名 URL

## 待人工复核清单（浏览器）

1. 在客家话页面点击“AI 质检当前条”后，确认返回 JSON 包含三项结构化字段。
2. 确认客家话行与普通话行不再大面积显示“待复核”空值。
3. 确认说话人属性可展示平台值与 AI 建议值。
4. 确认 endpoint 使用客家话路径（或 legacy annotator），不是闽南语路径。
