# Alibaba LabelX ASR 转写页面结构（脱敏）

## 采集范围

- 采集日期：2026-05-09
- 采集方式：Chrome DevTools MCP。
- 详情页：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 首页：`/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
- 本轮采集任务：ASR 转写审核任务，`labelModel=single`，`size=50`。

## 审核首页

页面：ASR 转写审核首页

URL：

```text
/corpora/labeling/checkTask?projectId
```

关键 DOM：

- 顶部导航：`.header-component-container`
- 用户区域：顶部导航右侧头像 / 用户信息区域，结构与快判公共头像下拉一致。
- 任务列表：`我的任务` 下的 Ant Design 表格。
- 任务项：表格行内显示 `任务名称`、`任务ID`、`子任务ID`、`分包ID`、`任务状态`、`领取时间`、`操作`。
- 操作按钮：`检查`、`释放`、`驳回原因`。
- 分页：Ant Design Pagination，包含页码、上一页、下一页、跳页输入框。
- 可领取任务：`可领取的任务` 区域，显示任务名称、任务 ID、已领取/总数、`领取`、`分人员领取`。

供应商是否可从 DOM 直接读取：

- 无独立供应商字段。
- 可从任务名称前缀推断，例如 `棋燊-...`。

## 标注详情页

页面：ASR 转写详情页（标注态）

URL：

```text
/corpora/labeling/sdk?missionType=label&projectId&subTaskId
```

关键 DOM：

- `mark-toolbox`：存在，选择器 `.mark-toolbox`。
- 工具栏挂载点：
  - 页面原生顶部工具栏为 `.mark-toolbox`。
  - 面包屑容器为 `.mark-toolbox-breadcrumb-wrapper`。
  - 本轮未检测到扩展转写工具栏。
- 顶部面包屑：
  - `标注任务`
  - 任务名称，例如 `棋燊-...`
  - `子任务标注`
- 顶部状态：
  - 可见 `被驳回 : 1 / 50` 这类摘要。
  - 可见 `保存成功`。
  - 可见 `自动领取` switch。
  - 可见 `提交任务` 与右侧 `down` 下拉按钮。
  - 本轮标注态未见 `驳 回` 按钮。
- 题卡：`.labelRender-item`
- 当前题：`.labelRender-item-selected`
- 题卡列表：`.labelRender-scrollable`
- 题卡工具栏：`.labelRender-toolbox`
- 当前题导航：`.labelRender-answerNav`
- 文本框：题卡内 `textarea`
- 有效按钮：题卡内 `input[type=radio][value="有效"]`
- 无效按钮：题卡内 `input[type=radio][value="无效"]`
- 特殊按钮：题卡内 `input[type=radio][value="特殊"]`
- 特殊备注：第二个 `textarea`
- audio：存在，原生 `audio` 标签。
- 播放按钮：原生 audio 控件。
- 前进 / 后退：平台按钮 `fast-forward`、`fast-backward`。
- 倍速：题卡内 `倍速` 下拉，当前显示 `1x`。
- 音量：原生 audio 控件音量 slider。
- 任务名 DOM：面包屑内文本。
- 供应商 DOM：无独立节点，只能从任务名推断。

标注态题卡字段：

- 内容区：
  - 音频播放器。
  - 平台前进 / 后退 / 重载 / 倍速控件。
  - `文本` 展示区，显示原始识别文本。
- 回答区：
  - `是否有效` 单选组：`有效 / 无效 / 特殊`。
  - `转写文本` textarea。
  - `特殊备注` textarea。
  - `历史标注`。

与审核态差异：

- 标注态本轮未见 `标注人` 提示、`答案已订正`、`标记错误`、`取消标记错误`。
- 标注态编辑转写文本只观察到 `subTask/{id}/data` 保存；未观察到 `mistake` 请求。

## 审核详情页

页面：ASR 转写详情页（审核态）

URL：

```text
/corpora/labeling/sdk?missionType&projectId&subTaskId
```

关键 DOM：

- `mark-toolbox`：存在，选择器 `.mark-toolbox`。
- 工具栏挂载点：
  - 页面原生顶部工具栏为 `.mark-toolbox`。
  - 面包屑容器为 `.mark-toolbox-breadcrumb-wrapper`。
  - 本轮未检测到扩展转写工具栏或 `#asr-edge-transcription-stats-upload-entry`。
