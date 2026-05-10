# 标注脚本中心维护说明

## 项目定位

- 当前仓库根目录是 `C:\Projects\annotation-script-center`。
- 当前仓库是“标注脚本中心 annotation-script-center”。
- 当前项目处于“Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段”，不是初始化、骨架或 Demo。
- 当前通用扩展源码目录是 `extension/`，这是“标注脚本中心”的 Chrome / Chromium MV3 兼容扩展源码目录。
- 当前重点平台包括：`Alibaba LabelX`、`标贝易采`。
- 当前重点脚本包括：`extension/sites/alibaba-labelx/asr-judgement/`、`extension/sites/alibaba-labelx/asr-transcription/`、`extension/sites/data-baker/round-one-quality/`。
- 当前统一后端入口是 `platform-resources/backend/server.js`。
- `extension/` 是唯一业务运行时代码源。Chrome 和 Edge 本地加载、打包、调试都应优先使用同一目录，不再复制一套业务逻辑。

## 协作执行规则

### 单人项目 Git 工作流

- 当前项目为单人维护项目。
- 默认直接在 `main` 分支完成执行类任务。
- 默认不创建 feature branch。
- 默认不创建 Pull Request。
- 只有用户明确要求“开分支 / 开 PR / 不直接改 main”时，才允许走分支或 PR。
- 执行类任务验证通过后，默认直接 `git add` / `git commit` / `git push` 到 `main`。
- 只读审计任务不提交。
- 验证失败不提交、不 push。
- 用户明确说“不要提交”时不提交。
- 如果当前不在 `main`，必须先说明并切回 `main`，不得在非 `main` 分支悄悄完成并 push 后结束。

### subagent / parallel agents 使用规则

- 文档小修、小 UI、小 bug 可以不使用 subagent。
- 涉及多平台、多脚本、多模块、MAIN world / ISOLATED world 通信、后端 AI 调用、网络拦截、快捷键、DOM 结构、日志脱敏、部署联动等复杂任务时，优先使用 subagent / parallel agents。
- 如果当前 Codex 环境不支持 subagent / parallel agents，则按相同分工串行执行。
- 执行 Prompt 中应明确是否使用 subagent / parallel agents。

### 默认 GitHub 直接验收规则

- Codex 执行并 push 到 `main` 后，默认由网页端指挥 AI 直接通过 GitHub 验收。
- 默认不再输出“验收检测 Prompt”。
- 网页端指挥 AI 默认检查：
  - `main` 最新 commit。
  - 是否已 push 到 `main`。
  - diff 与修改文件。
  - 关键代码实现。
  - 文档同步。
  - GitHub Actions / CI（如存在）。
  - 是否通过、明显问题、风险点、是否建议保留提交、下一步建议。
- 仅在以下情况输出验收 Prompt：
  - 用户明确要求“给我验收 Prompt”。
  - 需要 Codex 在本地环境重新跑命令。
  - GitHub `main` 看不到最新代码。
  - 需要浏览器手工测试且用户希望 Codex 或本地环境辅助执行。

### 网页端指挥 AI 与 Codex 执行 AI 协作模式

- 网页端 ChatGPT 是项目指挥、需求整理、任务拆解和验收方。
- Codex 是本地执行方，负责读代码、改代码/文档、验证、提交并 push。
- 网页端给出的 Codex Prompt 是当前任务的直接执行依据，不是建议稿。
- `AGENTS.md` 是长期规则；网页端 Prompt 是当前任务规则。
- 若网页端 Prompt 与旧文档冲突，当前任务先按 Prompt 执行；最终输出必须说明冲突点，并在合适文档同步为正式规则。
- Codex 不得把网页端 Prompt 当作“仅讨论，不执行”的内容。

### 执行类任务不得停留在审计报告

- 任务要求修改、重构、实现、删除、补文档、提交或 push 时，必须完成实际落地。
- 子代理或审计阶段只能作为执行前分析，不能替代主线程执行。
- 使用 subagent / parallel agents 时，主线程必须整合结论并继续完成主任务。
- 只有任务明确是“只读审计 / 调研 / 不修改 / 不提交”时，才允许不改文件。
- 因页面、账号、服务等条件不足导致部分步骤无法完成时，仍要完成所有不依赖该条件的代码/文档修改，并在最终输出列出阻塞项。
- 执行类任务禁止仅以“如果你要，我下一步可以执行”收尾；应按当前 Prompt 直接执行到可交付状态。

### 网页端已确认信息沉淀规则

- 用户在网页端确认的业务规则、限制、暂不实现内容、字段契约、保存策略、快捷键策略、验收口径等，必须写入对应 README/docs。
- 这些信息若影响当前功能行为，必须同步更新根目录 `log.md`。
- 不允许只把关键规则写在最终回复里。
- 优先写入对应模块 README，例如：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `platform-resources/alibaba-labelx/...`
  - `docs/...`
- 若暂不确定文档落点，先更新对应模块 README，并在最终输出说明后续可迁移到更细文档。

### Codex 最终输出要求

- 最终输出至少包含：
  - 当前分支。
  - 修改文件列表。
  - 删除文件或删除逻辑列表（如有）。
  - 关键修改说明。
  - 文档同步位置。
  - 验证命令和结果。
  - `git status --short`。
  - commit hash。
  - push 结果。
  - 风险点。
  - 需要网页端或真实浏览器继续验收的内容。

