# SearchModifyItem：返修列表与详情最小安全快照

## 请求标识 / 目的

- 接口：`/api/dispatch/SearchModifyItem`
- 目的：读取返修列表当前页已加载条目的 ItemID 与允许的参考内容，供当前页批量导入和返修详情单题导入使用。

## 页面入口 / 触发动作

- 列表：`/management/task-v2/{taskId}/node/14/revise?page={page}`。
- 详情：`/management/task-v2/{taskId}/modify-v2/4/{itemId}`。
- AIDP 加载或切换返修列表页时发起；扩展只观察，不改写请求。

## 请求摘要

- 只精确匹配 pathname `/api/dispatch/SearchModifyItem`。
- 不保存或转发完整请求 URL、查询参数、请求头、Cookie、Token 或签名字段。

## 请求体摘要

- `Filter.TaskID`：当前任务 ID。
- `Filter.NodeID`：返修列表固定为 `14`。
- `Filter.Direction`：列表方向。
- `PageRequest.PageNo` / `PageSize`：零基页码与当前请求页大小。
- 其他请求字段全部丢弃。

## 响应摘要

- 从 `Items` 逐条读取 `ItemID`、`TaskID`、`NodeID` 和字符串 `Content`。
- `Content` 只解析 `asr_text`、`audio`、`video`；非法 JSON 或三项全空的条目不作为可导入数据。
- 最小快照附带 `capturedAt`，只保存在当前页面内存并支持同源回放。

## 关键字段

| 最小字段 | 来源 | 用途 |
| --- | --- | --- |
| `taskId` | 请求 `Filter.TaskID` | 与列表/详情路由任务精确匹配 |
| `filterNodeId` | 请求 `Filter.NodeID` | 必须为返修列表节点 `14` |
| `pageNo` / `pageSize` | 请求 `PageRequest` | 只允许当前页，最多导入 10 条 |
| `sourceItemId` | 响应 `ItemID` | 录音平台来源幂等键与详情路由匹配 |
| `taskId` / `nodeId` | 响应条目 | 防止跨任务串题并保留必要节点上下文 |
| `referenceText` / `audioUrl` / `videoUrl` | `Content` 允许字段 | 录音参考内容 |

## 前端接入建议

- 列表必须同时校验路由 TaskID、请求 TaskID、响应 Item TaskID、`filterNodeId=14`、当前零基页码和快照时效。
- 列表按响应顺序串行导入当前页最多 10 条，不翻页；停止或 scope 变化后不再发起下一条。
- 详情必须按路由 ItemID 精确选择同题数据，不使用行号、`nextIndex` 或数组位置兜底。
- 只把 `sourceItemId`、参考文字和原始音视频 URL 传给既有录音导入 runtime。

## 风险 / 未确认项

- 列表重新请求、分页、切换方向或任务会使旧快照失效；不得继续使用旧数组。
- 媒体 URL 可能带签名，只能存在于页面运行时内存，不得进入 storage、日志、测试样例或文档。
- 响应结构变更或字段缺失时必须 fail-closed，不得扩大到其他返修业务字段。
