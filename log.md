# 标注脚本中心修改日志

## 2026-05-17（Abaka AI：修复 Task21 specify 联动重复点击取消）

- 修复 Abaka AI Task21 快捷键联动重复点击导致 `specify` 被取消的问题。
- `same_font=true` 与 `same_font=same underlying font+artistic effect` 都会确保两个派生字段为 `specify`。
- `image_b_texts_removed=specify` 与 `other_changes=specify` 改为幂等选择：已选中时不重复点击，不会被取消。
- `4/5` 快捷键同样改为幂等 ensure 行为，重复触发不会取消已选中状态。
- 未修改提交/领取/放弃/跳过/送审逻辑，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：Task21 same_font 快捷键辅助第一版）

- 新增 Abaka AI Task21 ISOLATED content runtime：`content.js`、`shortcuts.js`、`dom-actions.js`、`toast.js`，并保留 MAIN world `network-structure-observer.js`。
- `extension/manifest.json` 新增 Abaka AI ISOLATED content script 注入（`shared/constants.js`、`shared/storage.js` + Task21 runtime 脚本）。
- 新增 Task21 快捷键动作与默认键位：
  - `1`：`same_font=true`
  - `2`：`same_font=false`
  - `3`：`same_font=same underlying font+artistic effect`
  - `4`：`image_b_texts_removed=specify`
  - `5`：`other_changes=specify`
- `same_font=true` 联动默认开启：自动选择 `image_b_texts_removed=specify` 与 `other_changes=specify`（可在 options 关闭）。
- options 新增 Abaka AI Task21 快捷键配置区：联动开关、快捷键录制/清除、恢复默认、保存。
- 快捷键只在 `/items` 且存在 `same_font` 字段时生效；焦点在输入框/textarea/editor 时忽略。
- 所有动作仅触发页面真实 DOM 点击，不直接调用保存、提交、领取、放弃、跳过、送审接口；平台是否自动保存由页面自身机制决定。
- 同步更新 Abaka AI 相关 README、平台索引和动作边界文档。
- 未提升 `extension/manifest.json` 版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：按 LabelX 快判风格收口 Task 页面网络目录）

- 将 `platform-resources/abaka-ai/network/common/` 中的状态 Tab、Skipped / Dropped、恢复、送审成功和内审只读文档合并进 `platform-resources/abaka-ai/network/task-page/`。
- `network/task-page/` 调整为类似 LabelX 快判 `network/` 的单层编号文档目录，新增完整索引、来源页面、操作步骤、初始化序列、状态变更链路和脱敏规则。
- 更新 Abaka AI 根目录、动作边界和平台资源索引中的旧 `common/` 路径。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：重排公共资料与任务项目目录）

- 按 LabelX 资料组织方式重排 Abaka AI 平台文档：根目录维护公共 Task 页面结构、动作边界、多语言和公共 Network。
- 将 Task 页面公共请求上移到 `platform-resources/abaka-ai/network/`，区分 `task-page/` 公共请求与 `common/` 公共状态流转。
- 新增 `platform-resources/abaka-ai/task21/`，仅保留 Task21 same_font、派生字段和专项保存结构。
- 新增 `platform-resources/abaka-ai/task17/`，记录 Task17 公共结构对比和领取审核空池失败响应。
- 更新平台索引、扩展 README 和平台资源总览中的 Abaka AI 路径。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补采剩余动作网络缺口）

- 使用 DevTools MCP 在标注权限下补采 `Label / 标注` 区域、`other_changes` textarea 暂存、语言切换和跨页选择请求结构。
- 确认 `Label / 标注` 是角色区域而非状态 Tab 专属 endpoint；`other_changes` 自由文本暂存复用 `/api/v2/label/save-labels`。
- 确认语言切换未观察到独立偏好保存接口；切回中文时仅捕获常规 `/api/message/list`。
- 仅观察跨页全选的选择态、列表刷新和帧数统计请求，未执行批量送审、批量恢复、批量领取等危险动作。
- 在 Task17 内审页补测 `领取审核` 空池失败响应，返回“无条目可领”；出现验证组件后未继续操作。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补充领取与中文动作文案）

- 使用 DevTools MCP 二次测试 Task21 `Claim Label` / `Claim Review`，均仍成功领取 1 条测试数据，未触发空池响应。
- 切换到简体中文环境，补齐 Data 页 `查看`、`领取标注`、`领取审核`、状态 Tab 和标注页 `暂存`、`放弃`、`跳过`、`送审` 等动作文案。
- 补充 Dropped 恢复后的目标状态：恢复后进入 Todo / 待办项。
- 按用户要求不记录统计分析、工作流、成员配置三页。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补采 Skipped / Dropped 恢复与标注送审链路）

- 使用 DevTools MCP 补采 Task 页面公共状态 Tab、Skipped / Dropped 列表和恢复链路。
- 标注权限下单条测试送审成功链路，确认 `save-labels -> submit-item` 和 Data 页 `Labeled / Pending Review` 状态变化。
- 标注内审权限下只观察列表、状态 Tab 和 `View` 查看页初始化，未提交、未通过、未驳回、未触发审核完成类动作。
- 新增 `platform-resources/abaka-ai/task-page/network/common/` 网络文档目录，区分公共 Task 页面能力与 Task21 `same_font` 专属能力。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补齐 Task21 动作网络请求）

- 按 LabelX 快判 `network/` 目录风格拆分 Abaka AI Task21 网络请求，新增编号文档和待补/接续说明。
- 使用 DevTools MCP 测试并补采领取标注、领取审核、单选/多选条目、same_font 暂存保存、放弃、跳过、送审前端校验和资源加载链路。
- 每个动作独立文档记录 request/response 结构摘要、后续链路、页面反馈和风险边界。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：按 LabelX 风格重构平台资料）

- 拆分 Abaka AI README 中的页面结构、Network、动作风险、多语言内容，README 收口为资料入口和当前状态。
- 新增/更新 `platform-resources/abaka-ai/README.md`、`platform-resources/abaka-ai/network.md`、`platform-resources/abaka-ai/task-page/network.md`、`platform-resources/abaka-ai/task-page/page-structure.md`、`platform-resources/abaka-ai/task-page/actions.md`、`platform-resources/abaka-ai/task-page/i18n.md`。
- `extension/sites/abaka-ai/task-page/README.md` 收口为运行时入口、注入范围和 Console 采集方法。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：深化 Task21 页面与 Network 结构采集）

- 使用 Google Chrome DevTools MCP 深度采集 Abaka AI Task21 页面结构和 Network 结构。
- 覆盖 Task21 全部数据页、批次页、标注/内审角色切换、单条选择、查看页、标注页、same_font 主标注区、右侧条目列表、语言切换与 Task17 对比页。
- 记录 same_font 单选、派生字段、资源区、图片查看器、锁定/暂停状态、暂存/放弃/跳过/送审等按钮结构；在测试账号单条范围内触发 same_font 选择、自动保存和放弃接口。
- 补充 `/items` 工作页接口族：条目历史、查看权限、操作权限、工作状态、标注数据、问题数据、标注记录、AI 检查、无效帧、抽帧数据、右侧条目列表、自动保存和放弃接口。
- 补充中文与 English 文案映射，明确后续定位应优先使用 route/query keys、表头结构、role/aria/data-col-key 和双语文案兜底，不能只依赖中文文本。
- Task17 仅作为公共结构对比，记录列表、`/items` 查看页、公共接口模式与 Task21 差异；未对 Task17 做领取、送审、放弃、跳过等状态变更。
- 文档仅记录脱敏结构；未提交真实 JSON/HAR/截图/CSV/原始接口响应，未记录 cookie、token、authorization、密码、签名或完整资源 URL。
- 本轮未实现自动化功能，未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补充 Task21 页面与 Network 结构文档）

- 使用 Google Chrome DevTools MCP 采集并整理 Abaka AI Task21 页面结构。
- 补充任务列表页 `/data-task/v2`、Task21 详情页 `/task-v2/data-item?taskId={taskId}`、批次视图 `/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}` 的 DOM 区域、表格字段、筛选控件和选择器候选。
- 补充登录后用户/权限、任务列表、Task21 详情、Workflow、批次列表、筛选列表、Todo 条目列表等 Network 结构摘要。
- 明确 `Claim Label`、保存、提交、领取、流转、跳过、跨页选择等危险操作边界；本轮未主动触发。
- 未提交真实采集 JSON/HAR/截图/CSV/原始接口响应，未记录 cookie、token、authorization、密码或完整资源 URL。
- 本轮仅更新 Abaka AI 文档和平台索引，不实现自动化功能，不修改运行时代码，不提升 `extension/manifest.json` 版本，不生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：新增 Task 页面结构只读采集壳）

- 新增 Abaka AI 平台与脚本登记：
  - 平台：`abakaAi`（host: `abao.fortidyndns.com`）
  - 脚本：`abakaAiTaskPageCapture`
  - 状态：只读采集阶段（仅 DOM/Network 结构采集，不做自动领取/保存/提交/流转）。
- `extension/manifest.json` 新增：
  - `host_permissions`: `http://abao.fortidyndns.com:30473/*`
  - MAIN world content script：`sites/abaka-ai/task-page/page-world/network-structure-observer.js`
- 新增 MAIN world 观察器：
  - 同时被动 hook `fetch` 与 `XMLHttpRequest`
  - 仅记录脱敏结构，不记录敏感原始值
  - Console 导出入口：`window.__ASCAbakaAiCapture.snapshot()` / `download()`。
- 文档同步：
  - 新增 `extension/sites/abaka-ai/task-page/README.md`
  - 新增 `platform-resources/abaka-ai/task-page/README.md`
  - 更新 `docs/platforms/index.md`、`README.md`、`extension/README.md`、`platform-resources/README.md`。
- 本轮不提升 `extension/manifest.json` 版本号，不发布，不生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-15（0.3.2 热修：快判 AI 规则按 0422 规范重写并补充错例 few-shot）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 AI 规则修复。
- 快判比较规则版本升级为 `asr-judgement-rules-20260422`（后端 `RULE_VERSION` 同步更新）。
- 快判 AI 比较规则重写为 P0/P1/P2 决策树：
  - 先分层判定两条候选；
  - 一条 P0/P1、另一条仅 P2 或无错时必须选更优条；
  - 两条都存在影响理解的 P0/P1 才允许 `both_bad`；
  - `uncertain_or_similar` 仅用于两条都合格且无明显优劣。
- 强化规则优先级：实意词、专有名词、动作词、否定词高于标点和格式；`heardText` 仅作辅助，不替代候选比较。
- 在 compare 规则模板中补充 6 个错例 few-shot：
  1) 共同核心漏字 -> `both_bad`
  2) 重复次数接近度 -> 选更接近者
  3) 两条动作实词都错 -> `both_bad`
  4) 实意词优先于格式 -> 选核心词正确者
  5) 领域词误切语气词 -> 选真实领域词
  6) 核心语义相反 -> 选语义正确者

## 2026-05-15（发布脚本增强：新增每版本 ZIP 产物）

- `scripts/package-crx-release.js` 新增每版本 ZIP 生成：`dist/annotation-script-center-v<version>.zip`。
- ZIP 默认打包 `extension/` 目录内容，并增加校验：文件存在、非空、包含 `manifest.json`。
- ZIP 内容保护校验：禁止命中 `config/`、`platform-resources/`、`docs/`、`dist/`、`.git/`、`node_modules/`、`config/secrets/`、`.env*`、运行数据目录等路径。
- 发布脚本输出日志调整为两组：
  - 当前手工分发文件：`CRX + ZIP`
  - 企业自动更新预留文件：`update.xml + crx-latest.json`
- `crx-latest.json` 增加 ZIP 元数据字段：
  - `zip_filename`
  - `zip_download_url`
  - `zip_sha256`
  - `zip_size_bytes`
- 文档同步：
  - `README.md`
  - `extension/README.md`
  - `docs/unfinished/crx-enterprise-managed-install.md`
  - `AGENTS.md`
- 本轮不修改运行时代码，不提升 `manifest.version`。

## 2026-05-15（0.3.2 文档整理：AGENTS 瘦身与平台索引）

- 新增 `docs/platforms/index.md`，集中维护平台与脚本文档入口，不在 AGENTS 堆平台细节。
- 更新 `docs/README.md`：新增 `docs/platforms/` 分类与关键入口。
- `AGENTS.md` 精简为项目级规则（工作流、暗号、目录边界、安全、验证、发布、文档规则），删除具体平台长口径，改为“先看平台索引再看对应 README/资料”。
- 更新 `README.md` 与 `extension/README.md` 文档入口，加入 `docs/platforms/index.md`。
- 本轮仅文档整理，不修改运行时代码，不变更 `manifest.version`。