- 题卡：`.labelRender-item`
- 当前题：`.labelRender-item-selected`
- 题卡列表：`.labelRender-scrollable`
- 题卡工具栏：`.labelRender-toolbox`
- 当前题导航：`.labelRender-answerNav`
- 文本框：题卡内 `textarea`
- 有效按钮：题卡内 `input[type=radio][value="有效"]`
- 无效按钮：题卡内 `input[type=radio][value="无效"]`
- 特殊按钮：题卡内 `input[type=radio][value="特殊"]`
- 特殊备注：第二个 `textarea`
- audio：存在，原生 `audio` 标签。
- 播放按钮：原生 audio 控件。
- 前进 / 后退：平台按钮 `fast-forward`、`fast-backward`。
- 倍速：题卡内 `倍速` 下拉，当前显示 `1x`。
- 音量：原生 audio 控件音量 slider。
- 任务名 DOM：面包屑内文本。
- 供应商 DOM：无独立节点，只能从任务名推断。

## 当前页题卡字段

每条题卡包含：

- 内容区：
  - 音频播放器。
  - 平台前进 / 后退 / 重载 / 倍速控件。
  - `文本` 展示区，显示原始识别文本。
- 回答区：
  - 标注人提示。
  - 审核态订正提示，例如 `答案已订正`。
  - `是否有效` 单选组：`有效 / 无效 / 特殊`。
  - `转写文本` textarea。
  - `特殊备注` textarea。
  - `历史标注`。
  - `标记错误` / `取消标记错误`。

## 已测试交互

### 音频

- 播放 / 暂停：可用。
- 后退：可将当前音频时间归零。
- 前进：可将当前音频推进到结尾。
- 未触发业务保存请求。

### 有效性切换

测试步骤：

1. 记录当前题原始状态。
2. 将 `有效` 切到 `无效`。
3. 等待平台自动保存。
4. 切回 `有效`。
5. 刷新页面确认恢复。

观察：

- 会触发 `POST /api/v1/label/center/mistake`。
- 会触发 `POST /api/v1/label/center/subTask/{subTaskId}/data`。
- 会刷新 `summary` 和 `board`。
- 最终刷新后确认可恢复。

### 文本编辑

测试步骤：

1. 记录当前题转写文本原文。
2. 临时追加测试后缀。
3. 触发 input/change/blur。
4. 等待平台自动保存。
5. 恢复原文。
6. 刷新页面确认恢复。

观察：

- 会触发 `POST /api/v1/label/center/subTask/{subTaskId}/data`。
- 保存体包含单条 `dataList` 和 `timestamp`。
- 最终刷新后确认原文恢复。

### 提交任务

测试步骤：

1. 用户授权后点击 `提交任务`。
2. 页面顶部按钮进入 loading。
3. 自动领取开关处于开启状态。
4. 最终返回审核首页。

观察：

- 触发 `POST /api/v1/label/center/subTask/{subTaskId}/commit`。
- 随后触发 `POST /api/v1/label/center/{taskId}/check/fetch`。
- 未跳转到新详情页，返回 `/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`。

### 提交下拉菜单

测试步骤：

1. 用户授权后打开 `提交任务` 右侧下拉。
2. 只记录菜单结构。
3. 用户授权后点击 `提交并结束`。

DOM 观察：

- 下拉按钮：`提交任务` 右侧 `down` 按钮。
- 菜单项：
  - `提交并结束`
  - `释放并结束`
  - `跳过必填校验` switch

行为观察：

- `提交并结束` 会触发 `commit`。
- 不触发自动领取 `check/fetch`。
- 返回审核首页。

### 驳回弹窗

测试步骤：

1. 用户授权后点击顶部 `驳 回`。
2. 平台打开居中 modal。
3. 填写 `驳回理由`。
4. 点击 `确 定`。

DOM 观察：

- 顶部按钮：`.mark-toolbox` 内 `驳 回`。
- 弹窗标题：`驳回至上个环节`。
- 必填字段：`驳回理由` textarea。
- 计数文本：`0 / 500`。
- 操作按钮：
  - `取 消`
  - `确 定`

行为观察：

- 点击 `确 定` 后按钮进入 `loading 确 定`。
- 成功提示：`驳回成功！跳转回标注中心`。
- 随后返回审核首页 `/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`。

### 分页和每页条数

DOM 观察：

- 页码区：Ant Design Pagination。
- 可见页码：按当前 `recordCount/size` 展示，例如 50 条时默认 `1` 到 `5`。
- 上一页 / 下一页：`left`、`right` 按钮。
- 每页条数：Ant Design Select，当前显示如 `10 条/页` 或 `20 条/页`。
- 每页条数选项：
  - `1 条/页`
  - `2 条/页`
  - `3 条/页`
  - `4 条/页`
  - `5 条/页`
  - `10 条/页`
  - `20 条/页`
  - `30 条/页`
  - `40 条/页`
  - `50 条/页`

