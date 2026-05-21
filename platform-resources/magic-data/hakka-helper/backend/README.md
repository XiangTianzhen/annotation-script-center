# 客家话助手后端（Magic Data）

## 路由

- 新接口：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 兼容旧接口：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 词表

- `../lexicon/hakka-lexicon.csv`

## 配置（优先级：HAKKA 前缀 > 旧通用前缀）

- `MAGIC_DATA_HAKKA_AI_LISTEN_MODEL`（fallback: `MAGIC_DATA_AI_LISTEN_MODEL`）
- `MAGIC_DATA_HAKKA_AI_COMPARE_MODEL`（fallback: `MAGIC_DATA_AI_COMPARE_MODEL`）
- `MAGIC_DATA_HAKKA_AI_TIMEOUT_MS`（fallback: `MAGIC_DATA_AI_TIMEOUT_MS`）
- `MAGIC_DATA_HAKKA_AI_ENABLE_THINKING`（fallback: `MAGIC_DATA_AI_ENABLE_THINKING`）
- `MAGIC_DATA_HAKKA_AI_MOCK`（fallback: `MAGIC_DATA_AI_MOCK`）
- `MAGIC_DATA_HAKKA_AI_CALL_LOG_DIR`（fallback: `MAGIC_DATA_AI_CALL_LOG_DIR`）

## 安全边界

- 不记录完整签名音频 URL、token、cookie、authorization、API Key。
- 只提供 AI 建议，不触发平台保存/提交/审核/流转接口。
