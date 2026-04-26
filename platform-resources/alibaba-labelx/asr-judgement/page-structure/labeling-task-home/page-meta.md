# 页面元信息

- 页面名称：智能标注
- 页面类型：LabelX 标注首页 / 标注任务列表页
- 页面 URL 样例：`https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`
- 页面用途：展示已领取标注子任务和可领取任务，并提供进入标注详情、释放任务、领取任务的入口
- 本地 Console 导出文件：
  - `C:\Projects\annotation-script-center\edge-extension\脚本输出文件\首页1.json`
  - `C:\Projects\annotation-script-center\edge-extension\脚本输出文件\首页2.json`
- Console 导出概要：
  - buttons：13
  - radios：0
  - textareas：0

## 顶层结构

- 应用根：
  - `#root`
- 主内容：
  - `main#mainContentWrapper`
- 首页容器：
  - `.label-center-container`
- 左侧菜单：
  - `.left-menu-container`
  - `.side-menu`

## 主区域结构

- 我的任务标题：
  - `.label-center-task-header`
  - 文本为 `我的任务`
- 我的任务列表：
  - `.my-task-list`
  - `.my-task-list-tabs`
  - `.my-task-list .ant-v5-table-wrapper`
- 可领取任务标题：
  - `.label-center-task-header`
  - 文本为 `可领取的任务`
- 可领取任务列表：
  - `.all-task-list-container`
  - `.all-task-list-container .ant-v5-table-wrapper`

## 推荐选择器

- 任务名称过滤框：
  - `.label-center-filter input[placeholder="请输入任务名称"]`
- 我的任务表格行：
  - `.my-task-list .ant-v5-table-tbody .ant-v5-table-row`
- 可领取任务表格行：
  - `.all-task-list-container .ant-v5-table-tbody .ant-v5-table-row`
- 行内操作按钮：
  - `button.label-center-task-link`
- 顶部导航头像下拉：
  - `.ant-v5-avatar.ant-v5-avatar-circle`
  - `.ant-v5-dropdown-menu[role="menu"]`
- 进入详情页按钮：
  - 在 `.my-task-list` 行内查找文本 `标注`
- 释放按钮：
  - 在 `.my-task-list` 行内查找文本 `释放`
- 领取按钮：
  - 在 `.all-task-list-container` 行内查找文本 `领取`
- 分页：
  - `.label-center-pagination`

## 渲染与加载特征

- 渲染框架特征：
  - `#root` 下存在 React root 痕迹
  - 未发现 Vue `data-v-app`
  - 未发现 iframe
  - 未发现 shadow root
- 首屏是否异步加载：是
- 本次观察到的关键接口：
  - `GET /api/v1/label/center/subTasks?type=label&keyword=&appId=<REDACTED_PROJECT_ID>&finished=false&page=1&pageSize=5...`
  - `GET /api/v1/label/center/subTasks?type=label&keyword=&appId=<REDACTED_PROJECT_ID>&finished=true&page=1&pageSize=5...`
  - `GET /api/v1/label/center/tasks?subTaskType=label&keyword=&appId=<REDACTED_PROJECT_ID>&page=1&pageSize=5...`
  - `GET /api/v1/label/center/tasks/process?subTaskType=label&taskIds=...`
  - `POST /api/v1/label/center/<REDACTED_TASK_ID>/label/fetch`
  - `POST /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/release`

## 动态节点与不稳定因素

- 刷新后会变化：
  - `projectId`
  - 任务名称
  - 任务 ID
  - 子任务 ID
  - 分包 ID
  - 任务状态
  - 领取时间
  - 表格分页状态
- 不建议依赖：
  - `css-19lwvue`
  - `css-var-`
  - `rc-tabs-*`
  - `rc_unique_*`
  - `data-menu-id`
  - `data-aplus-*`
  - `data-spm-*`
  - `aria-describedby`
- 可辅助但不应唯一依赖：
  - Ant Design class，如 `.ant-v5-table-wrapper`、`.ant-v5-tabs`、`.ant-v5-pagination`

## 后续扩展脚本开发建议

- 首页识别应优先使用路径 `/corpora/labeling/labelingTask`，并确认 `.label-center-container` 存在。
- 如果后续脚本要从首页跳转详情页，不要自动点击 `标注`，应先做用户确认或只生成候选动作。
- 自动领取、释放任务属于业务动作，不应在结构采集或默认脚本初始化阶段触发。
- 顶部头像下拉中存在 `退出登录`，脚本不要主动点击。
- 首页工具栏若需要挂载，候选位置：
  - `.label-center-container` 顶部
  - `.my-task-list` 前
  - `.all-task-list-container` 前
- 当前快判运行时没有首页自动化逻辑；首页相关能力后续应单独建模块，并同步更新快判 README 和根目录 `log.md`。

## 采集备注

- 当前采集日期：2026-04-23
- 采集方式：Google Chrome + `chrome_devtools` MCP + 用户保存的 Console JSON
- 页面是否包含脱敏处理：是
- 是否需要登录态：是
