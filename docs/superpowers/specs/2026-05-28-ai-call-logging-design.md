# AI 调用日志设计

## 目标

本设计用于为仓库内所有 AI 调用补齐一套统一的“默认记录”方案。

本轮固定目标：

- 所有 AI 请求默认记录调用日志，不再依赖某个脚本单独实现。
- 日志文件按“各项目目录独立保存”落地，不汇总到统一根目录。
- 公共基础字段统一，脚本扩展字段按各项目自行补充。
- 日志主格式统一为 CSV，按天分文件。
- 成功与失败都要记录。
- 原始返回 JSON 默认保留，但必须先脱敏再落盘。
- 前端新增全局公共必填字段 `AI 调用使用人`，未填写时禁止任何 AI 调用。
- 平台用户名/用户 ID 尽量自动获取，并跟随请求进入后端日志。
- 项目默认不使用 mock；日志设计不围绕 mock 构建，也不新增 mock 公共列。

## 当前现状

当前仓库已经存在两类相关能力，但没有形成统一方案：

1. 统一 AI 基座已能返回部分 usage / timing / requestId：
   - `platform-resources/backend/ai/usage.js`
   - `platform-resources/backend/ai-framework/runtime/execute-project-pipeline.js`
2. DataBaker 已经有一套脚本内日志：
   - `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
   - 当前会写 `recommend-calls.jsonl` 与 `recommend-calls.csv`

问题在于：

- 只有 DataBaker 明确落了调用日志，其他脚本没有统一默认记录。
- 现有 DataBaker 日志字段过于贴近 ASR 场景，不能直接作为全项目公共表头。
- 前端没有全局公共“AI 调用使用人”必填项，无法稳定做人员统计。
- 平台用户名自动获取没有统一字段名，各脚本后续统计会越来越散。

## 设计原则

- 公共列只保留“无论哪个平台、哪个 AI 调用都会有”的字段。
- `listenModel / compareModel / singleModel / pipelineMode` 这类字段不进入公共列，只作为脚本扩展列。
- `promptTokens / completionTokens` 是主消耗口径；`totalTokens` 只作兜底。
- `totalTokens` 只有在输入/输出 token 都拿不到，但上游返回总 token 时才写入。
- 成功结果默认不拆业务结果列；优先保留脱敏后的原始返回 JSON。
- 日志主格式只保留 CSV；不再把 JSONL 作为默认正式方案。
- 日志文件归脚本自己所有，但写 CSV 的底层能力应收口到共享核心。
- 前端拦截和后端校验都要做，避免漏接和绕过。

## 方案对比

### 方案一：共享日志核心 + 各脚本独立 CSV 扩展列

做法：

- 在统一后端新增共享日志核心。
- 每个脚本提供自己的日志目录、扩展列和扩展字段构建函数。
- CSV 文件继续落到各脚本自己的 `backend/logs/` 目录。

优点：

- 基础字段、CSV 转义、脱敏、分日切分全部统一。
- 各脚本仍可保留项目专属字段。
- 后续做总统计时可以按统一公共列聚合。

缺点：

- 第一轮需要补一层共享抽象。

### 方案二：所有脚本写一套超大通用 CSV

做法：

- 所有脚本共用同一套超大表头。
- 平台专属列为空时留空。

缺点：

- 公共列和扩展列边界会越来越模糊。
- 非 ASR 与 ASR 混在一起后，很多列长期空置。

### 方案三：每个脚本继续各写各的

做法：

- 不新增共享日志核心。
- 只要求各脚本自己补日志。

缺点：

- 字段名、脱敏规则、切分规则会迅速分叉。
- 后续做跨脚本 AI 统计代价很高。

### 结论

采用方案一：

- 共享日志核心负责“怎么写”。
- 各脚本目录决定“写到哪里”和“额外写什么”。

## 目标目录

### 共享日志核心

```text
platform-resources/
  backend/
    ai-call-log/
      csv-writer.js
      sanitizer.js
      schema.js
      index.js
```

职责：

- 统一 CSV 表头顺序与写入流程
- 统一创建按天文件名
- 统一 CSV 转义
- 统一 JSON 字段序列化
- 统一原始 JSON 脱敏与截断
- 统一失败兜底日志行为

### 脚本侧日志目录

```text
platform-resources/<platform>/<script>/backend/logs/
  ai-calls-YYYY-MM-DD.csv
