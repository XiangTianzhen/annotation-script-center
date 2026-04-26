# 审核首页结构资料

## 页面用途

本目录记录 LabelX 审核首页，也就是审核任务列表页。该页面用于查看当前账号已领取或已完成的审核子任务，并展示可领取 / 可分配的审核任务列表。

该页面与标注首页布局相近，同样包含顶部导航、左侧任务菜单、`我的任务` 和 `可领取的任务` 区域。页面上可出现 `分人员领取` 按钮，但本次采集只做只读观察，没有点击领取、释放或提交。

## 真实 URL 样例

- `https://labelx.alibaba-inc.com/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`

建议路由识别拆成：

- 路径：`/corpora/labeling/checkTask`
- 关键查询参数：
  - `projectId`

## 已确认接口

已通过 `chrome_devtools` 在登录态页面确认以下只读请求：

- `/api/v1/label/center/subTasks?type=check&keyword=&appId=<PROJECT_ID>&finished=false&page=1&pageSize=5&_=<timestamp>`
- `/api/v1/label/center/subTasks?type=check&keyword=&appId=<PROJECT_ID>&finished=true&page=1&pageSize=5&_=<timestamp>`
- `/api/v1/label/center/tasks?subTaskType=check&keyword=&appId=<PROJECT_ID>&page=1&pageSize=5&_=<timestamp>`
- `/api/v1/label/center/tasks/process?subTaskType=check&taskIds=<TASK_IDS>&_=<timestamp>`

其中 `subTasks?type=check&finished=true` 返回已完成审核分包摘要，字段结构与标注首页已完成分包基本一致，包含 `id`、`type`、`taskId`、`batchId`、`status`、`gmtCreate`、`gmtCommit`、`taskName`、`size`、`dataList`、`dataResultHistory`、`labelModel`、`taskType` 等字段。

## 与统计上传的关系

- 快判统计上传在首页点击“上传统计”时会同时采集标注和审核两类首页列表。
- 审核首页采集使用 `type=check` / `subTaskType=check`。
- 统计上传只保留 ASR 更优判断任务：`labelModel=vote` 是强判断，`taskName` 包含 `ASR更优结果判断` / `ASR更优` 且 `size=400` 是补充判断；`labelModel=single`、`taskName=中文普通话asr任务` 或 `size=50` 会被视为历史转写任务并跳过。
- 审核分包构造统计 payload 时写入 `roleRecord.role = "audit"`。
- 人员名称优先从顶部头像 hover 后出现的下拉菜单第一个 `role="menuitem"` 读取；读取失败时再回退到接口字段。

## 推荐选择器

- 顶部导航头像：
  - `.ant-v5-dropdown-trigger[class*="NavAvatar-module__userInfoWrapper"]`
  - `[class*="NavAvatar-module__dropdown"] [role="menuitem"]`
- 页面主容器：
  - `main#mainContentWrapper`
  - `.label-center-container`
- 首页分页和任务表格：
  - `.my-task-list`
  - `.all-task-list-container`
  - `ul.label-center-pagination`

## 手动验证建议

1. 打开 `/corpora/labeling/checkTask?projectId=...`。
2. 确认页面顶部导航头像存在。
3. 鼠标悬停头像，确认下拉菜单第一项是当前用户展示名，第二项是组织信息，第三项是 `退出登录`。
4. 打开 DevTools Network，确认审核首页列表请求使用 `type=check` 和 `subTaskType=check`。
5. 只观察结构，不点击 `领取`、`释放`、`分人员领取` 或其他会改变任务状态的按钮。