## 2026-05-15（0.3.2 文档整理：指令与 docs 分层归档）

- docs 目录完成分层重构：`architecture/`、`workflow/`、`external-docs/`、`rules/`、`archive/`、`unfinished/`，docs 根层仅保留导航 `docs/README.md`。
- 新增 `docs/workflow/codex-prompt-style.md`，固定 Codex Prompt 输出格式（外层单一 text 代码块、禁止内部嵌套三反引号）。
- 新增 `docs/external-docs/aliyun-bailian.md`，集中沉淀阿里云百炼官方文档入口与查阅规则。
- 根 `README.md` 瘦身为项目概览 + 运行入口 + 文档导航，历史细节统一收口到 `log.md` 与 `docs/archive/`。
- 更新 `AGENTS.md`：补充 Prompt 输出摘要、百炼文档查阅规则、docs 分类规则与 shared 通用模块定位。
- 更新 `extension/README.md`、`platform-resources/backend/README.md` 的文档入口与百炼核对口径。
- 新增快判人工规范整理版：`platform-resources/alibaba-labelx/asr-judgement/ai/asr-judgement-official-rules.md`（P0/P1/P2、优先级、both_bad/uncertain 限制、错例摘要）。
- 本轮仅文档整理，不修改运行时代码，`manifest.version` 保持不变。

## 2026-05-15（0.3.2 热修：补齐转写提交快捷键设置项）

- 修复转写 options 快捷键列表缺项：补齐 `shortcutSubmitTask`（提交任务）与 `shortcutSubmitTaskAndFinish`（提交任务并结束）显示与保存。
- 补齐转写本地归一化默认字段：`shortcutSubmitTask: null`、`shortcutSubmitTaskAndFinish: null`，默认不占用键位。
- 转写运行时仍复用 `extension/sites/alibaba-labelx/shared/submit-actions.js` 执行提交动作；不新增工具栏按钮，不自动确认二次弹窗。
- `manifest.version` 保持 `0.3.2`。

## 2026-05-15（0.3.2 热修：提交快捷键抽为 LabelX 快判/转写通用能力）

- 新增通用模块 `extension/sites/alibaba-labelx/shared/submit-actions.js`，统一封装“提交任务 / 提交任务并结束”DOM 查找与点击逻辑（仅点击页面系统按钮，不直接请求平台 API，不自动确认二次弹窗）。
- 快判 `judgement-actions.js` 删除本地重复提交按钮查找代码，改为薄封装调用 shared submit-actions。
- 转写接入提交快捷键动作：`shortcutSubmitTask`、`shortcutSubmitTaskAndFinish`，并在 `shortcut-bus.js` / `content.js` 支持触发 shared submit-actions。
- 快判与转写提交类快捷键配置独立保存，默认均未绑定；顶部工具栏两边均未新增提交按钮。
- `manifest.version` 保持 `0.3.2`。

## 2026-05-15（0.3.2 热修：清理快判 AI 顶部按钮并新增提交快捷键）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本小修。
- 快判顶部工具栏 AI 分组收口：仅保留 `AI 分析当前题` 与 `复制两条 ASR 文本`，移除顶部 `AI 采用/AI 重试/AI 忽略` 三个重复按钮。
- AI 面板内“采用建议 / 重新分析 / 忽略”按钮和对应快捷键能力保持不变。
- 快判新增两个快捷键动作（默认未绑定）：
  - `submitTask`（提交任务）
  - `submitTaskAndFinish`（提交任务并结束）
- 提交类快捷键实现方式为点击页面真实系统按钮（`button/.ant-btn/[role=button]`），不直接调用平台接口；若出现二次确认弹窗需人工确认。
- 找不到目标按钮时返回清晰失败提示：`未找到“提交任务”按钮` 或 `未找到“提交任务并结束”按钮`。

## 2026-05-15（0.3.2：修复 LabelX 默认倍速与切题自动播放，新增通用音频核心）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本功能修复与模块整理。
- 新增通用模块：`extension/sites/alibaba-labelx/shared/audio-controller-core.js`，统一承载 LabelX 快判/转写的音频基础能力：
  - 默认倍速与默认音量应用
  - 倍速步进与前进/后退步长
  - 自动播放当前题
  - 切题时停旧播新
  - 单音频互斥播放
- 快判与转写 `audio-controller.js` 改为薄封装，继续保留原有 `globalThis` 接口名，`content.js` 侧改动最小。
- 修复“默认倍速只显示不生效”：音频应用默认值时同时写入 `playbackRate/defaultPlaybackRate`，并加入短延迟校验回写，避免平台组件把倍速回滚到 `1x`。
- 修复“切题旧音频继续播放”：选中题卡变化时立即暂停旧音频，再对新题音频应用默认值并自动播放（开启自动播放时）。
- 默认值调整：
  - 快判默认倍速改为 `2x`。
  - 转写默认倍速改为 `1.5x`，并统一默认步进为 `0.25`、前进/后退步长为 `0.5`。
- 文档同步补充：shared 音频模块归属、快判/转写默认倍速与切题播放规则、`400` 条 pageSize 为快判专属边界。

## 2026-05-15（0.3.2 热修：修复快判 AI Web Search 变量未定义）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 hotfix。
- 修复 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 中 `requestCompare` 的 `webSearchEnabled` 变量未定义问题，避免 compare 阶段抛出 `webSearchEnabled is not defined`。
- `requestCompare` 增加 Web Search 开关解析兜底链路：`options.webSearchEnabled -> options.aiOptions.webSearchEnabled -> input.aiOptions.webSearchEnabled -> 后端默认配置`。
- `sanitizeAiOptions` 补充 `webSearchEnabled` 兼容读取（仅用于是否启用联网搜索控制，不直接透传为模型参数字段）。
- 维持原有边界：listen 阶段仍不启用 Web Search；compare 阶段按配置启用，不支持时仅移除联网参数重试一次。

## 2026-05-14（0.3.2：增强快判 AI 搜索辅助与快捷键）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本功能增强。
- 快判 AI 建议新增 4 个动作并接入快捷键系统（按钮与快捷键复用同一动作逻辑）：
  - `applyAiSuggestion`：AI 采用建议
  - `retryAiSuggestion`：AI 重新分析
  - `ignoreAiSuggestion`：AI 忽略建议
  - `copyAsrTextPair`：复制两条 ASR 文本
- 新增“复制两条 ASR 文本”统一格式：
  - `asr_text1:<第一条文本>;`
  - `asr_text2:<第二条文本>`
- 快判 AI 权重规则调整为：`asrText1/asrText2` 为主判断对象，`heardText`、`contextText`、Web Search 仅作消歧辅助。
- 快判 compare 阶段接入 Web Search 开关：
  - 前端新增 `aiSuggestionWebSearchEnabled`（默认开启）。
  - 后端仅在 compare 阶段启用 Web Search，不在 listen 阶段启用。
  - 若上游返回搜索参数不支持，后端移除搜索参数重试一次并返回 fallback 状态。
- 快判响应新增 `webSearch` 状态对象（`enabled/used/fallbackUsed/fallbackReason`），并支持 `evidence.webSearchHint`。
- 文档同步：`AGENTS.md`、`extension/sites/alibaba-labelx/asr-judgement/README.md`、`platform-resources/backend/README.md`、`config/env/ai.env.example`。

## 2026-05-13（0.3.2：统一 ASR AI thinking 显式传参语义）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于 AI 参数语义热修。
- 统一四个 ASR AI 后端客户端的 thinking 行为：
  - 关闭时显式传 `enable_thinking=false`。
  - 开启时显式传 `enable_thinking=true`。
  - 若上游返回参数不支持/参数无效，仅移除该参数重试一次（`thinkingFallbackMode=remove`），不做无限重试。
- 修复快判链路：`asr-judgement` 关闭 thinking 时此前可能省略参数，现改为显式发送 `false`。
- 修复标贝易采链路：开启 thinking 时此前可能省略参数，现改为显式发送 `true`；并统一返回 `enableThinking/thinkingFallbackUsed/thinkingFallbackMode`。
- 补齐 defaults 口径：标贝易采 defaults 的 `enableThinking` 现在跟随后端环境默认值，不再固定 `false`。
- 文档同步：
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2：完善 ASR 语音 AI 设置 defaults/override 口径）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本设置部件完善与后端 defaults 对齐。
- 通用“ASR 语音 AI 设置”部件更新：
  - 删除面板内“安全边界”展示区（仅移除 UI，安全规则仍保留在代码与文档）。
  - 删除前端 `response_format` 配置入口；结构化输出由后端固定控制。
  - 解锁后按脚本请求后端 `defaults` 接口，面板默认显示后端当前模型、Prompt 与生成参数。
  - Prompt/参数改为 override 语义：与默认一致或清空时不保存 override，请求时由后端默认生效。
- 后端新增/补齐 defaults 接口并返回 `defaults + supportedParams`：
  - `/api/alibaba-labelx/asr-judgement/ai/defaults`
  - `/api/alibaba-labelx/asr-transcription/ai/defaults`
  - `/api/data-baker/round-one-quality/ai/recommend/defaults`
  - `/api/magic-data/annotator/ai/defaults`
- 四个 ASR 类脚本统一接入完整设置部件样式（快判、转写、标贝易采、Magic Data），保持脚本级配置互不串用。
- Magic Data 快捷键设置继续常显，不受 AI 隐藏面板影响。

## 2026-05-13（0.3.2：重构通用 ASR 语音 AI 隐藏设置部件）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 options 结构重构与文档同步。
- options 新增通用隐藏部件：`ASR 语音 AI 设置`。
  - 统一挂载在脚本详情页标题区下方、普通设置区之前。
  - 默认隐藏；在对应脚本详情页标题连续点击 10 次（3 秒窗口）后显示。
  - 解锁状态仅当前 options 页面会话有效，刷新后恢复隐藏。
- 已接入脚本：
  - 阿里 ASR 语音判别（judgement）
  - 阿里 ASR 语音转写（transcription）
  - 标贝易采一检质检（dataBakerRoundOneQuality）
  - Magic Data ANNOTATOR（magicDataAnnotatorAiReview）
- 展示收口：
  - 快判、标贝易采、Magic Data 的 AI 模型/开关/超时等不再散落在普通设置区，统一迁入隐藏 AI 设置部件。
  - 快判普通区仅保留“AI 半自动参考建议为默认能力、仅手动触发”的说明。
  - Magic Data 快捷键设置改为常显，不再默认折叠，也不受 AI 隐藏机制影响。
- 配置隔离：
  - 通用 UI 部件复用，但按脚本独立读取/保存原有存储路径，不做全局 AI 配置复用。
  - 快判继续强制 `aiSuggestionEnabled=true`；标贝易采/Magic Data 仍可在隐藏 AI 设置中调整其 AI 开关。
- 文档同步：
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2：整理快判脚本级 AI 高级设置并强制启用半自动建议）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本配置收口增强。
- 快判 AI 半自动建议改为默认强制能力：
  - options 快判详情页移除“启用 AI 建议”开关，仅保留“手动触发、手动采用”的说明。
  - `shared/storage.js` normalize 阶段强制 `aiSuggestionEnabled=true`（兼容旧存储的 `false` 值）。
  - 快判运行时不再因为 `aiSuggestionEnabled=false` 拒绝请求。
- 快判详情页新增隐藏入口：
  - 在“阿里ASR语音判别”标题连续点击 10 次（3 秒窗口）后显示 `AI 高级设置（阿里ASR语音判别）`。
  - 解锁状态只在当前 options 页面会话有效，刷新后恢复隐藏。
- 新增快判脚本级 AI 高级字段（独立保存在快判 `asrConfig`）：
  - `aiSuggestionListenPrompt` / `aiSuggestionComparePrompt`
  - `aiSuggestionTemperature` / `aiSuggestionTopP`
  - `aiSuggestionMaxTokens` / `aiSuggestionMaxCompletionTokens`
  - `aiSuggestionPresencePenalty` / `aiSuggestionFrequencyPenalty`
  - `aiSuggestionSeed` / `aiSuggestionResponseFormat` / `aiSuggestionStopSequences`
  - `aiSuggestionEnableThinking`（保留）
- 前后端参数白名单同步：
  - 前端按 `JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS` 决定显示与提交；不支持参数不显示。
  - 后端 `ai-routes.js` + `ai-client-qwen.js` 双层过滤，仅允许白名单字段进入模型请求体；不支持字段忽略，不透传。
  - `response_format=text` 时不发送 `json_object`；`stop` 最多 8 条、每条最多 80 字；数值参数按范围归一化。
