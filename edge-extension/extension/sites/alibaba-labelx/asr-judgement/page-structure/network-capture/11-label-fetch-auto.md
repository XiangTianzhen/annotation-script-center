# POST /api/v1/label/center/{taskId}/label/fetch

## 请求目的

该请求用于领取或自动领取下一包标注数据。本次采集是在“自动领取”开关开启时点击“提交任务”后自动触发。

本次采集场景中，数据池为空或未领取到下一包，因此请求后没有跳转到新的详情页，而是返回标注首页。

## 触发操作

- 在详情页保持“自动领取”开启。
- 点击 `提交任务`。
- `commit` 请求返回后自动触发本请求。

## 请求记录

- Method：`POST`
- URL：`/api/v1/label/center/<REDACTED_TASK_ID>/label/fetch`
- Content-Type：`application/json`
- Request Body：

```json
{
  "taskId": "<REDACTED_TASK_ID>",
  "type": "label",
  "autoFetch": true
}
```

- Status：`200`
- Response Body：本次触发后发生页面导航，DevTools 中响应体已不可读取。

## 脱敏请求示例

```http
POST /api/v1/label/center/<REDACTED_TASK_ID>/label/fetch
Content-Type: application/json
Cookie: <REDACTED>

{
  "taskId": "<REDACTED_TASK_ID>",
  "type": "label",
  "autoFetch": true
}
```

## 脱敏响应示例

```json
{
  "status": 200,
  "body": "<UNAVAILABLE_AFTER_NAVIGATION>"
}
```

## 后续页面行为

本次请求后页面跳转到：

```text
/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>
```

首页随后加载：

- `GET /api/v1/label/center/subTasks`
- `GET /api/v1/label/center/tasks`
- `GET /api/v1/label/center/tasks/process`

## 字段推断

- URL path 中的 `taskId` 与 body 中 `taskId` 一致。
- `type=label` 表示领取标注类型子任务。
- `autoFetch=true` 表示该请求由自动领取流程触发。
- 如果后端分配到新包，按用户说明预期会跳转到新的标注详情页；本次未观察到该分支。

## Content Script 建议

- 扩展不应主动调用该接口，避免改变任务分配状态。
- 可被动监听该请求区分“提交后自动领取”与“手动领取”。
- 需要根据 `autoFetch` 字段区分触发来源。
- 不能仅凭 `status=200` 判断一定领取到新包，需要结合最终 URL 或 response body。

## 未确认项

- 有可领取数据时的响应 body 和跳转详情页 URL 未采集。
- 手动点击首页“领取”按钮时是否使用同一接口、`autoFetch` 是否为 `false` 未采集。
- 数据池为空时 response body 的准确结构本次不可读取。

