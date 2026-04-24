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

- `https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=1023`

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
- 本目录只记录首页结构，不记录详情页题卡结构。
- 详情页结构见 `../asr-judgement-detail/`。
