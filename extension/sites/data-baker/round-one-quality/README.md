# DataBaker 一检质检 AI 推荐文本

本目录是 DataBaker / DataFactory 质检站点的扩展运行时代码，目标页面为：

- 首页：`https://datafactory.data-baker.com/v2/#/quality/roundOne`
- 详情页：`https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`

这是独立新增站点，不属于 Alibaba LabelX，也不复用 `extension/sites/alibaba-labelx/asr-judgement/` 或 `extension/sites/alibaba-labelx/asr-transcription/` 的业务代码。

## 当前能力

- 仅在 `roundOneCollect` 详情页注入小工具卡。
- 已接入扩展 options “标注脚本中心”，在 `DataBaker / DataFactory` 平台区域提供脚本启停和专属设置页。
- 只处理左侧当前选中的单条句子。
- 工具卡提供“AI 推荐文本”按钮，由用户手动点击触发。
- 点击后读取当前题的 `audioUrl`、页面候选文本、句子编号、朗读要求、有效时间和音频时长，再调用 options 中配置的后端接口。
- 结果卡展示页面候选文本、AI 听音文本、AI 推荐文本、是否相对页面文本变更、置信度、模型、流水线模式、阶段耗时、决策和复核提示。
- 结果卡提供“复制推荐文本”“填入推荐文本”“忽略”。
- “填入推荐文本”只在用户点击后触发，只写入页面的“本句话文本”输入框，不自动保存、不自动提交、不自动点击合格 / 不合格。

## 文件职责

```text
round-one-quality/
  content.js
  data-api.js
  ai-recommendation.js
  ui-panel.js
  page-world/
    network-observer.js
```

- `content.js`：入口编排，判断当前页面是否 `roundOneCollect`，初始化数据 API、AI 推荐和 UI 面板。
- `data-api.js`：解析 `collectId/checkType`，监听 MAIN world 缓存的列表接口响应，定位当前选中题并生成后端请求数据。
- `ai-recommendation.js`：调用本地后端 `POST /api/data-baker/round-one-quality/ai/recommend`，请求体只传必要字段。
- `ui-panel.js`：注入按钮和推荐结果卡，支持复制和用户点击后填入推荐文本。
- `page-world/network-observer.js`：运行在 MAIN world，观察 `queryCollectStatementByCondtion` 列表接口响应，只在内存中缓存当前页题目记录。

## options 设置

`DataBaker 一检质检` 在 options 首页默认启用，方便上线验证；用户可在卡片中关闭脚本。专属设置页支持：

- 启用 / 关闭 AI 推荐文本；关闭后页面不显示 AI 推荐工具卡，也不会触发推荐请求。
- AI 推荐接口地址只能选择服务器或本机，默认服务器地址：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`。
- 本机调试地址：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`，仅用于开发调试；员工默认走服务器。
- 配置前端请求超时时间，页面以秒展示，默认 `120` 秒；扩展内部仍按毫秒存储到 `aiRecommendRequestTimeoutMs`。

扩展前端只保存接口地址、超时时间和开关，不保存 API Key、access token、cookie 或完整 `audioUrl`。模型密钥仍由后端通过 `config/env/ai.env` 读取。

## 页面选择器依据

页面结构资料维护在：

```text
platform-resources/data-baker/round-one-quality/page-structure.md
platform-resources/data-baker/round-one-quality/network.md
```

当前运行时主要依赖：

- 左侧句子列表：`.sentence-list`
- 单条句子：`.sentence-list .sentence-item`
- 当前选中句子：`.sentence-list .sentence-item.active`
- 当前句子标题：`.sentence-list .sentence-item .title`
- 右侧详情容器：`.waver-page`
- “本句话文本”输入框：`.waver-page .text-box textarea.el-textarea__inner`
- 音频 iframe 容器：`#iframeBox iframe#myIframe`
- 时间信息：`.timeform_left_time`
- 分页容器：`.roundOneCollect-el-pagination`

音频真实地址优先来自列表接口字段 `audioUrl`。页面中 `#myIframe` 只是播放器入口，不把 iframe `src` 当成可直接传给 AI 的音频地址。

## 数据来源与安全边界

- 前端不硬编码 `access_token`、cookie、OSS 参数或音频签名。
- MAIN world 网络观察脚本只监听同源接口路径 `/cms/tbAudioUserTask/queryCollectStatementByCondtion`。
- 接口响应只保存在当前页面内存中，不写入 `chrome.storage`、DOM 持久属性、`localStorage` 或文档。
- 扩展前端不直连 DashScope，AI Key 只允许后端读取环境变量 `DASHSCOPE_API_KEY`。
- 前端和后端日志都不输出完整 `audioUrl`、access token、cookie、`OSSAccessKeyId` 或 `Signature`。
- 扩展前端不保存 API Key；`DASHSCOPE_API_KEY` 由后端通过 `config/env/ai.env` 或系统环境变量读取。