- 快判请求体新增脚本级 `aiOptions`，并继续保留 `listenModel/compareModel/includeContext` 等主字段，确保兼容当前链路。
- `ai-prompt.js` 支持 `listenPrompt/comparePrompt` 覆盖，但后端会追加安全边界（只输出 JSON、固定 answer 枚举、禁止敏感信息）。
- 文档同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2 热修：收口快判 AI 答案枚举与格式差异判定）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本小修。
- 快判后端响应 schema 收口：
  - `answer` 仍只允许 `first_better/second_better/both_bad/uncertain_or_similar/other_dialect_or_language`。
  - `answerText` 改为后端固定映射五选一，不再允许模型返回文案覆盖：
    - `first_better -> 第一个更好`
    - `second_better -> 第二个更好`
    - `both_bad -> 都不好`
    - `uncertain_or_similar -> 不确定或差不多`
    - `other_dialect_or_language -> 其他方言或语种`
- 快判 compare 规则增强：当两条 ASR 主体语义一致但存在标点/空格/数字/日期格式差异时，若其中一条明显更规范，必须选择对应候选；不能把“仅标点不同”一律判为“不确定或差不多”。
- `compare-prompt-template.md` 新增格式优劣判定规则和“机票疑问句”示例，强调示例输出仅包含 `answer` 等结构化字段，不使用 `answerText`。
- `AGENTS.md` 与快判 README 同步稳定口径：建议答案五选一固定映射，解释性文字只放 `reasonSummary`。

## 2026-05-13（0.3.2：快判 AI 升级双模型听音+比较与上文开关）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本增强与质量修复。
- 快判 AI 后端从单模型升级为双阶段 pipeline：
  - 第一阶段 `listen`：听音模型（默认 `qwen3.5-omni-flash`）只输出听音结果与音频有效性。
  - 第二阶段 `compare`：比较模型（默认 `qwen3.5-plus`）结合 `heardText + asrText1/asrText2 + 可选上文` 输出“哪个更优”建议。
- 快判 Qwen 客户端新增双模型能力与配置：
  - `ASR_JUDGEMENT_AI_LISTEN_MODEL`
  - `ASR_JUDGEMENT_AI_COMPARE_MODEL`
  - `ASR_JUDGEMENT_AI_TIMEOUT_MS`
  - `ASR_JUDGEMENT_AI_ENABLE_THINKING`
  - `ASR_JUDGEMENT_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
  - 保留 `ASR_JUDGEMENT_AI_MODEL` 作为 compare fallback 兼容字段。
- 快判后端日志补齐为分阶段脱敏日志：`suggest start`、`listen start/success`、`compare start/success`、`suggest success/suggest failed`。
- 快判前端 AI 卡片升级：
  - 点击后立即显示“正在分析当前题...”。
  - 成功显示听音文本、建议答案、置信度、风险等级、双模型、耗时、requestId。
  - 失败显示错误卡和重试按钮，不再静默。
  - 新增当前题“使用上文理解”开关（默认有上文时开启），开关仅运行态生效，切换后需“重新分析”生效。
- options 快判设置新增 AI 字段：
  - 听音模型（下拉 + 自定义）
  - 比较模型（下拉 + 自定义）
  - 启用思考开关
  - 请求超时（保留）
- 文档与规则同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 更新为双模型口径和上文开关说明。
  - `platform-resources/backend/README.md`、`config/env/ai.env.example` 增补快判双模型环境变量。
  - `AGENTS.md` 沉淀“快判 AI 双模型 + 上文仅消歧 + 当前题运行态开关”规则。

## 2026-05-12（0.3.2 热修：快判 AI 真实链路无返回提示）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮为当前测试版本 hotfix。
- 修复快判 Qwen 音频输入格式：`platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 从 `audio_url` 切换为 `input_audio.data + input_audio.format`，`format` 按音频后缀推断（wav/mp3/aac/m4a/amr/3gp/3gpp，默认 wav）。
- 增强快判后端流式读取：新增 `readStreamCompletion`，统一返回 `text/usage/firstChunkAtMs/chunkCount`，并兼容 SSE `data:`、非 stream 响应、`delta.content` 与 `message.content` 的 string/array 形态。
- 修复 `enable_thinking` 兼容：先按配置发送 `enable_thinking`，若上游返回参数不支持/无效，自动移除该参数重试一次（非无限重试）。
- 补齐后端阶段日志（脱敏）：`suggest start`、`provider request start`、`provider response`、`provider stream complete`、`suggest success`、`suggest failed`。
- 补齐后端错误回传：统一返回 `code/message/requestId`，并按情况返回 `providerStatus/summary`，覆盖 `timeout/provider-http-error/empty-provider-response/invalid-model-json/invalid-model-schema/internal-error`。
- 前端 `judgement-ai-suggestion.js` 增加状态反馈：点击即渲染“正在分析当前题...”卡片；成功替换建议卡；失败或超时替换错误卡（重试/忽略），并 toast 显示失败原因。
- 前端增加同题防并发：当前题分析中重复触发会提示“当前题 AI 分析中，请稍候”，不并发发第二个请求。
- `content.js` 增加发起即提示：工具栏按钮或快捷键触发 AI 时立即提示“AI 分析已开始，请等待结果。”。
- 本轮明确真实验收要求：`GET /api/alibaba-labelx/asr-judgement/ai/health` 需确认 `mockEnabled=false`，不得以 mock 结果代替真实 Qwen 调用验证。

## 2026-05-12（0.3.2 热修：快判差异视图兼容新版内容区）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮为当前测试版本小修。
- 修复 `judgement-asr-diff-view.js` 的 ASR 内容块识别：不再仅依赖标题 `两个ASR文本`，新增兼容 `online_rec` / `online_recognition` / `asr` / `asr_text`，并最终以 `asr_text1/asr_text2` 可解析作为判定。
- 明确忽略新版内容区中的 `上文`、`音频地址`、`wav_id`（以及 `音频`、`音频文件`）块，避免误把长上下文当作 ASR 文本。
- 差异视图继续仅隐藏真正 ASR 文本块的原始 `.dt-text-wrapper`，不隐藏 `上文` 内容块。
- 同步修复依赖同类定位逻辑的模块：
  - `judgement-compact-card.js`
  - `judgement-thunder-question.js`
  - `judgement-ai-suggestion.js`
  以上模块均改为兼容 `online_rec` 并以 `asr_text1/asr_text2` 解析成功为准。
- 文档同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 补充新版结构兼容规则。
  - `platform-resources/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md` 补充“上文 + online_rec + wav_id”结构与选择器建议。

## 2026-05-12（0.3.2：阿里转写当前题 AI 推荐第一版）

- 版本升级：`extension/manifest.json` 从 `0.3.1` 提升到 `0.3.2`（新增用户可见功能）。
- 前端新增转写 AI 模块：
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-collector.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-panel.js`
- 转写工具栏新增“AI推荐 / 填入AI”动作，且仅作用于当前题；填入后只写当前 textarea 并触发 `input/change`，不自动保存/提交/流转。
- 转写快捷键新增：
  - `shortcutAiSuggest`
  - `shortcutApplyAiSuggestion`
- 后端新增转写 AI 接口：
  - `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`
- 后端新增转写 AI 文件：
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-client-qwen.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-prompts.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-response-schema.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-call-log.js`
  - `platform-resources/alibaba-labelx/asr-transcription/ai-rules.md`
- Qwen 调用口径：默认 `qwen3.5-omni-flash`（听音）+ `qwen3.5-plus`（文本比较）；支持 `response_format: { type: \"json_object\" }`，并在 `enable_thinking` 不支持时按“移除/关闭参数重试”兜底。
- 降级策略：音频不可用或模型无法访问音频时，允许回退到纯文本比较，返回可读错误/风险提示，不阻断页面手工操作。
- 安全与脱敏：API Key 仅后端读取；日志仅记录 requestId/hostname/模型/耗时/结果，不记录完整音频 URL、cookie、token、authorization、API Key。
- 文档同步：
  - `AGENTS.md` 增加“转写允许当前题 AI 推荐（人工确认填入）”规则。
  - `extension/sites/alibaba-labelx/asr-transcription/README.md` 增加 AI 推荐能力、接口与实测清单。
  - `platform-resources/backend/README.md`、`platform-resources/alibaba-labelx/asr-transcription/backend/README.md` 增加 AI 接口与环境变量。
  - `config/env/ai.env.example` 增加 `ASR_TRANSCRIPTION_AI_*` 占位变量。

## 2026-05-12（协作规则收口：默认 main 单工作区）

- `AGENTS.md` Git 工作流改为“默认 `main` 单工作区开发”：默认不建分支、不建独立 worktree、不建 PR。
- 新增默认暗号体系：`ASC_MAIN_TASK`、`ASC_MAIN_HOTFIX`、`ASC_RELEASE`、`ASC_BRANCH_TASK`、`ASC_READONLY`、`ASC_ABORT_IF_DIRTY`。
- `ASC_NEW_BRANCH` / `ASC_CONTINUE_BRANCH` / `ASC_RELEASE_MERGE` 保留为历史兼容识别，明确“不再作为默认流程”。
- `AGENTS.md` 并行开发口径调整为“仅在用户明确要求时启用分支 + worktree”，并要求声明目录、白名单、禁止范围、push 目标。
- `AGENTS.md` Prompt 必备字段更新：补充当前工作目录、当前分支、是否允许创建分支、是否允许直接改 main、是否允许生成 CRX、文件白名单与 push 目标分支。
- `AGENTS.md` 新增 Magic Data 稳定口径（脚本/后端路径、页面挂载位置、规则优先质检、收益估算和安全边界）。
- `README.md` 维护规则最小同步：默认不创建独立 worktree，仅在用户明确要求时使用分支/worktree/PR 流程。

## 2026-05-12（清理旧分支与旧 worktree）

- 已确认 `feature/magic-data-ai-review-debug` 完整合并到 `main` 后再执行清理。
- 已删除旧 worktree：`C:\Projects\annotation-script-center-magic-data-ai-review`（通过 `git worktree remove`）。
- 已删除本地分支：`feature/magic-data-ai-review-debug`。
- 已删除远端分支：`origin/feature/magic-data-ai-review-debug`。
- 协作口径保持：默认 `main` 单工作区开发；分支/worktree 仅在用户明确要求时启用。

## 2026-05-12（0.3.1 发布合并：Magic Data AI 质检助手）

- 发布合并：`main` 合并 `feature/magic-data-ai-review-debug`，引入 Magic Data ANNOTATOR 前后端能力。
- 版本升级：`extension/manifest.json` 从 `0.3.0` 提升到 `0.3.1`。
- 前端接入：新增 `extension/sites/magic-data/annotator/`（页面识别、接口优先采集、页面内质检卡片、快捷键执行与焦点恢复、模型参数透传）。
- 页面形态：`#/asrmark` 在右侧“句子列表”下方固定显示 `Magic Data AI 质检结果` 卡片，不再使用右下角悬浮入口。
- 交互增强：质检卡片支持手动拖拽高度与持久化，支持重置默认高度；AI 结果仅在卡片内部更新，不新增弹窗大面板。
- options/popup：新增 Magic Data 平台卡片与脚本设置入口，支持听音模型、质检模型（下拉 + 自定义）、启用思考、快捷键配置；popup 可识别 Magic Data 页面命中状态。
- 后端接入：新增 `platform-resources/magic-data/annotator/backend/`，并通过 `platform-resources/backend/registry.js` 注册。
- Magic Data 接口：`GET /api/magic-data/annotator/ai/review-current/health`、`POST /api/magic-data/annotator/ai/review-current`。
- 安全边界：保持“只辅助、不自动保存/提交/审核/领取”；日志与响应继续脱敏，不记录完整签名音频 URL、token、cookie、authorization、API Key。
- 发布产物：按 CRX 路径生成 `0.3.1` 三件套（CRX / update.xml / crx-latest.json），不使用 zip 作为正式发布路径。

## 2026-05-11

- AGENTS 协作规则增强：新增“并行功能开发与动态版本号规则”，明确并行任务默认使用独立分支（`feature/<功能名>`、`fix/<修复名>`）与独立 `worktree`，禁止多 Agent 同时改同一 `main` 工作区。
- AGENTS 发布规则增强：并行功能分支不提前改 `manifest.version`、不生成正式 CRX 三件套；统一在合并 `main` 的发布阶段提升 patch、生成 CRX 三件套并打 tag（如 `v0.3.1`）。
- AGENTS Prompt/验收规则增强：并行开发 Prompt 必须包含分支/工作目录/白名单/禁止范围/push 目标分支；并行验收先查功能分支，发布合并阶段再查 `main`、版本、CRX 三件套和 tag。

