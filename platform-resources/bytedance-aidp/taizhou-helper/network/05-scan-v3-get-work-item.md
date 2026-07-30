# GetWorkItem：检查包当前题只读快照

## 请求标识 / 目的

- 接口：`/api/dispatch/GetWorkItem`
- 目的：在 `scan-v3/14` 检查包页面读取当前题的媒体地址和现有分段，供台州话 AI 识别预览使用。

## 页面入口 / 触发动作

- 页面路由：`/management/task-v2/{taskId}/scan-v3/14/{itemId}`。
- 页面加载或切换当前检查包题目时由 AIDP 发起。

## 请求摘要

- 请求参数包含平台会话相关信息；扩展不读取、不保存，也不转发请求 URL、请求头、Cookie 或鉴权字段。

## 请求体摘要

- 本能力不依赖请求体，也不改写请求。

## 响应摘要

- 顶层为当前题条目数组。
- `Item.Content` 为 JSON 字符串，包含媒体字段。
- `Answer` 为 JSON 字符串，包含当前标注答案及 `data.regions` 或 `dataMap.regions`。
- 跨页面世界仅转发每条的 `Item.ItemID`、`Item.Content` 与 `Answer`；审计历史、用户资料和其他无关字段均不转发。

## 关键字段

- `Item.ItemID`：当前 AIDP 题目 ID。
- `Item.Content.audio` / `video`：当前题媒体来源。
- `Answer.itemID` / `templateID`：答案上下文。
- `Answer.data.regions` 或 `Answer.dataMap.regions`：分段数组，使用 `id`、`no`、`start`、`end`、`txt`、`ms`。

## 前端接入建议

- 仅在精确命中 `scan-v3/14` 路由时使用该快照。
- 使用 Arco 行的 `data-neeko-table-row-key` 与 `regions[*].id` 关联可见分段；不要使用动态 textarea ID。
- AI 结果仅渲染、复制和批量预览，不写回页面或平台。

## 风险 / 未确认项

- 响应结构若改动，应以最小字段缺失为不可用状态，不能降级为写操作。
- 签名媒体地址只存在于当前运行时内存，不能写入日志、存储、测试样例或文档。
