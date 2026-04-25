# 待二次采集请求

## 当前状态

以下动作可能改变当前标注状态、任务流转状态或提交状态。本阶段已补采首页手动领取、连续领取、释放、首页标注打开详情页、详情页选择/输入保存、保存边界、分页大小、真实翻页、任务状态筛选、音频播放/高级操作、题卡选中/快捷键观察、未完成提交前端校验、提交成功响应体和自动领取空池响应体。

## 已补采但仍有缺口

### 提交任务

已采集文件：

- `10-subtask-commit.md`
- `20-submit-client-validation.md`

- 已确认：点击 `提交任务` 触发 `POST /api/v1/label/center/subTask/{subTaskId}/commit`。
- 已确认：请求体只有 `subTaskId`。
- 已确认：本次状态码为 `200`。
- 已确认：提交成功 response body 为 `code=0`、`data=true`、`success=true`。
- 已确认：自动领取开启时，提交成功后继续触发 `label/fetch`。
- 已确认：未完成包点击 `提交任务` 时，前端会先提示必填题未填写，并且不发出 `/commit` 请求。
- 已确认：用户说明自动领取关闭时提交的页面工作流与本次自动领取空池后返回首页一致，不再单独复测。
- 不再采集：完成全部题目后服务端提交失败属于异常路径，实际使用中基本不会主动构造。

### 自动领取空池路径

已采集文件：`11-label-fetch-auto.md`

- 已确认：自动领取开启时，提交成功后触发 `POST /api/v1/label/center/{taskId}/label/fetch`。
- 已确认：请求体包含 `taskId`、`type=label`、`autoFetch=true`。
- 已确认：任务池没有可领取数据时，HTTP status 仍为 `200`，业务响应为 `code=500`、`message="暂无待标注数据"`、`data=null`、`success=false`。
- 已确认：任务池没有可领取数据时，本次未进入新详情页，而是返回标注首页。
- 缺口：有可领取数据时的 response body 和跳转详情页 URL 未采集。

### 首页手动领取与释放

已采集文件：

- `16-label-fetch-manual.md`
- `17-subtask-release.md`

已确认：手动领取成功时返回新的 `subTaskId`。
已确认：连续手动领取多条时，每次领取后都会刷新 `subTasks`、`tasks`、`tasks/process`。
已确认：手动领取空池任务时 HTTP status 仍为 `200`，业务响应 `code=500`，message 为 `暂无待标注数据`。
已确认：释放已领取包使用 `/subTask/{subTaskId}/release`，成功响应 `data=true`。

### 首页标注打开详情页

已采集文件：`22-home-open-subtask-detail.md`

已确认：首页未完成包行内 `标注` 打开新的详情页标签页。
已确认：首页当前标签页未观察到额外跳转前业务接口。
已确认：新详情页执行标准 `data`、`summary`、`board`、`session`、`getLabelTaskInfo` 初始化链路。
已确认：可出现多个同一 `subTaskId` 的详情页标签。

### 保存、分页、筛选、音频

已采集文件：

- `18-subtask-data-save.md`
- `19-subtask-data-pagination-filter.md`
- `09-audio-media.md`

已确认：单选和填空都使用 `POST /subTask/{subTaskId}/data` 自动保存。
已确认：补齐当前页多条单选时，每条修改基本对应独立保存请求，payload 中 `dataList` 仍只有单条样本。
已确认：清空填空内容会保存 `value=""`。
已确认：快速连续输入后仅保存最终值。
已确认：每页条数切换会改变 `pageSize` 并刷新 `data`、`summary`、`board`。
已确认：点击页码 `2` 会请求 `data?page=2&pageSize=20...`，随后刷新 `summary`、`board` 并加载新页音频。
已确认：任务状态筛选会改变 `filter.dataStatus` 并刷新 `data`、`summary`、`board`。
已确认：音频播放、暂停、拖动、快进、后退、倍速调整未观察到额外业务保存请求；重载会再次触发同一音频的 media Range 请求。

### 题卡选中与上下题

已采集文件：`21-item-selection-navigation.md`

已确认：鼠标点击题卡只改变 `.labelRender-item-selected`，未观察到新增业务请求。
已确认：自动化触发 `W` / `S` / `Shift+ArrowDown` / `Shift+ArrowUp` 时，页面可收到键盘事件，但本次未改变 selected 题卡，也未产生业务请求。
已确认：用户说明真实用户快捷键上下题复测不会产生业务请求，不再单独复测 Network。

### 提交后首页列表

已采集文件：

- `12-home-subtasks.md`
- `13-home-tasks.md`
- `14-home-tasks-process.md`
- `15-home-subtasks-finished.md`

已确认：提交后返回首页时会加载“我的任务”“可领取的任务”和任务进度补充接口。
已确认：标注首页“我的任务 / 已完成”使用 `/subTasks?finished=true`，返回已提交子任务包摘要。

## 不再主动采集项

以下项保留说明，但不再列为待采集：

- 回答区数据筛选 `filter.questions`：实际使用中基本不会使用，当前已记录常规筛选 `filter.dataStatus` 和 `questions=[]` 的结构。
- 音频加载失败：依赖异常资源或网络异常，实际使用中基本不会出现，不主动构造失败路径。
- 保存失败：需要构造异常或网络失败，实际使用中基本不会出现，不主动构造失败路径。
- 真实用户快捷键上下题复测：用户确认真实使用也不会产生业务请求；现有文档已记录自动化触发和鼠标选中均无新增业务请求。
- 自动领取关闭时提交：用户说明页面工作流与本次提交后自动领取空池返回首页一致，不再单独复测。
- 提交服务端失败：属于异常路径，不主动构造。

## 仍待采集清单

用户已说明后续不需要再执行“全包填充为其他方言或语种”，答案已由用户处理完成。当前已完成答案后的提交和自动领取空池 response body 已补齐，后续只采集仍未完成且有实际价值的分支。

| 动作 | 风险 | 预期需要记录 |
| --- | --- | --- |
| 自动领取成功进入新详情页 | 会领取新包 | 提交后 `label/fetch` response body、是否返回新 subTaskId、详情页跳转 URL |

## 二次采集建议步骤

1. 先清空或记录当前 Network 请求基线。
2. 用户明确说明允许采集的动作。
3. 用户或 Agent 只执行一个动作。
4. 立即记录新增 XHR/fetch/media 请求。
5. 对请求 body 和 response 做脱敏摘要。
6. 将对应请求补充为独立 Markdown 文件。
7. 更新本文件的待采集状态。

## 脱敏要求

- 不记录完整 cookie、token、authorization、session、csrf。
- 不记录人员信息、完整音频签名 URL、完整 ASR 文本。
- 保存/提交 payload 中如果包含答案，只保留字段结构和少量枚举值示例。
- 如果响应包含完整样本列表，只保留结构和 1 到 2 条脱敏样例。
