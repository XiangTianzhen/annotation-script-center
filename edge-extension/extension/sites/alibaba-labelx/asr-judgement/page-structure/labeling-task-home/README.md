# 标注首页结构资料

## 页面用途

本目录记录 LabelX 标注首页，也就是标注任务列表页。该页面用于查看当前账号已领取的标注子任务，并展示可领取任务列表。

当前页面包含两个主区域：

- `我的任务`
  - 以 tabs 区分 `未完成` 和 `已完成`
  - 当前采集到的 `未完成` tab 内是 Ant Design Table
  - 表格操作按钮包括 `标注` 和 `释放`
- `可领取的任务`
  - 顶部有任务名称过滤输入框
  - 列表主体也是 Ant Design Table
  - 行内操作按钮为 `领取`

## 真实 URL 样例

- `https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`

建议路由识别拆成：

- 路径：`/corpora/labeling/labelingTask`
- 关键查询参数：
  - `projectId`

## 文件说明

- `page-meta.md`
  - 页面 URL、框架痕迹、异步接口、推荐选择器和风险说明。
- `app-shell.html`
  - 页面顶层内容区骨架。
- `side-menu.html`
  - 左侧任务类型菜单。
- `home-root.html`
  - 标注首页主容器 `.label-center-container` 的板块顺序。
- `my-tasks-section.html`
  - “我的任务”区域，包含 tabs、过滤输入框、表格和分页。
- `task-filter.html`
  - 任务名称过滤输入框。
- `my-task-table.html`
  - 已领取任务表格的代表性结构。
- `available-tasks-section.html`
  - “可领取的任务”区域，包含过滤输入框、任务表格和分页。
- `available-task-row.html`
  - 可领取任务表格的代表性行。
- `pagination.html`
  - 两类分页控件代表性结构。
- `action-buttons.html`
  - `标注` / `释放` / `领取` 行内按钮结构。
- `../common-top-nav-avatar-dropdown.html`
  - 顶部导航右侧头像下拉菜单，包含用户、组织和退出登录入口，属于共享导航结构。

## 推荐选择器

- 页面主容器：
  - `main#mainContentWrapper`
  - `.label-center-container`
- 左侧菜单：
  - `.left-menu-container .side-menu`
  - `.side-menu [role="menuitem"]`
- 我的任务区域：
  - `.my-task-list`
  - `.my-task-list-tabs`
  - `.my-task-list .ant-v5-table-wrapper`
- 可领取任务区域：
  - `.all-task-list-container`
  - `.all-task-list-container .ant-v5-table-wrapper`
- 过滤输入框：
  - `.label-center-filter input[placeholder="请输入任务名称"]`
- 行内动作按钮：
  - `button.label-center-task-link`
  - 按按钮文本区分 `标注`、`释放`、`领取`
- 顶部导航头像：
  - `.ant-v5-avatar.ant-v5-avatar-circle`
  - 下拉菜单 `.ant-v5-dropdown-menu[role="menu"]`
- 分页：
  - `ul.label-center-pagination`

## 当前页面结构结论

- 首页没有 radio，也没有 textarea。
- 页面主要输入框是两个任务名称过滤框，另有分页跳转输入框。
- `我的任务` 和 `可领取的任务` 都使用 Ant Design Table。
- `可领取的任务` 看起来像列表卡片，但 DOM 实际是 table row。
- 页面首屏数据异步加载，表格内容刷新后任务名称、任务 ID、领取时间都会变化。

## 手动验证建议

1. 打开 `/corpora/labeling/labelingTask?projectId=...`。
2. 确认 `main#mainContentWrapper .label-center-container` 存在。
3. 确认 `.my-task-list` 下存在 tabs 和表格。
4. 确认 `.all-task-list-container` 下存在可领取任务表格。
5. 只观察结构，不点击 `标注`、`释放`、`领取`。

## 与详情页的关系

- 从“我的任务”表格点击 `标注` 会进入详情页路由 `/corpora/labeling/sdk?...`。
- “我的任务 / 已完成”进入详情页时可能带 `disableEdit=true` 和 `isFinished=true`。
- 首页点击 `领取` 会触发 `/api/v1/label/center/{taskId}/label/fetch`。
- 首页点击 `释放` 会触发 `/api/v1/label/center/subTask/{subTaskId}/release`。
- 本目录只记录首页结构，不记录详情页题卡结构。
- 详情页结构见 `../asr-judgement-detail/`。

## 与当前快判运行时的关系

- 当前快判运行时主要在详情页生效。
- 首页结构资料主要服务于后续领取、释放、打开详情页等流程分析。
- 当前扩展默认不自动点击首页的 `标注`、`释放`、`领取` 按钮。
- 若后续实现首页辅助能力，应新增独立模块，不要把首页逻辑写入详情页相关模块。