行为观察：

- 点击页码会更新当前题号，例如第 2 页显示第 11 题，第 3 页显示第 21 题。
- 从第 3 页切到 `20 条/页` 后，当前题号显示第 41 题。
- 平台保留当前页码，不自动切回第 1 页。
- 标注详情页从 `10 条/页` 切到 `50 条/页` 后，页面一次渲染 50 个音频题卡。
- `50 条/页` 标注详情页 DOM 计数：`audio=50`，`textarea=101`。

### 标注详情页批量写入测试

测试步骤：

1. 切换到 `50 条/页`。
2. 对当前页 10 个非空转写 textarea 快速连续写入临时测试后缀并触发输入事件。
3. 刷新页面并切回 `50 条/页` 查看真实保存结果。
4. 恢复临时测试后缀，刷新并再次核验。

观察：

- 平台只触发 1 次 `POST /api/v1/label/center/subTask/{subTaskId}/data`。
- 保存体仅包含单条 `dataList`。
- 刷新后只看到 1 条数据保留临时后缀。
- 恢复后刷新并切回 `50 条/页`，临时后缀计数为 0。

结论：

- 快速批量改多个 textarea 不能保证全部保存。
- 后续全页一键填充不能直接采用“批量写 DOM 后统一 blur”的策略。
- 后续目标方案应优先验证直接多条 `dataList[]` 保存或小批量保存；逐题等待自动保存只适合作为低速兜底。
- 必须提供中止、恢复和保存结果校验方案。

### 筛选面板

入口：

- 顶部工具栏文本 `筛选`。

面板结构：

- 标题：`筛选条件`
- `按内容区数据：`
  - 输入框 placeholder：`请输入内容关键词`
- `按任务状态：`
  - Select，默认 `全部`
  - 可见选项：`全部`、`已完成`、`未完成`
- `按回答区数据(仅支持选择题)：`
  - `新增筛选条件`
  - 题目 Select，当前转写样例可选 `是否有效`
  - 答案 Select，可选 `有效`、`无效`、`特殊`
- `条件关系：`
  - radio `且(AND)`
  - radio `或(OR)`
- 操作按钮：
  - `重 置`
  - `确 定`

行为观察：

- 选择 `是否有效=有效` 并点击 `确定` 后，会通过 `filter.questions` 影响 `data` 和 `board` 请求。
- 选择 `或(OR)` 后，radio label 增加 `ant-v5-radio-button-wrapper-checked`。
- 设置内容区关键词和任务状态 `未完成` 后，`filter.content` 与 `dataStatus=UNFINISHED` 写入 `data` 和 `board` 请求。
- 点击 `重 置` 后关键词清空、任务状态回到 `全部`。
- 筛选测试不修改题目数据。

CSS / DOM 观察：

- 筛选面板由 Ant Design dropdown 挂载到 `body` 尾部。
- 外层 class：
  - `ant-v5-dropdown css-11ftrgp css-var- ant-v5-dropdown-css-var ant-v5-dropdown-placement-bottomLeft`
- 面板背景 class：
  - `labelRender-toolbox-filter-background`
- 标题 class：
  - `labelRender-toolbox-item-filter-title`
- 内容 class：
  - `labelRender-toolbox-item-filter-content`
- dropdown inline style 包含：
  - `--arrow-x`
  - `--arrow-y`
  - `inset`
  - `box-sizing`
  - `min-width`
- 打开筛选面板时，`.mark-toolbox`、`.labelRender-toolbox`、`.labelRender-scrollable`、`.labelRender-item-selected` 的 class 未变化。

## 未检测到的扩展 DOM

本轮 Chrome 页面未检测到：

- `#asr-edge-transcription-stats-upload-entry`
- `#asr-edge-judgement-stats-upload-entry`
- `[id*=asr-edge]`
- `[class*=asr-edge]`
- `window.__ASREdgeAlibabaLabelxTranscriptionStatsClient`
- `window.__ASREdgeAlibabaLabelxJudgementServer`

可能原因：

- 当前 Chrome 未加载本仓库 `extension/`。
- 扩展未启用对应脚本。
- options 当前 active project 不匹配。
- 页面刷新后 content script 未注入或未命中。

## 待补采

- 扩展启用后的工具栏 DOM 和快捷键行为。
- 在正常可编辑详情页复测高速全页一键填充保存方案。
- 样式设置面板 DOM。
