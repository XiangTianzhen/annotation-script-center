# 01-首页 DOM 结构

- 路由：`/index`
- 主容器：`#app` → `.v-main.main-padding` → `.v-app-main` → `section` → `#data-view` → `#a-container`
- 框架：Vue 2 + Element UI（el-row/el-col 栅格 + el-card 卡片 + el-table 表格）+ x-vue-echarts（图表）

---

## 页面布局总览

```
.v-main.main-padding
└─ .v-app-main
   └─ section
      └─ #data-view
         └─ #a-container
            ├─ [Row 1] el-row (el-col-12 + el-col-12, height:220px)
            │   ├─ 左侧：完成概况卡片（3 列数字统计）
            │   └─ 右侧：嵌套 el-row
            │       ├─ 近七日完成数量（ECharts 柱状图）
            │       └─ 近七日合格率（ECharts 图表）
            ├─ [Row 2] el-row (el-col-12 + el-col-12)
            │   ├─ 近30天数据统计（ECharts 折线图）
            │   └─ 团队成员榜（ECharts 横向柱状图）
            ├─ [Row 3] el-row (el-col-24)
            │   └─ 我进行中任务（el-table 表格，8 列）
            └─ [隐藏] el-loading-mask
```

---

## Row 1：顶部概览区

### 左侧：完成概况卡片

- **选择器**：`.el-card.person-card`
- **卡片标题**：`完成概况`
- **内容**：3 列 el-col（各占 el-col-8），每列一个 `.person-info`

| 列 | 标题 | 数据格式 | 说明 |
|----|------|----------|------|
| 1 | 标注数据 | `已完成 / 总数` | 两个 `el-tooltip` 包裹的数字 |
| 2 | 标注任务数据包 | `已完成 / 总数` | 同上 |
| 3 | 参与项目/任务数 | `已参与数 / 总数` | 同上 |

**关键选择器**：

| 目标 | 选择器 |
|------|--------|
| 完成概况卡片 | `.person-card` 或 `.el-card[data-v-4e828dee]` |
| 单个统计项 | `.person-info` |
| 统计数字 | `.person-info h1 span.el-tooltip` |
| 统计标签 | `.person-info p` |

### 右侧上部：近七日完成数量

- **选择器**：`#a-container > .el-row:first-child > .el-col-12:last-child > .el-row > .el-col-12:first-child .el-card`
- **卡片标题**：`近七日完成数量`
- **图表组件**：`<x-vue-echarts>` — ECharts 实例
- **图表类型**：柱状图（多系列：标注 `#5470c6`、采集 `#91cc75`、质检 `#fac858`）
- **tooltip 数据结构**：日期 + 标注数 + 采集数 + 质检数

### 右侧下部：近七日合格率

- **选择器**：`#a-container > .el-row:first-child > .el-col-12:last-child > .el-row > .el-col-12:last-child .el-card`
- **卡片标题**：`近七日合格率`
- **图表组件**：`<x-vue-echarts>`

---

## Row 2：趋势与排行榜区

### 左侧：近30天数据统计

- **选择器**：`#a-container > .el-row:nth-child(2) > .el-col-12:first-child .el-card`
- **卡片标题**：`近30天数据统计`
- **图表组件**：`<x-vue-echarts>` — ECharts 实例
- **图表类型**：折线图（多系列：标注/采集/质检）
- **tooltip 数据结构**：日期 `MM-DD` + 标注数 + 采集数 + 质检数

### 右侧：团队成员榜

- **选择器**：`#a-container > .el-row:nth-child(2) > .el-col-12:last-child .el-card`
- **卡片标题**：`团队成员榜`
- **图表组件**：`<x-vue-echarts>`
- **图表类型**：横向柱状图（多系列，按用户分组）
- **tooltip 数据结构**：用户名 + 标注数 + 采集数 + 质检数

---

## Row 3：进行中任务表格

### 我进行中任务

- **选择器**：`#a-container > .el-row:nth-child(3) > .el-col-24 .el-card`
- **组件属性**：`data-v-3b18574d`
- **卡片标题**：`我进行中任务`
- **表格选择器**：`div.el-table`（有 `.el-table--small`）

### 列定义（8 列）

| 列序号 | 列名 | 关键特征 |
|--------|------|----------|
| 1 | 任务编号 | 普通文本 |
| 2 | **任务名称** | `a.el-link.el-link--primary.is-underline` → 点击跳转详情 |
| 3 | 任务类型 | "标注任务" + `<p>` 标注子类型 `【短音频标注】` |
| 4 | 项目名称 | 普通文本 |
| 5 | 项目经理 | 普通文本 |
| 6 | 创建时间 | 日期文本（格式 `YYYY/M/D`） |
| 7 | 接收时间 | 日期文本 |
| 8 | 任务状态 | `span.el-tag.el-tag--small.el-tag--light`（如"进行中"） |

**注意**：首页表格**不包含**任务进度列（环形进度条），与 `02-mytask-index` 中的任务列表表格（9 列）不同。

### 表格关键选择器

| 目标 | 选择器 |
|------|--------|
| 表格容器 | `.el-card[data-v-3b18574d] .el-table` |
| 所有行 | `.el-table .el-table__row` |
| 任务名称链接 | `.el-table__row a.el-link--primary` |
| 状态标签 | `.el-table__row .el-tag--light` |

### 点击跳转行为

点击任务名称的 `a.el-link` → 跳转 `/mytask/mark?taskId=<任务ID>&packageId=<首个分包ID>`（与其他页面一致）

---

## 页脚

- **选择器**：`footer.v-footer`
- **内容**：`数据处理工作平台 2026`

---

## 全局组件

- **顶部导航栏**：`.v-header`（与所有页共用）
- **多 Tab 标签页**：`.el-tabs`（如有多页面，与所有页共用）

---

## 图表组件

- **组件名**：`<x-vue-echarts>`
- **渲染方式**：每个图表创建一个 ECharts 实例，通过 `<canvas>` 渲染
- **图例配色**：
  - 标注：`#5470c6`（蓝色）
  - 采集：`#91cc75`（绿色）
  - 质检：`#fac858`（黄色）
- **图表数据源**：来自 `/api/Statistics/GetIndexStatistics` 响应（`latest30days` 和 `users` 字段）
- **完成概况数据源**：来自同一响应的 `total` 字段

---

## 数据同步原则

- Vue 2 响应式数据，图表通过 `x-vue-echarts` 绑定。
- 如需程序化触发数据刷新，应找到对应 Vue 实例的方法调用，不得绕过 Vue 直接操作 DOM。
