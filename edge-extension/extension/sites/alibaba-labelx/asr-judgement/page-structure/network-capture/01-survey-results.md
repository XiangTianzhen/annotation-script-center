# GET /api/v1/label/surveyResults

## 请求目的

该请求出现在详情页初始化早期。本次采集中返回 `404`，响应体为空。当前 ASR 更优判断详情页未观察到依赖该请求渲染核心内容。

## 触发操作

- 打开详情页。
- 刷新详情页。

## 请求记录

- Method：`GET`
- URL：`/api/v1/label/surveyResults`
- Query：
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`404`
- Response Body：空。

## 脱敏示例

```http
GET /api/v1/label/surveyResults?_=<REDACTED_TIMESTAMP>
Referer: /corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>
Cookie: <REDACTED>
```

```text
HTTP/2 404
location: /corpora/labeling/labelingTask

<empty response>
```

## 字段推断

- `_<timestamp>` 是前端通用防缓存参数。
- `location` 指向任务列表页，可能是旧 survey 能力的兼容跳转。
- 当前页面可以把该请求视为非核心请求。

## Content Script 建议

- 不建议将该请求作为 ASR 更优判断页面是否加载成功的依据。
- 如果做网络监听，可以记录为初始化噪声请求。

## 未确认项

- 其他 LabelX 项目或 survey 类型页面是否使用该接口尚未确认。

