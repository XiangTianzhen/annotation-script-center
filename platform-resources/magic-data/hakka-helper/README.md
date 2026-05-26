# 客家话助手（Magic Data）资料

本目录只维护客家话助手专属资料。

## 实际文件与职责

- `backend/index.js`：客家话助手后端注册入口。
- `backend/ai-routes.js`：客家话助手 AI 路由；同时注册旧 `annotator` 兼容 API。
- `backend/ai-*.js`：客家话助手 AI 能力实现（模型调用、Prompt、词表、日志、成本估算）。
- `backend/lexicon/hakka-lexicon.csv`：客家话词表（后端运行时读取）。
- `backend/lexicon/客家话-正字表.xlsx`：词表原始来源文件（可选）。
- `backend/tools/convert-hakka-lexicon.js`：词表转换脚本。
- `network/.gitkeep`：当前无助手专属 Network 差异；共用结构见平台根目录 `network/`。
- `page-structure/.gitkeep`：当前无助手专属页面结构差异；共用结构见平台根目录 `page-structure/`。

## 接口

- 新路径：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 兼容旧路径：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。

## 前端联动口径（2026-05-26）

- 客家话助手前端已切换到与闽南语助手一致的新面板体系（行内建议、说话人建议、原始输出、全部填入、独立折叠）。
- 旧 `shared/assistant-panel-core.js` 与 `hakka-helper/ui-panel.js` 仅作 legacy 兼容，不再作为客家话主链路入口。
- 运行时接口仍使用客家话路径 `/api/magic-data/hakka-helper/ai/review-current`，并保留 legacy `/api/magic-data/annotator/ai/review-current` 兼容。
- 2026-05-26 Options 保存链路修复后，客家话助手的 `识别策略` 与 `比较模型` 会通过前端显式写入配置（`aiReviewRecognitionStrategy`、`aiReviewCompareModel` 与 legacy `reviewModel` 同步），刷新后保持一致。
- `storage` 归一逻辑已调整为显式字段优先：当用户明确保存 `aiReviewModelMode` 时，不再被 legacy `recognition_convert` 推断覆盖为 `omni_single`。
- options 中不再展示 `AI 质检模式`；客家话助手只按 `modelMode + recognitionStrategy` 运行（legacy `reviewMode` 仅兼容保留，不作为主逻辑）。
- 2026-05-26 审核页支持热修：
  - 客家话助手支持 `#/asrmarkCheck` 审核页采集与 AI 质检。
  - 不再显示“审核页暂未接入填入”提示。
  - 审核页默认只做质检与风险提示，不自动改写平台文本，不自动保存/提交。
  - 结果稳定性按 `pageType + taskItemId + samplingRecordId` 保持，避免轻微刷新后自动清空。
  - 文本可编辑时支持行内 `填入本行`；审核页 `全部填入AI推荐` 仅填文本项，不自动保存/提交，也不自动点击合格/不合格。

## 2026-05-26 后端输出结构对齐

- 客家话后端已按闽南语后端口径补齐结构化输出，核心字段包含：
  - `speakerCheck.gender/ageRange`
  - `dialectTextCheck`
  - `mandarinTextCheck`
  - `overall.reviewConclusion/shouldReview/summary`
  - `recommendations.dialectText/mandarinText/summary`
  - `audioCheck.heardDialectText/heardMandarinMeaning`
- 当模型未返回完整结构时，后端会按平台文本和听音结果做兜底，避免前端全部显示为空。
- `rawAiDebug/rawModelText/rawJson` 返回前会做脱敏，不输出 token/cookie/完整签名 URL。

## 2026-05-25 客家话模型评测结论（50条样本）

- 样本规模：50 条
- 总音频时长：398.932 秒
- 听音模型：`qwen3.5-omni-flash`
- 默认要求：`enable_thinking=false`

默认生产配置（已落地）：

- 模型方案：`two_stage`
- 识别策略：`direct_dialect`
- 听音模型：`qwen3.5-omni-flash`
- 比较模型：`qwen3.5-flash`
- thinking：关闭

候选配置：

- 高质量：`direct_dialect + qwen3.5-plus`
- 普通话优先：`mandarin_to_dialect + qwen3.5-plus`

| 配置 | 总分 | 客家话分 | 普通话分 | 性别准确 | 年龄准确 | 1万小时成本 |
|---|---:|---:|---:|---:|---:|---:|
| direct + qwen3.5-flash | 0.8292 | 0.7319 | 0.9023 | 0.96 | 0.88 | 约27.71万 |
| direct + qwen3.5-plus | 0.8313 | 0.7398 | 0.9269 | 0.88 | 0.86 | 约28.75万 |
| mandarin_to_dialect + qwen3.5-flash | 0.8258 | 0.7123 | 0.9237 | 0.96 | 0.86 | 约27.36万 |
| mandarin_to_dialect + qwen3.5-plus | 0.8318 | 0.7113 | 0.9307 | 0.96 | 0.90 | 约28.42万 |
