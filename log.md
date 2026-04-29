# 标注脚本中心修改日志

## 2026-04-29

- 修复 DataBaker Qwen-Omni 听音请求格式：`requestListen` 改用 `input_audio`，按音频 URL pathname 后缀推断 `wav/mp3/aac/m4a/amr/3gp/3gpp`，并移除听音请求的 `response_format`，避免多模态请求触发 HTTP 400。
- DataBaker 前端错误提示补充后端脱敏 `summary`，方便排查 provider 400，同时继续避免暴露完整音频 URL、token、cookie、`OSSAccessKeyId`、`Signature` 或 API Key。
- options “标注脚本中心”新增 `DataBaker / DataFactory` 平台区域和 `DataBaker 一检质检` 脚本卡片，支持在控制面板启停该脚本。
- 新增 DataBaker 一检质检专属设置页，可配置 AI 推荐接口地址、请求超时时间和 AI 推荐开关；默认 endpoint 为 `https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`，本机 `127.0.0.1:3333` 仅用于开发调试。
- DataBaker content script 改为读取 `chrome.storage` 中的脚本启停、AI 推荐开关、endpoint 和 timeout；关闭脚本或关闭 AI 推荐后不显示推荐工具卡。
- 扩展前端仍不保存 API Key、access token、cookie 或完整音频 URL，DataBaker 模型密钥继续由后端通过 `config/env/ai.env` 读取。
- manifest 版本提升到 `0.2.8`。
- 新增统一 AI 环境配置文件 `config/env/ai.env` 自动加载能力，统一后端启动时会先加载仓库内 AI 环境配置，不再要求每次手动设置 `DASHSCOPE_API_KEY`。
- 新增 `config/env/ai.env.example`，覆盖 DashScope、OpenRouter、MiniMax、其他模型服务和 DataBaker AI 推荐文本配置项。
- `.gitignore` 新增真实密钥文件忽略规则：`config/env/ai.env`、`config/env/ai.local.env`、`.env`、`.env.*`，保留模板文件可提交。
- 新增 DataBaker / DataFactory 一检质检站点目录 `extension/sites/data-baker/round-one-quality/`，仅在 `datafactory.data-baker.com` 的 `roundOneCollect` 详情页注入“AI 推荐文本”工具卡。
- DataBaker 前端新增 MAIN world 网络观察脚本，只在内存中缓存 `queryCollectStatementByCondtion` 当前页响应；ISOLATED world 根据 `.sentence-list .sentence-item.active`、右侧“本句话文本” textarea 和接口记录定位当前单条。
- DataBaker 推荐结果卡支持展示页面候选文本、AI 听音文本、AI 推荐文本、变更标记、置信度、模型和复核提示，并提供“复制推荐文本”“填入推荐文本”“忽略”；填入必须由用户点击触发，不自动保存、提交、判定或流转。
- 统一后端新增 DataBaker AI 推荐接口：
  - `GET /api/data-baker/round-one-quality/ai/recommend/health`
  - `POST /api/data-baker/round-one-quality/ai/recommend`
- DataBaker 后端默认使用听音模型 `qwen3.5-omni-flash` 和对比模型 `qwen3.5-plus`，沿用原生 `fetch` 调 DashScope，支持 `DATABAKER_AI_MOCK=1` mock、费用估算和有效音频裁剪环境变量预留。
- `manifest.json` 新增 `https://datafactory.data-baker.com/*` 权限与 content script，扩展版本提升到 `0.2.7`；同步更新根 README、扩展 README、平台资源 README、统一后端 README 和 DataBaker 页面 / 网络资料。

## 2026-04-28