## 开发策略

- 先继续以 Edge 作为主要人工验证浏览器，同时保持源码为 Chrome / Chromium MV3 通用形态。
- 不要同时维护 Edge 和 Chrome 两套业务逻辑；Chrome、Edge 应加载同一个 `extension/` 目录或同一份打包产物。
- 如果涉及 Edge / Chrome 差异，优先收敛到 `manifest`、浏览器 API 兼容层、打包配置、发布说明或少量适配文件，业务运行时代码不要拆成两套。
- 判断和转写先完全独立，不提前抽公共 `shared` 业务目录。
- 只有后续确认某些能力确实复用时，才允许提取公共目录，并在对应 README 和 `log.md` 里记录原因、调用方和验证步骤。

## ASR 转写当前业务口径

- `asr-transcription` 当前只做基础功能。
- 一条音频对应一个完整文本框。
- 当前不实现时间戳。
- 当前不实现说话人区分。
- 当前不实现 AI 初稿、AI 校对或 AI 格式化。
- 保存方式以平台自动保存为准。
- 不新增自定义后端保存接口。
- 不盲目构建或注入自定义保存 payload。
- 快捷键只保留当前已有功能相关动作，不额外添加新动作。
- 不照搬 `asr-judgement` 的判别动作、保存 payload、自动下一条逻辑。
- 允许在 `asr-transcription` 范围内重构明显错误、重复、遗留或与当前规则冲突的代码。
- 删除前必须先检查引用关系（manifest、注入链路、options、运行时入口）。

## 统计上传与后端地址统一口径

- 后续所有平台脚本若具备数据导出/统计上传能力，统计上传必须默认强制启用，不在脚本详情页提供关闭开关。
- 若脚本实现了定时上传能力，则定时上传也默认强制启用；没有定时上传能力的脚本不强制新增该能力。
- 各脚本详情页不得新增“是否启用统计上传 / 是否启用定时上传”开关。
- 各脚本详情页不得新增独立后端地址、上传接口地址或 AI 接口地址配置。
- 后端地址统一由 options 首页顶部“后端接口地址”（`server` / `local`）控制，运行时统一按 `baseUrl + API path` 拼接。
- 脚本详情页只保留业务参数配置（例如快捷键、倍速、音量、AI 推荐启用），不暴露基础数据上传能力开关。
- 标贝易采导出上传能力必须采用“前端导出 + 后端保存”边界：`extension/sites/data-baker/round-one-quality/group-export.js` 只负责采集、生成 CSV、本地下载和上传请求；Node 落盘与下载接口必须放在 `platform-resources/data-baker/round-one-quality/backend/`。
- `platform-resources/data-baker/round-one-quality/backend/export-data/` 属于运行数据目录，必须加入 `.gitignore` 且不得提交。

## 目录边界

- `extension/sites/alibaba-labelx/asr-judgement/`：快判运行时代码。
- `extension/sites/alibaba-labelx/asr-transcription/`：转写运行时代码。
- `platform-resources/`：Chrome / Edge 共用的平台资源库，保存 LabelX 页面结构、网络请求、统计格式、未完成事项和浏览器无关调试工具。
- `platform-resources/backend/`：平台资源统一 Node 后端入口，后续新增平台 / 项目 API 时优先接入这里。
- `platform-resources/alibaba-labelx/asr-judgement/backend/`：快判统计上传本地 Node 调试服务，按 `batchId` / 分包ID 合并 CSV 宽表。
- 新任务如果是快判，不要误改 `asr-transcription/`，除非任务明确要求。
- `extension/sites/alibaba-labelx/` 根目录不放业务 JS，业务运行时代码放在具体脚本目录里。
- 快判页面 DOM 或网络相关修改，优先参考 `platform-resources/alibaba-labelx/asr-judgement/` 下的文档和 HTML 片段，不要凭印象猜结构。

## 快判模块归属

