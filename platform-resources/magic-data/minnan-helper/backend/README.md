# 闽南语助手后端（Magic Data）

## 路由

- `GET /api/magic-data/minnan-helper/ai/review-current/health`
- `GET /api/magic-data/minnan-helper/ai/defaults`
- `POST /api/magic-data/minnan-helper/ai/review-current`

## 识别模式

- `two_stage + fun-asr`：Fun-ASR 听音 + compare 模型复核。
- `two_stage + Qwen Omni`：Qwen Omni 听音 + compare 模型复核。
- `omni_single + Qwen Omni`：单模型一次完成听音与两行文本复核。

## 词表

- `./lexicon/minnan-lexicon.csv`
- 可用 `tools/convert-hakka-lexicon.js`（兼容脚本名，输出已改为闽南语词表路径）转换自定义表格。

## 配置（优先级：MINNAN 前缀 > 旧通用前缀）

- `MAGIC_DATA_MINNAN_AI_LISTEN_MODEL`（fallback: `MAGIC_DATA_AI_LISTEN_MODEL`）
- `MAGIC_DATA_MINNAN_AI_OMNI_MODEL`（fallback: `MAGIC_DATA_AI_LISTEN_MODEL`）
- `MAGIC_DATA_MINNAN_AI_COMPARE_MODEL`（fallback: `MAGIC_DATA_AI_COMPARE_MODEL`）
- `MAGIC_DATA_MINNAN_AI_PIPELINE_MODE`（`two_stage | omni_single`）
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_MODEL`（默认 `fun-asr`）
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_PROVIDER`（默认 `rest`）
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_PROVIDER_FALLBACK`（可选 `python`）
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_REST_BASE_URL`
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_POLL_INTERVAL_MS`
- `MAGIC_DATA_MINNAN_AI_TIMEOUT_MS`（fallback: `MAGIC_DATA_AI_TIMEOUT_MS`）
- `MAGIC_DATA_MINNAN_AI_ENABLE_THINKING`（fallback: `MAGIC_DATA_AI_ENABLE_THINKING`）
- `MAGIC_DATA_MINNAN_AI_MOCK`（fallback: `MAGIC_DATA_AI_MOCK`）
- `MAGIC_DATA_MINNAN_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
- `MAGIC_DATA_MINNAN_AI_LEXICON_REWRITE_MODE`
- `MAGIC_DATA_MINNAN_AI_CACHE_TTL_MS`
- `MAGIC_DATA_MINNAN_AI_CALL_LOG_DIR`（fallback: `MAGIC_DATA_AI_CALL_LOG_DIR`）

## 安全边界

- 不记录完整签名音频 URL、token、cookie、authorization、API Key。
- 只提供 AI 建议，不触发平台保存/提交/审核/流转接口。
