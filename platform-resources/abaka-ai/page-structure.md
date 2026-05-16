# Abaka AI Task 页面公共结构（脱敏）

## 采集范围

- 采集日期：2026-05-16。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本。
- 覆盖目标：Task21、Task17。
- 说明：本文维护 Task17 / Task21 可复用的公共页面结构；Task21 same_font 专项结构见 `task21/page-structure.md`，Task17 差异见 `task17/page-structure.md`。
- 说明：本文只记录页面结构、DOM、选择器候选和可见文案，不记录完整资源 URL 或原始业务响应。

## 动态任务列表页

URL 模式：

```text
/data-task/v2
```

关键 DOM：

- 页面标题：`Platform`。
- 根节点：`#app`。
- 任务列表：Dynamic Projects 表格。
- 搜索和分页在平台列表页中渲染，任务行可通过任务号与名称定位。

表头字段：

- 任务号 / Project ID
- 任务状态 / Project Status
- 名称 / Name
- 工具类型 / Tool Type
- 批次数 / Batch Count
- 条目数 / Item Count
- 所属团队 / Team
- 创建者 / Owner
- 创建时间 / Created Time

Task21 行样例见 `task21/page-structure.md`。公共识别策略：

- 优先使用 `/data-task/v2` route。
- 使用表头文本确认表格。
- 使用项目号 + 任务名双条件定位目标行。
- 不把行号、hash class、`data-v-*` 作为唯一依据。

## 数据条目页

URL 模式：

```text
/task-v2/data-item?taskId={taskId}&vm={all|batch}&dm=all
```

### 左侧主导航

- 中文：数据条目、统计分析、工作流、成员配置。
- English：Data、Analytics、Workflow、Members。
- 定位：导航文本 + 当前 route。

### 面包屑

- 中文：数据任务 > 动态任务 > `{taskName}` > 数据条目。
- English：Annotation > Dynamic Projects > `{taskName}` > Data。
- `{taskName}` 是任务级定位点，例如 Task21 或 TASK17-9。

### 筛选区

- 中文标题：筛选。
- English 标题：Filter。
- 中文 placeholder：`条目号/文件名`。
- English placeholder：`Search by ID or filename...`。
- 不记录 input value。

### 视图切换

- 中文：全部数据、批次视图。
- English：All、By Batch。
- `vm=all` 为全部数据视图。
- `vm=batch` 为批次视图。

### 批次侧栏

- 仅批次视图出现。
- 中文输入 placeholder：`名称`。
- 可见批次：`批次_1`、`批次_2`。
- `批次_2` 实采为 1 条。
- 侧栏包含 checkbox、批次名、条目计数。

### 状态 Tab

- 中文：总览、待办项、已跳过、已放弃、标注。
- English：Overview、Todo、Skipped、Dropped、Label。
- 内审角色会显示 `标注内审` 节点。

### 表格区

中文表头：

- 条目号
- 帧数
- 无效帧数
- 导入轮次
- 所属批次
- 所在节点
- 标注状态
- 当前审核状态
- 标注员
- 标注团队
- 审核员（内审角色）
- 审核团队（内审角色）
- 变更时间
- 数据来源

English 表头：

- Item ID
- Frames
- Invalid Frames
- Import Round
- Batch
- Stage
- Label Status
- Review Status
- Labeler
- Label Team
- Reviewer
- Review Team
- Last Updated
- Data Source

`data-col-key` 候选：

- `domainId`
- `frames`
- `invalidFrames`
- `importRound`
- `packageId`
- `node`
- `labelStatus`
- `checkStatus`
- `labeler`
- `labelSpace`
- `checker`
- `checkSpace`
- `operateTime`
- `dataSource`

### 分页区

- 中文：跨页全选、已选择0条目，0帧、10 / 页。
- English：Select All Across Pages、Selected 0 entry, 0 frame、10 / Page。
- 跨页全选属于批量风险动作，后续脚本默认禁止自动触发。

### 角色切换

- 标注角色：节点 `标注 / Label`，按钮 `领取标注 / Claim Label`。
- 内审角色：节点 `标注内审`，按钮 `领取审核 / Claim Review`。
- 内审角色表格增加审核员、审核团队列。
- 定位优先使用 `role` query + 按钮文案 + 表头差异。

### 选择状态

- 勾选单条后顶部按钮从 `领取标注` 变成 `标注：1条`。
- 底部状态从 `已选择0条目，0帧` 变成 `已选择1条目，0帧`。
- 该操作触发 `get-frame-count`。

## 查看页

URL 模式：

```text
/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&viewMode=true&nodeId={nodeId}
```

### 资源区

- 多个 `iframe[srcdoc]` 文本预览。
- 三张 `.webp` 图片：
  - `image_a`
  - `image_b`
  - `image_b_removed`
- 图片资源只记录字段名、资源类型、扩展名和 masked 状态。

### same_font 只读状态

- 标题：`same_font`。
- 选项：`true`、`false`、`unsure`、`error`。
- 说明：`same underlying font+artistic effect`。
- 查看页字段不可编辑或禁用。

### 右侧条目列表