- `content.js`：快判入口编排层，只保留设置加载、启停、状态聚合、网络桥接和模块串联。
- `judgement-actions.js`：判别选项、快捷键动作顺序和“哪个ASR更优”单选写入。
- `judgement-shortcuts.js`：键盘 / 鼠标快捷键匹配、事件拦截和后续事件抑制。
- `judgement-toast.js`：右上角运行时提示。
- `judgement-toolbar.js`：`.mark-toolbox` 工具栏和顶部主导航总时长 / 默认音频参数 / 每页条数挂载。
- `judgement-page-size.js`：默认每页条数、原生分页选择器点击和重试。
- `judgement-duration-summary.js`：总时长请求、分页补齐和网络摘要归一化。
- `judgement-virtual-window.js`：未完成的实验性窗口化显示代码，当前前端不展示开关，运行时强制关闭。
- `judgement-asr-diff-view.js`：ASR 文本对齐差异视图，隐藏原始双行文本并生成高亮对齐阅读区，维护差异高亮颜色。
- `judgement-thunder-question.js`：雷题库读取、题卡匹配、标准答案提示和当前选择不一致告警。
- `judgement-compact-card.js`：轻量题卡摘要，在对应 `.labelRender-item` 根节点内部补充 ASR 文本、音频时间比和当前判别状态，可视宽度跟随原题卡且不破坏 LabelX 原生多列布局。
- `asr-judgement-server.js`：快判扩展侧统计上传模块，顶部导航头像旁挂载“上传统计”，详情页、标注首页、审核首页和定时上传统一通过 LabelX `tasks` / `subTasks` / `subTask/{id}/data` 按 `projectId` 批量采集，并上传给外部服务端。
- `platform-resources/backend/`：统一 Node 后端启动入口和基础路由工具，`server.js` 是推荐启动入口。
- `platform-resources/alibaba-labelx/asr-judgement/backend/`：快判统计本地 Node 调试服务目录，`index.js` 注册项目 API，`server.js` 保留为兼容启动入口。
- `judgement-auto-advance.js`：选择判别结果后的当前页自动下一题。
- `audio-controller.js`：音频扫描、默认配置、单音频临时状态和动作路由。
- `audio-volume-controller.js`：当前音频音量和 Web Audio gain；重置回 options 默认音量。
- `audio-rate-controller.js`：当前音频倍速、倍速显示和重置；重置回 options 默认倍速。
- `audio-playback-controller.js`：播放、暂停、自动播放、相邻音频播放和当前音频前进 / 后退。
- `page-world/network-*.js`：运行在 MAIN world，负责 data 请求改写、响应摘要和 `postMessage`。

## 修改前检查

- 修改快判前先读：
  - `extension/manifest.json`
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/options/options.js`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md`
- 涉及页面结构、网络请求或统计格式时，再读 `platform-resources/alibaba-labelx/asr-judgement/` 下对应资料。
- 这是浏览器扩展 content script / MAIN world 注入环境，不是 Tampermonkey 脚本。
- MAIN world 与 ISOLATED world 只能通过 `window.postMessage` 等桥接通信，注意 source/type 字符串一致。

## 文档要求

- 所有 Markdown 文档使用中文书写；技术文件名、API 名、选择器、代码标识可以保留英文。
- 每次有功能、目录结构、模块归属、选择器或验证步骤变化，都要同步更新相关 README。
- 每次有有意义的代码或行为变更，都要更新根目录 `log.md`。
- 如果新增或确认 LabelX DOM 结构、网络请求或统计契约，优先整理到 `platform-resources/` 对应平台和脚本项目目录。
- 网页端确认的业务信息不得只写在最终回复里，必须同步沉淀到 README/docs；如影响行为或协作口径，必须同步更新 `log.md`。
## 安全规则

- 扩展前端不保存 API Key、cookie、access token、完整签名音频 URL 或完整音频 URL。
- 模型 API Key 只放后端环境变量或 `config/env/ai.env`。
- 真实 `config/env/ai.env`、`config/env/ai.local.env`、`.env`、`.env.*` 不得提交。
- 模板 `config/env/ai.env.example` 可以提交。
- 日志、错误提示和调试输出必须脱敏。
- 不输出 API Key、cookie、token、完整签名 URL、完整音频 URL。
- AI 建议 / AI 推荐文本默认是辅助能力，不自动保存、不自动提交、不自动领取、不自动流转。
- 标贝易采 “填入推荐文本”必须由用户主动点击或快捷键触发，不自动提交平台任务。
- 快判 AI 建议必须保持人工确认，不绕过雷题或平台限制。

## 验证要求

- 修改 JS 后运行 `node --check` 检查变更文件。
- 修改 `manifest.json` 后必须确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 快判页面人工验证至少覆盖：扩展重新加载、快判详情页加载、`1~5` 判别、音量、倍速、播放暂停、工具栏按钮、顶部总时长、每页设置、切换到非快判 active project 后不触发快判。
- 若 `chrome_devtools` 或真实业务页面不可访问，不得伪造页面结论；可先基于仓库代码和 `platform-resources/` 文档完成可执行部分。
- 执行类任务中，不依赖真实页面的代码/文档修改应继续完成，不得因为页面不可访问而整体停止。
- 涉及保存、提交、切页、快捷键、DOM 选择器、网络请求等行为时，最终输出必须明确标注“需要真实页面验证”的验收项。
- 先做审计后做改造的任务，审计报告只能作为中间产物；若 Prompt 要求落地修改，必须继续执行到满足验收标准。
- 若当前轮只完成审计未完成修改，必须明确标注“未完成执行目标”，不得将审计输出视为任务完成。

## 版本与打包发布规则

