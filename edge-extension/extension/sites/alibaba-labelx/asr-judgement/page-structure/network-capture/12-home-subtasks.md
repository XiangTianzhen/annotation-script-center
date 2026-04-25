# GET /api/v1/label/center/subTasks

## 请求目的

该请求加载标注首页“我的任务 / 未完成”列表。本次是在提交详情页后返回首页时触发。

## 触发操作

- 点击详情页 `提交任务`。
- 自动领取未进入新详情页，页面返回标注首页。

## 请求记录

- Method：`GET`
- URL：`/api/v1/label/center/subTasks`
- Query：
  - `type=label`
  - `keyword=`
  - `appId=<REDACTED_PROJECT_ID>`
  - `finished=false`
  - `page=1`
  - `pageSize=5`
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`200`

## 脱敏请求示例

```http
GET /api/v1/label/center/subTasks?type=label&keyword=&appId=<REDACTED_PROJECT_ID>&finished=false&page=1&pageSize=5&_=<REDACTED_TIMESTAMP>
Cookie: <REDACTED>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "data": {
    "data": [],
    "recordCount": 0
  },
  "traceId": "<REDACTED_TRACE_ID>",
  "success": true
}
```

## 字段推断

- `type=label` 表示标注任务。
- `finished=false` 对应首页“我的任务 / 未完成”列表。
- `data.data=[]` 且 `recordCount=0` 表示当前未完成子任务列表为空。
- 已完成列表使用同一 endpoint，但 `finished=true`，详见 `15-home-subtasks-finished.md`。

## Content Script 建议

- 该请求属于首页列表，不属于详情页样本解析。
- 可用于判断提交后是否仍存在未完成包。
- 不要把该接口作为当前详情页数据来源。

## 未确认项

- 有未完成任务时列表项字段未在本轮记录。