- README 收尾修正：顶部“当前重点”改为 `0.3.0` 稳定验收完成口径，不再保留“第二轮自动更新方案仅做文档设计”的旧描述。
- README 章节调整：将“第二轮方案（仅文档，不在本轮实现）”改为“CRX 发布与自动安装状态”，明确“CRX 三件套 + ops_monitor 策略写入已完成，企业托管自动安装暂挂起且不阻塞 0.3.0”。

- 新增未完成模块文档：`docs/unfinished/crx-enterprise-managed-install.md`，明确记录“普通非企业托管 Windows 设备会拦截自托管 CRX force_installed 自动安装”的现实阻塞点。
- 文档同步：`README.md` 新增“CRX 企业自动安装说明”并链接未完成模块文档；`AGENTS.md` 新增规则“该模块不作为 0.3.0 阻塞项，恢复前必须先读未完成模块文档”。
- 当前 `0.3.0` 完成标准明确为：CRX 三件套发布能力 + 策略写入能力；企业托管自动安装暂挂起，不阻塞 0.3.0 发布。

- 发布产物追踪规则调整：`.gitignore` 取消全局 `*.crx` 忽略，改为 `dist` 白名单追踪 CRX 三件套（`annotation-script-center-v*.crx`、`annotation-script-center-update.xml`、`annotation-script-center-crx-latest.json`），用于后续上传 `https://script.xiangtianzhen.store/downloads/`。
- 安全规则保持不变：继续忽略 `config/secrets/*.pem|*.key|*.p12` 与私有 env 文件，私钥不得提交。
- 文档同步更新：`README.md`、`extension/README.md`、`AGENTS.md` 已改为“3.0 起允许追踪并提交 CRX 三件套；其他 dist 临时产物默认不提交”口径。

- CRX 企业发布能力：新增 `scripts/package-crx-release.js`，可基于 `extension/manifest.json` 版本和固定私钥 `config/secrets/annotation-script-center.pem` 生成 `dist/annotation-script-center-v<version>.crx`、`dist/annotation-script-center-update.xml`、`dist/annotation-script-center-crx-latest.json`。
- CRX 脚本支持浏览器路径优先级：`ASC_CHROME_EXE` > Chrome/Edge 常见安装路径自动探测；支持 `ASC_DOWNLOAD_BASE_URL` 覆盖下载前缀，支持 `--notes` 写入发布说明。
- CRX 脚本增加发布后自检：校验 `crx-latest.json` 必填字段、`sha256` 64 位 hex，以及 `update.xml` 的 `appid/version/codebase` 一致性；并输出需要上传到 `downloads` 的三个文件路径。
- `extension/manifest.json` 新增并保留 `update_url`：`https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml`。
- 清理 zip 发布路线：删除 `scripts/generate-release-manifest.js`、删除 `dist/annotation-script-center-latest.json`，文档不再把 zip 作为正式更新方式。
- `.gitignore` 保留 `config/secrets/*.pem|*.key|*.p12` 忽略规则；`config/secrets/README.md` 继续说明私钥长期保管要求（不提交真实私钥）。
- 文档同步：`README.md`、`extension/README.md`、`AGENTS.md` 收敛为 3.0 正式发布默认 CRX 三件套；zip 仅作为历史遗留说明，不作为正式发布和自动更新路径。

- 0.3.0 配置体验优化：统一项目数据下载私有配置文件模板，新增 `config/env/backend.env.example`，提供 `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256` 与 `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET` 示例占位。
- 后端环境加载顺序升级：`platform-resources/backend/env-loader.js` 默认改为优先读取 `config/env/backend.env`、`config/env/backend.local.env`，并保持 `ai.env` / `ai.local.env` / `.env.local` / `ASC_ENV_FILE` 兼容。
- `.gitignore` 补充忽略 `config/env/backend.env`、`config/env/backend.local.env`，并允许提交模板 `config/env/backend.env.example`。
- 文档同步：更新 `README.md` 与 `platform-resources/backend/README.md` 的项目数据下载配置教程，补充创建 backend.env、生成密码 hash、生成随机 JWT secret、Linux/PM2 重启与 `project-data-download-auth-not-configured` 排查。
- `config/env/ai.env.example` 增加提示注释：项目数据下载配置应放在 `backend.env`，AI 配置继续放在 `ai.env`。

## 2026-05-10

- 0.3.0 测试版 BUG 修复：修复 `extension/background/service-worker.js` 的 `importScripts` 路径，改为 MV3 service worker 可加载的根相对路径 `shared/constants.js`、`shared/storage.js`，避免扩展后台报 `Failed to execute 'importScripts' ... constants.js failed to load`。
- 0.3.0 隐藏入口逻辑修正：options 首页不再“点击 1 次显示切换”，改为连续点击“后端接口地址”文案 10 次后，同时显示“服务器/本机”切换按钮与“项目数据下载”面板。
- 0.3.0 默认后端模式修正：options 初始化阶段将 `meta.backendEndpointMode` 归一到 `server`，确保隐藏入口未解锁时默认仍为服务器口径。
- 文档补充：在 `README.md` 与 `platform-resources/backend/README.md` 新增“项目数据下载密码配置教程”，覆盖 PowerShell 生成 SHA256、Windows 临时/持久化、Linux/PM2、`project-data-download-auth-not-configured` 排查和安全注意事项。

- 扩展版本升级：`extension/manifest.json` 从 `0.2.11` 升级到 `0.3.0`，用于交付“项目数据下载鉴权与供应商筛选下载”第一轮能力。
- options 首页改造：
  - “后端接口地址”默认仅显示文案，点击一次文案后才显示“服务器 / 本机”切换按钮；
  - 连续点击同一文案 10 次后，解锁隐藏面板“项目数据下载”；
  - 新增获取人姓名、数据类型、供应商条件渲染、导出按钮和状态提示；
  - 获取人姓名可保存，下载密码仅在请求体使用，不保存到 storage。
- 统一后端新增聚合下载模块：`platform-resources/backend/project-data-download/`
  - 新增接口：`/api/admin/project-data-download/options`、`/request`、`/file`（GET/HEAD）；
  - 使用环境变量 SHA256 密码校验 + 内置 `crypto` HMAC 短期 token（120 秒）；
  - 三类数据集统一下载：ASR 快判统计、ASR 转写统计、标贝易采导出 latest；
  - 多供应商 CSV 强制先选供应商，服务端筛选后输出 UTF-8 with BOM；
  - 下载流程新增审计日志（IP、获取人、数据类型、供应商、状态、时间、UA 等），不记录 password/token 全文/cookie/authorization。
- 后端接入与规范：
  - `platform-resources/backend/registry.js` 注册 `project-data-download`；
  - `platform-resources/backend/server.js` 启动日志新增三条项目数据下载接口提示；
  - `.gitignore` 新增 `platform-resources/backend/project-data-download/audit-data/`，避免提交运行审计数据。
- 文档同步：
  - 更新 `README.md`、`extension/README.md`、`platform-resources/backend/README.md`、`platform-resources/data-baker/round-one-quality/README.md`；
  - 第二轮“自动更新扩展”仅沉淀方案：明确采用 `XiangTianzhen/ops_monitor` 本地 exe 路线，本轮不实现跨仓代码。

- 文档同步：全仓 README 与 `AGENTS.md` 稳定规则对齐。重点修正转写/快判 backend README 中“supplier 必传下载”和“suppliers 目录主写入”旧口径，统一为根级总表 `statistics-data/statistics-merged.csv` 主存储、`/statistics/download` 默认总表下载。
- 文档同步：修正 README 中旧“jitter 10 分钟”与并发上限 `500` 口径，统一为定时上传前随机延迟 `0~300` 秒（`100ms` 步进，手动上传不延迟）与动态并发上限 `999`。
- 本轮仅修改 Markdown 文档（README/log），未修改 JS/manifest，未升级版本，未打包 dist。

- 文档治理：更新 `AGENTS.md` 协作入口，补齐 `0.2.11` 稳定统计规则沉淀，覆盖 DevTools/Playwright 工作流、根级总表主存储、分包ID唯一定位、`existing/complete/upload` 跳过与上传边界、CSV UTF-8 with BOM 与健康值覆盖规则、供应商回退识别、进度悬浮窗与动态并发（`Math.floor(total/5)`，最小 `1` 最大 `999`）、定时上传 `10:00/16:00` 与 `0~300s`（`100ms` 步进）延迟规则。
- 本轮仅更新文档（`AGENTS.md`、`log.md`），未修改 JS/后端代码、未修改 `extension/manifest.json`、未升级版本、未打包 dist。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，仅做上传统计进度悬浮窗样式微调（不改统计业务逻辑）。
- `shared/progress-indicator.js` 悬浮窗位置上移到页面顶部中间附近（`top: 68px`），并增加卡片内边距与间距（`padding: 12px 16px`、`gap: 10px`），提升完成态和进行中态阅读舒适度。

- 保持 `extension/manifest.json` 版本 `0.2.11`，本轮不升级 `0.2.12`。
- 共享上传进度组件 `extension/shared/progress-indicator.js` 改为“页面顶部居中悬浮窗”显示（`position: fixed`），不再挤占 LabelX 顶部工具栏布局。
- 进度进行中/完成/失败统一使用同一紧凑卡片布局，完成态不再出现横向铺满的绿色长条。
- 上传按钮状态更新不再写入长 `title` 文案，移除转写/快判按钮 tooltip 动态赋值，避免鼠标悬停出现黑色长文本框。
- 转写与快判继续共用同一 `shared/progress-indicator.js` 组件，仅修样式，不改统计业务逻辑、existing 判断、并发规则、定时规则和后端接口。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，本轮不升级 `0.2.12`。
- 修复转写待补任务名称链路：`enrichSubtaskData` 改为健康文本优先（`detail -> summary -> taskMap` 多源回退），并补充 `summary.name`、`taskMap.taskName/name`、`task.id` 等候选来源。
- 修复转写合并键复用：同 `分包ID + role + subTaskId` 命中旧行时优先复用旧 mergeRow，避免“未识别供应商旧行”与“新识别供应商新行”并存导致任务名称始终不补齐。
- 保持规则：`exists=true` 不等于 `complete=true`；任务名称为空仍视为 `complete=false`，必须继续拉详情并上传补齐。
- 修复共享进度组件样式：新增居中外层容器，进行中/完成态保持同一紧凑卡片布局；宽度提升到 `560~860px` 并支持换行，四位数成功/失败数字可见。
- 转写完成态摘要文案压缩为核心数字（扫描/补齐/上传/跳过完整/待补/废弃/失败/并发），避免完成态绿色块被超长文本撑坏。
- 保持规则：无待上传数据不调用 `/statistics/upload`，显示“已全部完整，无需上传”。
- 主存储继续保持根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，不升级 `0.2.12`，本轮聚焦统计小修正。
- 新增统计 CSV 统一字段清洗：转写/快判后端写出前统一去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符），任务名称、任务ID、子任务ID、分包ID、人员、时间、完成状态、供应商都不再保留前后空格。
- 修正供应商回退识别：当前后端/前端 helper 遇到 `未识别供应商` / `unknown-supplier` / 空值时，不再直接沿用，统一回退到任务名称重新推断（`棋燊`、`希尔贝壳`）。
- 快判统计上传接入共享进度条 `shared/progress-indicator.js`，显示阶段、完成/总数、百分比、并发、成功/失败，并在上传完成/失败后显示摘要。
- 快判详情抓取改为按 `recordCount` 分页补齐（保持 `pageSize=400` 口径），详情并发改为动态 `Math.floor(total/5)`，最小 `1`、最大 `500`，与转写并发展示口径一致。
- 保持扩展版本 `0.2.11` 不升级 `0.2.12`，修正 LabelX 统计导出策略并重新按 `0.2.11` 口径验证与打包。
- 修正转写统计进度并发显示：详情阶段并发改为 `Math.floor(total/5)`，最小 `1`、最大 `500`，进度条显示并发与实际执行并发保持一致（例如 `total=1854 -> 370`，`total=8000 -> 500`）。
- 修正供应商识别稳定性：`statistics-supplier.js` 与 `supplier-utils.js` 统一任务名规范化（decode + 清理前后空白 + 连续空白规整），优先按任务名包含关系识别 `希尔贝壳` / `棋燊`，修复前导空格与全角空格场景误判。
- 修正 LabelX 统计主存储口径：转写与快判后端主写入恢复为根级 `statistics-data/statistics-merged.csv`，`/statistics/download` 默认下载总表，不再强制 `supplier` 参数；历史 `suppliers/<供应商>/statistics-merged.csv` 仅兼容读取迁移，不删除旧运行数据。
- 修正后端目录行为：`ensureDataDir()` 不再主动创建 `statistics-data/suppliers/`，新上传仅写根级 `statistics-data/statistics-merged.csv`。
- 新增共享上传进度组件 `extension/shared/progress-indicator.js`，并接入转写统计上传流程，展示阶段、完成数/总数、百分比、并发、成功/失败，长任务期间不再只显示“上传中”。
- 修正转写统计抓取完整性：`transcription-stats-client.js` 移除旧硬上限（5 页/50 子任务/300 详情），改为按 `recordCount` 计算分页；首页与详情分页保留保护阈值，详情默认并发 `5`、上限 `500`，详情优先 `pageSize=5000` 并在必要时继续分页补齐。
- 修正转写有效时长口径：仅累计“是否有效”严格等于“有效”的题目时长，不使用 `includes(\"有效\")`，避免“无效”误算。
- 修正转写人员解析：新增 `dataResultHistory` 兜底（优先 `type===0`，否则最后一条）。
- 修正快判统计采集并发与分页上限：首页分页保留保护阈值，详情并发默认 `5`，保持快判 `pageSize=400` 业务口径不变。
- 修正转写/快判后端 CSV 写出规则：供应商信息仍保留在内部 payload/mergeKey/行数据中用于防冲突；CSV 导出改为动态供应商列（单供应商不输出，多供应商在最后一列追加）。
- 文档同步更新：`AGENTS.md`、根 `README.md`、`extension/README.md`、`platform-resources/backend/README.md`、转写/快判模块 README、LabelX 平台 README、转写统计策略文档，统一到 0.2.11 修正口径。
- 本轮继续遵循页面采集工作流：结构和 Network 采集优先 Chrome DevTools / MCP；Playwright Edge 仅用于真实操作验证或 DevTools 不可用兜底；Codex 仅负责打开浏览器，登录与进页面由用户完成。