- 为 Alibaba LabelX ASR 快判新增“AI 半自动参考建议”第一版：新增 `judgement-ai-suggestion.js`，仅支持按钮/快捷键手动分析当前题卡，不自动分析全页，不自动保存/提交/领取/流转。
- 快判设置新增 AI 建议配置：`aiSuggestionEnabled`（默认 false）、`aiSuggestionEndpoint`、`aiSuggestionRequestTimeoutMs`、`aiSuggestionModel`（默认 `qwen3-omni-flash`）、`aiSuggestionAvailableModels`（预留 `qwen3.5-omni-plus`）；快捷键动作统一为 `shortcuts.aiSuggestCurrentItem`。
- 快判工具栏新增“AI 分析当前题”按钮；建议卡支持“采用建议/忽略”，采用建议统一调用 `selectJudgementChoice(choiceActionKey)`，不重写单选逻辑。
- AI 建议与雷题联动：命中雷题时显示“雷题优先”；若 AI 与雷题标准答案冲突，禁用“采用建议”。
- 快判后端新增 AI 路由与客户端：
  - `GET /api/alibaba-labelx/asr-judgement/ai/health`
  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest`
  - 新增 `ai-routes.js`、`ai-client-qwen.js`、`ai-prompt.js`、`ai-response-schema.js`。
- AI 后端默认真实调用 DashScope Qwen（`stream=true`），默认模型 `qwen3-omni-flash`；仅 `ASR_JUDGEMENT_AI_MOCK=1` 才走 mock；未配置 `DASHSCOPE_API_KEY` 时 health 返回 `missing-api-key`，suggest 返回清晰错误且服务不崩溃。
- 新增 AI 规则资料：`platform-resources/alibaba-labelx/asr-judgement/ai/rules.ai.md`、`prompt-template.md`、`fewshot-examples.json`；并在相关 README 同步文档说明。已明确取消 MiniMax 接入，不新增 MiniMax client。
- 安全约束补充：不在日志/存储/DOM 持久化完整 `audioUrl`，后端日志仅记录 requestId、hostname、itemIndex、model。

- 修正 AI prompt 输入最小化：`ai-prompt.js` 仅向模型文本 prompt 提供 `asrText1/asrText2`，不再包含 `projectId/subTaskId/itemId/itemIndex`，`audioUrl` 仅作为模型音频输入字段。
- 修正模型校验链路：请求显式传入非法 `model` 时 `suggest` 返回 `HTTP 400` + `code=invalid-model`；未传 `model` 时才使用 `ASR_JUDGEMENT_AI_MODEL` 或默认 `qwen3-omni-flash`。
- 清理冗余配置字段：移除旧快捷键独立字段，统一使用 `shortcuts.aiSuggestCurrentItem` 并兼容迁移旧配置。
- 提升扩展版本到 `0.2.6`，并同步更新相关 README 与验证说明。

## 2026-04-27

- 补充服务器扩展压缩包下载目录说明：记录 Nginx `autoindex` 配置、`/downloads/` 访问地址、`dist/` 目录约定和验证命令，便于用户选择不同版本 zip 下载。
- 补充根目录 README 和扩展源码 README 的扩展压缩包生成命令，明确压缩包根级必须直接包含 `manifest.json`；同步补强 `.gitignore` 对旧 `edge-extension/dist/` 的忽略规则。
- 将扩展源码从 `edge-extension/extension/` 迁移到仓库根目录 `extension/`，将历史文档迁移到 `docs/extension/`，将旧参考脚本迁移到 `legacy-reference/`；新增根目录 README 的本地加载、打包和服务器部署说明，并新增 `.gitignore` 忽略 `dist/` 等构建产物。
- 将扩展定位调整为 Chrome / Chromium MV3 单源码形态：Chrome 和 Edge 都加载同一个 `extension/` 目录，不再规划复制一套业务运行时代码；同步更新维护说明、本地加载说明和扩展源码目录 README。
- 为快判新增当前音频前进 / 后退快捷键动作，默认 `ArrowLeft` 后退、`ArrowRight` 前进，前进 / 后退步长默认 `0.5` 秒并可在 options 中配置。
- 调整快判倍速与音量语义：options 只保存默认倍速和默认音量；快捷键只临时调整当前音频，重置倍速 / 重置音量恢复到面板默认值，不再扩散到其他题卡音频。
- 将快判倍速步进改为 `0.1/0.25/0.5/1` 四档选择，移除 options 中“当前倍速”字段。
- 顶部主导航状态合并显示总时长、当前默认每页条数、默认倍速和默认音量；`.mark-toolbox` 工具栏移除每页状态并新增当前音频前进 / 后退按钮。
- manifest 版本提升到 `0.2.4`，同步更新快判 README 与 `AGENTS.md` 中的音频模块职责和验证步骤。
- 将快判前进 / 后退步长也改为 `0.1/0.25/0.5/1` 四档选择，旧的非四档配置会回退到 `0.5` 秒；manifest 版本提升到 `0.2.5`。
- 新增根目录 `PRIVACY_POLICY.md`，用于 Edge 扩展上架时说明扩展处理的设置、LabelX 任务统计数据、上传接口和用户控制方式。

## 2026-04-25

- 为 Alibaba LabelX ASR 快判新增总时长统计：读取 `/api/v1/label/center/subTask/{subTaskId}/data`，汇总 `data.dataList[].data.duration`。
- 为快判新增默认每页条数设置，默认值为 `all`，尝试将详情页 data 请求改写为 `pageSize=400`。
- 新增快判 MAIN world 网络捕获与请求改写，支持同标签页刷新时读取缓存配置。
- 将总时长显示位置调整到页面顶部主导航区域，快判工具栏中保留每页状态。
- 将音频运行时拆分为 `audio-volume-controller.js`、`audio-rate-controller.js`、`audio-playback-controller.js`，`audio-controller.js` 只保留编排、扫描和动作路由。
- 将分页和总时长逻辑拆分为 `judgement-page-size.js` 和 `judgement-duration-summary.js`。
- 将 MAIN world 网络逻辑拆分为 `network-protocol.js`、`network-config.js`、`network-url-rewriter.js`、`network-summary.js` 和 `network-observer.js`。
- 将 `content.js` 中的判别动作、快捷键、提示和工具栏拆分为 `judgement-actions.js`、`judgement-shortcuts.js`、`judgement-toast.js` 和 `judgement-toolbar.js`。
- 更新快判 README，记录当前运行时模块边界和验证步骤。
- 将项目维护说明统一迁移到仓库根目录 `AGENTS.md`，并新增根目录 `log.md` 作为长期修改日志。
- 统一调整项目 README：重写 `edge-extension/README.md`，更新 `alibaba-labelx/README.md`、快判 README、快判页面结构 README 和网络采集 README，使文档匹配当前 `asr-judgement` 模块拆分后的实际结构。
- 在 `AGENTS.md` 中新增 Git 提交要求：每次完成修改并验证后提交，提交前检查暂存范围，默认不主动推送。
- 将快判“默认每页条数”从默认 `400` 调整为默认 `100 条/页`，设置页提供 `100/150/200/400 条/页` 自定义档位，历史 `all/全部` 配置兼容为 `400 条/页`。
- 新增快判页数负载测试文档，用于在 DevTools Console 对比不同 `pageSize` 的接口耗时、响应大小和页面 DOM 压力。
- 为快判新增实验性“窗口化显示”开关，开启后按当前题号只展开前后 5 题，并折叠窗口外题卡以降低 400 条页面的渲染压力。
- 调整快判窗口化隐藏方式：窗口外题卡高度改为 2px，并通过 LabelX inline CSS 变量隐藏内容区和回答区，恢复时还原原始变量。
- 因窗口化显示在 LabelX 页面未能稳定生效，暂时从 options 前端移除开关，并在运行时强制关闭；代码保留为未完成能力等待后续继续验证。
- 在快判 README 中补充脚本能力路线：优先提效脚本，其次半自动人工，最后全自动；新增 ASR 文本差异高亮、差异摘要、差异导航等后续提效功能池。
- 为快判新增 ASR 文本对齐差异视图，按字符级编辑距离生成高亮对齐文本和差异摘要。
- 为快判新增“选择后自动下一题”设置，选择 `1~5` 或点击快判工具栏判别按钮后可自动跳到当前页下一题。
- 为快判 ASR 对齐差异视图新增 options 开关，默认开启，关闭后恢复 LabelX 原始文本展示。
- 修复转写 content 读取运行时契约时只访问 `window` 的兼容问题，改为优先读取 `globalThis`，减少 Edge MV3 隔离环境下的 `Runtime contract is not loaded` 误报。
- 修复快判进入新详情页可能误选选项的防护：快捷键只响应真实用户事件，判别写入不再在无法定位当前题卡时默认回退到第一页第一题。
- 修复快判网络改写导致翻页数据错位：原生 `1~50 条/页` 不再走网络改写；自定义档位只覆盖 `pageSize`，不再把所有分页请求强制改成 `page=1`。
- 暂停快判 `100/150/200/400 条/页` 自定义大页数入口，options 只保留 LabelX 原生 `1~50 条/页`，历史大页数配置自动回退为 `50 条/页`，并记录到未完成能力。
- 为快判新增轻量题卡摘要：当 LabelX 样式设置隐藏内容区和回答区时，在每个题卡根节点展示 `asr_text1`、`asr_text2` 和“哪个ASR更优”的当前选择状态。
- 为快判轻量题卡摘要新增 options 开关，默认开启；摘要块改为由开关控制显示，不再要求先隐藏 LabelX 内容区和回答区。
- 调整快判默认音量快捷键：增大音量为 `[`，减小音量为 `]`，重置音量为 `\`，并通过 schema 迁移补齐旧配置中的空快捷键。
- 修复快判轻量题卡摘要在 LabelX 横向题卡布局中不可见的问题：摘要题卡根节点强制占满整行，并增加从 ASR 差异视图 `data-asr-edge-signature` 回退读取文本。
- 再次调整快判轻量题卡摘要挂载点：摘要改为插入到 `.labelRender-scrollable` 下对应原题卡前方，避免原题卡在隐藏内容区 / 回答区后被压缩或裁剪导致摘要不可见。
- 修复快判轻量题卡摘要在 LabelX 持续 DOM 更新时不生成的问题：启动时立即扫描题卡，后续 MutationObserver 改为节流扫描，避免防抖计时器被连续变动长期重置。
- 同步修复快判 ASR 对齐差异视图的扫描时机：启动时立即处理现有题卡，后续 DOM 变动改为节流扫描，避免刷新页面后差异视图迟迟不生成。
- 增强快判轻量题卡摘要：在“哪个ASR更优”当前选择下方显示音频时间比，并在 ASR 对齐差异视图开启时同步用差异高亮版本展示摘要内两条 ASR 文本。
- 修复快判轻量题卡摘要宽度：摘要外层保持整行避免与原题卡并排，内部可视卡片按对应 `.labelRender-item` 实际宽度缩放，适配 LabelX 卡片大小 / 列数变化。
- 为快判 ASR 对齐差异视图新增颜色设置：options 可分别配置替换 / 不同字、缺字 / 多字、标点 / 空格的高亮背景色，普通差异视图和轻量题卡摘要共用该配置。
- 优化快判 ASR 文本对齐算法：降低标点和空格插入 / 删除权重，减少标点差异导致中文主体错位的问题。
- 修正快判轻量题卡摘要挂载方式：摘要改为插入 `.labelRender-item` 根节点内部顶部，并清理旧版外部摘要块，恢复 LabelX 原生多列 / flex 排版。
- 优化快判轻量题卡摘要展示：ASR 文本改为自动换行完整显示，五种判别结果使用不同颜色，差异摘要移动到标题下方以对齐右侧音频时间。
- 新增快判统计上传框架：创建 `asr-judgement-server.js`，按 CSV 样例生成分包级补丁记录，支持进入子任务后上传、工具栏手动上传、10:00 / 16:00 定时上传和远程时间配置 URL 预留。
- 调整快判统计上传入口：上传按钮移到 options 快判设置面板，取消进入子任务详情自动上传；上传地址改为服务器 / 本机两个选项，默认服务器 `47.108.254.138:3333`，并让 `asr-judgement-server.js` 可直接启动本地接收服务。
- 拆分快判统计本地服务：`asr-judgement-server.js` 回归扩展侧上传运行时，新增 `backend/server.js` 作为 Node 启动入口，并按 HTTP、CSV 列、CSV 写入、文件存储和分包合并拆成小文件。
- 调整快判统计上传到 LabelX 标注首页：在 `labelingTask?projectId=...` 页面显示“上传统计”按钮，使用首页 `tasks`、`subTasks` 和 `/subTask/{subTaskId}/data` 批量采集后上传，options 不再提供手动上传按钮和单独的定时时间输入框。
- 快判统计定时配置改为从“上传接口地址”追加 `purpose=schedule` 获取，本地 `backend` 服务支持批量 `payloads` 合并，并新增定时配置响应。
- 优化快判统计上传首页采集：通过 DevTools 确认审核首页 `/checkTask` 使用 `type=check` / `subTaskType=check`，上传按钮改为挂载在顶部头像旁，首页点击时同时采集标注和审核两类分包；补充头像 hover 用户名结构、审核首页结构和网络采集文档。
- 为快判统计上传新增 ASR 更优判断任务过滤：优先按 `labelModel=vote` 识别，结合 `taskName` 和 `size=400` 兜底，自动跳过 `labelModel=single`、`size=50` 或 `中文普通话asr任务` 的历史转写数据。
- 优化快判统计上传数据规模处理：时长秒数统一保留 4 位小数，详情页上传和定时上传改为按 `projectId` 采集全账号数据；本地统计服务默认只落合并 CSV，不再写 `statistics-rows.json` 和上传事件日志，并将批量合并改为一次读写。
- 修正快判详情页统计上传：移除当前 `subTaskId` 单条上传回退，详情页、首页和定时上传统一走 `projectId` 项目级批量采集，保证同一账号同一项目上传行数一致。
- 新增根目录 `platform-resources/` 平台资源库，迁移 Alibaba LabelX 快判的页面结构、网络采集、统计格式、未完成事项和本地调试后端；后续跨 Edge / Chrome 共用的资料与工具统一写入该目录。
- 移除快判扩展目录中的旧 `page-structure/` 内容；将快判统计本地 Node 服务迁移到 `platform-resources/alibaba-labelx/asr-judgement/backend/`，并更新启动路径和统计输出目录。
- 新增 `platform-resources/backend/` 统一 Node 后端入口和路由注册结构，快判项目后端改为通过 `index.js` 注册 API；新增统计 CSV 下载接口 `/api/alibaba-labelx/asr-judgement/statistics/download`。
- 将快判统计服务器上传地址改为域名 `https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/upload`，扩展 manifest 版本提升到 `0.2.1` 并新增域名 host permission；移除 CSV 下载旧接口 `/api/asr-judgement/statistics/download`。
- 合并快判统计资料目录：删除仅含 README 的 `platform-resources/alibaba-labelx/asr-judgement/statistics/`，统计宽表字段、上传规则和服务端合并契约统一维护到 `backend/README.md`。
- 恢复快判默认每页条数中的 `400 条/页` 入口：options 只新增 400 档位，运行时将 400 识别为自定义全量请求并改写详情页 `data` 请求，`100/150/200 条/页` 继续不开放并回退到 `50 条/页`。
- 新增快判“雷题判断”能力：manifest 版本提升到 `0.2.2`，打包本地 `thunder-question-bank.csv` 雷题库，options 默认开启开关；命中雷题时在轻量题卡摘要和回答区“特殊情况标注”显示标准答案，当前选择与标准答案不一致时显示红色严重提示和错误 toast。
- 增强快判统计上传失败诊断：非 2xx 响应会显示状态码、目标上传地址和响应摘要；浏览器权限、CORS、证书或网络拦截导致请求未发出时会显示更明确的错误来源。
- 修正转写脚本在 LabelX 非转写页面的契约缺失告警：manifest 版本提升到 `0.2.3`，`content.js` 改为等待 `runtime-contract.js` 注入后再启动，超时仍缺失时以 info 级日志跳过，避免在快判首页出现 `Runtime contract is not loaded` 扩展错误。
