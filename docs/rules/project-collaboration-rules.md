# 项目协作规则

本文件用于沉淀项目级长期协作规则，避免网页端和仓库文档回退到旧口径。

## Prompt 下载文件规则

- 网页端输出 Codex Prompt 时，默认生成 `.md` 文件供下载。
- 不再默认在聊天消息中直接贴完整 Prompt。
- 只有用户明确要求“直接贴出 Prompt”时，才直接输出到聊天消息。
- 即使直接贴出，Prompt 内也不应嵌套复杂三反引号代码块。

## 资料补充提醒规则

- 当任务依赖截图、文件、日志、Network、Console、原始 JSON、音频样例等资料时，网页端应先提醒用户上传。
- 页面 UI / DOM 问题：提醒上传页面截图、Elements 截图、关键 HTML 片段。
- Network / 接口问题：提醒上传请求、响应、状态码；敏感字段必须脱敏。
- Console / 扩展报错：提醒上传完整错误堆栈和报错截图。
- AI / 模型问题：提醒上传脱敏原始 AI 返回 JSON、debug JSON、后端日志、模型配置截图。
- 数据导入 / CSV / JSON 问题：提醒上传脱敏样例文件和期望输出。
- 音频 / TTS / ASR 问题：提醒上传音频样例、识别结果、页面文本、朗读要求。
- 不过度打断：资料已足够时直接生成 Prompt；资料不足但仍可低风险推进时，先说明假设再继续。

## 重复代码复用规则

- 同一模块中大部分重复逻辑超过 2 次时，必须优先抽取复用。
- 避免大段复制粘贴。
- 优先抽取为函数、工具模块、配置表或组件。
- DOM 构建重复超过 2 次时，优先抽取 `createRow`、`createButton`、`createSection` 等辅助函数。

## CSS 与 SCSS 规则

- 新增样式或重构样式时，优先做 CSS 变量化。
- 当前模块支持 SCSS 构建链时，优先使用 SCSS 和嵌套结构。
- 当前模块没有 SCSS 构建链时，不强行引入 SCSS，继续使用 CSS 变量和模块化 class。

## 中文 commit message 规则

- Git commit message 必须使用中文。
- 允许保留英文范围标识，但提交描述必须是中文。
- 推荐格式：
  - `修复(data-baker): 修复 AI 工具卡挂载失败`
  - `优化(data-baker): 调整 Omni 并发显示`
  - `新增(backend): 增加 Fun-ASR REST 调用`
  - `文档(workflow): 更新 Codex Prompt 输出规则`
  - `发布: v0.3.6`
- 禁止使用纯英文、`update`、`fix bug`、`修改` 等含糊提交说明。

## patch 小版本规则

- 默认保持当前 `extension/manifest.json` 版本不变，除非用户明确要求“完成当前版本 / 准备打包 / 准备发布 / 提升版本号”。
- 当前阶段版本固定为 `0.3.7`；在用户明确说明“这是 `0.3.7` 的最终版本并开始打包/发布”之前，不自动提升到 `0.3.8`。
- `0.3.7` 完成打包/发布后，后续新的开发 / 修复 / 优化对话再进入 `0.3.8` 周期。
- 正式发布仍使用 `ASC_RELEASE`。
- 纯文档同步、只读审计或用户明确要求不动版本号的任务，不强制为了规则同步而追补版本。

## 平台资料目录规则

- 平台资料根目录优先使用：`README.md`、`backend/`、`network/`、`page-structure/`、`<script-id>/`。
- 平台共用后端、共用 loader、共用词表放 `platform-resources/<platform>/backend/`。
- 平台共用页面结构放 `platform-resources/<platform>/page-structure/`。
- 平台共用 Network 资料放 `platform-resources/<platform>/network/`。
- 脚本目录默认使用：`README.md`、`backend/`、`network/`、`page-structure/`；仅放脚本专属差异。
- README 只维护实际文件职责与边界，不重复抄写默认目录模板。
- 需要保留空目录时使用 `.gitkeep`。
- 平台资料严禁写入 token、cookie、authorization、完整签名 URL、真实敏感文本。

## 同平台脚本互斥规则

- 同一平台存在多个脚本时，默认互斥启用：同一时刻只允许一个脚本生效。
- 启用某脚本时必须自动关闭同平台其他脚本；关闭当前脚本时不自动启用其他脚本。
- 如需同平台并行启用，必须由当前 Prompt 明确授权。

## Magic Data 双助手规则

- Magic Data 双助手（客家话/闽南语）同平台互斥启用。
- AI 配置统一按“模型方案 + 识别策略”，不再以“AI 质检模式”作为主逻辑。
- `识别转换` 属于识别策略，不属于模型方案。
- 审核页 `#/asrmarkCheck` 允许 AI 质检与人工触发填入；禁止自动保存、自动提交、自动点击合格/不合格。
