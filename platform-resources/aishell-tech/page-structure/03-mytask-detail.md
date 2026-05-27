# 03-任务详情 DOM 结构

- 路由：`/mytask/detail/<taskId>`
- 主容器：`.taskDetail-container`
- 框架：Vue 2 + Element UI
- 入口：我的任务列表 → 点击任务名称

## 页面头部

- 容器：`.el-page-header`
- 返回：`i.el-icon-back` + "返回"
- 标题：`.el-page-header__content` = "标注任务详情"

## 上排：左基本信息 + 右任务描述

### 左侧（16列）基本信息卡片

- 容器：`.el-card`，标题"基本信息"
- 按钮："行为分析"（`button.el-button--text`）
- 信息行（`.line.el-row`，每行两栏 `el-col-4` 标签 + `el-col-8` 值）：

| 字段 | 示例 |
|------|------|
| 项目名称 | 闽南方言标注-艾斯 |
| 任务名称 | short_方言采集_20260525-闽南-2_20260527 |
| 任务编号 | 202652710253000 |
| 任务模板 | 闽南标注 |
| 任务类型 | 标注任务【短音频标注】 |
| 分配团队 | 艾斯云瓴[闽南方言标注-艾斯] |
| 创建时间 | 2026/5/27 10:25:30 |
| 任务接收时间 | 2026/5/27 10:31:31 |
| 完成时间 | 空 |

### 右侧（8列）任务描述卡片

- 容器：`.el-card`，标题"任务描述"
- 内容：`.describe`

## 下排：任务数据卡片（分包列表）

- 标题"任务数据"
- 统计信息：
  - 剩余包数/总包数 `（9 / 10）`
  - 已返工数/返工数 `（0/0）`
- 操作按钮：
  - "开始标注"：`button.el-button--text`
  - "刷新数据"：`button.el-button--text`

### 筛选

- 标注人员输入：`input.el-input__inner[placeholder="标注人员"]`
- 查询按钮：`button.el-button--primary` "查询"

### 分包表格（11列）

| 列 | 选择器/特征 |
|----|------------|
| Checkbox | `label.el-checkbox` |
| 编号 | 数字文本 |
| 进度 | `el-progress--circle`（环形，如 `1/86`） |
| 标注人员 | 用户名文本 |
| 创建时间 | 时间 |
| 开始时间 | 时间 |
| 完成时间 | 时间或 `-` |
| 标注状态 | `el-tag--light`（"进行中"） |
| 质检状态 | `el-tag--info.el-tag--light`（"未质检"） |
| 返工状态 | `el-tag--info.el-tag--light`（"无需返工"） |
| **操作** | **`button.el-button--text` 含"查看"** |

## 隐藏对话框

- 修改任务信息：`.el-dialog__title`="修改任务信息"
- 数据分包：`.el-dialog__title`="数据分包"
- 定向分配：`.el-dialog__title`="定向分配"
- 选择团队：`.el-dialog__title`="选择团队"

## 关键选择器

| 目标 | 选择器 |
|------|--------|
| 返回按钮 | `.el-page-header i.el-icon-back` |
| 基本信息行 | `.line.el-row` |
| 分包行 | `.el-table__body tr.el-table__row` |
| 查看按钮 | `button.el-button--text` 含"查看" |
| 进度文本 | `.el-progress__text` |
| 标注状态 | `.el-tag--light` |
| 总包数 | 含 `（N / M）` 的 `<span>` |

## 页面流转

点击"查看" → `/mytask/mark?taskId=<taskId>&packageId=<packageId>`