## 2026-05-09

- 修复扩展重载后的旧页面刷错：`shared/storage.js` 新增扩展上下文可用性检测与 `EXTENSION_CONTEXT_INVALIDATED` 结构化错误，统一识别 `Extension context invalidated`。
- 转写运行时生命周期修复：`runtime-config.js` 对上下文失效改为一次性 info + 安全 fallback，不再按普通设置加载失败反复 `warn`。
- 转写 content runtime 新增 `extension-context-invalidated` 停机分支：命中后停止工具栏/快捷键/统计调度与重试观察器，`PANEL_PING` 返回“扩展上下文已失效，请刷新页面”。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 标贝易采一检质检新增“导出后上传后端”能力：`group/detail` 导出总表生成 CSV 后，保持本地下载，同时自动 `POST /api/data-baker/round-one-quality/export/upload` 上传。
- 新增 DataBaker 导出后端模块：`export-routes.js`、`export-store.js`，统一挂载到 `platform-resources/backend/server.js`，提供 `health/config/upload/download(含 HEAD)/list`。
- 新增 DataBaker 导出保存目录：`platform-resources/data-baker/round-one-quality/backend/export-data/`，默认写 `latest.csv` 与 `latest.json`，可通过环境变量开启 history/events。
- 收口安全边界：导出上传失败不阻断本地下载；后端限制 `csvText` 最大 20MB；日志仅输出 `requestId/rowCount/fileName/csvPath/uploadedAt`；`export-data` 已加入 `.gitignore`。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 配置收口：删除 ASR 转写详情页“转写统计导出”配置板块，移除“启用转写统计上传”等可关闭控件，转写面板仅保留自动播放、倍速、步长、音量和快捷键配置。
- 配置收口：快判详情页移除“启用统计上传 / 启用定时上传”可关闭控件，统计上传改为只读强制启用说明。
- 运行时收口：转写与快判统计上传改为默认强制启用；已实现定时上传能力的脚本，定时上传也按脚本规则强制启用，不再受 options 开关控制。
- 存储收口：`shared/storage.js` 在转写/快判 normalize 阶段强制 `statsUploadEnabled=true`、`statsAutoUploadOnSchedule=true`，忽略旧存储中的 `false`。
- 修复转写运行时报错可读性：`runtime-config.js` 新增错误摘要与安全回退，避免控制台出现 `[ASR Edge][transcription] load settings failed [object Object]`，加载失败时回退到安全默认配置并继续运行。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 统一后端接口地址配置入口：options 首页顶部“后端接口地址”改为全局 `meta.backendEndpointMode`（`server/local`），不再通过 DataBaker 脚本字段间接承载。
- 删除脚本详情页重复 endpoint 配置控件：移除转写“上传地址”、快判“上传接口地址”和快判 AI“后端接口地址”输入。
- options 详情页仅保留业务开关和参数（转写/快判/标贝），后端地址统一只读说明“由首页全局控制”。
- 转写统计、快判统计、快判 AI 建议、标贝易采 AI 推荐运行时统一改为“全局 baseUrl + 固定 API path”拼接，不再以脚本级 endpoint 字段作为运行时主来源。
- `shared/storage.js` 新增旧字段迁移：当 `meta.backendEndpointMode` 缺失时，会从历史 `statsUploadEndpoint/aiSuggestionEndpoint/aiRecommendEndpoint` 推断 `local/server`，避免旧配置报错。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 修复 ASR 转写统计 CSV 角色污染：前端 `csvPatch` 收敛为基础字段（`任务名称/任务ID/分包ID/题数/有效时长(秒)`），不再写入标注/审核字段。
- 修复转写后端合并边界：`applyBasePatch` 忽略全部角色字段；标注/审核字段仅允许 `applyRoleRecord` 按 `role` 写入。
- 修复 `role` 容错风险：`roleRecord.role` 不再默认回退 label，缺失或非法时直接拒绝写入并返回错误，避免误把审核数据写入标注列。
- 本地自测覆盖 `audit-only` / `label-only` / `label->audit` / `audit->label` / 缺失 role 五种场景，验证分包合并和顺序无关性。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 修复 ASR 转写统计上传请求风暴风险：详情抓取从 `pageSize=10` 调整为 `pageSize=100`，并增加 `maxPages=3`、`maxItems=300` 硬上限。
- 修复详情分页停止条件：遇空页、重复页签名、`recordCount` 缺失、`recordCount` 已满足或达到上限即停止，避免疑似无限循环请求。
- 修复首页分页抓取边界：列表分页最多 `5` 页，去除旧的大范围循环策略。
- 新增首页采集限流：详情请求并发限制为 `2`，单次上传最多处理 `50` 个转写子任务，并按清洗后的 `subTaskId` 去重，单轮只请求一次详情。
- 新增上传互斥锁反馈：上传进行中返回 `upload-in-progress` + `skipped=true`，手动连点与定时触发不会并发第二轮上传。
- 同步补充转写统计策略文档：新增 `platform-resources/alibaba-labelx/asr-transcription/statistics.md`，并更新 `network.md` 与转写 README。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

## 2026-05-08

- ASR 转写统计取数按 `platform-resources/alibaba-labelx/asr-transcription/network.md` 修正：详情接口分页解析改为 `data.dataList[]`，并保持 `pageSize=10` + `maxPages=20`。
- 转写统计新增详情页元信息合并：`fetchSubtaskDetail` 会把分页首屏 metadata（`taskId/batchId/taskName/status/gmtCreate/gmtCommit`）与首页 summary 合并，避免只拿题目列表导致字段缺失。
- ASR 转写恢复轻量设置面板：options 转写详情页新增自动播放、默认倍速/重置倍速、倍速步进、前进/后退步长、默认音量、当前题行为和转写统计上传配置。
- ASR 转写恢复快捷键配置与运行时：新增 `shortcut-bus.js`，仅支持当前保留动作（含“上传转写统计”），并加入“输入框普通字符不拦截”保护。
- `runtime-config.js` 改为读取 `scriptCenter.projects.transcription.asrConfig` 并规范化安全字段，不再仅使用固定硬编码值；转写运行时参数与 options 保存值打通。
- `manifest.json` 为转写注入链路新增 `sites/alibaba-labelx/asr-transcription/shortcut-bus.js`（在 `content.js` 前），版本保持 `0.2.10`。

