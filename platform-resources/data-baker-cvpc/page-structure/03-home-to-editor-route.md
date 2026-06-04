# 03 首页到编辑器的页面链

- `routeKey`: `home-to-editor`
- `riskLevel`: `safe-ui`

## A. `#/my-job`

### 路由与前置条件

- 路由：`#/my-job`
- 前置条件：有效登录态

### 主要 DOM

```text
main
└─ 列表页容器
   ├─ 顶部标签：标注项目 / 考试项目
   ├─ 筛选区
   │  ├─ 输入框：请输入ID/名称
   │  ├─ 重置
   │  └─ 查询
   └─ 项目表格
      ├─ 项目ID
      ├─ 项目名称
      ├─ 模态分类
      └─ 操作（打开）
```

### 稳定选择器

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 搜索框 | `input[placeholder="请输入ID/名称"]` | `high` |
| 标注项目标签 | `text=标注项目` | `high` |
| 考试项目标签 | `text=考试项目` | `high` |
| 项目表格 | `table` + `text=项目ID` | `medium` |
| 打开按钮 | `button:has-text("打开")` | `high` |

### 接口映射

- 项目表格：`my_job/project_list`

## B. `#/my-job/<projectId>/callout`

### 主要 DOM

```text
main
└─ 项目内任务页
   ├─ 左侧项目级菜单
   │  ├─ 标注任务
   │  ├─ 质检任务
   │  ├─ 验收任务
   │  ├─ 作业统计
   │  └─ 包管理
   ├─ 顶部筛选区
   └─ 任务表格
      ├─ 任务ID
      ├─ 任务名称
      ├─ 模态分类
      ├─ 作业数量
      ├─ 工序
      ├─ 状态
      ├─ 任务执行进度
      └─ 操作（领取 / 修改）
```

### 稳定选择器

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 项目级菜单 | `getByRole('menuitem', { name: '标注任务' })` | `high` |
| 任务表头 | `text=任务ID` | `high` |
| 查询按钮 | `button:has-text("查询")` | `high` |
| 任务名称链接 | `a[href*="/callout/"][href*="/job?"]` 或 `text=<taskName>` | `medium` |
| 领取按钮 | `button:has-text("领取")` | `high` |
| 修改按钮 | `button:has-text("修改")` | `high` |

### 接口映射

- 项目头信息：`project/top_info`
- 工序筛选：`my_job/process_list_queryopt`
- 任务表格：`my_job/process_list`

### 风险说明

- `领取`：`write-action`
- `修改`：先按 `write-action` 管理，后续补采后再降级或细分

## C. `#/my-job/<projectId>/callout/<taskProcessId>/<taskId>/job?...`

### 主要 DOM

```text
main
└─ 作业列表页
   ├─ 返回按钮
   ├─ 当前任务标题
   ├─ 搜索区
   └─ 作业表格
      ├─ 作业ID
      ├─ 作业名称
      ├─ 条目数量
      ├─ 正确率
      ├─ 工序
      ├─ 作业人员
      ├─ 状态
      ├─ 工序用时
      └─ 更多（查看 / 继续作业 / 记录）
```

### 稳定选择器

| 目标 | 建议选择器 | `selectorConfidence` |
|------|------------|----------------------|
| 返回按钮 | `button:has-text("返回")` | `high` |
| 搜索框 | `input[placeholder="请输入ID/名称"]` | `high` |
| 作业表头 | `text=作业ID` | `high` |
| 查看按钮 | `button:has-text("查看")` | `high` |
| 继续作业按钮 | `button:has-text("继续作业")` | `high` |
| 记录按钮 | `button:has-text("记录")` | `high` |

### 接口映射

- 任务头信息：`task/top_info`
- 状态/人员筛选：`my_job/job_list_queryopt`
- 作业表格：`my_job/job_list`

### 风险说明

- `继续作业`：`safe-ui`，会打开编辑器新标签
- `查看`：后续仍需确认是否只读
- `记录`：未展开采集

## 通用重渲染风险

- Ant 表格行和菜单选中态会频繁重绘
- 避免依赖：
  - `.css-wjhehw`
  - `rc-menu-uuid-*`
  - 表格行号/分页序号

## 页面区域与接口映射总结

- `#/my-job`：`project_list`
- `callout`：`top_info + process_list_queryopt + process_list`
- `job`：`task/top_info + job_list_queryopt + job_list`
- `继续作业`：把 `<projectId> / <taskId> / <processId> / <dataId> / <jobId>` 拼进 `/app/editor/asr/`
