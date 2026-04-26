# POST /api/v1/label/center/timer

## 请求目的

该请求用于页面计时或在线心跳。它在页面初始化阶段出现一次，随后页面停留期间周期性出现。

## 触发操作

- 打开详情页。
- 刷新详情页。
- 页面停留期间自动触发。

## 请求记录

- Method：`POST`
- URL：`/api/v1/label/center/timer`
- Content-Type：`application/x-www-form-urlencoded; charset=utf-8`
- Status：`200`

初始 Request Body：

```text
sessionId=&_=<REDACTED_TIMESTAMP>
```

后续 Request Body：

```text
sessionId=<REDACTED_SESSION_ID>&_=<REDACTED_TIMESTAMP>
```

## 脱敏请求示例

```http
POST /api/v1/label/center/timer
Content-Type: application/x-www-form-urlencoded; charset=utf-8
Cookie: <REDACTED>

sessionId=<REDACTED_SESSION_ID>&_=<REDACTED_TIMESTAMP>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "log": null,
  "data": true,
  "traceId": "<REDACTED_TRACE_ID>",
  "traceSql": null,
  "extraInfo": null,
  "cost": 0,
  "success": true
}
```

## 字段推断

- `sessionId` 来自 `07-session.md` 记录的 session 接口。
- 初始请求可能先于 session 返回，因此 `sessionId` 为空。
- 响应 `data=true` 表示心跳上报成功。

## Content Script 建议

- 可用于观察页面生命周期，但不应作为 ASR 业务数据来源。
- 不要主动重放该接口，避免影响平台计时和在线状态。
- 日志中不要记录真实 sessionId。

## 未确认项

- 心跳周期未精确计时。
- 页面失焦、暂停、关闭标签页时的心跳行为未采集。