- ASR 转写新增统计导出能力：新增 `transcription-stats-client.js`（浏览器端上传客户端），提供顶部“上传转写统计”入口、工具栏“上传统计”动作、定时上传调度（默认 `10:00` / `16:00`，jitter `10` 分钟）和上传状态提示。
- ASR 转写新增独立统计后端：新增 `platform-resources/alibaba-labelx/asr-transcription/backend/`，包含 `health/config/upload/download` 路由、分包合并、CSV 写入与下载；默认输出 `statistics-data/statistics-merged.csv`。
- 转写统计 CSV 列固定为：`任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`，同一分包按 `mergeKey.batchId` 合并标注/审核记录。
- 统一后端注册新增 `alibaba-labelx/asr-transcription` 项目路由与环境变量支持（`ASR_TRANSCRIPTION_STATS_DIR`、`ASR_TRANSCRIPTION_PERSIST_ROWS_JSON`、`ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS`）。
- options 转写详情页继续保持轻量模式，不恢复旧完整设置表单，仅新增统计导出小卡（开关、上传地址、本地保存目录和下载地址说明）。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`，因为当前属于 `0.2.10` 测试修复阶段，不提前升到 `0.2.11`。
- 修正转写统计前后端命名与边界：扩展侧文件从 `transcription-stats-server.js` 重命名为 `transcription-stats-client.js`，只保留采集/上传客户端职责；Node 服务继续只在 `platform-resources/alibaba-labelx/asr-transcription/backend/`。
- 修复转写统计取数逻辑：详情接口改为 `pageSize=10` 分页抓取（含最大页数保护），新增 `subTaskId` 空白清洗（空格/Tab/换行/全角空格）后再请求 `/subTask/{id}/data`。
- 修复转写任务识别：排除 `labelModel=vote` 与“ASR更优结果判断”类快判任务，采集 `labelModel=single`、`size=50`、任务名含“中文普通话asr任务”等转写任务。
- 修复有效时长汇总：转写统计改为从分页 `dataList` 聚合 `item.data.duration/item.duration/item.audioDuration/...` 候选字段，不再只依赖单一路径。

- ASR 转写轻量工具栏完成页面内布局改造：新增 `toolbar.js`，工具栏优先注入 `.mark-toolbox`（优先 breadcrumb 后），无 `.mark-toolbox` 时回退到首条题卡前，不再默认固定悬浮在页面顶部中央。
- ASR 转写工具栏改为分组结构：`当前题/文本/音频/倍速/音量/状态`；状态块新增当前题定位、当前音频状态和最近动作结果，按钮动作继续只作用于当前题/当前音频。
- 转写运行时编排收敛：`content.js` 只负责命中重试、动作分发、popup ping 与工具栏状态更新；保留 DOMContentLoaded/load/MutationObserver/SPA/轮询重试链路，避免过早判定失败。
- options 转写详情页继续保持轻量说明，补充“版本 0.2.10、支持能力、不支持能力、使用步骤”文案，不恢复完整设置表单。
- `manifest.json` 为转写注入新增 `toolbar.js`（在 `content.js` 前），版本继续保持 `0.2.10`（当前仍属同版本修复与体验优化阶段）。

- 修正版本策略：当前 ASR 转写属于 `0.2.10` 实际使用 BUG 修复过程，版本号回退并保持为 `0.2.10`，不提前升到 `0.2.11`。
- 明确 `0.2.11` 仅在 `0.2.10` 修复完成且通过真实浏览器验证后再使用。
- 重新生成 `dist/annotation-script-center-v0.2.10.zip` 作为当前有效测试包。

- 修复 Alibaba LabelX 转写轻量脚本注入时机：`content.js` 改为持续重试命中（`DOMContentLoaded`、`load`、`MutationObserver`、`pushState/replaceState/popstate`、短轮询），不再在 `document_start` 首次 DOM 未就绪时永久停机。
- 修复 popup 误报“注入失败”：转写 `PANEL_PING` 改为脚本注入后恒响应，新增 `injected/matched/reason`；popup 新增“已注入，等待转写详情页”状态，仅在真正无响应时显示“注入失败”。
- 删除转写独立设置链路：移除 `settings-panel.js`、options 页转写设置表单挂载、页面内 overlay 设置入口与“设置”工具栏按钮。
- 删除转写快捷键链路：移除 `shortcut-bus.js`、content 侧快捷键绑定与配置依赖；转写仅保留页面工具栏按钮触发。
- 精简 `runtime-config.js`：仅保留脚本中心启用状态读取与固定默认值输出，不再保存或订阅转写独立配置。
- `manifest.json` 删除 `settings-panel.js` 和 `shortcut-bus.js` 引用，版本从 `0.2.10` 提升到 `0.2.11`。

- `asr-transcription` 按“删除旧目录 + 轻量重写”执行：先 `git rm -r extension/sites/alibaba-labelx/asr-transcription/`，再重建为最小文件集（`content.js`、`settings-panel.js`、`runtime-config.js`、`audio-controller.js`、`active-item.js`、`item-actions.js`、`shortcut-bus.js`、`text-utils.js`、`README.md`）。
- `manifest.json` 删除转写旧 MAIN world 与旧 ISOLATED world 链路引用，移除所有旧 legacy/save/submit/batch/ai/export/leaderboard/page-flow 相关脚本路径，仅保留轻量版转写脚本引用；快判与 DataBaker 链路保持不变。
- 转写运行时收敛为“当前题 + 当前音频”能力：快速填入、标有效/无效、去空格、数字转换、焦点切换、播放/暂停、前进/后退、倍速调整/重置、音量调整/重置、复制时长；不做自动保存/提交/流转与整页批量动作。
- options 页补充加载 `runtime-config.js`，确保转写设置面板可在脚本中心继续保存基础配置。
- 文档同步更新根 `README.md`、`extension/sites/alibaba-labelx/asr-transcription/README.md`、`platform-resources/alibaba-labelx/asr-transcription/README.md`，明确“旧能力已删，恢复需重新设计和验收”。

- 继续清理 `asr-transcription`：删除全页批量修改动作（全页标有效并填充、全页去空格、全页校验自动修复）在工具栏、快捷键和交互执行器中的入口与逻辑，仅保留当前题级别操作。
- 物理删除旧自动化与旧保存链路文件：`annotation-save-runner.js`、`annotation-submit-runner.js`、`annotation-page-flow-runner.js`、`legacy-save-coordinator.js`、`legacy-ai-punctuation.js`、`legacy-auto-assign.js`、`legacy-batch-flow.js`、`legacy-export.js`、`legacy-leaderboard.js`。
- 同步收口引用链路：更新 `manifest.json`、`runtime-contract.js`、`content.js`、`annotation-control-panel.js`、`runtime-debug.js`、`annotation-debug-snapshot.js`，移除上述模块依赖与暴露。
- 同步收口配置与兼容迁移：更新 `shared/constants.js` 与 `shared/storage.js`，删除全页批量快捷键定义，旧字段统一清理为 `null` 或运行时忽略。
- 文档口径更新为“旧功能已删除，后续如需恢复必须重新设计并重新验收，不从旧脚本直接恢复”。

- 对 `asr-transcription` 执行基础收口重构：禁用扩展侧自定义保存 payload 注入、手动强制保存、提交闭环、自动提交、自动领取、自动流转入口；保留兼容空实现以避免 manifest/注入链路断链。
- 收口转写快捷键和配置：移除 AI 标点、自动批量提交、校验后自动提交、排行榜等危险快捷键入口；新增并统一使用 `playbackRateValue`、`rateStepValue`、`seekStepSeconds`，音频步进/倍速/音量重置改为读取统一配置。
- 收口运行时自动链路：`content.js` 不再启动自动抢单和批量流转轮询；`legacy-batch-flow`、`legacy-auto-assign`、`legacy-ai-punctuation` 默认返回 `disabled-in-basic-stage`。
- 同步文档口径：更新根 `README.md`、`extension/sites/alibaba-labelx/asr-transcription/README.md`、`platform-resources/alibaba-labelx/asr-transcription/README.md`，明确“基础转写阶段”规则与真实页面验收步骤。
- 文档目录迁移：将 `docs` 下旧 `extension` 子目录文件全量迁移到 `docs` 根目录，并清理空子目录。
- 文档引用修正：README、AGENTS、docs 与平台资料中的旧子目录引用统一改为 `docs/`。
- 用户可见命名统一：文档中的平台名称统一为“标贝易采”，脚本名称统一为“标贝易采一检质检”；保留 `data-baker` 目录与 API 路径等历史技术标识。
- 环境模板收敛：`config/env/ai.env.example` 仅保留 DashScope、DeepSeek、MiniMax、OpenRouter 四类配置，移除 mock 与其他 Provider 示例项。
- 新增 `AGENTS.md` 长期规则：执行类任务需检查并同步提升扩展版本号；默认代码或用户可见行为变化时提升 patch 版本。
- 新增 `AGENTS.md` 长期规则：验证通过后默认按 `manifest.version` 生成 `dist/annotation-script-center-v<version>.zip`，并检查压缩包根目录结构。
- 本轮将 `extension/manifest.json` 版本从 `0.2.9` 提升到 `0.2.10`。
- 继续清理文档中的标贝易采旧称残留：统一用户可见平台名为“标贝易采”，脚本名为“标贝易采一检质检”。
- 明确 `dist/` 为构建产物目录，默认不提交 git。

## 2026-05-07

- 强化 `AGENTS.md` 协作规则：新增“网页端指挥 AI + Codex 执行 AI”模式，明确网页端 Prompt 是当前任务直接执行依据，冲突时当前任务优先按 Prompt 执行并同步文档。
- 新增执行约束：执行类任务不得停留在审计报告；子代理结论只能作为中间分析，主线程必须继续落地修改与验证。
- 新增文档沉淀约束：网页端确认的业务规则、限制和验收口径必须写入 README/docs，并在影响行为时同步记录到 `log.md`。
- 新增输出规范：Codex 最终输出需包含分支、修改文件、验证结果、`git status --short`、commit hash、push 结果、风险点和后续真实页面验收项。
- 新增真实页面不可访问处理规则：禁止伪造页面结论；可先完成不依赖页面的代码/文档改动，并明确标注“需要真实页面验证”项。
- 新增 `asr-transcription` 当前业务口径：仅做基础转写（一音频一文本框），暂不做时间戳、说话人、AI 初稿/校对/格式化，保存以平台自动保存为准，不照搬 `asr-judgement` 判别动作与保存链路。

## 2026-04-30

- 重做 标贝易采快捷键焦点恢复策略：`shortcuts.js` 删除旧焦点哨兵与被动恢复依赖，不再在平台按钮点击、active 题目变化或窗口 focus 时盲目 blur/focus。
- 新增“本句话文本”变化检测机制：当平台自动切题导致 textarea 内容变化且用户不在手动编辑时，脚本会短暂 focus 文本框再 blur 退出，用于恢复快捷键焦点。
- 手动输入保护增强：用户在“本句话文本”中输入时不会被定时检查抢走光标；仅命中已配置快捷键时才强制退出输入框并执行动作。
- 修复 标贝易采一检质检快捷键被动焦点恢复可能影响音频播放的问题：`shortcuts.js` 移除平台按钮点击、左侧句子切换、active 题目变化、窗口 focus 等被动 blur/focus 恢复链路。
- 标贝易采快捷键策略收敛为“仅命中已配置快捷键时强制退出输入框并执行动作”；未命中快捷键时不拦截普通输入、不干预平台切题和音频组件初始化。
- 保留“填入推荐文本”后的主动失焦能力（`data-api.js`），仅在用户点击填入成功后触发，不影响平台自动切题流程。

## 2026-04-29

- 修复 标贝易采 总表导出分页大小下拉稳定性：`group-export.js` 切换 `100条/页` 前先点击 `.el-pagination__sizes .el-select` 内的 `.el-input.el-input--mini.el-input--suffix`，等待 `.el-select-dropdown.el-popper` 渲染后再选择 `100条/页`。
- 分页大小下拉匹配增加防误点规则：仅选择包含 `10/20/50/100条/页` 组合的可见 dropdown，优先最后一个可见项，避免误点筛选条件下拉。
- 切换 `100条/页` 后新增状态提示与兜底：支持“已选择100条/页，正在等待平台响应”；若响应未及时捕获但分页显示已变更为 `100条/页`，允许继续全量导出。

- 优化 标贝易采 group/detail 总表导出为“平台原生分页全量导出”：`group-export.js` 点击后先切换 `100条/页`，再通过跳页控件逐页触发 `queryByCondition`，由 MAIN world 拦截响应并合并去重后下载 CSV。
- 标贝易采 总表 CSV 字段移除“采集ID”列，继续保留中文表头、UTF-8 BOM 与“原始JSON”脱敏列；导出过程不写入 `access_token`、`refresh_token`、cookie 或 authorization。
- 导出失败时增加明确提示和当前页兜底导出提示：分页控件不可用会提示手动切换 `100条/页` 后重试，避免静默失败。

- 修复 标贝易采 group/detail 导出 `code=51000`：`group-export.js` 不再直接 `fetch /cms/tbAudioUserTask/queryByCondition`，改为触发页面原生查询并等待 MAIN world 拦截响应后导出。
- 扩展 `page-world/network-observer.js`：新增 `queryByCondition` 拦截、`DATABAKER_ROUND_ONE_QUALITY_GROUP_QUERY_RESPONSE` 消息类型，以及 `window.__ASREdgeDataBakerRoundOneGroupQueryCache`（最多 20 条）缓存；保留原有 `queryCollectStatementByCondtion` 逻辑不变。
- 导出流程第一版调整为“当前页导出”：按钮文案改为“导出当前页数据”，文件名包含 `pageNum`；支持查询按钮触发、分页触发和 `location.reload()` 兜底，并通过 `sessionStorage` 恢复等待状态。

- 删除 标贝易采 后端自动导出链路：移除 `export-auth.js`、`export-client.js`、`export-csv.js`、`export-routes.js`，并在 `backend/index.js` 取消导出路由注册，仅保留 AI 推荐文本路由。
- 清理导出登录配置模板：`config/env/ai.env.example` 删除全部 `DATABAKER_EXPORT_*`、`ticket`、`nounce` 相关变量，避免继续配置账号密码或 token 链路。
- 清理文档现行说明：根 README、标贝易采 扩展 README、平台 README、后端 README 全部移除后端导出接口与自动登录说明，统一为前端同源导出（`/cms/tbAudioUserTask/queryByCondition`、`credentials: include`、默认 `pageSize=100`、CSV UTF-8 BOM 本地下载）。

- 标贝易采 `group/detail?taskId=...` 总表导出默认链路切换为前端同源导出：扩展直接使用当前页面登录态请求 `/cms/tbAudioUserTask/queryByCondition`（`credentials: include`），默认 `pageSize=100` 自动翻页并下载本地 CSV（含 UTF-8 BOM）。
- `group-export.js` 导出流程新增分页进度状态（第 x / y 页、已获取 n / total 条）、最大页数保护（`10000`）与登录态失效错误提示；不再默认依赖 `127.0.0.1:3333` 本地后端。
- CSV 导出列改为中文表头并新增“原始JSON”脱敏列；导出时过滤 `token/cookie/authorization/signature/ossaccesskeyid` 敏感字段，不导出完整 URL。
- 同步更新 README 文档口径：前端同源导出为默认推荐，后端导出保留为备用能力；后端自动登录受滑块验证码 `ticket/nounce` 限制，不作为首选。

- 使用 `chrome_devtools` 完成 标贝易采 登录请求脱敏调研：确认真实接口为 `POST /cms/authentication/form`，`username/password/ticket/nounce` 走 query，响应 token 路径为 `data.access_token` / `data.refresh_token`，并会设置 `JSESSIONID`。
- 标贝易采 导出后端对齐真实登录契约：`export-auth.js` 新增 query 传参登录、captcha `ticket/nounce` 配置、Cookie/JSESSIONID 缓存与 `language` 头兼容；`export-client.js` 请求侧同步带 `language` 与 Cookie。
- 更新导出环境模板与文档：`ai.env.example`、根 README、平台 README、后端 README 同步登录契约字段与安全要求（不记录真实账号、密码、token、cookie）。
- 实测导出验证：`health` 在补全配置后可 `ready=true`；复用已使用的 `ticket` 会返回“滑块验证码校验不通过”，后端现已透传明确业务错误，不再误报缺少 token。

- 新增 标贝易采一检质检导出后端：`/api/data-baker/round-one-quality/export/health` 与 `/api/data-baker/round-one-quality/export/task`；账号密码从环境变量读取，导出链路支持 token 内存缓存、过期刷新与 401/403 自动重登，按 `taskId` 自动翻页 `queryByCondition` 并生成 CSV 到 `platform-resources/data-baker/round-one-quality/backend/exports/`，响应不返回 token。
- 新增 标贝易采 `group/detail?taskId=...` 页面“导出数据总表”按钮：点击后调用本地导出接口并触发浏览器下载，同时展示“正在导出/已导出/失败原因”状态。
- 修复 标贝易采一检质检输入框误失焦：快捷键焦点恢复拆分为被动恢复与强制恢复；被动恢复会跳过编辑态和最近 1200ms 手动点入输入框场景，命中已配置快捷键时仍可强制失焦执行动作。
- 新增导出环境变量模板 `DATABAKER_EXPORT_*` 与登录字段/token 路径可配置项；同步 `.gitignore` 忽略 `platform-resources/data-baker/round-one-quality/backend/exports/`。
- 标贝易采 AI 推荐文本新增去空格兜底：后端统一清理 `heardText` 和最终 `recommendedText` 中的普通空格、全角空格、Tab 和换行；前端展示、复制和填入前也做兼容兜底，不修改页面候选文本原文，不自动保存或提交。
- 更新 AGENTS.md 项目定位：当前重点平台收口为 Alibaba LabelX 与 标贝易采，重点脚本包含快判、转写和 标贝易采一检质检。
- 固化单人项目 Git 工作流：默认 main 分支直接执行，验证通过后 commit 并 push，不创建分支、不创建 PR。
- 固化复杂任务优先使用 subagent / parallel agents；不支持时按相同分工串行执行。
- 固化默认由网页端指挥 AI 通过 GitHub 直接验收，不再默认输出验收 Prompt。
- 本轮仅更新协作文档，不改扩展业务代码、不改后端 API、不改 manifest。

- 修复 标贝易采 点击平台“确定”后自动切题导致快捷键失焦的问题：快捷键运行时新增平台动作按钮点击、`.sentence-list .sentence-item.active` 变化、快捷键触发平台按钮和窗口重新聚焦后的多次焦点恢复；只做 blur + 隐藏焦点哨兵，不模拟点击页面空白处。
- 修复 标贝易采一检质检快捷键焦点恢复：快捷键运行时先匹配已配置动作，未命中时不拦截普通输入；命中后通过隐藏焦点哨兵退出输入框并执行动作，同时监听左侧句子点击后延迟恢复焦点。
- 标贝易采 “填入推荐文本”后增加立即、50ms、180ms 三次失焦兜底，避免 Element UI / Vue 在 input/change 后重新聚焦 textarea；仍不自动保存、提交或判定。
- 标贝易采 AI 推荐文本新增中文句末标点兜底：后端在对比结果和词表强替换后统一补全 `。！？；…`，前端展示和填入前也做旧后端兼容兜底；仍不自动保存或提交。
- 优化 标贝易采一检质检快捷键焦点行为：普通输入不拦截，只有命中已配置 标贝易采快捷键时才会自动 blur 当前输入焦点并执行动作。
- 标贝易采 “填入推荐文本”成功后自动退出“本句话文本”输入框并把焦点交回页面，便于继续使用快捷键；仍不自动保存、提交或判定。
- 新增 标贝易采一检质检自动每页条数设置：options 默认启用 `50条/页`，运行时在 `roundOneCollect` 详情页有限重试点击页面原生分页下拉，不自动提交任务。
- 新增 标贝易采一检质检快捷键配置，默认全部未设置，支持 AI 推荐、复制 AI 听音文本、复制推荐文本、填入、忽略、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 标贝易采快捷键运行时只在详情页生效，普通输入不拦截，任务判定按钮 disabled 时不绕过平台限制；脚本总开关关闭时工具卡、自动分页和快捷键全部停止。
- 修复 标贝易采 闽南方言词表拼音批注误替换：括号内容、拉丁拼音、数字注音和残留连接符不再参与建议用字 / 对应华语解析；CSV 单字映射默认跳过强替换，避免把 `家庭` 误改成异常文本。
- 优化 标贝易采 AI 推荐速度定位：Qwen 原生 `fetch` 请求默认改为顶层 `enable_thinking=false`，不再使用 `extra_body`，并在供应商不支持该参数时自动移除字段重试一次；可通过 `DATABAKER_AI_ENABLE_THINKING=1` 开启 thinking。
- 新增 标贝易采 `DATABAKER_AI_PIPELINE_MODE=two_stage|listen_only`，默认保留听音 + 对比双模型，`listen_only` 极速模式只调用 `qwen3.5-omni-flash` 并结合本地词表强替换生成推荐文本。
- 标贝易采 AI 响应、推荐卡和调用日志补充流水线模式、听音耗时、对比耗时和总耗时，便于区分真实 Qwen 调用慢在听音阶段还是对比阶段。
- 补充 标贝易采 当前页 AI 推荐预生成方案：后续可由前端按钮触发当前页记录预生成、后端限制并发、前端按 `itemId` 内存缓存；默认不自动执行，避免成本失控。
- 修复 标贝易采 Qwen-Omni 听音请求格式：`requestListen` 改用 `input_audio`，按音频 URL pathname 后缀推断 `wav/mp3/aac/m4a/amr/3gp/3gpp`，并移除听音请求的 `response_format`，避免多模态请求触发 HTTP 400。
- 标贝易采 前端错误提示补充后端脱敏 `summary`，方便排查 provider 400，同时继续避免暴露完整音频 URL、token、cookie、`OSSAccessKeyId`、`Signature` 或 API Key。
- 标贝易采 options 设置页将 后端接口地址收敛为“服务器 / 本机”两个选项，旧的自定义地址会回退到默认服务器接口，员工默认走服务器，本机仅用于开发调试。
- 标贝易采 options 请求超时时间改为按秒展示，默认 `120` 秒，保存后仍写入毫秒字段 `aiRecommendRequestTimeoutMs` 供运行时使用。
- 标贝易采 AI 调用日志 CSV 新建时使用中文表头，JSONL 继续保留英文 key，便于人工查看和后续程序处理。
- 新增 标贝易采 闽南方言字词表 `platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv`，后端 `ai-lexicon.js` 会解析 CSV 并为听音 / 对比 prompt 注入短上下文；词表只辅助字形判断，不强行替换文本。
- 增强 标贝易采 词表策略：默认 `DATABAKER_AI_LEXICON_REWRITE_MODE=aggressive`，对最终推荐文本做“对应华语 -> 建议用字”的强替换并记录替换明细；设置为 `off` 时仅保留 prompt 上下文。
- 标贝易采 AI 响应和调用日志新增阶段耗时：听音耗时、对比耗时和总耗时；日志同步记录词表启用状态、替换模式、替换数量和替换明细，便于区分 `mock=true` 本地耗时与 `mock=false` 真实 Qwen 调用耗时。
- 标贝易采 推荐卡新增词表替换提示，返回词表强替换时显示替换数量和最多 8 个替换项，复制和填入继续使用最终 `recommendedText`。
- options “标注脚本中心”新增 `标贝易采` 平台区域和 `标贝易采一检质检` 脚本卡片，支持在控制面板启停该脚本。
- 新增 标贝易采一检质检专属设置页，可配置 后端接口地址、请求超时时间和 AI 推荐开关；默认 endpoint 为 `https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`，本机 `127.0.0.1:3333` 仅用于开发调试。
- 标贝易采 content script 改为读取 `chrome.storage` 中的脚本启停、AI 推荐开关、endpoint 和 timeout；关闭脚本或关闭 AI 推荐后不显示推荐工具卡。
- 扩展前端仍不保存 API Key、access token、cookie 或完整音频 URL，标贝易采 模型密钥继续由后端通过 `config/env/ai.env` 读取。
- manifest 版本提升到 `0.2.8`。
- 新增统一 AI 环境配置文件 `config/env/ai.env` 自动加载能力，统一后端启动时会先加载仓库内 AI 环境配置，不再要求每次手动设置 `DASHSCOPE_API_KEY`。
- 新增 `config/env/ai.env.example`，覆盖 DashScope、OpenRouter、MiniMax、其他模型服务和 标贝易采 AI 推荐文本配置项。
- `.gitignore` 新增真实密钥文件忽略规则：`config/env/ai.env`、`config/env/ai.local.env`、`.env`、`.env.*`，保留模板文件可提交。
- 新增 标贝易采一检质检站点目录 `extension/sites/data-baker/round-one-quality/`，仅在 `datafactory.data-baker.com` 的 `roundOneCollect` 详情页注入“AI 推荐文本”工具卡。
- 标贝易采 前端新增 MAIN world 网络观察脚本，只在内存中缓存 `queryCollectStatementByCondtion` 当前页响应；ISOLATED world 根据 `.sentence-list .sentence-item.active`、右侧“本句话文本” textarea 和接口记录定位当前单条。
- 标贝易采 推荐结果卡支持展示页面候选文本、AI 听音文本、AI 推荐文本、变更标记、置信度、模型和复核提示，并提供“复制推荐文本”“填入推荐文本”“忽略”；填入必须由用户点击触发，不自动保存、提交、判定或流转。
- 统一后端新增 标贝易采 AI 推荐接口：
  - `GET /api/data-baker/round-one-quality/ai/recommend/health`
  - `POST /api/data-baker/round-one-quality/ai/recommend`
- 标贝易采 后端默认使用听音模型 `qwen3.5-omni-flash` 和对比模型 `qwen3.5-plus`，沿用原生 `fetch` 调 DashScope，支持 `DATABAKER_AI_MOCK=1` mock、费用估算和有效音频裁剪环境变量预留。
- `manifest.json` 新增 `https://datafactory.data-baker.com/*` 权限与 content script，扩展版本提升到 `0.2.7`；同步更新根 README、扩展 README、平台资源 README、统一后端 README 和 标贝易采 页面 / 网络资料。

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
- 将扩展源码从 `edge-extension/extension/` 迁移到仓库根目录 `extension/`，将历史文档迁移到 `docs/`，将旧参考脚本迁移到 `legacy-reference/`；新增根目录 README 的本地加载、打包和服务器部署说明，并新增 `.gitignore` 忽略 `dist/` 等构建产物。
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
## 2026-05-08

