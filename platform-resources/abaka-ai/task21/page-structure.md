# Abaka AI Task21 页面结构

## 目录定位

本文只记录 Task21 相对 Abaka AI Task 页面公共结构的差异。公共页面壳、Data 页、状态 Tab、分页、角色切换、资源区和右侧条目列表见 `../page-structure.md`。

## Task21 业务识别

| 字段 | 样例 |
| --- | --- |
| 任务号 / Project ID | `#HM_395_v2` |
| 名称 / Name | `Task21` |
| 工具类型 / Tool Type | `MMAT` |
| 所属团队 / Team | `abaka.ai` |
| 创建者 / Owner | `Anniejln` |
| 创建时间 / Created Time | `04-30-2026 22:01:33` |

这些值只用于人工核对，不作为脚本唯一硬编码依据。

## same_font 主标注结构

| 字段 | 控件类型 | 文案 / 值 | DOM 定位策略 | Network |
| --- | --- | --- | --- | --- |
| `same_font` | custom radio | `true`、`false`、`unsure`、`error`、`same underlying font+artistic effect` | 标题 `same_font` + 后继 `radio-container` | `network/08-label-save-labels.md` |
| `image_b_texts_removed` | radio + rich text editor | `specify`、`true`、`null` | `same_font=true` 后出现的派生字段块 | `network/08-label-save-labels.md` |
| `other_changes` | radio + textarea | `specify`、`unsure`、`null` | 后继字段块 + textarea | `network/08-label-save-labels.md` |

Task21 输入区结构补充（2026-05-19）：

- `image_b_texts_removed` 常见输入区：
  - `div.l-item`
  - `span.l-title-text = image_b_texts_removed`
  - `div.l-label .custom-md-editor`
  - `div.l-label .monaco-container[data-mode-id="markdown"]`
  - `.monaco-editor[data-uri="inmemory://model/..."]`
  - `textarea.inputarea.monaco-mouse-cursor-text`
  - `.view-lines`
- `other_changes` 常见输入区：
  - `.l-label .n-input.n-input--textarea...`
  - `textarea.n-input__textarea-el`
- 字段定位建议优先级：
  - `Array.from(document.querySelectorAll(".l-item"))`
  - 在每个 `.l-item` 内查 `.l-title-text`，文本严格等于字段名
  - 命中后只在当前 `.l-item` / `.l-label` 内查输入控件，避免串填到其他字段
- `specify` 填写时建议先等待输入区渲染（当前实现默认 `5000ms`，轮询间隔 `80ms`），再执行写入。
- Monaco/custom-md-editor 建议写入顺序：
  - 先读 `.monaco-editor[data-uri]`
  - 用 `window.monaco.editor.getModels()` 匹配 `model.uri.toString()`
  - 命中后 `model.setValue(text)`
  - 再 fallback 到 editor instance / `execCommand` / textarea fallback
- `image_b_texts_removed` 的业务判断链路：
  - `T` = target removal text multiset，目标删除文本多重集，只作辅助
  - `B` = image_b 可读文本实例多重集
  - `R` = image_b_removed 仍可读文本实例多重集
  - `D = B - R`
- 只有 `image_b` 中存在、`image_b_removed` 中消失的文本才叫删除。
- `image_a` 不参与 `image_b_texts_removed` 删除判断。
- `true`：`D == T`。
- `null`：`D` 为空。
- `specify`：`D` 非空且 `D != T`，包括 extra deleted texts、部分删除、count mismatch。
- 多实例比较大小写不敏感；普通空格、普通字距差异可忽略。
- 换行和 `<br>` 有意义；带换行文本与无换行文本不能合并。
- `specify` 行格式限定为：
  - `all instances of xxx`
  - `1 instance of xxx`
  - `N instances of xxx`
- 例子：
  - `Logo Variation` 只删 `Variation` 时，写 `1 instance of Variation`
  - `MODERN<br>ABODE` 必须保留 `<br>`
  - `image_b_removed` 中仍保留的文本不算删除，不能写 `all instances of xxx`
