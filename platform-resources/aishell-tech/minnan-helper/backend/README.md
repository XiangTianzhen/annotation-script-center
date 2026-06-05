# Aishell Tech 闽南语助手后端

## 入口

- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`
- `POST /api/aishell-tech/minnan-helper/ai/recommend/jobs`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/jobs/:jobId`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/jobs/:jobId/debug`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/logs/summary`

## 模块边界

- `config.js`：Aishell 独立配置、模型默认值、队列组设置与 `AISHELL_AI_*` 环境变量读取；第一阶段允许只读回退旧的 `DATABAKER_AI_*`。
- `errors.js`：Aishell 自己的错误包装，统一阶段、可重试标记、provider 状态码与取消态。
- `cache.js`：Aishell recommend 成功缓存。
- `queue.js`：Aishell 独立 provider queue 入口，默认组名：
  - `aishell_qwen_omni`
  - `aishell_fun_asr`
  - `aishell_text_compare`
- `pipeline.js`：Aishell 自己的同步推荐编排，只复用公共 provider HTTP 工具，不复用 DataBaker recommend orchestration。
- `dashscope-omni-client.js`：Aishell 独立 DashScope compatible-mode Omni 客户端，直接构造 `input_audio` 流式请求并固定 `enable_thinking=false`。
- `ai-service.js`：请求归一、默认 Prompt、health/defaults、统一成功/失败响应包装。
- `ai-routes.js`：HTTP 路由、客户端断开取消、同步超时墙、成功后写缓存与 CSV 日志。

## 当前实现口径

- Aishell 已不再把请求映射成 DataBaker recommend payload，也不再直接调用 DataBaker `recommend()`。
- 底层仍复用公共 provider 工具：
  - `platform-resources/backend/ai/providers/qwen-openai-compatible.js`
  - `platform-resources/backend/ai/providers/funasr.js`
- 当前仓库所有 AI 链路都已统一固定关闭 thinking；Aishell 即使收到前端或旧配置的 thinking 请求，也会强制归一为 `false`。
- 当前默认链路改为“短请求创建 job + HTTP 轮询结果”；同步 recommend 继续保留为兼容 / 调试入口，不引入 SSE 或 WebSocket。
- 默认同步总超时统一为 `60000ms`；环境变量可用 `AISHELL_AI_TIMEOUT_MS` 覆盖。
- 客户端主动刷新、关闭页面或代理提前断开时，Aishell 会通过 `AbortSignal` 取消后续链路，不再把这类中断请求写成成功缓存或成功 CSV 行。
- 路由层当前只把 `request.aborted` 与 `response.close` 视为真实断连；不会再把请求体正常读完后的 `request.close` 误判成客户端已断开。

## 推荐模式

- 当前只保留 `two_stage + audio_first_reference`
  - 听音阶段按实际发音输出，允许普通话词与闽南语词混合存在。
  - `two_stage` 当前固定使用三段式：
    - 候选转写阶段：候选模型先结合 `pageText` 与 `minnan-lexicon.csv` 词表上下文生成 `lexiconCandidateText`
    - 听音阶段：输出 `heardText`
    - 差异比较阶段：再基于 `pageText + lexiconCandidateText + heardText` 做最终推荐
  - 比较模型只重点判断 `heardText` 与 `lexiconCandidateText` 的差异项；音频里没读到的词不补回。
  - `audioFirstReferenceCorrectionThreshold` 默认 `0.75`；当 `correctionConfidence` 低于阈值时，后端会优先保留 `heardText`，并把 `needHumanReview` 置为 `true`。
  - 该策略仍会构建词表上下文给模型参考，但后处理 `lexicon.rewriteMode` 固定为 `off`，不会再做强制词表改写。
- `omni_single`
  - 仍保留为模型方案；但识别策略当前固定为 `audio_first_reference`。
  - 该模式下也会先生成 `lexiconCandidateText`，再由 Omni 在单次音频请求里结合候选文本与原文判断差异项该保留哪一侧。

## 返回契约

- 成功：`success + data + meta`
- 失败：`success=false + error + meta`

其中：

- `data` 只放业务结果，例如 `heardText`、`recommendedText`、`needHumanReview`。
- `meta` 固定放诊断上下文：
  - `requestId`
  - `stage`
  - `models`
  - `timing`
  - `usage`
  - `queue`
  - `cache`
  - `debugId`
  - `retryCount`
  - `cancelled`
  - `audioFirstReference`
    - `candidateText`
    - `candidatePairs`
    - `correctionThreshold`
    - `correctionConfidence`
    - `candidateDecisions`
- `error` 固定放：
  - `code`
  - `message`
  - `stage`
  - `retryable`
  - `providerStatus`
  - `providerCode`

## defaults / health

- `defaults` 返回：
  - `modelModeOptions`
  - `recognitionStrategyOptions`
  - 当前策略默认 `candidatePrompt / listenPrompt / comparePrompt`
  - `candidateModelOptions`
  - `candidateModel`
  - `promptProfiles`
  - `audioFirstReferenceCorrectionThreshold`
  - `audio_first_reference` 对应的 `promptProfiles` 会明确要求按实际发音输出，并允许普通话/闽南语混合保留
- `health` 返回：
  - 当前默认模式
  - 当前默认策略
  - `audioFirstReferenceCorrectionThreshold`
  - 当前同步超时
  - Aishell 独立队列组配置
- 当前默认组合已收口为：`two_stage + audio_first_reference + 候选 qwen3.5-plus + 听音 qwen3.5-omni-flash + 差异比较 qwen3.5-plus`。

## 日志与缓存

- Aishell 继续写平台专属 CSV：
  - `platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`
- CSV 当前会记录：
  - 是否取消
  - 当前阶段
  - 总耗时 / 候选转写耗时 / 听音耗时 / 比较耗时
  - 排队等待
  - 重试次数
  - 缓存命中
  - Aishell 模式与模型信息
- 统计接口：
  - `GET /api/aishell-tech/minnan-helper/ai/recommend/logs/summary`
- 只有完整同步返回成功并真正写出响应后，才允许写成功缓存和成功日志。

## 安全边界

- 后端只返回 AI 辅助结果，不保存平台标注数据。
- 不记录 token、cookie、authorization、完整音频 URL、完整签名 URL。
- 取消、超时、中途断开只保留必要诊断摘要，不伪装成成功请求。