- ASR 转写网络请求文档补录：新增 `platform-resources/alibaba-labelx/asr-transcription/network.md`，基于真实 DevTools 采集沉淀首页与详情页接口结构（脱敏）。
- 明确转写取数关键约束：详情接口 `subTask/{id}/data` 使用 `pageSize=10`；`subTaskId` 需先 `decode + 去空白` 后再拼接请求。
- 明确任务识别边界：`labelModel=vote` / “ASR更优结果判断”类任务排除，`labelModel=single` / `size=50` / “中文普通话asr任务”类任务采集。
- 同步更新 `platform-resources/alibaba-labelx/asr-transcription/README.md` 与 `platform-resources/alibaba-labelx/README.md`，将转写网络文档从占位说明升级为可执行口径文档。

- 新增 Magic Data ANNOTATOR 平台前置采集文档目录：`platform-resources/magic-data/annotator/`。
- 新增并维护文档：`README.md`、`page-structure.md`、`network.md`、`safety-boundary.md`、`development-plan.md`。
- 本轮采集页面范围：首页、标注任务页、标注任务详情页、标注单条页、审核任务页、审核任务详情页、审核单条页。
- 已通过 `chrome_devtools` 完成真实页面只读采集，记录请求摘要并脱敏处理。
- 明确敏感动作边界：领取、开始（会改状态）、保存、提交、审核通过、审核驳回、退回、批量流转等均禁止自动触发。
- 本轮未修改扩展运行时代码；未修改 `extension/manifest.json`；未修改 `extension/options/`；未修改 `extension/popup/`。
- 按 `platform-resources/alibaba-labelx/asr-judgement` 目录方式重构 Magic Data 文档：新增 `platform-resources/magic-data/annotator/page-structure/` 与 `network/` 子目录。
- `page-structure.md` 与 `network.md` 改为兼容索引入口，详细内容拆分到子目录多文件。
- 补全 `network.md` 缺失项：新增欢迎页、标注链路、审核链路、音频脱敏、敏感写操作清单与待补采项。

## 2026-05-09

