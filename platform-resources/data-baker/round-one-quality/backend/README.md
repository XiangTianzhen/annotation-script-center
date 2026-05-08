# 标贝易采一检质检 AI 推荐后端

本目录是 标贝易采一检质检“AI 推荐文本”的本地 Node 后端实现，通过统一入口 `platform-resources/backend/server.js` 注册。

说明：`group/detail` 总表导出由扩展前端同源实现（直接使用页面登录态请求 标贝易采 接口），不依赖本目录后端导出接口。

## 接口

- `GET /api/data-baker/round-one-quality/ai/recommend/health`
- `POST /api/data-baker/round-one-quality/ai/recommend`

## 文件职责

- `index.js`：项目路由注册入口。
- `ai-routes.js`：HTTP health / recommend 路由、请求校验、日志和响应组装。
- `ai-client-qwen.js`：DashScope Qwen 原生 `fetch` 调用，不依赖 OpenAI SDK。
- `ai-lexicon.js`：读取闽南方言字词表 CSV，按当前页面文本和听音文本生成 prompt 上下文。
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

- `DASHSCOPE_API_KEY`：DashScope API Key，真实调用必需；统一后端启动时默认从仓库根目录 `config/env/ai.env` 自动读取。
- `DATABAKER_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时走 mock，可直接写入 `config/env/ai.env`。
- `DATABAKER_AI_ENABLE_THINKING`：默认 `0`，原生 `fetch` 请求体顶层传 `enable_thinking=false` 尝试关闭 thinking；设为 `1` 时不传该字段。
- `DATABAKER_AI_PIPELINE_MODE`：默认 `two_stage`，即听音模型 + 对比模型；设为 `listen_only` 时跳过 `qwen3.5-plus`，只使用听音文本和本地词表强替换生成推荐文本。
- `DATABAKER_AI_LEXICON_REWRITE_MODE`：词表最终推荐文本改写模式，默认 `aggressive`；设为 `off` 时只保留 prompt 上下文，不做强替换。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。

后端入口 `platform-resources/backend/server.js` 会自动加载：

1. `config/env/ai.env`
2. `config/env/ai.local.env`
3. `.env.local`
4. 可选 `ASC_ENV_FILE` 指向的外部文件

因此本地不需要每次手动 `set DASHSCOPE_API_KEY`。如果 `config/env/ai.env` 和系统环境变量都没有配置 `DASHSCOPE_API_KEY`，且未开启 `DATABAKER_AI_MOCK=1`，health 会返回 `status=missing-api-key`。

未配置 `DASHSCOPE_API_KEY` 且未开启 mock 时：

- health 返回 `status=missing-api-key`。
- recommend 返回 `success=false` 和 `code=missing-api-key`。

## 推荐流程

1. 校验请求体中的 `collectId`、`itemId`、`audioUrl`、`pageText`。
2. 从 `platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv` 读取闽南方言字词表，生成听音 prompt 上下文。
3. 调用听音模型 `qwen3.5-omni-flash`，以 `input_audio` 传入完整 `audioUrl` 和根据路径后缀推断的音频格式，并在 prompt 中要求 JSON 输出。
4. 解析听音 JSON：`heardText`、`confidence`、`isValid`、`invalidReasons`，并删除 `heardText` 中的普通空格、全角空格、Tab 和换行。
5. 结合 `pageText` 和 `heardText` 重新筛选词表上下文。
6. `two_stage` 模式继续调用对比模型 `qwen3.5-plus`，输入 `pageText`、`heardText`、词表上下文和规则；`listen_only` 模式跳过该步骤。
7. `two_stage` 模式解析对比 JSON：`recommendedText`、`decision`、`changePoints`、`confidence`、`needHumanReview`；`listen_only` 模式直接以 `heardText` 作为推荐文本并标记 `decision=listen_only`。
8. 对 `recommendedText` 先删除普通空格、全角空格、Tab 和换行，再默认使用 `aggressive` 模式做闽南方言词表强替换；替换后再次去空格并补全中文句末标点，强制 `needHumanReview=true`。
9. 组装统一响应，包含推荐文本、听音文本、变更标记、置信度、模型、usage、费用估算、词表启用 / 改写状态、流水线模式、阶段耗时和 `requestId`。

后端原生 `fetch` 请求默认在请求体顶层传 `enable_thinking=false`，不再使用 OpenAI SDK 风格的 `extra_body.enable_thinking`。如果供应商返回不支持 `enable_thinking` 的 400 错误，后端会移除该字段自动重试一次；如需开启 thinking，可设置 `DATABAKER_AI_ENABLE_THINKING=1`。

`listen_only` 是极速推荐模式，只适合“AI 推荐文本”人工复核场景，不适合自动保存或自动提交。本仓库不会因为该模式自动保存、自动提交、批量识别或流转。

听音模型请求中的音频片段格式：

```json
{
  "type": "input_audio",
  "input_audio": {
    "data": "完整音频 URL",
    "format": "wav"
  }
}
```

`format` 会从 URL pathname 后缀推断，支持 `wav`、`mp3`、`aac`、`m4a`、`amr`、`3gp`、`3gpp`，无法识别时默认 `wav`。`data` 必须保留完整音频 URL，包括签名 query 参数，但日志和文档中不得记录完整 URL。

## 闽南方言字词表

词表 CSV 路径：

```text
platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv
```

CSV 表头至少包含 `编号`、`建议用字`、`对应华语`。后端使用原生 Node.js 解析 CSV，支持 UTF-8 BOM、双引号包裹和双引号转义。

词表有两层用途：

1. prompt 上下文：听音 prompt 会先注入基础易混规则，再按 `pageText` 筛选最多 40 条上下文；对比 prompt 会结合 `pageText` 与 `heardText` 筛选最多 60 条上下文。
2. 最终推荐文本强替换：默认 `aggressive`，按“对应华语 -> 建议用字”做长词优先替换，例如 `他 -> 伊`、`喜欢 -> 欢喜`、`的 -> 诶`。

强替换只修改返回给前端展示的 `recommendedText`，不会修改原始 `pageText`，也不会触发自动保存、自动提交、批量识别或流转。后端会对 `heardText` 和最终 `recommendedText` 删除空格、Tab、换行和全角空格，日志记录的也是清理后的文本，不额外保存清理前文本。可通过 `DATABAKER_AI_LEXICON_REWRITE_MODE=off` 关闭强替换，只保留 prompt 上下文。词表缺失时后端仍可运行，但会跳过 CSV 上下文，推荐效果可能下降。后续更新词表时只需要替换 CSV 文件，不要把词表内容硬编码进 JS。

词表清洗规则：

- 中文括号和英文括号中的内容全部视为拼音或批注，例如 `家（gei、dao）、厝（cuo）` 会清洗为 `家`、`厝`，`床（眠床）(min ceng)` 会清洗为 `床`。
- 拉丁字母、拼音音调字母、数字注音和残留连接符不会参与 prompt 上下文匹配或强替换。
- CSV 来源的单字“对应华语”默认不进入强替换规则，避免把 `家庭` 误改成 `厝庭` 之类的异常文本。
- 基础高频单字仍由 `BASE_ENTRIES` 显式控制，例如 `我 -> 阮`、`你 -> 汝`、`他 -> 伊`、`的 -> 诶`、`很 -> 真`、`吃 -> 食`。
- 如果出现异常替换，优先检查 `minnan-lexicon.csv` 中是否存在括号批注、拼音残留或 CSV 单字映射。

PowerShell 下可用以下命令做最小清洗回归：

```powershell
@'
const { __testOnly } = require('./platform-resources/data-baker/round-one-quality/backend/ai-lexicon');
console.log(__testOnly.splitTerms('家（gei、dao）、厝（cuo）'));
console.log(__testOnly.splitTerms('透早(tao za )'));
'@ | node -
```

## 真实调用排查

如果前端显示 `Qwen 接口请求失败（HTTP 400）`：

1. 先查看后端返回给前端的 `summary`，该字段已脱敏，不应包含完整音频 URL、token、cookie、`OSSAccessKeyId` 或 `Signature`。
2. 确认 `requestListen` 使用的是 `input_audio`，不是旧的 `audio_url`。
3. 确认听音请求没有传 `response_format`；JSON 输出只由 prompt 约束。
4. 确认当前音频 URL 在服务端可访问，且签名参数没有过期。
5. 确认 `config/env/ai.env` 中 `DASHSCOPE_API_KEY` 正确。
6. 将 `DATABAKER_AI_MOCK=1` 写入 `config/env/ai.env` 后重启后端，可排除前端、路由和日志链路问题。

## 日志安全

每次 recommend 调用都会尝试写入：

- `platform-resources/data-baker/round-one-quality/backend/logs/recommend-calls.jsonl`
- `platform-resources/data-baker/round-one-quality/backend/logs/recommend-calls.csv`

可通过 `DATABAKER_AI_CALL_LOG_DIR` 覆盖日志目录。JSONL 保留英文 key，便于后续程序处理；CSV 新建时写入中文表头，字段包含标注员、token、费用、有效时间、音频总时长、mock 状态、流水线模式、词表改写明细、听音阶段耗时、对比阶段耗时和错误信息。已有旧 CSV 文件第一版不自动迁移，删除旧文件后会按中文表头重新创建。

`mock=true` 的耗时只代表本地 mock 链路，不代表真实 Qwen 听音 / 对比耗时；真实调用应以 `mock=false` 记录中的 `listenDurationMs`、`compareDurationMs` 和总 `durationMs` 为准。

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
- 如果模型 usage 未返回或未解析，`cost.note` 会提示成本可能低估。

## 有效音频裁剪

第一版默认不启用裁剪。已保留环境变量：

- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`
- `DATABAKER_AI_CROP_PADDING_SECONDS`

后续如启用裁剪，需要下载完整音频、按有效起止时间裁剪、转 16k 单声道 wav、base64 传给 Qwen；裁剪失败必须 fallback 到完整 `audioUrl`，且全过程不得记录完整音频 URL。



