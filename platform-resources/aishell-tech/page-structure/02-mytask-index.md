# 02-我的任务列表 DOM 结构

- 路由：`/mytask/index`
- 主容器：`.taskList-container`
- 框架：Vue 2 + Element UI（el-table + el-form + el-pagination）

## 查询筛选区

- 容器：`.v-query-form`
- 筛选字段：
  - 任务编号：`input.el-input__inner[placeholder="请输入任务编号"]`
  - 所属项目：下拉选择 `placeholder="所属项目"`（选项：闽南方言标注-艾斯、腾讯中原官话采集 等）
  - 任务名称：`input.el-input__inner[placeholder="请输入任务名称"]`
  - 任务类型：下拉选择 `placeholder="任务类型"`（短音频/长音频/图片/文本/视频/多通道/多段落/采集）
  - 任务状态：下拉选择 `placeholder="任务状态"`（未开始/暂停/进行中/已完成）
- 查询按钮：`button.el-button--default.is-round` 含 `.el-icon-search` + 文字"查询"

## 任务列表表格

- 容器：`div.el-table`，表宽 900px
- 表头行：`thead th` → `.cell` 内含列名
- 数据行：`tr.el-table__row`

### 列定义（9 列）

| 列序号 | 列名 | 关键选择器 / 特征 |
|--------|------|-------------------|
| 1 | 任务编号 | `.cell` 内含任务编号文本 |
| 2 | **任务名称** | `a.el-link.el-link--primary.is-underline` → 点击跳转详情 |
| 3 | 任务进度 | `el-progress--circle`（环形进度条），文字格式 `0/857` |
| 4 | 任务类型 | 含 `.i-icon-waves-left` 图标 + 任务类型文字 |
| 5 | 项目名称 | 项目中文名文本 |
| 6 | 项目经理 | 人名文本 |
| 7 | 创建时间 | 日期文本（`2026/5/27`） |
| 8 | 接收时间 | 日期文本 |
| 9 | 任务状态 | `span.el-tag.el-tag--small.el-tag--light`（如"进行中"） |

### 任务行关键选择器

| 目标 | 选择器 |
|------|--------|
| 所有行 | `tr.el-table__row` |
| 任务名称链接 | `a.el-link--primary.is-underline` |
| 任务名称文本 | `a.el-link--primary .el-link--inner` |
| 任务进度 | `.el-progress__text` |
| 任务状态标签 | `.el-tag--light` |

### 点击跳转行为

点击任务名称的 `a.el-link` → 跳转 `/mytask/mark?taskId=<任务ID>&packageId=<首个分包ID>`

## 底部分页器

- 容器：`div.el-pagination.is-background`
- 总条数：`span.el-pagination__total`（"共 22 条"）
- 每页条数：`el-select` 下拉（默认 15条/页）
- 页码：`li.number`（active 页有 `.active` 类）
- 前一页：`button.btn-prev`
- 后一页：`button.btn-next`
- 跳转：`input.el-pagination__editor` + "前往"文字

### 分页器关键选择器

| 目标 | 选择器 |
|------|--------|
| 总条数 | `.el-pagination__total` |
| 当前页 | `li.number.active` |
| 每页条数下拉 | `.el-pagination__sizes .el-select` |
| 跳转输入 | `.el-pagination__editor input` |
