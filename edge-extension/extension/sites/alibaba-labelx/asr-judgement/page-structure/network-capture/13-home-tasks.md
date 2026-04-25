# GET /api/v1/label/center/tasks

## 请求目的

该请求加载标注首页“可领取的任务”列表。本次是在提交详情页后返回首页时触发。

## 触发操作

- 点击详情页 `提交任务`。
- 自动领取未进入新详情页，页面返回标注首页。

## 请求记录

- Method：`GET`
- URL：`/api/v1/label/center/tasks`
- Query：
  - `subTaskType=label`
  - `keyword=`
  - `appId=<REDACTED_PROJECT_ID>`
  - `page=1`
  - `pageSize=5`
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`200`

## 脱敏请求示例

```http
GET /api/v1/label/center/tasks?subTaskType=label&keyword=&appId=<REDACTED_PROJECT_ID>&page=1&pageSize=5&_=<REDACTED_TIMESTAMP>
Cookie: <REDACTED>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "data": {
    "data": [
      {
        "taskId": "<REDACTED_TASK_ID_1>",
        "subTaskType": null,
        "name": "<REDACTED_TASK_NAME_1>",
        "gmtCreate": "<REDACTED_TIME>",
        "total": null,
        "left": null,
        "labelModel": "vote"
      },
      {
        "taskId": "<REDACTED_TASK_ID_2>",
        "subTaskType": null,
        "name": "<REDACTED_TASK_NAME_2>",
        "gmtCreate": "<REDACTED_TIME>",
        "total": null,
        "left": null,
        "labelModel": "single"
      }
    ],
    "recordCount": 13
  },
  "traceId": "<REDACTED_TRACE_ID>",
  "success": true
}
```

## 字段推断

- `data.data[]` 是可领取任务列表。
- `taskId` 是领取接口 `/label/center/{taskId}/label/fetch` 使用的任务 ID。
- `labelModel` 表示任务标注模式，本次看到 `vote` 和 `single` 两类。
- `total`、`left` 在本次响应中为 `null`，不能依赖它们判断是否有可领取数据。

## Content Script 建议

- 该请求只适合首页任务列表页面使用。
- 若扩展需要从首页识别目标任务，可监听该接口并用任务名/任务 ID 做脱敏后的匹配策略。
- 不要记录完整任务名；任务名可能包含业务信息。

## 未确认项

- 任务列表搜索 `keyword` 时响应结构是否变化未采集。
- 下一页 `page>1` 的结构未采集。

