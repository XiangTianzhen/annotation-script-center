# 标注脚本中心维护说明（精简版）

## 项目定位

- 仓库目录：`C:\Projects\annotation-script-center`
- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。
- 运行时代码主目录：`extension/`
- 平台资料与后端主目录：`platform-resources/`
- 统一后端入口：`platform-resources/backend/server.js`
- 当前扩展版本以 `extension/manifest.json` 为准。

## 平台细节读取规则

- AGENTS.md 只保留项目级规则，不承载具体平台长口径。
- 处理具体平台前，必须先读：`docs/platforms/index.md`，再读对应脚本 README、`platform-resources` 资料与相关代码。
- Abaka AI Task21 当前为“Task21助手”完成态；具体规则以 `extension/sites/abaka-ai/task-page/README.md`、`platform-resources/abaka-ai/task21/README.md`、`platform-resources/abaka-ai/task21/ai/prompt.md` 为准。
- 新增平台或脚本时，必须同步更新：
  - `extension/sites/<platform>/<script>/README.md`
  - `platform-resources/<platform>/<script>/README.md` 或资料目录
  - `docs/platforms/index.md`
  - `log.md`

## 协作与 Git 规则

- 默认在 `main` 单工作区执行。
- 默认不创建分支、不创建 worktree、不创建 PR。
- 执行前必须检查：目录正确、分支为 `main`、工作区无无关改动。
- 若 Prompt 含 `ASC_ABORT_IF_DIRTY` 且发现无关改动，必须停止并报告。
- 执行类任务验证通过后默认 `git add`、`git commit`、`git push origin main`。
- 只读任务或验证失败不得提交。

## 任务暗号

- `ASC_READONLY`：只读审计，不改文件。
- `ASC_MAIN_TASK`：在 `main` 执行并提交。
- `ASC_MAIN_HOTFIX`：在 `main` 小修并提交。
- `ASC_RELEASE`：发布流程（版本、CRX、tag）。
- `ASC_BRANCH_TASK`：仅用户明确要求分支时使用。

## 目录边界（项目级）

- `extension/sites/`：平台脚本运行时代码。
- `platform-resources/`：平台资料、网络结构、后端实现。
- `platform-resources/backend/`：统一后端入口与路由注册。
- `docs/`：长期文档与索引，不再把文档散落在根层。

## shared 模块规则（项目级）

- `extension/sites/alibaba-labelx/shared/audio-controller-core.js`：LabelX 快判/转写通用音频核心。
- `extension/sites/alibaba-labelx/shared/submit-actions.js`：LabelX 快判/转写通用提交快捷键动作。
- 提交类动作只作为快捷键，不加入顶部工具栏。
- 提交类动作只点击页面真实系统按钮，不直接调平台 API，不自动确认二次弹窗。
- 快判 `400` 条 pageSize 为快判专属能力，不属于 shared audio。

## 统一行为约束

- 各脚本详情页不得新增独立后端地址；后端地址统一走 options 首页入口。
- AI 建议/推荐仅作辅助，不自动保存、不自动提交、不自动领取、不自动流转。
- 前端不得保存 API Key、cookie、token、完整签名 URL、完整音频 URL。
- 日志必须脱敏，不输出敏感字段全文。
- TTS 自动清除默认时间统一为 `60000ms`。
- AI / 模型请求默认超时时间统一为 `120000ms`。
- 本项目默认不使用异步 job / SSE / WebSocket 接收 AI 结果；AI 辅助请求默认直接通过 HTTP 返回结果。
- 批量 AI 请求允许前端错峰发起；后端继续使用 provider queue / RPM 限流保护上游。
- 如果单次 AI / 模型请求超过 `120000ms` 仍不能返回，默认认为该链路不适合当前项目，应优先优化模型、Prompt、任务拆分或后端策略，而不是继续拉长超时。
- 只有当前 Prompt 明确要求时，才允许新增异步 job 接收 AI 结果。
- 非 AI 模型类的上传、下载、统计与普通后端接口超时不受该规则影响，按业务需要单独设置。

## 自动化与发布安全（项目级）

- 用户触发规则：AI 建议默认只作辅助；仅在用户明确点击按钮或触发快捷键后，才允许执行“填入页面输入框”类辅助动作。
- 默认禁止自动状态流转：不得自动保存、自动提交、自动领取、自动送审、自动审核、自动判定流转；若确需自动提交类动作，必须在当前 Prompt 明确授权。
- 批量/连续能力约束：必须明确作用范围，默认只处理当前页、不跨页；必须提供停止机制与失败统计/失败提示；不得点击 checkbox（除非当前 Prompt 明确授权）。
- 平台安全约束：不得绕过平台原生 disabled/只读限制；不得硬编码 token/cookie/access_token/authorization。
- 发布前验收：执行 `ASC_RELEASE` 前必须确认已完成真实浏览器验收；发布失败不得 commit/tag/push。
- 发布要求：`ASC_RELEASE` 必须提升 patch 版本，生成 CRX 三件套并完成 main 与 tag 推送。

