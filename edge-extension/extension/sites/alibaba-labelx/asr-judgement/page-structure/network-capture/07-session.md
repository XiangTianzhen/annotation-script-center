# POST /api/v1/label/center/{subTaskId}/session

## 请求目的

该请求创建或返回当前详情页会话 ID。后续 `timer` 心跳会携带该 sessionId。

## 触发操作

- 打开详情页。
- 刷新详情页。

## 请求记录

- Method：`POST`
- URL：`/api/v1/label/center/<REDACTED_SUBTASK_ID>/session`
- Content-Type：`application/x-www-form-urlencoded; charset=utf-8`
- Request Body：
  - `subTaskId=<REDACTED_SUBTASK_ID>`
  - `_=<REDACTED_TIMESTAMP>`
- Status：`200`

## 脱敏请求示例

```http
POST /api/v1/label/center/<REDACTED_SUBTASK_ID>/session
Content-Type: application/x-www-form-urlencoded; charset=utf-8
Cookie: <REDACTED>

subTaskId=<REDACTED_SUBTASK_ID>&_=<REDACTED_TIMESTAMP>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "log": null,
  "data": "<REDACTED_SESSION_ID>",
  "traceId": "<REDACTED_TRACE_ID>",
  "traceSql": null,
  "extraInfo": null,
  "cost": 0,
  "success": true
}
```

## 字段推断

- `data` 是页面会话 ID。
- `timer` 心跳的 `sessionId` 与该字段对应。
- 该 sessionId 是运行态值，不能写入文档、日志或扩展持久存储。

## Content Script 建议

- 仅可作为识别页面生命周期的辅助信号。
- 不建议主动调用或重放该请求。
- 如果需要判断页面初始化完成，应优先等待 `data` 或 `getLabelTaskInfo` 请求，而不是 session。

## 未确认项

- session 是否与保存、提交请求关联尚未采集。

