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