- 每次执行类任务只要修改了扩展源码、manifest、options、popup、content script、shared、平台脚本、后端接口契约、用户可见文案、文档发布说明或会影响扩展分发的内容，都必须同步检查是否需要提升 `extension/manifest.json` 版本号。
- 默认只要本轮有代码或用户可见行为变化，就提升 patch 版本（例如 `0.2.9 -> 0.2.10`）。
- 例外：如果当前任务是在修复“当前已生成但未通过真实使用验证”的同一版本 BUG，可以保持版本号不变。
- 例如：`0.2.10` 正在修复和验证期间，可持续使用 `0.2.10`，不因同一轮 BUG 修复重复提升到 `0.2.11`。
- 只有当该版本已完成真实浏览器验证并准备进入下一轮功能或发布时，再提升下一个 patch 版本。
- 用户明确要求“保持当前版本号修 BUG”时，以用户要求为准。
- 纯只读审计、不改文件、不提交时不改版本号。
- 只改内部文档且不影响扩展使用时，可以不提升版本号；但如果用户明确要求“更新版本 / 打包 / 发布”，必须提升版本号。
- 修改 `manifest.json` 后必须验证 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 执行类任务验证通过后，如果本轮有扩展源码、manifest、options、popup、content script、shared、平台脚本或用户可见行为变更，默认生成扩展压缩包到 `dist/`。
- 如果用户明确要求打包，即使本轮只改文档，也必须生成压缩包。
- 压缩包命名规则：`dist/annotation-script-center-v<manifest.version>.zip`。
- 压缩包内容必须直接来自 `extension/` 目录内部文件；根目录必须直接包含 `manifest.json`、`background/`、`options/`、`popup/`、`shared/`、`sites/`，禁止多套一层 `extension/` 目录。
- `dist/` 是构建产物目录，默认不提交 git。
- 如果系统缺少压缩工具导致打包失败，验证失败，不得提交和 push。
- 推荐 PowerShell 打包命令：
  ```powershell
  $manifest = Get-Content -Raw extension\manifest.json | ConvertFrom-Json
  $zipPath = "dist\annotation-script-center-v$($manifest.version).zip"
  New-Item -ItemType Directory -Force dist | Out-Null
  if (Test-Path $zipPath) { Remove-Item $zipPath }
  Compress-Archive -Path extension\* -DestinationPath $zipPath -Force
  Write-Host "已生成：$zipPath"
  ```
- Codex 最终输出必须包含：旧版本号、新版本号、是否已生成 `dist` 压缩包、压缩包路径、压缩包根目录检查结果。

## Git 提交要求

- 每次完成代码或文档修改后，验证通过再提交到 git。
- 提交前先查看 `git status`，确认只暂存本轮相关文件。
- 如果工作区存在明显无关或无法确认归属的改动，不要混入提交，应在最终回复中说明。
- 提交信息使用中文，简明说明本轮改动目的。
- 当前项目按单人维护流程，执行类任务验证通过后默认直接 push 到 `main`；仅在只读审计、验证失败或用户明确禁止提交时不 push。

## 2026-05 稳定协作规则补充（网页端已确认）

本节用于同步网页端已长期确认且需强约束执行的规则；若与历史口径冲突，以本节和当轮用户 Prompt 为准，并在后续文档中持续去重收敛。

### 1) 项目阶段和协作模式

- 当前项目是“标注脚本中心 annotation-script-center”。
- 当前阶段是“Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段”。
- 当前仅使用 Codex 执行，不再使用 MiniMax。
- 网页端 ChatGPT 是项目指挥 AI，负责需求整理、任务拆分、Codex Prompt 输出、GitHub 验收和风险判断。
- Codex 是本地执行 AI，负责读取代码、修改代码/文档、验证、`git status`、`git add`、`git commit`、`git push`。
- 执行类任务默认验证通过后直接 commit 并 push 到 `main`。
- 只读审计任务不得修改、不得提交、不得 push。
- 验证失败不得 commit / push。
- 默认不创建分支，不创建 PR；仅当用户明确要求时才允许例外。

### 2) 核心目录（固定认知）

- `extension/`
- `extension/background/`
- `extension/options/`
- `extension/popup/`
- `extension/shared/`
- `extension/sites/alibaba-labelx/asr-judgement/`
- `extension/sites/alibaba-labelx/asr-transcription/`
- `extension/sites/data-baker/round-one-quality/`
- `platform-resources/`
- `platform-resources/alibaba-labelx/`
- `platform-resources/alibaba-labelx/asr-judgement/backend/`
- `platform-resources/alibaba-labelx/asr-transcription/backend/`
- `platform-resources/data-baker/round-one-quality/backend/`
- `platform-resources/backend/server.js`
- `platform-resources/backend/registry.js`
- `config/env/`
- `log.md`
- `AGENTS.md`
- 用户可见名称优先使用“标贝易采”；代码路径、常量、环境变量可保留 `data-baker` / `dataBaker` / `DATABAKER_`。

### 3) 稳定业务规则

