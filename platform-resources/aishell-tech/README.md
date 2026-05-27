# Aishell Tech 数据处理工作平台资料

## 平台信息

- **平台名称**：数据处理工作平台
- **平台域名**：`https://mark.aishelltech.com/`
- **API 域名**：`https://markapi.aishelltech.com`
- **前端技术栈**：Vue 2 + Element UI + Wavesurfer.js
- **路由类型**：History API（带 Query 参数 `taskId`、`packageId`）
- **鉴权格式**：`Authorization: Bearer <JWT>`
- **分页格式**：`page` + `size`
- **音频存储**：OSS（`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com`），`dataRoot + url` 拼接，当前无需签名

## 路由体系（6 页）

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/index` | 平台 Welcome 页 |
| 我的任务 | `/mytask/index` | 任务列表（el-table，22条，page+size 分页） |
| 任务详情 | `/mytask/detail/<taskId>` | 基本信息 + 分包列表 + "查看"按钮 |
| 数据标注 | `/mytask/mark?taskId=xxx&packageId=xxx` | 核心工作页（文件列表 + Wavesurfer + 表单 + 隐藏质检区） |
| 我的团队 | `/organization/myteam` | 组织 + 团队 + 用户管理 |
| 登录 | `/login` | 登录页 |

## 页面流转

```
/mytask/index（任务列表）
    └─ 点击任务名 → /mytask/detail/:taskId（任务详情）
                      └─ 点击分包"查看" → /mytask/mark?taskId=xxx&packageId=xxx（数据标注）
```

## 目录职责

| 目录 | 内容 | 状态 |
|------|------|------|
| `network/` | 5 个编号文档 + pending-capture + README | 完成 |
| `page-structure/` | 5 个编号文档 + pending-capture + README | 核心链路完成；`05-organization` 已有初版占位，详细 DOM 仍待补 |

## 当前阶段

**正式接入准备阶段**（2026-05-28）。已完成首页、我的任务、任务详情、数据标注的 DOM 与网络采集；我的团队页面的 network 已完成，page-structure 已补一版占位说明。当前仍无 `extension/sites/aishell-tech/` 运行时代码和专属后端注册，但核心标注链路资料已足够支撑首阶段运行时代码开发。

## 正式接入建议

### 首阶段范围

建议首阶段只覆盖核心标注链路：

1. `/mytask/index`
2. `/mytask/detail/:taskId`
3. `/mytask/mark?taskId=...&packageId=...`

这三页当前已经具备：

- 稳定路由
- 关键 DOM 选择器
- 任务 / 分包 / 条目请求链
- 保存接口结构 `POST /api/mark/SaveShortMark`
- 音频拼接规则 `dataRoot + url`

### 首阶段是否需要专属后端

当前**不需要**先做专属后端。首阶段运行时代码可以先做：

- 页面识别
- 任务列表 / 任务详情 / 数据标注页 DOM 读取
- 音频播放辅助
- 标注输入框辅助填入
- 保存前只读检查

原因：

- 保存接口和表单结构已经明确。
- 音频地址当前无需签名拼接和后端代理。
- 现阶段更缺的是运行时代码接入，而不是额外 Node 路由。

### 当前不阻塞首阶段、但后续要补的资料

- `/organization/myteam` 详细 DOM
- 质检 / 验收角色可见的 `.check-area`
- 历史标注记录弹窗
- 修改任务信息 / 数据分包 / 定向分配 / 选择团队等对话框
- 长标注 `saveLongMark`
- 质检 / 重检 / 验收写操作 payload

这些项不阻塞首阶段“标注员视角 + 短音频标注”接入，但会影响后续扩到组织管理、质检和验收视角。

## 关键发现

### 标注保存

SaveShortMark 的 `mark` 字段不是纯文本，而是 JSON 字符串 `{"text":"..."}`，由模板 `templateItems[0].fieldName` 决定结构。`scene` 为 `"mark"`。

### 文件列表

条目状态通过 CSS 类名区分：`list-item`（未选）、`list-item-selected`（当前）、`list-item-finshed`（已完成）。保存成功后条目自动标记完成并跳转下一条。

### 条目数据

`packageItemList` 一次返回全量 86 条（`pageSize=9999`），不分页。每条含 `id`、`fileName`、`url`、`text`（参考文本）等字段。

### 音频

`dataRoot` 取自 `/api/task/detail` 响应。音频 URL 拼接规则：`dataRoot + url`。OSS 直链，当前无需签名参数。

### 质检

质检区域 `.check-area` 默认 `display:none`，仅质检员角色可见。当前标注员视图不展示该区域。

## 安全边界

- AI 仅辅助建议，不自动保存/提交/审核/流转。
- 文档不记录 token、cookie、签名 URL、真实敏感文本。
- 质检区域 `.check-area` 仅质检员可见，不得绕过。
- 音频 URL 运行时从 `dataRoot + url` 拼接，不硬编码。