- 超时诊断应至少包含：
  - `fieldItemFound`
  - `titleFound`
  - `customMdEditorFound`
  - `monacoContainerFound`
  - `monacoEditorFound`
  - `monacoDataUri`
  - `monacoTextareaFound`
  - `viewLinesFound`
  - `viewLinesPreview`
  - `candidateCount`
- Task21助手运行时版本排查：
  - 面板调试信息显示 `runtimeVersion` / `domActionsVersion`
  - Console 启动日志显示 `[ASC][Abaka AI] Task21 assistant runtime version: ...`
  - 若页面仍出现旧 `2500ms` 提示，优先判断扩展未重载或旧页面未刷新

Task21 快捷键联动（运行时）：

- `same_font=true` 或 `same_font=same underlying font+artistic effect` 快捷键命中后，默认会确保：
  - `image_b_texts_removed=specify`
  - `other_changes=specify`
- ensure 行为为幂等：`specify` 已选中时不会重复点击，不会被取消。
- 该联动仅通过页面 DOM 点击触发，不直接调用保存接口。
- 若页面后续触发 `save-labels`，属于平台自身监听点击后的行为。

本轮 DevTools MCP 快照补充（2026-05-18）：

- 标注区外层：`.grid-board`
- 字段容器：`.l-item`
- 字段标题：`.l-title-text`
- 标题动作区：`.l-header-actions`
- 单选项：`.radio-container .radio-item.custom-radio`（选中态可能含 `.checked`）

Task21 按钮快捷键（运行时）：

- `6`：仅点击页面真实“暂存 / Save / Stash”按钮，不直接调用 `save-labels`。
- `7`：仅点击页面真实“送审 / Submit / Submit Review”按钮，不直接调用提交接口，也不自动确认二次弹窗。
- `7` 会在疑似标注内审环境下被阻止；`6/7` 在 `viewMode=true` 查看页不执行。

## AI 面板结构（调试版）

- 面板注入位置：字段标题右侧（内联按钮）。
- 按钮挂载：
  - `same_font`：`AI分析`、`整体分析`
  - `image_b_texts_removed`：`AI分析`
  - `other_changes`：`AI分析`
- 结果展示：字段锚点悬浮窗，可关闭，可展开“原始 JSON（脱敏）”。
- 可用状态：
  - `same_font` 板块不存在时：same_font/overall 按钮禁用。
  - `image_b_texts_removed` 或 `other_changes` 板块不存在时：对应按钮禁用。
- 快捷键（默认）：
  - `Alt+1`：same_font
  - `Alt+2`：image_b_texts_removed
  - `Alt+3`：other_changes
  - `Alt+4`：overall
- 数据采集：
  - 优先读取 `POST /api/v2/item/get-item-info`
  - 回退 DOM：`.content-title span` + `.content-image-view img`
  - 图片字段固定为：`image_a`、`image_b`、`image_b_removed`
  - 文本字段：`image_a_texts`、`image_b_texts`、`text_positions`（能读则读）
  - 页面当前值：`same_font`、`image_b_texts_removed`、`other_changes`
- 安全边界：
  - 面板不自动写入字段，不自动保存/提交/送审。
  - 调试原始 JSON 脱敏显示，不展示完整图片 URL / dataUrl / token。
  - `same_font` 支持 `error`（用于仅单侧存在文本等异常数据）。
  - `image_b_texts_removed=specify` 支持 `all instances of xxx / N instance of xxx / N instances of xxx`。
  - `other_changes` 只比较 `image_b_removed` 与 `image_b`，不比较 `image_a`。

## 资源字段

- `image_a`
- `image_b`
- `image_b_removed`
- 多个 `iframe[srcdoc]` 文本预览

完整资源 URL 不记录；资源加载公共规则见 `../network/task-page/17-resource-files.md`。

## 后续脚本定位建议

- 先用 `/items` route 与 `taskId` 判断 Task21 工作页。
- 再用 `same_font` 标题确认专项标注区。
- 字段保存只监听 `/api/v2/label/save-labels`，不得主动写入。
