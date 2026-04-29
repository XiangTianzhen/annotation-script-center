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

## 扩展 options 接入

`DataBaker 一检质检` 已接入扩展 options “标注脚本中心”：

- options 首页展示 `DataBaker / DataFactory` 平台区域和 `DataBaker 一检质检` 脚本卡片。
- 脚本可在卡片中启停，默认启用，便于上线验证。
- 专属设置页可配置 AI 推荐接口地址、请求超时时间和 AI 推荐开关。
- 专属设置页新增自动每页条数，默认启用并设置为 `50条/页`，只点击页面原生分页控件。
- 专属设置页新增快捷键配置，默认全部未设置，可手动绑定 AI 推荐、复制、填入、忽略、句子判定和任务判定动作。
- `group/detail?taskId=...` 页面新增“导出数据总表”按钮，先切换 `100条/页` 并逐页触发页面原生请求，再由 MAIN world 拦截 `queryByCondition` 响应合并导出 CSV（使用当前登录态，不依赖本地后端）。
- 默认推荐接口走服务器：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`。
- 本机接口 `http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend` 仅用于开发调试。
- 扩展前端不保存 API Key，`DASHSCOPE_API_KEY` 仍由后端通过 `config/env/ai.env` 或系统环境变量读取。

## 当前资料

```text
round-one-quality/
  README.md
  page-structure.md
  network.md
  ai/
    minnan-lexicon.csv
  backend/
    README.md
    ai-lexicon.js
    index.js
    ai-client-qwen.js
    ai-cost.js
    ai-prompts.js
    ai-response-schema.js
    ai-routes.js
```

- `page-structure.md`：页面 DOM 结构、稳定选择器和当前可编辑文本框判断。
- `network.md`：列表接口路径、请求参数、响应字段和缓存策略。
- `ai/minnan-lexicon.csv`：闽南方言字词表，用于 DataBaker AI 推荐文本后端 prompt 上下文。
- `backend/`：DataBaker AI 推荐文本本地 Node 接口。

## 自动分页与快捷键

- 运行时只在 `roundOneCollect` 详情页生效。
- 自动分页目标 DOM 为 `.roundOneCollect-el-pagination span.el-pagination__sizes .el-select`，会读取当前分页 input 值，若不是目标值则打开下拉并点击可见的 `5条/页`、`10条/页`、`20条/页`、`50条/页` 或 `100条/页`。
- 自动分页有限重试，默认最多 5 次，失败只输出简短 `console.debug`，不影响 AI 推荐主流程。
- 快捷键默认全部未设置，用户需在 options DataBaker 专属设置页手动录制。
- 快捷键不会在 `input`、`textarea`、`select` 或 `contenteditable` 聚焦时触发。
- 句子判定只点击 `.submit-btn` 中的“合格 / 不合格”；任务判定只点击 `.operate-btn` 中包含“任务判定”的“通过 / 部分驳回 / 全部驳回”按钮。
- 任务判定按钮 disabled 时不会绕过平台限制；该能力不自动保存、不自动提交、不自动流转。

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

扩展默认请求服务器完整路径：

- `POST https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`

导出默认走前端拦截链路：扩展不直接 `fetch /cms/tbAudioUserTask/queryByCondition`，而是触发页面原生分页查询并拦截响应。背景是平台可能对扩展直接请求返回 `code=51000`。当前流程会先切到 `100条/页`，再逐页导出全量数据；CSV 带 UTF-8 BOM，不依赖本地后端和账号密码配置，且已移除“采集ID”列。

## 闽南方言词表

后端已接入闽南方言字词表 CSV：

```text
platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv
```

词表既作为 Qwen prompt 上下文，也会默认以 `aggressive` 模式对最终推荐文本做强替换，用于帮助模型在“的/诶”“很/真”“喜欢/欢喜”“这位/即个”“他/伊”等场景中选择更合适的字形。强替换只影响推荐文本展示，不会触发自动提交、自动保存或批量识别；如需关闭，可设置 `DATABAKER_AI_LEXICON_REWRITE_MODE=off`。词表缺失时后端仍可运行，但推荐文本效果会下降。后续更新词表时直接替换该 CSV 文件即可。

词表括号内容全部按拼音 / 批注处理，不参与建议用字或对应华语，例如 `家（gei、dao）、厝（cuo）` 只会清洗出 `家`、`厝`。拉丁字母、拼音音调字母、数字注音和残留连接符也不会参与替换。CSV 单字映射默认跳过强替换，避免误伤 `家庭` 这类复合词；基础高频单字仍由后端 `BASE_ENTRIES` 显式维护，例如 `他 -> 伊`、`的 -> 诶`、`很 -> 真`、`吃 -> 食`。如果出现异常替换，优先检查 `minnan-lexicon.csv` 中是否含有括号批注或单字映射。

后端会对 AI 听音文本和最终 AI 推荐文本删除普通空格、全角空格、Tab 和换行，推荐卡展示、复制、填入和调用日志都使用清理后的文本；页面候选文本原文不做去空格处理。

环境变量：

- `DASHSCOPE_API_KEY`：DashScope API Key，只由后端读取。
- `DATABAKER_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时返回 mock 结果。
- `DATABAKER_AI_ENABLE_THINKING`：默认 `0`，后端原生 `fetch` 会在请求体顶层传 `enable_thinking=false`，不再使用 `extra_body`；设为 `1` 时不传该字段。
- `DATABAKER_AI_PIPELINE_MODE`：默认 `two_stage`，即听音 + 对比双模型；设为 `listen_only` 时只调用 `qwen3.5-omni-flash`，再做本地词表强替换。
- `DATABAKER_AI_LEXICON_REWRITE_MODE`：词表最终推荐文本改写模式，默认 `aggressive`；设为 `off` 时只保留 prompt 上下文。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。

## 速度与预生成方案

- 默认 `two_stage` 模式会串行调用 `qwen3.5-omni-flash` 和 `qwen3.5-plus`，日志会记录听音耗时、对比耗时、总耗时和流水线模式。
- `listen_only` 是极速听音模式，只返回听音文本并做词表强替换，仍然只作为人工复核推荐，不自动保存或提交。
- `mock=true` 的耗时只代表本地链路，不代表真实 Qwen 调用耗时；真实耗时以日志中 `mock=false` 的听音 / 对比阶段耗时为准。
- 后续可新增“预生成当前页 AI 推荐”按钮：前端读取当前页 10/50 条接口记录，后端批量接口限制并发，例如 2，前端以内存缓存 `itemId -> result`，当前题点击 AI 推荐时优先读缓存。
- 当前页预生成默认不自动执行，避免在翻页或误触时产生不可控模型成本。

## 当前边界

- 第一版只做“单条 AI 推荐文本”。
- 不做自动保存、不做自动提交、不做批量识别、不做自动流转。
- 结果写入页面输入框必须由用户点击“填入推荐文本”触发。
- 如果页面结构变化导致无法安全定位输入框，扩展只保留复制能力。