- `extension/` 是唯一扩展运行时代码源，Chrome / Edge 共用，不复制两套业务逻辑。
- 本项目是浏览器扩展，不是 Tampermonkey 脚本。
- MAIN world 与 ISOLATED world 仅通过 `window.postMessage` 等桥接通信，`source/type` 必须一致。
- 后端统一入口是 `platform-resources/backend/server.js`，默认监听 `127.0.0.1:3333`。
- 新增平台 API 时，业务逻辑优先放在 `platform-resources/<platform>/<script>/backend/`，再通过 `platform-resources/backend/registry.js` 注册。
- 后端地址只有一个全局入口：options 首页顶部“后端接口地址”（`server` / `local`）。
- 各脚本详情页不得新增独立后端地址、上传接口地址或 AI 接口地址配置。
- 各脚本运行时仅按 `baseUrl + API path` 拼接后端接口。
- 数据导出/统计上传属于默认能力时，上传必须强制启用，详情页不得提供关闭开关。
- 若脚本已实现定时上传，定时上传按脚本规则强制启用；未实现者不强制新增。
- `extension/` 前端只负责采集、生成 CSV、本地下载、POST 上传；Node 落盘、CSV 合并、下载接口必须放在 `platform-resources/.../backend/`。
- 运行数据目录（如 `statistics-data/`、`export-data/`）必须加入 `.gitignore`，不得提交。
- ASR 转写当前是轻量工具栏 + options 轻量设置面板 + 快捷键配置 + 音频配置 + 统计上传能力，不恢复 legacy 保存/提交/AI/批量流转能力。
- ASR 转写不做时间戳、说话人区分、AI 初稿/校对/格式化/标点、强制保存、自定义保存 payload、自动提交/领取/流转/跳转、整页受控执行、全页批量修改。
- ASR 转写统计取数以 `platform-resources/alibaba-labelx/asr-transcription/network.md` 为准，不得套用快判 `pageSize=400` 逻辑。
- 标贝易采 group/detail 导出必须保留本地下载，同时自动上传统一后端；上传失败不得阻断本地下载。
- AI 建议/推荐文本属于辅助能力，不自动保存、不自动提交、不自动领取、不自动流转。
- 标贝易采“填入推荐文本”必须由用户主动点击或快捷键触发。
- 快判 AI 建议必须人工确认，不得绕过雷题或平台限制。
- 扩展重新加载后旧页面可能出现 `Extension context invalidated`；应识别并停止旧实例或提示刷新，不得持续刷屏。

### 4) 版本与打包规则

- 修复当前测试版本 BUG 时不要自动升版本（例如当前在修 `0.2.10`，可保持 `manifest.version = 0.2.10`）。
- 只有用户确认当前版本通过真实浏览器验证并准备发布下一版时，才提升 patch 版本。
- 修改 `manifest.json` 后必须检查 JSON 可解析，并确认引用脚本路径存在。
- 打包 zip 根目录必须直接包含 `manifest.json`、`background/`、`options/`、`popup/`、`shared/`、`sites/`，不得多套一层 `extension/`。
- `dist` 构建产物默认不提交；若当前版本 zip 已被仓库追踪或用户明确要求提交测试包，则重新生成后可一并提交，并必须检查 zip 根目录结构。

### 5) 每轮优先阅读与按需补充阅读

- 每轮优先阅读：`AGENTS.md`、`README.md`、`extension/README.md`、`platform-resources/backend/README.md`、`log.md`、`extension/manifest.json`、与本轮任务直接相关的平台/脚本 README 与代码文件。
- LabelX 通用补充：`platform-resources/alibaba-labelx/README.md`、`page-structure.md`、`network.md`。
- 快判补充：`extension/sites/alibaba-labelx/asr-judgement/`、`platform-resources/alibaba-labelx/asr-judgement/`。
- 转写补充：`extension/sites/alibaba-labelx/asr-transcription/`、`platform-resources/alibaba-labelx/asr-transcription/`。
- 标贝易采补充：`extension/sites/data-baker/round-one-quality/`、`platform-resources/data-baker/round-one-quality/`。
- 后端补充：`platform-resources/backend/server.js`、`platform-resources/backend/registry.js`、对应项目 backend 目录。

### 6) Codex 执行 Prompt 必备字段

每次输出 Codex 执行 Prompt，必须包含：

- 当前阶段判断
- 推荐模型
- 推荐推理强度
- 是否使用 subagent / parallel agents
- 任务目标
- 修改范围
- 不允许修改的内容
- 验证命令
- 验收标准
- 是否自动提交
- commit message
- 必须 push 到 main
- 验证失败不得 commit / push

### 7) 验收规则

- 用户要求“检查项目/验收/看 Codex 结果”时，网页端直接通过 GitHub 检查 `main` 最新 commit、diff、代码和文档。
- 验收结论必须明确：是否通过、当前 `main` 最新 commit、是否已 push 到 `main`、明显问题、风险点、是否建议保留提交、下一步建议。
- 若存在并行 agent 或多次提交，不得只看 `main~1..main`，必须检查最近多次提交或用户指定 commit 范围。
- 真实浏览器行为必须明确列出需复测的页面、按钮、Network、Console、CSV 或下载结果。
- GitHub `main` 看不到最新改动时，应提示可能未 push，并要求提供 commit hash 或先执行 `git push`。

### 8) 验证规则

- 修改 JS 后，必须对实际改动 JS 运行 `node --check`。
- 修改 `manifest.json` 后，必须检查 JSON 可解析和脚本路径存在。
- 修改 Node 后端后，至少运行相关 JS `node --check`；可行时启动 `node platform-resources/backend/server.js` 做 smoke test。
- 修改 AI 后端路由后，优先验证 health；无真实 API Key 时不得声称真实模型调用已跑通。
- 修改平台后端接口后，必须验证本轮涉及的 `health/config/upload/download`。
- 修改 CSV/统计上传/导出下载后，必须验证表头、字段归属、合并规则、下载接口、保存目录，以及运行数据目录未提交。
- 修改 content script 后，最终必须列出人工浏览器验证步骤。
- 修改 options/popup 后，需检查扩展重载后的配置页或 popup。
- 涉及 `chrome.storage` / `chrome.runtime` 时，必须考虑 `Extension context invalidated`。

### 9) 安全与脱敏

