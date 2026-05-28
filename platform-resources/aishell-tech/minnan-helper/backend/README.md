# Aishell Tech 闽南语助手后端

## 入口

- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`

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
- 当前保持同步 HTTP 返回，不引入异步 job、SSE 或 WebSocket。
- 默认同步总超时统一为 `120000ms`；环境变量可用 `AISHELL_AI_TIMEOUT_MS` 覆盖。
- 客户端主动刷新、关闭页面或代理提前断开时，Aishell 会通过 `AbortSignal` 取消后续链路，不再把这类中断请求写成成功缓存或成功 CSV 行。

## 推荐模式

- `two_stage + mandarin_to_dialect`
  - 听音阶段先输出普通话。
  - 比较阶段再结合页面预测闽南语文本与词表给出最终推荐。
- `two_stage + direct_dialect`
  - 听音阶段直接输出闽南语。
  - 比较阶段再结合页面预测文本给出推荐。
- `omni_single`
  - 单模型一次完成听音、对比与推荐。

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
  - 当前策略默认 `listenPrompt / comparePrompt`
  - `promptProfiles`
- `health` 返回：
  - 当前默认模式
  - 当前默认策略
  - 当前同步超时
  - Aishell 独立队列组配置

## 日志与缓存

- Aishell 继续写平台专属 CSV：
  - `platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`
- CSV 当前会记录：
  - 是否取消
  - 当前阶段
  - 总耗时 / 听音耗时 / 比较耗时
  - 排队等待
  - 重试次数
  - 缓存命中
  - Aishell 模式与模型信息
- 只有完整同步返回成功并真正写出响应后，才允许写成功缓存和成功日志。

## 安全边界

- 后端只返回 AI 辅助结果，不保存平台标注数据。
- 不记录 token、cookie、authorization、完整音频 URL、完整签名 URL。
- 取消、超时、中途断开只保留必要诊断摘要，不伪装成成功请求。
