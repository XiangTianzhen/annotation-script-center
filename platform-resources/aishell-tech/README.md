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

**独立脚本已接入**（2026-05-28）。已完成：

- `extension/sites/aishell-tech/minnan-helper/` 运行时代码。
- `platform-resources/aishell-tech/minnan-helper/backend/` 独立 AI recommend 路由。
- `/mytask/index`、`/mytask/detail/:taskId`、`/mytask/mark` 的路由覆盖与资料复用。

当前业务能力只在 `/mytask/mark` 生效；`我的团队` 页面仍只有 network 与 page-structure 初版占位，质检/验收角色视图与多个对话框仍待补采。

## 当前接入范围

### 已落地范围

当前首版覆盖核心标注链路：

1. `/mytask/index`
2. `/mytask/detail/:taskId`
3. `/mytask/mark?taskId=...&packageId=...`

这三页当前已经具备：

- 稳定路由
- 关键 DOM 选择器
- 任务 / 分包 / 条目请求链
- 保存接口结构 `POST /api/mark/SaveShortMark`
- 音频拼接规则 `dataRoot + url`

### 当前专属后端

当前已接入独立后端接口：

- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`

实现边界：

- Aishell 保持独立路由、独立脚本 ID、独立词表目录。
- Prompt、模型白名单与默认模型仍参考现有 DataBaker 口径，但推荐编排、缓存、日志、同步超时、取消与队列已经改成 Aishell 自己维护。
- Aishell 的 Omni 音频调用已拆到 `platform-resources/aishell-tech/minnan-helper/backend/dashscope-omni-client.js`，直接按 DashScope compatible-mode 请求体构造并固定 `enable_thinking=false`。
- 底层只复用公共 provider HTTP 工具，不再复用 DataBaker recommend orchestration。
- 当前独立队列组固定为 `aishell_qwen_omni / aishell_fun_asr / aishell_text_compare`。
- 当前环境变量默认优先读取 `AISHELL_AI_*`；第一阶段仍允许只读回退旧的 `DATABAKER_AI_*`。
- v1 不引入异步 job、SSE 或 WebSocket，仍按同步 HTTP 返回推荐结果；当前同步总超时统一为 `120000ms`。
- 当前仓库所有 AI 链路都已统一固定关闭 thinking；Aishell 不再开放 thinking 作为有效配置项。
- 成功响应固定为 `success + data + meta`，失败响应固定为 `success=false + error + meta`。

### 当前运行时能力

- 仅在 `https://mark.aishelltech.com/mytask/mark?...` 注入业务面板。
- 当前条支持 AI 推荐、复制听音文本、复制推荐文本、填入当前条。
- 批量模式只处理当前分包，从当前选中条开始，跳过已完成条目。
- AI 请求按前端并发预取；页面填入与保存严格串行，每条都点击页面真实“保存”按钮并等待选中项切换后再继续。

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