- 中文：条目号、条目数。
- English：Item ID、Items。
- Task21 样例：`HM_395_v2#377264`。

### 图片查看器

按钮为英文：

- Zoom In
- Zoom Out
- One to One
- Reset
- Previous
- Play
- Next
- Rotate Left
- Rotate Right
- Flip Horizontal
- Flip Vertical
- Enter Full Screen

### 锁定状态

- 中文：解锁、锁定时不支持对标签进行修改。
- English：UnLock、Modification is not allowed。
- 长时间未工作时会出现暂停提示。

## 标注页

URL 模式：

```text
/items?taskId={taskId}&itemId={itemId}&selectIds={selectId}&nodeId={nodeId}
```

### 顶部 / 工作壳

- 页面标题：`Platform`。
- route：`/items`。
- query keys：`version`、`taskId`、`vm`、`dm`、`role`、`itemId`、`selectIds`、`nodeId`、可选 `viewMode`。

### 资源区

同查看页，包含 iframe 文本预览和 `.webp` 图片资源。

### 主标注区

- 主结构：`same_font`。
- 控件：custom radio + 派生字段 + textarea / rich text editor。
- 点击 `true` 后展开 `image_b_texts_removed`、`other_changes` 等派生字段。
- Task21 快捷键第一版支持 `1~5` 触发 DOM 点击；`1` 默认会联动两个 `specify`。
- 快捷键实现只做页面真实点击，不直接调用保存接口。

### 右侧条目列表

- 当前条：`HM_395_v2#377264`。
- 条目计数：`条目数：1 / Items:1`。

### 锁定 / 工作状态

- 标注页加载会触发工作状态接口。
- 可见计时器。
- 空闲后可能出现暂停文案。

### 操作区

- 暂存
- 放弃
- 跳过
- 送审
- 放弃后可见恢复

这些按钮均属于高风险或需确认动作，不得自动触发。

### 弹窗 / Toast

- 放弃后出现：`提示`、`没有更多数据，是否退出?`、`确认`。
- 离开未保存页面时可能出现浏览器确认：`你有未保存的更改，确定要离开吗?`。

## 任务专项标注结构

Task21 `same_font` 主标注结构已移至 `task21/page-structure.md`。Task17 标注结构差异见 `task17/page-structure.md`。根目录只维护公共容器、资源区、右侧条目列表、锁定状态、操作区和选择器策略。

历史采集到的 Task21 same_font 字段摘要如下，后续以 `task21/page-structure.md` 为准：

| 字段 | 控件类型 | 中文文案 | English 文案 | DOM 定位策略 | 是否触发 Network | 对应接口 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| same_font | custom radio | `true`、`false`、`unsure`、`error`、`same underlying font+artistic effect` | 同中文页 | 标题 `same_font` + `radio-container` + `radio-item` | 选项点击后可能自动保存 | `/api/v2/label/save-labels` | Task21 主标注结构。 |
| image_b_texts_removed | radio + rich text editor | `specify`、`true`、`null` | 同中文页 | same_font 后继字段块 + editor aria | 保存时并入 payload | `/api/v2/label/save-labels` | 点击 true 后出现。 |
| other_changes | radio + textarea | `specify`、`unsure`、`null` | 同中文页 | 后继字段块 + textarea | 保存时并入 payload | `/api/v2/label/save-labels` | 查看页禁用，标注页可见。 |

## 选择器候选

推荐优先级：

1. URL route：`/data-task/v2`、`/task-v2/data-item`、`/items`。
2. query keys：`taskId`、`vm`、`dm`、`role`、`batchId`、`itemId`、`selectIds`、`nodeId`、`viewMode`。
3. 表头文本：Item ID / 条目号、Label Status / 标注状态、Review Status / 当前审核状态。
4. `data-col-key`：作为表格列辅助定位。
5. `role`、`aria-label`、input placeholder。
6. 中文 / English 双语文案兜底。

禁止作为唯一依据：

- `data-v-*`
- 打包 hash class
- 完整图片 / 音频 / 文件 URL
- 行序号

## Task17 对比结论

相同点：

- Data 页路径仍为 `/task-v2/data-item`。
- `/items` 页仍为资源区、标注控件区、右侧条目列表、锁定状态、计时器结构。
- 公共接口族一致：`get-item-info`、`find-labels`、`find-issues`、`find-label-records`、`get-ai-check-result`、`find-invalidate-frame`、`sampling/get-frames-data`、`find-items-base-info`。
- 资源接口仍为对象存储图片资源，完整 URL 必须脱敏。

差异：

- Task17 名称为 `TASK17-9`，项目号前缀为 `HM_312_v2`。
- Task17 列表在内审角色，按钮为 `Claim Review`，表格有 Reviewer / Review Team。
- Task17 `/items` 示例携带多个 `selectIds`，右侧条目列表显示 10 条。
- Task17 主标注是图片二选一、skip、原因多选和其他原因 textarea，不是 Task21 的 same_font。

Task17 不是当前主目标；除已按用户授权补测的内审领取空池失败响应外，不做送审、放弃、跳过、通过、驳回等状态变更。
