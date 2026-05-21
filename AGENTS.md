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

- 输出 Codex Prompt 时，外层只用一个 `text` 代码块。
- Prompt 内不得嵌套 Markdown 三反引号代码块。
- 命令、JSON、env 示例统一用普通缩进文本。
- 完整规范见：`docs/workflow/codex-prompt-style.md`。

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
