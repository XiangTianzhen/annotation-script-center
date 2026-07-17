# 杭州话脚本后端（Magic Data）

## 对外接口

- `GET /api/magic-data/hangzhou-helper/ai/review-current/health`
- `GET /api/magic-data/hangzhou-helper/ai/defaults`
- `POST /api/magic-data/hangzhou-helper/ai/review-current`
- `GET /api/magic-data/hangzhou-helper/ai/review-current/logs/summary`

说明：

- legacy `/api/magic-data/annotator/*` 继续只归属客家话助手，杭州话后端不新增同名别名。
- 运行时仍通过统一 `ai-framework` 暴露 jobs / runtime 元信息，前端沿用现有轮询链路。

## 当前实现口径

- 首版结构对齐客家话助手：健康检查、defaults、review-current、日志统计都已可用。
- 响应结构保持当前 Magic Data AI 质检口径，包含结构化结果、脱敏调试信息、usage/cost 与词表状态。
- `speakerCheck` 当前包含 `gender / ageRange / pureDialect` 三项；其中 `pureDialect` 对应平台说话人属性里的“音频是否是纯方言”。
- Prompt、`rulesProfile` 与服务名已切到杭州话语义，但默认模型口径先与客家话保持一致。
- 新请求优先读取 `aiStages.listen/refine/single`；defaults 通过 `defaults.stages` 返回每阶段模型、Prompt、生成参数和默认开启的词表配置。
- 双模型分两次调用，单模型只调用一次；旧识别转换字段仅作请求兼容，不再进入业务路径。

## 词表

- `backend/lexicon/` 当前已接入用户维护的 `hangzhou-lexicon.json` 作为主读词表。
- `hangzhou-lexicon.csv` 与 `杭州方言正字表0509.xlsx` 继续只作为后续参考源命名预留，当前不入库。
- 词表文件缺失或 JSON 解析失败时：
  - `lexicon.status=missing`
  - `review-current` 继续按无词表模式运行
  - 不额外报错阻断请求
- 词表只作为阶段 Prompt 参考；每阶段最多附带 `30` 条相关词条，无命中、关闭、缺失或非法时按无词表模式继续。
- 响应 `lexicon.stages` 返回各阶段 `enabled/contextEntryCount`；旧 `lexiconMatches/conversionWarnings` 保持空数组并视为弃用字段。

## 配置

- `MAGIC_DATA_HANGZHOU_AI_LISTEN_MODEL`
- `MAGIC_DATA_HANGZHOU_AI_COMPARE_MODEL`
- `MAGIC_DATA_HANGZHOU_AI_TIMEOUT_MS`
- `MAGIC_DATA_HANGZHOU_AI_ENABLE_THINKING`
- `MAGIC_DATA_HANGZHOU_AI_MOCK`
- `MAGIC_DATA_HANGZHOU_AI_CALL_LOG_DIR`

以上配置都可继续回退到同名 `MAGIC_DATA_AI_*` 通用前缀。

## 安全边界

- 不记录完整签名音频 URL、token、cookie、authorization、API Key。
- 只提供 AI 建议，不触发平台保存、提交、审核或流转接口。