- 不提交 API Key、cookie、token、authorization、access token。
- 不提交完整签名音频 URL、完整敏感音频地址。
- 不把完整音频 URL 写入扩展存储、DOM 属性、日志或 Markdown。
- 用户提供 fetch 示例、Network 请求、DevTools 截图若包含 cookie、SSO token、authorization、完整签名 URL，应先提醒脱敏；代码和文档不得写入这些内容。
- CSV 原始 JSON 列、导出文件、统计文件不得包含 cookie、token、authorization、完整音频 URL、完整签名 URL；如存在 URL，必须脱敏或截断。
- 错误提示和日志仅保留脱敏 summary、hostname、requestId、模型名、耗时、状态码等必要信息。

### 10) 文档要求

- 所有 Markdown 文档使用中文。
- 功能、目录结构、模块归属、选择器、接口契约、验证步骤变化时，必须同步更新相关 README。
- 每次有有意义的代码或行为变更，都要更新根目录 `log.md`。
- 新增或确认平台 DOM / Network / 统计契约时，优先沉淀到 `platform-resources` 对应平台和脚本目录。
- 新增后端保存目录时，必须同步更新 README 与 `.gitignore`，并明确运行数据目录不得提交。
- 网页端确认的新业务规则必须写入 `AGENTS.md` / README / `log.md`，避免后续执行回退旧口径。

### 11) 禁止事项

- 不要把项目描述为初始化、骨架或 Demo。
- 不要建议重建项目。
- 不要建议复制一套 Chrome / Edge 业务运行时代码。
- 不要建议无关大重构。
- 默认优先保持扩展可用、小步增强、真实平台口径优先。

### 12) 页面采集与验证工具工作流（长期规则）

- 获取网页 HTML 结构与 Network 请求时，默认优先使用 Google Chrome DevTools / MCP。
- 只有真实操作验证（按钮、快捷键、行为回归）或 Chrome DevTools 不可用时，才使用 Playwright Edge。
- Codex 默认只负责打开浏览器，不自动输入账号密码，不保存账号、cookie、token。
- 用户自行打开网址、登录并进入目标页面；用户回复“处理好了”后，Codex 再继续采集或测试。
- LabelX 公共资料沉淀到 `platform-resources/alibaba-labelx/`，转写专项资料沉淀到 `platform-resources/alibaba-labelx/asr-transcription/`。

### 13) LabelX 统计总表与供应商列规则（0.2.11 修正）

- ASR 转写与 ASR 快判统计内部都按“供应商 + 分包ID”合并，避免同分包跨供应商互相覆盖。
- 供应商识别优先级：
  1. `payload.supplier.name`
  2. `payload.vendor.name`
  3. `payload.supplier`
  4. `payload.vendor`
  5. `csvPatch["供应商"]`
  6. `taskName/name` 规则推断（含 `棋燊`、`希尔贝壳`）
  7. `未识别供应商`
- 任务名识别前需先 `decodeURIComponent`（失败回退原文），去掉 `BOM`，清理空白（普通空格/Tab/换行/回车/全角空格）并生成去空白 `compactTaskName`，再做包含匹配与前缀推断。
- 对转写已知供应商优先按任务名包含识别：包含 `希尔贝壳` -> `希尔贝壳`；包含 `棋燊` -> `棋燊`。
- 统计 CSV 使用动态供应商列策略：
  - 单供应商数据集：CSV 不输出“供应商”列。
  - 多供应商数据集：CSV 在最后一列追加“供应商”列。
- 不再无条件把“供应商”固定在中间列。
- CSV 写出前必须做字段清洗：去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符），避免把 ` 任务名称`、` 未识别供应商` 这类脏值直接写入 CSV。
- 当 `csvPatch["供应商"]` 为 `未识别供应商` / `unknown-supplier` / 空值时，必须回退到任务名重新识别供应商，不得直接沿用错误值。
- ASR 转写统计抓取按 `recordCount` 全量分页，不再固定只抓前 `5` 页、`50` 子任务或 `300` 详情条目。
- ASR 转写详情抓取并发按 `Math.floor(total/5)` 动态计算（`total` 为当前阶段待处理总数），最小 `1`、最大 `999`；详情优先 `pageSize=5000`，不足时继续分页补齐并在超限时明确告警，不静默漏数。
- ASR 快判统计也按相同并发规则执行：`Math.floor(total/5)`，最小 `1`，最大 `999`；快判详情仍保持 `pageSize=400` 口径，但必须按 `recordCount` 分页补齐。
- 有效时长仅统计“是否有效”严格等于“有效”的题目时长，不使用 `includes("有效")`。
- `legacy-reference/asr-script.user.js` 仅用于分页/并发/有效时长/`dataResultHistory` 兜底逻辑参考，不恢复 Tampermonkey 架构。
- 当前主存储恢复为根级总表：
  - `statistics-data/statistics-merged.csv`
- `/statistics/download` 默认下载根级总表，不要求 `supplier` 参数。
- `.../statistics/suppliers` 可保留为辅助信息接口，但不影响默认总表下载。
- 不再主动创建或写入 `statistics-data/suppliers/`；主写入固定为根级总表。
- 历史 `suppliers/<供应商>/statistics-merged.csv` 若本地已存在，属于旧方案残留，可忽略或手动清理；不再作为主输出目录。
- LabelX 转写上传流程已接入共享进度组件（`shared/progress-indicator.js`）：
  - 显示阶段、完成数/总数、百分比、并发、成功/失败。
  - 并发显示与实际执行并发一致；详情阶段按 `Math.floor(total/5)`，最小 `1`，最大 `999`。