```

示例：

- `platform-resources/data-baker/round-one-quality/backend/logs/ai-calls-2026-05-28.csv`
- `platform-resources/magic-data/hakka-helper/backend/logs/ai-calls-2026-05-28.csv`

说明：

- 日志文件按天切分。
- 日志目录仍然归脚本自己维护。
- 真正写文件时由共享日志核心统一处理。

## 公共字段

所有脚本固定存在的公共列为：

- `createdAt`
- `requestId`
- `platformId`
- `scriptId`
- `success`
- `errorCode`
- `errorMessage`
- `durationMs`
- `promptTokens`
- `completionTokens`
- `totalTokens`
- `aiUsageOperatorName`
- `platformUserName`
- `platformUserId`
- `rawResponseJson`
- `rawErrorJson`

### 字段说明

- `createdAt`：后端写日志时的 ISO 时间。
- `requestId`：本次 AI 调用唯一请求 ID。
- `platformId`：平台标识，如 `dataBaker`、`magicData`。
- `scriptId`：脚本标识，如 `dataBakerRoundOneQuality`。
- `success`：本次调用是否成功。
- `errorCode`：标准错误码；成功时留空。
- `errorMessage`：脱敏且截断后的错误信息；成功时留空。
- `durationMs`：总耗时毫秒。
- `promptTokens`：输入 token；没有则留空。
- `completionTokens`：输出 token；没有则留空。
- `totalTokens`：只在输入/输出 token 都缺失、但上游给了总 token 时写入；否则留空。
- `aiUsageOperatorName`：用户在 options 中填写的真实使用人姓名，作为统计主口径。
- `platformUserName`：平台页面自动识别出来的当前用户名，获取失败时可留空。
- `platformUserId`：平台页面自动识别出来的当前用户 ID，获取失败时可留空。
- `rawResponseJson`：成功时记录的脱敏原始返回 JSON。
- `rawErrorJson`：失败时记录的脱敏原始错误 JSON。

## Token 记录规则

- 如果上游明确返回 `promptTokens` 与 `completionTokens`：
  - 记录 `promptTokens`
  - 记录 `completionTokens`
  - `totalTokens` 留空
- 如果上游只返回总 token：
  - `promptTokens` 留空
  - `completionTokens` 留空
  - 记录 `totalTokens`
- 如果三者都没有：
  - 三列都留空

后续统计原则：

- 优先按 `promptTokens` 与 `completionTokens` 分开统计。
- 只有当两者都为空时，才回退使用 `totalTokens`。

## 原始 JSON 记录规则

成功与失败都保留原始 JSON，但不拆业务结果列。

### 成功

- 优先写 `rawResponseJson`
- `rawErrorJson` 留空

### 失败

- 优先写 `rawErrorJson`
- `rawResponseJson` 只有在确有有效原始返回时才写；否则留空

### 统一限制

- 原始 JSON 写入前必须脱敏
- 原始 JSON 写入前必须 `JSON.stringify`
- 原始 JSON 作为单个 CSV 单元格保存
- 超长时允许截断，但要附带截断标记

不再默认把 `recommendedText / heardText / verdict / reason` 这类业务结果拆成公共列。

## 脚本扩展字段

公共列之外，每个脚本允许自行追加扩展列。

示例：

### DataBaker

- `collectId`
- `itemId`
- `textId`
- `sentenceNumber`
- `audioHostname`
- `listenModel`
- `compareModel`
- `recognitionMode`

### Magic Data

- `recordId`
- `speakerIndex`
- `pagePath`
- `listenModel`
- `compareModel`
- `reviewMode`

### Alibaba LabelX

- `taskId`
- `subTaskId`
- `itemIndex`
- `listenModel`
- `compareModel`

### Abaka Task21

- `taskId`
- `fieldKey`
- `analysisMode`
- `singleModel`
- `visionModel`
- `reasoningModel`

### Aishell Tech

- `taskId`
- `packageId`
- `markItemId`
- `listenModel`
- `compareModel`

实现约束：

- 扩展列定义在脚本自己的后端目录。
- 共享日志核心不理解这些业务字段，只按顺序写入。

## 前端公共设置

### 字段位置

在扩展 options 首页新增一个全局公共字段：

- `AI 调用使用人`

存储位置固定为：

- `settings.meta.aiUsageOperatorName`

说明：

- 这是所有脚本共用字段，不放到某个脚本详情页。
- 它与“项目数据下载获取人姓名”是同级的公共字段，但语义独立。

### 保存规则

- 用户填写一次后持久保存。
- 后续所有脚本共用这一项。
- 该字段视为全局必填。

## 前端调用拦截

所有会触发后端 AI 请求的前端入口，在发送请求前统一做公共校验。

统一规则：

- 读取 `settings.meta.aiUsageOperatorName`
- 如果为空：
  - 阻止本次 AI 调用
  - 提示用户去 options 首页填写
  - 本次调用结束，不自动继续
- 如果有值：
  - 允许继续调用

不采用页面内临时弹窗补填，不采用“填完自动继续调用”。

建议前端抽公共 helper，例如：

- `ensureAiUsageOperatorNameConfigured()`

所有 AI 调用脚本先走这一层。

## 平台用户名自动获取

平台用户名与用户 ID 的自动获取不做统一 DOM 规则，只统一字段名。

前端请求体统一追加：

- `aiUsageOperatorName`
- `platformUserName`
- `platformUserId`

规则：

- `aiUsageOperatorName` 必填
- `platformUserName` 尽量自动获取，获取失败可留空
- `platformUserId` 尽量自动获取，获取失败可留空

原因：

- 各平台用户名读取方式不同
- 共享的应该是字段名，不是具体抓取逻辑

## 后端双重校验

后端收到 AI 请求时，必须再次校验：

- `aiUsageOperatorName` 是否存在

如果为空：

- 直接返回 `400`
- 返回稳定错误码，例如 `missing-ai-usage-operator-name`

原因：

- 防止旧 content script
- 防止手工构造请求
- 防止某个脚本漏接前端公共校验

## 日志写入时机

统一要求在 AI 主调用链结束后写日志：

- 成功写一条
- 失败写一条

写日志失败时：

- 不应覆盖主业务返回
- 只允许输出脱敏 warning

## 脱敏规则

原始 JSON、错误信息和扩展字段在写 CSV 前都必须脱敏。

禁止落盘的敏感内容包括：

- token
- cookie
- authorization
- API Key
- 完整签名 URL
- 完整音频 URL
- 完整图片 URL
- 完整 session

允许保留的调试摘要包括：

- requestId
- model 名
- status code
- error code
- hostname
- 脱敏后的原始 JSON 结构

## 迁移顺序

建议按下面顺序逐块落地：

1. 前端公共字段与公共校验
   - `settings.meta.aiUsageOperatorName`
   - options 首页输入项
   - 公共拦截 helper
2. 共享后端日志核心
   - CSV schema
   - 按天文件名
   - 脱敏与截断
3. DataBaker 先接入
   - 复用现有 `recommend-calls` 逻辑迁移到共享核心
4. Magic Data 两个脚本接入
5. LabelX 转写与快判接入
6. Abaka Task21 接入
7. Aishell Tech 接入

原因：

- DataBaker 当前已有日志雏形，最适合做首块样板。
- 迁完 DataBaker 后，其它脚本照相同协议接入。

## 测试策略

### 前端

- 未填写 `AI 调用使用人` 时，所有 AI 按钮都应阻止调用。
- 填写并保存后，再次进入页面仍应生效。
- 平台用户名自动获取失败时，不应阻止调用，但请求体可为空。

### 后端

- 缺 `aiUsageOperatorName` 的请求应返回 `400`
- 成功请求应写入当天 CSV
- 失败请求应写入当天 CSV
- 输入/输出 token、总 token 兜底逻辑应符合约定
- 原始 JSON 必须脱敏、可截断、可写入 CSV 单元格
- 写日志失败不影响主接口返回

### 回归

- 现有脚本对外 API path 不变
- 现有 AI 业务响应结构不因日志而变化
- 日志目录只增加运行文件，不提交敏感运行数据

## 非目标

本轮不做：

- 不改现有 AI 主业务返回结构
- 不把所有脚本的日志文件合并到单一总目录
- 不新增 mock 调用链
- 不把业务结果字段统一拆成大宽表
- 不顺手重构所有 AI 请求 payload 结构

## 提交策略

建议继续沿用“一个板块一个提交”：

1. 文档与公共设置设计
2. 前端公共字段与拦截
3. 共享后端日志核心
4. DataBaker 接入
5. Magic Data / LabelX / Task21 / Aishell 逐块接入

每块都要求：

- 先加测试
- 再写实现
- 验证通过后单独提交
