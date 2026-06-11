# 03 首页到编辑器的页面链

## 页面标识 / 路由 / 前置条件

- `routeKey`: `home-to-editor`
- `riskLevel`: `safe-ui`

- 路由：`#/my-job`
- 前置条件：有效登录态

- `#/my-job`：`project_list`
- `callout`：`top_info + process_list_queryopt + process_list`
- `job`：`task/top_info + job_list_queryopt + job_list`
- `继续作业`：把 `<projectId> / <taskId> / <processId> / <dataId> / <jobId>` 拼进 `/app/editor/asr/`

## 页面总览

- `#/my-job`：`project_list`
- `callout`：`top_info + process_list_queryopt + process_list`
- `job`：`task/top_info + job_list_queryopt + job_list`
- `继续作业`：把 `<projectId> / <taskId> / <processId> / <dataId> / <jobId>` 拼进 `/app/editor/asr/`

## DOM 树 / 区域结构

- 当前文件未补充完整 DOM 树；后续仅记录稳定区域结构。

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 搜索框 | `input[placeholder="请输入ID/名称"]` | `high` |
| 标注项目标签 | `text=标注项目` | `high` |
| 考试项目标签 | `text=考试项目` | `high` |
| 项目表格 | `table` + `text=项目ID` | `medium` |
| 打开按钮 | `button:has-text("打开")` | `high` |

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 项目级菜单 | `getByRole('menuitem', { name: '标注任务' })` | `high` |
| 任务表头 | `text=任务ID` | `high` |
| 查询按钮 | `button:has-text("查询")` | `high` |
| 任务名称链接 | `a[href*="/callout/"][href*="/job?"]` 或 `text=<taskName>` | `medium` |
| 领取按钮 | `button:has-text("领取")` | `high` |
| 修改按钮 | `button:has-text("修改")` | `high` |

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 返回按钮 | `button:has-text("返回")` | `high` |
| 搜索框 | `input[placeholder="请输入ID/名称"]` | `high` |
| 作业表头 | `text=作业ID` | `high` |
| 查看按钮 | `button:has-text("查看")` | `high` |
| 继续作业按钮 | `button:has-text("继续作业")` | `high` |
| 记录按钮 | `button:has-text("记录")` | `high` |

## 动态区域 / 重渲染风险

- Ant 表格行和菜单选中态会频繁重绘
- 避免依赖：
  - `.css-wjhehw`
  - `rc-menu-uuid-*`
  - 表格行号/分页序号

## 可挂载点建议

- 如需挂载扩展 UI，优先选择宿主页面外层安全区域，不覆盖原生写操作控件。

## 页面区域与接口映射

- 项目表格：`my_job/project_list`

- 项目头信息：`project/top_info`
- 工序筛选：`my_job/process_list_queryopt`
- 任务表格：`my_job/process_list`

- 任务头信息：`task/top_info`
- 状态/人员筛选：`my_job/job_list_queryopt`
- 作业表格：`my_job/job_list`

## 写操作边界 / 未确认项

- 写操作默认维持人工确认边界；未确认链路不得按文案直接推断。
