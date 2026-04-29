# DataBaker 一检质检 AI 推荐后端

本目录是 DataBaker / DataFactory 一检质检“AI 推荐文本”的本地 Node 后端实现，通过统一入口 `platform-resources/backend/server.js` 注册。

## 接口

- `GET /api/data-baker/round-one-quality/ai/recommend/health`
- `POST /api/data-baker/round-one-quality/ai/recommend`

## 文件职责

- `index.js`：项目路由注册入口。
- `ai-routes.js`：HTTP health / recommend 路由、请求校验、日志和响应组装。
- `ai-client-qwen.js`：DashScope Qwen 原生 `fetch` 调用，不依赖 OpenAI SDK。
- `ai-prompts.js`：听音 prompt 和文本对比 prompt。
- `ai-response-schema.js`：模型 JSON 解析、字段归一化和响应体组装。
- `ai-cost.js`：费用估算常量和计算函数。

## 模型

默认固定：

- 听音模型：`qwen3.5-omni-flash`
- 对比模型：`qwen3.5-plus`

环境变量可覆盖：

- `DATABAKER_AI_LISTEN_MODEL`
- `DATABAKER_AI_COMPARE_MODEL`

## 环境变量

- `DASHSCOPE_API_KEY`：DashScope API Key，真实调用必需。
- `DATABAKER_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时走 mock。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。

未配置 `DASHSCOPE_API_KEY` 且未开启 mock 时：

- health 返回 `status=missing-api-key`。
- recommend 返回 `success=false` 和 `code=missing-api-key`。

## 推荐流程

1. 校验请求体中的 `collectId`、`itemId`、`audioUrl`、`pageText`。
2. 调用听音模型 `qwen3.5-omni-flash`，输入 `audioUrl` 和听音 prompt。
3. 解析听音 JSON：`heardText`、`confidence`、`isValid`、`invalidReasons`。
4. 调用对比模型 `qwen3.5-plus`，输入 `pageText`、`heardText` 和规则。
5. 解析对比 JSON：`recommendedText`、`decision`、`changePoints`、`confidence`、`needHumanReview`。
6. 组装统一响应，包含推荐文本、听音文本、变更标记、置信度、模型、usage、费用估算和 `requestId`。

## 日志安全

后端日志只允许输出：

- `requestId`
- 音频 `hostname`
- `sentenceNumber`
- `listenModel`
- `compareModel`
- 是否 mock

不得输出：

- 完整 `audioUrl`
- access token
- cookie
- `OSSAccessKeyId`
- `Signature`
- API Key

## 费用估算

费用字段仅用于调试展示，不参与业务判断。

- 收入估算：`effectiveTime / 3600 * 350`
- AI 成本：按 usage token 估算。
- 价格表在 `ai-cost.js` 中维护，并标注“按当前测试估算，可后续调整”。

## 有效音频裁剪

第一版默认不启用裁剪。已保留环境变量：

- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`
- `DATABAKER_AI_CROP_PADDING_SECONDS`

后续如启用裁剪，需要下载完整音频、按有效起止时间裁剪、转 16k 单声道 wav、base64 传给 Qwen；裁剪失败必须 fallback 到完整 `audioUrl`，且全过程不得记录完整音频 URL。
