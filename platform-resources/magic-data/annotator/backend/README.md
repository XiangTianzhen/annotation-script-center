# Magic Data ANNOTATOR AI 复核调试后端

本目录是 Magic Data ANNOTATOR 的本地 Node 调试后端实现，通过统一入口 `platform-resources/backend/server.js` 注册。

## 接口

- `GET /api/magic-data/annotator/ai/review-current/health`
- `POST /api/magic-data/annotator/ai/review-current`

说明：

- 只提供复核建议，不触发保存、提交、审核、领取等平台写操作。
- 不要求传 cookie、token、authorization 或平台请求头。

## 请求体

`POST /api/magic-data/annotator/ai/review-current` 示例字段：

- `taskItemId` / `samplingRecordId`
- `projectName`
- `audioUrl`（必须是 http/https）
- `audioDuration`
- `effectiveStartTime` / `effectiveEndTime` / `effectiveTime`
- `platformDialectText`、`platformMandarinText`（至少一个非空）
- `speaker.gender`、`speaker.ageRange`
- `rulesProfile`（默认 `hakka`）
- `clientVersion`

## 响应体（成功）

返回 `success=true`，主体在 `data`：

- `requestId`
- `verdict`：`same|mostly_same|different|uncertain|invalid_audio`
- `shouldReview`
- `effectiveTime`、`estimatedIncome`
- `listen`：听音结果与风险
- `comparison`：两行对比结果、词表问题、规则问题
- `lexicon`：词表状态
- `models`、`usage`、`timing`
- `mock`

## 响应体（失败）

返回 `success=false`：

- `requestId`
- `code`
- `message`
- `summary`（可选，脱敏 provider 摘要）

## 环境变量

- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL`
- `MAGIC_DATA_AI_LISTEN_MODEL`（默认 `qwen3.5-omni-flash`）
- `MAGIC_DATA_AI_COMPARE_MODEL`（默认 `qwen3.5-plus`）
- `MAGIC_DATA_AI_TIMEOUT_MS`（默认 `120000`）
- `MAGIC_DATA_AI_MOCK`（`1` 开启 mock）
- `MAGIC_DATA_AI_ENABLE_THINKING`（默认 `0`，关闭 thinking）
- `MAGIC_DATA_AI_PIPELINE_MODE`（默认 `two_stage`）
- `MAGIC_DATA_AI_CALL_LOG_DIR`（可选）
- `MAGIC_DATA_AI_LEXICON_REWRITE_MODE`（默认 `off`）

## 词表文件

- Excel（用户上传）：`platform-resources/magic-data/annotator/lexicon/客家话-正字表.xlsx`
- CSV（后端读取）：`platform-resources/magic-data/annotator/lexicon/hakka-lexicon.csv`

第一版策略：词表仅用于提示，不做强替换。  
如果 CSV 缺失，接口不中断，返回 `lexicon.enabled=false`、`lexicon.status=missing`。

转换脚本（依赖 `xlsx` 已存在时可用）：

```powershell
node platform-resources\magic-data\annotator\backend\tools\convert-hakka-lexicon.js
```

若仓库不存在 `xlsx` 依赖，请手动将 Excel 另存为 UTF-8 CSV，再放到词表目录。

## 日志安全

默认日志目录：`platform-resources/magic-data/annotator/backend/logs/`。

日志仅记录白名单字段：`requestId`、耗时、模型、mock、判定、`audioHostname`、文本长度/哈希等摘要。  
禁止记录：完整 `audioUrl`、`Signature`、`OSSAccessKeyId`、cookie、token、authorization、API Key、完整文本原文。
