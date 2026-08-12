# GetWorkItem / Receive：检查包当前题只读快照

## 请求标识 / 目的

- 首选接口：`/api/dispatch/GetWorkItem`
- 回退接口：`/api/dispatch/Receive`（仅当当前检查包未发起 `GetWorkItem` 时使用已观察到的同页快照）
- 目的：在检查包页面（`scan-v3/{nodeId}/{itemId}` 或 `mark-package/{packageId}/{nodeId}?itemID={itemId}`）读取当前题的媒体地址和现有分段，供台州话 AI 识别预览使用；`nodeId` 仅白名单 `14、17`，不表示任意节点开放。

## 页面入口 / 触发动作

- 页面路由：`/management/task-v2/{taskId}/scan-v3/{nodeId}/{itemId}`，或 `/management/task-v2/{taskId}/mark-package/{packageId}/{nodeId}?itemID={itemId}`；`nodeId` 仅白名单 `14、17`。
- 页面加载或切换当前检查包题目时由 AIDP 发起；实测 `mark-package` 页面可能只发起 `Receive`，不发起 `GetWorkItem`。

## 请求摘要

- 请求参数包含平台会话相关信息；扩展不读取、不保存，也不转发请求 URL、请求头、Cookie 或鉴权字段。

## 请求体摘要

- 本能力不依赖请求体，也不改写请求。

## 响应摘要

- 顶层为当前题条目数组。
- `Item.Content` 为 JSON 字符串，包含媒体字段。
- `GetWorkItem.Answer` 或 `Receive.TempAnswer.Content` 为 JSON 字符串，包含当前标注答案及 `data.regions` 或 `dataMap.regions`。
- `GetWorkItem` 跨页面世界仅转发每条的 `Item.ItemID`、`Item.Content` 与 `Answer`，并在最小快照外层附带首次捕获时间 `capturedAt`；`Receive` 仅转发 `Items[].Item.ItemID`、`Items[].Item.Content` 与 `Items[].TempAnswer.Content`，保留原有 `Items` / `Data.Items` / `data.items` 外层结构，并在最小快照外层附带固定 `snapshotVersion: 1`。
- 不转发 `Receive` 请求 URL、包元数据、审核历史、用户资料或其他无关字段。
- 主世界仅在当前页面内存缓存 `GetWorkItem` 最小快照；检查包运行时启动后可请求回放，解决初始化阶段的监听先后问题。回放必须保留原始 `capturedAt`，不得以回放时间刷新快照时效；缺失、非法或超过有效期时，录音导入 fail-closed。当前页 `Receive` 快照只复用既有观察结果；只读运行时拒绝未带该版本标记的旧观察器 `Receive` 消息。两类快照均不写入 storage、日志或后端请求。

## 关键字段

- `Item.ItemID`：当前 AIDP 题目 ID。
- `Item.Content.audio` / `video`：当前题媒体来源。
- `Answer.itemID` / `templateID`：答案上下文。
- `Answer.data.regions` 或 `Answer.dataMap.regions`：分段数组，使用 `id`、`no`、`start`、`end`、`txt`、`ms`。

## 前端接入建议

- 仅在精确命中 `scan-v3/{nodeId}/{itemId}` 或 `mark-package/{packageId}/{nodeId}` 检查包路由，且 `nodeId` 属于白名单 `14、17` 时使用该快照。
- 先按路由 `itemId` 精确选择 `Items` 中的当前条目；未命中时不建立上下文。再使用 Arco 行的 `data-neeko-table-row-key` 与 `regions[*].id` 关联可见分段；没有行键或没有任何匹配时返回空分段，不要使用动态 textarea ID。
- AI 结果仅渲染、复制和批量预览，不写回页面或平台。

## 风险 / 未确认项

- 响应结构若改动，应以最小字段缺失为不可用状态，不能降级为写操作。
- 签名媒体地址只存在于当前运行时内存，不能写入日志、存储、测试样例或文档。