- 补充 Alibaba LabelX 平台公共资料：新增 `platform-resources/alibaba-labelx/network.md`，将转写和快判共用的 `data/summary/board/getLabelTaskInfo/tasks/subTasks/tasks/process/save/commit/fetch/audio` 接口沉淀为公共网络口径。
- 新增 `platform-resources/alibaba-labelx/page-structure.md`，记录通用顶部导航、标注/审核首页、详情页 `.mark-toolbox`、`.labelRender-item`、音频控件和高风险按钮边界。
- 新增 `platform-resources/alibaba-labelx/asr-transcription/page-structure.md`，记录 ASR 转写审核首页和 `missionType=check` 详情页 HTML/DOM 结构、音频结构、有效性切换、文本编辑和提交任务行为。
- 更新 `platform-resources/alibaba-labelx/asr-transcription/network.md`，补充审核首页 `type=check/subTaskType=check`、审核详情页字段、自动保存、`mistake`、`subTask/{id}/data` 保存、`commit` 和 `check/fetch` 链路。
- 明确当前真实接口未发现 `supplier/vendor/company/provider/供应商` 字段；后续供应商统计只能按 `payload` 显式字段、`csvPatch["供应商"]` 或 `taskName/name` 前缀推断，当前样例包括 `棋燊` 和历史样例 `希尔贝壳`。
- 追加采集 LabelX ASR 转写审核详情页：确认 `提交并结束` 复用 `subTask/{subTaskId}/commit`，但不会触发 `check/fetch` 自动领取，会直接返回审核首页。
- 补充详情页分页、每页条数和筛选契约：第 2/3 页会重拉 `data/summary/board`；原生每页条数可见 `1/2/3/4/5/10/20/30/40/50 条/页`；回答区选择题筛选写入 `filter.questions[].title/value`。
- 补采 Alibaba LabelX ASR 转写标注详情页：确认 `missionType=label` 普通提交触发 `POST /api/v1/label/center/subTask/{subTaskId}/commit`，自动领取开启时继续触发 `POST /api/v1/label/center/{taskId}/label/fetch`。
- 验证转写标注详情页 `50 条/页`：页面一次渲染 50 个音频题卡，快速批量写入 10 个 textarea 只产生 1 条 `dataList` 保存，后续全页一键填充不能依赖批量 DOM 写入后统一失焦。
- 补充转写标注保存契约：文本编辑自动保存仍走 `POST /api/v1/label/center/subTask/{subTaskId}/data`，保存体顶层为 `dataList` 和 `timestamp`，音频 URL 字段必须持续脱敏。
- 本轮只更新平台资料 Markdown 和日志，未修改扩展运行时代码、manifest、后端代码或运行数据。
- 补采 Alibaba LabelX ASR 转写审核详情页驳回链路：顶部 `驳 回` 打开 `驳回至上个环节` 弹窗，提交后触发 `POST /api/v1/label/center/subTask/{subTaskId}/reject`，请求体字段为 `subTaskId/rejectReason/type/userIdList`，成功后返回审核首页。
- 补采转写详情页筛选面板：记录 dropdown / filter 面板 class、内容区关键词 `filter.content`、`questionsQueryConditions=OR` 和 `dataStatus=UNFINISHED`。
- 尝试高速全页填充保存方案：在 `驳回中` 审核详情页直接 POST 3 条 `dataList[]` 和最小字段保存均返回业务 `code=400`，页面自身单条自动保存也返回 `code=400`；确认该状态页面不能验证保存成功型批量写入，需要后续在正常可编辑详情页复测。

- 升级扩展版本到 `0.2.11`，新增 Alibaba LabelX 转写/快判统计“按供应商分表”能力，新增扩展侧 `extension/shared/statistics-supplier.js` 和后端侧 `platform-resources/alibaba-labelx/supplier-utils.js` 统一供应商识别工具。
- 转写与快判统计 CSV 新增 `供应商` 列，上传 payload 新增 `supplier` 对象、`mergeKey.supplierKey/supplierName`，并将幂等合并键升级为 `供应商 + 分包ID`，避免跨供应商同分包冲突覆盖。
- 两套后端统计服务均改为仅写入 `statistics-data/suppliers/<供应商>/statistics-merged.csv`；不再维护根级 `statistics-data/statistics-merged.csv`，但继续兼容读取历史根级 CSV 作为迁移输入，不删除旧文件。
- 新增并统一下载契约：`/statistics/download` 必须带 `supplier` 参数；未传返回 `400` 且提示 `suppliers` 列表接口。新增 `.../statistics/suppliers` 用于列出可下载供应商与下载链接。
- 更新统一后端启动日志和 health 返回口径，显式提供 `suppliersPath`、`downloadRequiresSupplier`、`suppliersDir`，并将旧 `csvPath` 标记为 deprecated 空值。
- 同步更新协作与文档规则：新增 Chrome DevTools / MCP 优先采集、Playwright Edge 仅用于真实操作验证或兜底、用户回复“处理好了”后再继续采集测试，以及 LabelX 公共资料与转写专项资料目录沉淀要求。

## 2026-05-10（0.2.11 小修正：统计 CSV 中文乱码与健康值覆盖）

- 修复 LabelX 转写/快判统计链路中的中文替换字符 `�` 问题，重点覆盖 `任务名称`、`标注员/审核员`、`供应商`。
- 新增/统一文本质量规则：识别 `U+FFFD` 为损坏文本，合并时“新健康值优先覆盖旧损坏值”。
- 供应商解析增强：`供应商=未识别供应商/unknown-supplier/含�` 时回退任务名推断，不再保留损坏供应商值。
- CSV writer 统一改为 UTF-8 with BOM 写入，兼容 Excel 直接打开中文显示。
- CSV/file-store/payload-merge 三层同步收敛清洗规则，避免旧损坏值持续污染新导出。
- 主存储口径保持根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 转写/快判前端 payload 构造增加健康文本优先选择，降低源头携带损坏值概率。

## 2026-05-10（0.2.11 小修正：导出完整性校验 + 断点跳过 + 定时延迟）

- 新增转写/快判 existing 检查接口：导出前按分包ID批量判断是否已完整，完整数据跳过详情拉取。
- 分包ID为空的数据直接废弃，不写 CSV、不上传，并计入失败/废弃统计。
- 后端合并结果新增失败列表（failedCount/failures），不中断整批处理，便于前端二次重试。
- 前端上传流程新增 skippedComplete/discardedNoBatch/failedPayloadValidation 汇总与失败提示。
- 结束时若失败数 > 0，统一提示“有数据导出失败，请再次点击导出”。
- 动态并发上限由 500 调整为 999：`Math.floor(total/5)`，最小1、最大999。
- 定时上传改为 10:00/16:00；新增 schedule 上传前随机延迟 0~300 秒（100ms 步进）；手动上传不延迟。
- 主存储继续根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- CSV 继续 UTF-8 with BOM、单供应商不出“供应商”列、多供应商末列追加“供应商”。

## 2026-05-10（修正统计失败判断并保留部分成功数据）

- 修正转写/快判前端 payload 校验口径：仅 `分包ID` 缺失才拒绝上传；其余关键字段空值改为 warning/incomplete，不再计入 failed。
- 修正转写/快判进度汇总：`failed` 仅统计真正失败（详情请求异常、校验拒绝、上传失败等），`discardedNoBatchId` 与 `warningPayloadCount` 单独展示。
- 修正转写/快判最终提示：仅 `failed > 0` 才提示“有数据导出失败，请再次点击导出”；仅 warning 时提示“部分字段待后续角色补齐”。
- 修正后端 existing complete 判定：转写按 `label=标注子任务ID`、`audit=审核子任务ID`；快判按 `label=任一标注员子任务ID`、`audit=审核子任务ID`，不再要求另一角色字段完整。
- 修正后端批量上传返回结构：新增 `acceptedCount/rejectedCount/rejectedItems`，保留 `failedCount/failures` 兼容字段，确保“部分失败不影响成功写入”。
- 保持主存储为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 保持并发规则 `Math.floor(total/5)`（最小 1，最大 999）、定时上传 `10:00/16:00`、定时随机延迟 `0~300s`（100ms 步进）。

## 2026-05-10（修正统计跳过完整判断和进度宽度）

- 修正 `existing complete` 判定过宽问题：`exists=true` 不再直接跳过，转写/快判都改为“基础字段 + 当前 role 子任务ID”最低完整条件。
- 转写/快判均支持：任务名称空值判 `complete=false`（待补），而非失败；下一次导出会继续拉详情补齐。
- 修正前端跳过逻辑：仅 `complete=true` 计入 `skippedComplete`；`exists=true && complete=false` 继续拉详情并可上传补齐。
- 修正无意义上传：当 `payloads.length===0` 时不调用上传接口，显示“已全部完整，无需上传”，不再出现“上传 1”占位行为。
- 进度面板样式优化：宽度提升到 `min-width:560px / max-width:780px`，文本允许换行，四位数成功/失败计数可见。
- 保持主存储口径：根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 版本保持 `0.2.11`，并发规则保持 `Math.floor(total/5)`（最小1、最大999）。

## 2026-05-11（0.3.0 测试修复：options 隐藏入口联动）

- 修复 options 首页“后端接口地址”隐藏入口状态分裂问题，统一为单一解锁状态：连续点击“后端接口地址”标题 10 次后，同时显示“服务器/本机”切换按钮与“项目数据下载”面板。
- 未解锁前统一隐藏后端切换与项目数据下载，并移除所有“连续点击 10 次”提示文案。
- 未解锁前 `home-endpoint-status` 不再显示“当前已选择：服务器（script.xiangtianzhen.store）...”文案；仅在解锁后显示当前后端选择状态。
- 点击绑定仍只挂在“后端接口地址”标题节点，不绑定整个卡片；鼠标样式保持默认（非 pointer）。
- 页面刷新后解锁状态不持久化，符合“每次进入 options 重新隐藏”的测试口径。
- 0.3.0 测试版 service worker 路径修复：`extension/background/service-worker.js` 的 `importScripts` 改为 `chrome.runtime.getURL("shared/constants.js")` 与 `chrome.runtime.getURL("shared/storage.js")`，避免被解析为错误的 `background/shared/*` 路径。
- 修复后 service worker 将从扩展根目录加载共享模块，解决 `Failed to execute 'importScripts' ... background/shared/constants.js failed to load` 与注册失败 `Status code: 15` 问题。
- 0.3.0 测试修复：标贝易采导出 CSV 与原始记录分离。前端导出与上传的 `csvText` 不再包含“原始JSON”列；原始记录改为脱敏 `rawRecords` 独立上传。
- 标贝易采后端导出存储新增 `latest-raw.json`，`latest.csv` 只保存 CSV，`latest.json` 继续保存 meta；开启 history 时同步写入 `*.raw.json`。
- 标贝易采导出上传路由增强：兼容 `rawRecords/rawJson`，新增原始记录大小限制，health/config 返回 `latestRawJsonPath`。
- 项目数据下载 CSV 清洗增强：`sanitizeParsedCsv` 强制剔除“原始JSON”列，避免历史 CSV 泄露原始记录。
- 项目数据下载供应商链路增强：下载 token 读取增加尾部中文标点容错；供应商错误返回补充 dataset/supplier/suppliers；下载链路新增安全调试摘要（仅 requestId/jti/dataset/supplier/计数，不记录完整 token）。

## 2026-05-11（协作规则更新：任务暗号与默认分支策略）

- `AGENTS.md` 新增“任务暗号规则”章节，明确 `ASC_READONLY`、`ASC_NEW_BRANCH`、`ASC_CONTINUE_BRANCH`、`ASC_MAIN_HOTFIX`、`ASC_RELEASE_MERGE`、`ASC_ABORT_IF_DIRTY` 的执行约束。
- 明确 Codex 无法读取网页端历史对话，每次执行 Prompt 必须携带任务暗号，并按暗号执行 Git 策略。
- 调整单人项目分支口径：保留“小修/当前版本 BUG/单模块可直接 main”，同时明确“新对话新需求通常走新分支、同对话追问通常继续当前分支、用户明确要求直改 main 时从用户指令”。
- 并行规则补充：谁先完成并通过验收，谁先进入 `ASC_RELEASE_MERGE`；发布合并阶段才执行 patch 提升、CRX 三件套生成与 tag。

## 2026-05-11（协作规则修正：任务暗号优先于 main 旧默认）

- 修正 `AGENTS.md` 中“默认直接在 main 分支完成执行类任务”的旧口径，改为“执行类任务默认按任务暗号决定 Git 策略”。
- 补充无暗号兜底：新功能、并行功能、跨模块改动默认独立分支；小修、当前版本 BUG、单模块任务、文档收尾可直接 main。
- 修正旧分支口径：不再要求“当前不在 main 就切回 main”；改为“分支与任务暗号/目标分支不符时停止并报告，不得擅自切换”。
- 明确 `ASC_CONTINUE_BRANCH` 必须留在目标功能分支执行，`ASC_RELEASE_MERGE` 才允许回 main 做发布合并。

## 2026-05-11（协作规则补充段冲突清理）

- 清理 `AGENTS.md` 在“2026-05 稳定协作规则补充”中的旧口径：不再写“执行类任务默认验证通过后直接 push 到 main”“默认不创建分支，不创建 PR”。
- 统一改为按任务暗号与目标分支执行 commit/push：新功能/新需求/并行/跨模块默认独立分支，小修与文档收尾可按 `ASC_MAIN_HOTFIX` 直改 `main`。
- 保留并强调只读审计不得改动和提交、验证失败不得 commit/push、PR 仅在用户明确要求时创建。