## 后端接口

本地后端入口仍是：

```powershell
node platform-resources\backend\server.js
```

接口：

- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend/health`
- `POST http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`

扩展默认请求服务器接口：

- `POST https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`

第一版固定模型：

- 听音：`qwen3.5-omni-flash`
- 对比：`qwen3.5-plus`

后端听音请求使用 Qwen-Omni `input_audio` 音频输入格式，`data` 保留完整音频 URL，`format` 从 URL pathname 后缀推断；听音请求不传 `response_format`。后端原生 `fetch` 默认在请求体顶层传 `enable_thinking=false` 尝试关闭 thinking，不使用 `extra_body`，如供应商不支持该字段会自动移除并重试一次。后端调用日志 JSONL 保留英文 key，CSV 新建时使用中文表头。

后端已接入闽南方言字词表 CSV：

```text
platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv
```

词表既用于听音和对比 prompt 的上下文提示，也会默认以 `aggressive` 模式对最终推荐文本做强替换。强替换后的文本只展示在推荐卡中，仍需用户手动复制或点击“填入推荐文本”，扩展不会自动保存、提交或批量处理。可通过后端环境变量 `DATABAKER_AI_LEXICON_REWRITE_MODE=off` 关闭强替换。词表缺失时功能仍可运行，但“的/诶”“很/真”“喜欢/欢喜”“这位/即个”“他/伊”等易混场景的推荐质量可能下降；更新词表时只替换 CSV 文件即可。

当后端返回 `lexicon.rewriteChanged=true` 时，推荐卡会显示“词表替换：已替换 N 处”，并列出最多 8 个替换项，例如 `他 → 伊`、`喜欢 → 欢喜`、`的 → 诶`。

后端支持两种流水线模式：

- `DATABAKER_AI_PIPELINE_MODE=two_stage`：默认模式，先听音，再调用 `qwen3.5-plus` 对比。
- `DATABAKER_AI_PIPELINE_MODE=listen_only`：极速听音模式，只调用 `qwen3.5-omni-flash`，再由本地词表强替换生成推荐文本；该模式只适合人工复核推荐，不自动保存、不自动提交。

推荐卡会在后端返回 `timing` 时显示听音耗时、对比耗时和总耗时；在 `listen_only` 或 `model.compare=skipped` 时显示“极速听音模式”。后续可增加“预生成当前页 AI 推荐”按钮：读取当前页 10/50 条记录，后端批量接口限制并发，例如 2，前端以内存缓存 `itemId -> result`，当前题优先读缓存。该能力默认不自动执行，避免模型成本失控。

## 人工验证步骤

1. 重新加载扩展。
2. 打开 options 页面，确认首页出现 `DataBaker / DataFactory` 平台和 `DataBaker 一检质检` 卡片。
3. 点击“打开设置”，确认默认 AI 推荐接口地址是服务器地址，并可切换成本机调试地址。
4. 保存后刷新 options 页面，确认配置仍存在。
5. 如需本机调试，启动本地后端：`node platform-resources\backend\server.js`。
6. 访问 health 接口，确认返回 `success=true`。
7. 打开 `https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`。
8. 等待列表和右侧题目加载，确认右侧“本句话文本”下方出现 `DataBaker AI 推荐文本` 工具卡。
9. 点击左侧不同句子，确认旧推荐结果会清空或提示需要重新生成。
10. 点击“AI 推荐文本”，确认只请求当前选中单条，且请求使用 options 中配置的 endpoint。
11. 点击“复制推荐文本”，确认剪贴板内容为推荐文本。
12. 点击“填入推荐文本”，确认只写入“本句话文本”输入框；不会自动保存、提交、合格、不合格或任务判定。
13. 关闭 DataBaker 脚本或关闭 AI 推荐后刷新详情页，确认不再显示工具卡或无法触发推荐。
14. 打开非 `roundOneCollect` 页面，确认不注入该工具卡。

## 已知限制

- 当前不实现自动保存、自动提交、批量识别、自动流转或自动判定。
- 如果当前页面还没有触发列表接口，运行时会尝试同源读取当前页数据；若浏览器限制导致读取失败，需要刷新详情页或点击左侧句子后再触发。
- 如果无法安全定位可编辑的“本句话文本”输入框，结果卡仍保留复制入口，但不会强行填入。
- 有效音频裁剪第一版未启用；后端只保留环境变量和代码结构，默认把完整 `audioUrl` 交给听音模型。
