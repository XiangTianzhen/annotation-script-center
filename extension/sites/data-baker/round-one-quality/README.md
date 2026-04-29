# DataBaker 一检质检 AI 推荐文本

本目录是 DataBaker / DataFactory 质检站点的扩展运行时代码，目标页面为：

- 首页：`https://datafactory.data-baker.com/v2/#/quality/roundOne`
- 详情页：`https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`
- 任务组详情页：`https://datafactory.data-baker.com/v2/#/group/detail?taskId=...`

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
- AI 听音文本、AI 推荐文本展示和填入前会自动删除普通空格、全角空格、Tab 和换行；页面候选文本保持平台原文。
- AI 推荐文本展示和填入前会自动补全中文句末标点；英文句末 `.?!;` 会转为 `。？！；`，无句末标点时默认补 `。`。
- `group/detail` 页面新增“导出数据总表”按钮，按 `taskId` 在当前页面同源请求 `queryByCondition` 全量翻页并下载 CSV（含 BOM）。
- 支持自动每页条数，默认进入详情页后尝试设置为 `50条/页`，只点击页面原生分页控件。
- 支持 DataBaker 专属快捷键配置，默认全部未设置；快捷键只处理当前题或当前推荐卡。

## 文件职责

```text
round-one-quality/
  content.js
  data-api.js
  ai-recommendation.js
  ui-panel.js
  page-size-controller.js
  shortcuts.js
  group-export.js
  page-world/
    network-observer.js
```

- `content.js`：入口编排，判断当前页面是否 `roundOneCollect`，初始化数据 API、AI 推荐和 UI 面板。
- `data-api.js`：解析 `collectId/checkType`，监听 MAIN world 缓存的列表接口响应，定位当前选中题并生成后端请求数据。
- `ai-recommendation.js`：调用本地后端 `POST /api/data-baker/round-one-quality/ai/recommend`，请求体只传必要字段。
- `ui-panel.js`：注入按钮和推荐结果卡，支持复制和用户点击后填入推荐文本。
- `page-size-controller.js`：在详情页有限重试点击分页大小选择器，按设置切换到目标每页条数。
- `shortcuts.js`：监听 DataBaker 专属快捷键；先匹配已配置快捷键再处理输入焦点，普通输入不拦截。被动焦点恢复（平台按钮、active 题目变化）不会打断正在编辑输入框；命中已配置快捷键时按强制模式退出输入框再执行动作。
- `group-export.js`：仅在 `group/detail?taskId=...` 页面注入“导出数据总表”按钮，使用当前页面登录态同源分页拉取 `queryByCondition` 并触发 CSV 下载。
- `page-world/network-observer.js`：运行在 MAIN world，观察 `queryCollectStatementByCondtion` 列表接口响应，只在内存中缓存当前页题目记录。

## options 设置

`DataBaker 一检质检` 在 options 首页默认启用，方便上线验证；用户可在卡片中关闭脚本。专属设置页支持：

- 启用 / 关闭 AI 推荐文本；关闭后页面不显示 AI 推荐工具卡，也不会触发推荐请求。
- AI 推荐接口地址只能选择服务器或本机，默认服务器地址：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`。
- 本机调试地址：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`，仅用于开发调试；员工默认走服务器。
- 配置前端请求超时时间，页面以秒展示，默认 `120` 秒；扩展内部仍按毫秒存储到 `aiRecommendRequestTimeoutMs`。
- 启用 / 关闭自动每页条数，默认启用，默认目标为 `50条/页`，可选 `5条/页`、`10条/页`、`20条/页`、`50条/页`、`100条/页`。
- 配置快捷键，默认全部未设置。支持动作：AI 推荐文本、复制 AI 听音文本、复制 AI 推荐文本、填入推荐文本、忽略 AI 推荐结果、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 普通输入不会被快捷键拦截；如果焦点停留在“本句话文本”输入框，只有按下已配置快捷键时才会自动 blur 输入框并执行动作。
- 点击左侧 `.sentence-list .sentence-item` 切换题目后，脚本会在不阻止平台点击行为的前提下延迟恢复页面焦点，避免必须手动再点空白区域才能继续使用快捷键。
- 点击平台“确定”“合格”“不合格”“通过”“部分驳回”“全部驳回”“上一条”“下一条”等动作按钮后，或平台自动切换 `.sentence-list .sentence-item.active` 后，脚本会通过 blur + 隐藏焦点哨兵恢复快捷键焦点；不模拟点击页面空白处，不绕过 disabled。
- 用户手动点击“本句话文本”输入框后，1200ms 内被动焦点恢复会跳过，不会再把光标抢走。
- “填入推荐文本”成功后会立即并延迟退出“本句话文本”输入框，方便继续使用快捷键；不会自动保存、自动提交或自动判定。

