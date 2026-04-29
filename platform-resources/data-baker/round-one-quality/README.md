# DataBaker 一检质检平台资料

本目录记录 DataBaker / DataFactory 质检站点“一检质检”页面结构、网络接口和本地后端调试资料。

## 页面范围

- 平台域名：`https://datafactory.data-baker.com/`
- 质检首页：`/v2/#/quality/roundOne`
- 质检详情页：`/v2/#/quality/roundOneCollect?collectId=...&checkType=0`

当前只服务扩展目录：

```text
extension/sites/data-baker/round-one-quality/
```

该站点与 Alibaba LabelX 无关，不应把 DataBaker 逻辑放入 `extension/sites/alibaba-labelx/`。

## 当前资料

```text
round-one-quality/
  README.md
  page-structure.md
  network.md
  backend/
    README.md
    index.js
    ai-client-qwen.js
    ai-cost.js
    ai-prompts.js
    ai-response-schema.js
    ai-routes.js
```

- `page-structure.md`：页面 DOM 结构、稳定选择器和当前可编辑文本框判断。
- `network.md`：列表接口路径、请求参数、响应字段和缓存策略。
- `backend/`：DataBaker AI 推荐文本本地 Node 接口。

## 安全记录规则

- 不记录真实 `access_token`、`refresh_token`、cookie。
- 不记录完整签名音频 URL、`OSSAccessKeyId`、`Signature`。
- 不记录客户文本、采集人姓名、手机号、合同内容或未脱敏截图。
- 文档只记录选择器、接口路径、参数名、字段名和脱敏后的结构结论。

## 后端接口

统一后端启动：

```powershell
node platform-resources\backend\server.js
```

DataBaker AI 推荐接口：

- `GET /api/data-baker/round-one-quality/ai/recommend/health`
- `POST /api/data-baker/round-one-quality/ai/recommend`

环境变量：

- `DASHSCOPE_API_KEY`：DashScope API Key，只由后端读取。
- `DATABAKER_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时返回 mock 结果。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。

## 当前边界

- 第一版只做“单条 AI 推荐文本”。
- 不做自动保存、不做自动提交、不做批量识别、不做自动流转。
- 结果写入页面输入框必须由用户点击“填入推荐文本”触发。
- 如果页面结构变化导致无法安全定位输入框，扩展只保留复制能力。