## Prompt 输出格式（摘要）

- 网页端输出 Codex Prompt 时，默认生成 `.md` 文件供下载，不再默认在聊天消息中直接贴完整 Prompt。
- 仅当用户明确要求“直接贴出 Prompt”时，才在聊天消息中直接输出。
- 即使直接贴出，Prompt 内也不得嵌套复杂 Markdown 三反引号代码块。
- 命令、JSON、env 示例统一用普通缩进文本。
- 完整规范见：`docs/workflow/codex-prompt-style.md`。

## 资料补充提醒规则

- 网页端准备输出 Prompt 前，如任务依赖额外资料，应先提醒用户上传，并明确需要上传哪些内容以及如何脱敏。
- 页面 UI / DOM 问题：优先提醒上传页面截图、Elements 截图、关键 HTML 片段。
- Network / 接口问题：优先提醒上传请求 URL、请求参数、响应体、状态码；cookie、token、authorization、签名参数必须脱敏。
- Console / 扩展报错：优先提醒上传完整错误堆栈、报错截图、触发步骤。
- AI / 模型问题：优先提醒上传脱敏后的原始 AI 返回 JSON、debug JSON、后端日志、模型配置截图。
- 数据导入 / CSV / JSON 问题：优先提醒上传脱敏样例文件、字段说明、期望输出。
- 音频 / TTS / ASR 问题：优先提醒上传音频样例、识别结果、页面文本、朗读要求。
- 不要过度打断：信息已经足够时直接生成 Prompt；资料缺失但可低风险推进时，先说明假设再继续。

## 代码质量规则

- 同一模块中大部分重复逻辑超过 2 次时，必须优先抽取复用。
- 避免大段复制粘贴；优先提炼为函数、工具模块、配置表或组件。
- DOM 构建重复超过 2 次时，优先抽取 `createRow`、`createButton`、`createSection` 等复用函数。

## CSS / UI 规则

- 新增样式或重构样式时，优先做 CSS 变量化。
- 当前模块有 SCSS 构建链时，优先使用 SCSS 与嵌套结构。
- 当前模块没有 SCSS 构建链时，不强行引入 SCSS，继续使用 CSS 变量和模块化 class。
- 避免同一模块内重复堆叠近似 class 与大段样式拷贝。

## Git commit 规范

- commit message 必须使用中文；允许保留英文范围标识，但描述必须是中文。
- 推荐格式：
  - `修复(data-baker): 修复 AI 工具卡挂载失败`
  - `优化(data-baker): 调整 Omni 并发显示`
  - `新增(backend): 增加 Fun-ASR REST 调用`
  - `文档(workflow): 更新 Codex Prompt 输出规则`
  - `发布: v0.3.6`
- 禁止使用纯英文、`update`、`fix bug`、`修改` 等含糊提交说明。

## 版本规则

- 一个新的开发 / 修复 / 优化对话，默认对应一个 patch 小版本。
- 执行类任务在第一次代码或用户可见行为改动前，应先提升 patch 版本。
- 同一对话内不重复提升版本。
- 正式发布仍使用 `ASC_RELEASE` 流程。
- 纯文档同步、只读审计或用户明确要求不动版本号的任务，不强制为了规则同步而追补版本。

## 外部文档查阅规则（百炼）

- 涉及百炼 / DashScope / Qwen 模型 / thinking / 结构化输出 / Qwen-Omni / Web Search / 调用地区 / 限流时，先读：`docs/external-docs/aliyun-bailian.md`。
- 官方文档不可访问时，必须明确说明，不能伪造结论。
- 模型名必须使用官方模型列表名称。

## docs 结构规则

- `docs/README.md`：文档导航。
- `docs/platforms/`：平台与脚本文档索引。
- `docs/architecture/`：架构与边界。
- `docs/workflow/`：协作流程、Prompt、验收。
- `docs/external-docs/`：外部官方文档索引。
- `docs/rules/`：当前有效规则。
- `docs/archive/`：历史方案。
- `docs/unfinished/`：未完成模块。

## 验证与发布

- 修改 JS 后运行 `node --check <file>`。
- 修改 `manifest.json` 后检查 JSON 可解析且脚本路径存在。
- 正式发布产物以 CRX 三件套为准：`annotation-script-center-v<version>.crx`、`annotation-script-center-update.xml`、`annotation-script-center-crx-latest.json`。
- ZIP 仅作为历史过渡分发兼容项，不作为正式发布验收必选项。
- 发布阶段使用 CRX 三件套（3.0 起）：
  - `annotation-script-center-v<version>.crx`
  - `annotation-script-center-update.xml`
  - `annotation-script-center-crx-latest.json`

## 文档同步要求

- 有效改动必须同步更新对应 README 与 `log.md`。
- 不得把关键规则只写在对话输出里。

## 禁止事项（项目级）

- 不伪造验证结果。
- 不提交密钥、token、cookie、私钥、敏感数据。
- 未经要求不做大重构。
- 业务代码、后端代码与文档任务边界必须严格区分。