扩展前端只保存接口地址、超时时间、开关、分页和快捷键设置，不保存 API Key、access token、cookie 或完整 `audioUrl`。模型密钥仍由后端通过 `config/env/ai.env` 读取。

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
- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/export/health`
- `POST http://127.0.0.1:3333/api/data-baker/round-one-quality/export/task`

扩展默认请求服务器接口：

- `POST https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`

任务总表导出默认走前端同源请求，不依赖本地后端、账号密码或 token 配置。后端导出接口仍保留为备用能力，默认本地导出目录 `platform-resources/data-baker/round-one-quality/backend/exports/`（可由 `DATABAKER_EXPORT_DIR` 覆盖）。

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
4. 确认自动每页条数默认启用且目标为 `50条/页`；快捷键配置区域默认全部未设置。
5. 录制一个快捷键，例如 `Alt+A` 绑定“AI 推荐文本”，保存后刷新 options 页面，确认配置仍存在。
6. 如需本机调试，启动本地后端：`node platform-resources\backend\server.js`。
7. 访问 health 接口，确认返回 `success=true`。
8. 打开 `https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`。
9. 等待列表和右侧题目加载，确认右侧“本句话文本”下方出现 `DataBaker AI 推荐文本` 工具卡，并观察页面自动尝试切换为 `50条/页`。
10. 点击左侧不同句子，确认旧推荐结果会清空或提示需要重新生成；切换后不点击空白区域直接按已配置快捷键，确认快捷键仍响应。
11. 点击平台“确定”让页面自动切到下一条，不点击屏幕直接按已配置快捷键，确认快捷键仍响应。
12. 点击“AI 推荐文本”或按已绑定快捷键，确认只请求当前选中单条，且请求使用 options 中配置的 endpoint。
13. 推荐结果出来后，验证复制 AI 听音文本、复制推荐文本、填入和忽略快捷键只作用于当前推荐卡。
14. 当后端返回带空格的 AI 听音文本或 AI 推荐文本时，确认推荐卡展示、复制和填入后的文本都已去除空白字符；页面候选文本原文不被修改。
15. 验证合格 / 不合格快捷键只点击 `.submit-btn` 中对应按钮；任务判定按钮 disabled 时快捷键不会绕过平台限制。
16. 聚焦“本句话文本”输入框，输入未配置为快捷键的普通字符，确认正常输入且不被拦截。
17. 聚焦“本句话文本”输入框后按已配置快捷键，例如 `Alt+A`，确认输入框先失焦再执行快捷键。
18. 点击“填入推荐文本”，确认只写入“本句话文本”输入框，且输入框会立即和延迟失焦；不会自动保存、提交、合格、不合格或任务判定。
19. 当后端返回的推荐文本没有句末标点时，确认推荐卡和填入后的输入框末尾都有中文句末标点。
20. 填入后不点击页面，直接按快捷键，确认仍可继续响应。
21. 关闭 DataBaker 脚本后刷新详情页，确认工具卡、自动分页和快捷键都停止；只关闭 AI 推荐时不显示工具卡。
22. 打开非 `roundOneCollect` 页面，确认不注入该工具卡。
23. 打开 `group/detail?taskId=...` 页面，确认出现“导出数据总表”按钮；在不启动本地后端时点击，状态应展示“正在导出：第 x / y 页”，最终提示“已导出 N 条，已下载 CSV”或明确失败原因。

## 已知限制

- 当前不实现自动保存、自动提交、批量识别、自动流转或自动判定。
- 如果当前页面还没有触发列表接口，运行时会尝试同源读取当前页数据；若浏览器限制导致读取失败，需要刷新详情页或点击左侧句子后再触发。
- 如果无法安全定位可编辑的“本句话文本”输入框，结果卡仍保留复制入口，但不会强行填入。
- 有效音频裁剪第一版未启用；后端只保留环境变量和代码结构，默认把完整 `audioUrl` 交给听音模型。