- LabelX 快判上传流程同样接入共享进度组件；后续所有平台的长耗时统计/导出上传任务默认复用该组件，不再只显示“上传中”。





## 0.2.11 中文乱码修正（CSV 健康值合并）

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
- 统计 CSV 写入统一为 **UTF-8 with BOM**，提升 Excel 直接打开时的中文兼容性。
- CSV 写出前会清理关键字段（任务名称、标注员/审核员、供应商）的前后空白、BOM、零宽字符。
- 若旧 CSV 中存在 `�`（U+FFFD）损坏值，合并时优先采用新 payload 的健康值覆盖旧损坏值。
- 当 `供应商` 为 `未识别供应商`、`unknown-supplier`、空值或包含 `�` 时，必须回退到任务名称重新推断。
- LabelX 转写已知供应商仍按任务名优先识别：包含 `棋燊` -> `棋燊`，包含 `希尔贝壳` -> `希尔贝壳`。
- 主存储继续保持根级总表：`statistics-data/statistics-merged.csv`。
- 不主动生成 `statistics-data/suppliers/`，历史残留目录不作为主输出。
- 转写与快判后端都使用同一套“中文清洗 + 健康值优先”策略。
- 日志与错误信息继续脱敏，不记录 cookie、token、authorization、完整音频 URL。

## 0.2.11 导出完整性与断点跳过增强

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
- 统计以 `分包ID` 作为关键定位点：分包ID 为空的数据直接废弃，不写入 CSV、不上传。
- 后端新增 existing 检查接口（转写/快判）：
  - `POST /api/alibaba-labelx/asr-transcription/statistics/existing`
  - `POST /api/alibaba-labelx/asr-judgement/statistics/existing`
- 导出前先检查已有根级总表 `statistics-data/statistics-merged.csv`：
  - `complete=true` 的分包数据直接跳过详情拉取。
  - `complete=false` 或不存在的数据继续拉取详情并重试。
- existing 检查失败时回退全量拉取，不阻断导出流程。
- 失败数据定义调整为：分包ID为空（废弃/拒绝）、详情请求失败、JSON解析失败、上传请求失败等真正失败；字段空白默认记为 warning/incomplete，不计入 failed。
- 结束时若存在失败数据，提示：`有数据导出失败，请再次点击导出`。
- 再次点击导出时会优先跳过已完整数据，重点补失败/不完整数据。
- 动态并发规则统一为：`Math.floor(total / 5)`，最小 `1`，最大 `999`。
- 转写与快判进度条都展示：阶段、完成/总数、并发、成功、失败，并支持 skipped/discarded 摘要。
- 定时上传时间统一：每天 `10:00`、`16:00`。
- 定时上传到服务器前新增随机延迟：`0~300` 秒、`100ms` 步进；手动上传不延迟。
- CSV 主存储继续为根级总表：`statistics-data/statistics-merged.csv`；不主动生成 `statistics-data/suppliers/`。
- CSV 继续使用 UTF-8 with BOM，单供应商不输出“供应商”列，多供应商在最后一列输出“供应商”。
- 全流程继续脱敏：不记录 cookie、token、authorization、完整音频 URL。

## 2026-05-10 0.2.11 失败判定修正
- LabelX 统计按标注/审核分角色逐步合并：另一角色字段为空属于正常情况，不再判失败。
- 只有 `分包ID` 为空时才直接废弃（discardedNoBatchId），不写 CSV、不上传。
- `任务名称/任务ID/人员/领取时间/提交时间/有效时长` 为空默认记为 warning/incomplete，不阻断上传。
- 批量上传改为“部分失败不影响成功数据保存”，后端返回 `acceptedCount/rejectedCount/rejectedItems`。
- 结束提示规则：仅当 `failed > 0` 才提示“有数据导出失败，请再次点击导出”；仅 warning 时提示“部分字段待后续角色补齐”。
- existing `complete` 按当前 role 最小条件判断：转写 `label=标注子任务ID`、`audit=审核子任务ID`；快判 `label=任一标注员子任务ID`、`audit=审核子任务ID`。
- 统计主存储继续为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 并发规则保持 `Math.floor(total / 5)`，最小 `1`，最大 `999`；定时上传保持 `10:00/16:00`，上传前随机延迟 `0~300s`（`100ms` 步进）。


## 2026-05-10 0.2.11 complete/跳过修正
- `existing` 接口中 `exists=true` 不等于 `complete=true`；只有满足最低完整条件才可跳过。
- 转写 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID`。
- 快判 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID（label 为任一标注员槽位ID）`。
- 任务名称为空不算失败，但必须判为 `complete=false`，下次导出继续拉详情补齐。
- `exists=true && complete=false` 必须继续拉详情与上传，不计入 `skippedComplete`。
- 无待上传数据（`payloads.length=0`）时不调用 `/statistics/upload`，提示“已全部完整，无需上传”。
- 上传进度板块宽度已增大（`min-width:560px`、`max-width:780px`、允许换行），四位数成功/失败数量可见。
- 主存储仍为根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 版本保持 `0.2.11`。

