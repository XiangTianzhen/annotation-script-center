# 02 当前条读取与临时答案读取

## 请求标识 / 目的

- `requestName`: `Receive`
- `purpose`: 读取当前详情页条目上下文、音频地址和当前临时答案里的分段状态

## 页面入口 / 触发动作

- 页面：`/management/task-v2/{taskId}/mark-v3/{index}`
- 触发动作：
  - 进入详情页
  - 刷新当前详情页

## 请求摘要

- `Method`: `POST`
- `Path`: `/api/dispatch/Receive`
- `Query`: 当前样例带平台签名参数，文档中不保留

## 请求体摘要

```json
{
  "Filter": {
    "Type": 1,
    "TaskID": "{taskId}",
    "NodeID": 1,
    "Count": 1,
    "StatusList": []
  }
}
```

## 响应摘要

- 响应里当前至少包含：
  - `Items[0].Item.ItemID`
  - `Items[0].Item.Content`
  - `Items[0].TempAnswer.Content`
- `Item.Content` 当前可解析出：
  - 当前条 `id`
  - `audio`
  - `uttid`
- `TempAnswer.Content` 当前可解析出：
  - `templateID`
  - `itemID`
  - `data.regions`
  - `data.discard`
  - `data.duration`
  - `data.valid_duration`
  - `dataMap.regions`

## 关键字段

- `Filter.TaskID`
- `Filter.NodeID`
- `Items[0].Item.ItemID`
- `Items[0].Item.Content.audio`
- `Items[0].TempAnswer.Content.data.regions[].no`
- `Items[0].TempAnswer.Content.data.regions[].id`
- `Items[0].TempAnswer.Content.data.regions[].start`
- `Items[0].TempAnswer.Content.data.regions[].end`
- `Items[0].TempAnswer.Content.data.discard`
- `Items[0].TempAnswer.Content.data.duration`
- `Items[0].TempAnswer.Content.data.valid_duration`

## 前端接入建议

- 当前详情页的“现有分段”优先以 `TempAnswer.Content.data.regions` 为准。
- 当前音频地址优先以 `Item.Content.audio` 为准。
- 若页面后续自动触发新的 `SubmitTempItemAnswer`，应把最新请求体里的 `Content` 视作更靠近“当前页面态”的临时答案。

## 风险 / 未确认项

- 当前不记录完整签名 query、完整音频 URL 或鉴权头。
- 当前未确认 `Item.Content` 里其他业务字段是否稳定。
- 当前未确认 `regions` 之外的文本字段是否总是写在同一层级；遇到已有文本或语音种类时应 fail closed。
