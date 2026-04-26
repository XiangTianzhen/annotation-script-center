# GET /api/v1/label/center/tasks/process

## 请求目的

该请求加载首页“可领取的任务”列表对应的进度或领取状态信息。本次是在首页任务列表返回后触发。

## 触发操作

- 点击详情页 `提交任务`。
- 页面返回标注首页。
- 首页加载可领取任务列表后触发本请求。

## 请求记录

- Method：`GET`
- URL：`/api/v1/label/center/tasks/process`
- Query：
  - `subTaskType=label`
  - `taskIds=<REDACTED_TASK_ID_LIST>`
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`200`

## 脱敏请求示例

```http
GET /api/v1/label/center/tasks/process?subTaskType=label&taskIds=<REDACTED_TASK_ID_LIST>&_=<REDACTED_TIMESTAMP>
Cookie: <REDACTED>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "data": [],
  "traceId": "<REDACTED_TRACE_ID>",
  "success": true
}
```

## 字段推断

- `taskIds` 来自首页 `tasks` 接口当前页返回的任务 ID 列表。
- 本次 `data=[]`，说明这些任务没有额外 process 信息或当前用户无可展示进度。
- 该请求不是详情页核心数据源。

## Content Script 建议

- 仅首页逻辑需要关注。
- 不要将它用于判断详情页是否提交成功；提交成功更直接的信号是 `commit` 请求状态和最终 URL。

## 未确认项

- 有 process 数据时的返回结构未采集。
- 不同任务模式 `vote` / `single` 下 process 数据是否不同未采集。