## 2026-05-10 0.2.11 待补任务名称与进度样式补充

- 当前版本继续保持 `0.2.11`，不升级到 `0.2.12`。
- `existing` 接口返回 `exists=true && complete=false` 时，前端必须继续拉取并补齐；不得按 `exists=true` 直接跳过。
- 转写补齐任务名称时必须使用健康文本优先回退链路：`detail.taskName/name -> summary.taskName/name -> taskMap.taskName/name`。
- 当 `detail` 返回空任务名称时，不得覆盖 `summary/taskMap` 中已存在的健康任务名称。
- 转写后端合并时，同 `分包ID + role + subTaskId` 应优先复用旧行，允许健康新值覆盖旧空值/未识别值，避免遗留“任务名称为空”的旧行长期无法补齐。
- `供应商=未识别供应商` 且任务名称可识别（棋燊/希尔贝壳）时，必须回退任务名称重新识别供应商。
- 进度条卡片必须水平居中，进行中与完成态保持同一紧凑布局；完成态不得出现整块拉伸或挤压关键数字的问题。
- 无待上传 payload 时，不调用 upload 接口，并明确提示“已全部完整，无需上传”。

## 2026-05-10 0.2.11 进度悬浮窗样式补充

- 当前版本继续保持 `0.2.11`，本轮仅修前端显示样式，不改统计导出业务逻辑。
- `shared/progress-indicator.js` 统一使用页面顶部居中悬浮窗（fixed）展示，避免进度条挤占 LabelX 顶部导航布局。
- 进行中/成功/失败/警告都必须复用同一紧凑卡片结构，完成态不得切换成横向整条提示条。
- 转写与快判上传按钮状态更新不得写入长 `title` 文案；组件与按钮悬停都不应出现黑色长 tooltip。

## 2026-05-10 0.2.11 稳定统计规则沉淀（仓库协作入口）

- 当前阶段维持 `0.2.11`，本节用于沉淀网页端项目指令中因篇幅压缩的稳定口径，后续执行默认按本节优先落地。
- 页面采集工作流固定为：HTML/Network 结构采集默认用 Chrome DevTools / MCP；Playwright Edge 仅用于真实按钮/快捷键/行为验证或 DevTools 不可用兜底；Codex 通常只负责打开浏览器，用户手动登录并进入页面，回复“处理好了”后再继续采集/测试；采集产物必须脱敏并写入 `platform-resources/` 对应目录。
- LabelX 统计主存储固定为根级总表：转写和快判都写 `statistics-data/statistics-merged.csv`；不主动创建 `statistics-data/suppliers/`，不把供应商目录作为主存储；`/statistics/download` 默认下载总表，不要求 `supplier` 参数。
- 分包ID是统计唯一关键定位点：`分包ID` 为空直接废弃（不写 CSV、不上传）；标注/审核按同一分包逐步合并；另一角色字段为空是正常情况；`任务名称/任务ID/人员/时间/有效时长` 为空默认记为待补（warning/incomplete），不阻断保存；未完成任务无提交时间正常；有效时长 `0` 合法。
- `existing/complete/upload` 固定规则：`exists=true` 不等于 `complete=true`；只有 `complete=true` 才能跳过详情；`complete` 最低要求为 `分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID`；无待上传数据时严禁调用 upload；禁止上传空 payload/占位 payload；批量部分失败不得影响成功数据保存。
- CSV 固定规则：写入必须 `UTF-8 with BOM`；写出前清理任务名称、人员、供应商、ID、时间、完成状态等字段；空值不得覆盖健康值；含 `�`（U+FFFD）的损坏值不得覆盖健康值；健康新值可覆盖空值/未识别值/损坏值；单供应商不输出“供应商”列，多供应商只在最后一列输出“供应商”，不得出现在中间列。
- 供应商识别固定规则：内部 `payload/mergeKey` 可保留 supplier；转写当前按任务名优先识别 `棋燊`、`希尔贝壳`；识别前必须清理前后空格、全角空格、Tab、换行及 BOM；当供应商为 `未识别供应商` 或含 `�` 时，必须回退到任务名重新推断。
- 进度/并发/定时上传固定规则：所有长耗时统计导出默认接入 `extension/shared/progress-indicator.js`；使用顶部居中悬浮窗；不写长 `title`，避免黑色 tooltip；进度展示阶段、扫描、详情、上传、跳过完整、字段待补、废弃、失败、并发等关键数字；动态并发固定 `Math.floor(total/5)`（最小 `1`，最大 `999`）；定时上传时间固定 `10:00`、`16:00`；定时上传前随机延迟 `0~300` 秒（`100ms` 步进）；手动上传不延迟。
- 验证增强规则：改 CSV writer 必须验证 BOM、单供应商表头、多供应商末列供应商、空值/损坏值不覆盖健康值；改统计上传必须验证“分包ID为空废弃”“字段待补不算失败”“exists 与 complete 区分”“无待上传不调用 upload”“部分失败不影响成功保存”；改进度组件必须验证悬浮窗居中、悬停无黑色长 tooltip、完成态样式不跳变、转写/快判共用；改定时上传必须验证 `10:00/16:00`、`0~300s` 随机延迟、`100ms` 步进、手动上传不延迟。
