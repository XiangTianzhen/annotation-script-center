# POST /api/v1/label/center/subTask/{subTaskId}/commit

## 请求目的

该请求由详情页顶部“提交任务”按钮触发，用于提交当前子任务包。提交成功后当前包不可返回继续测试。

已采集成功提交场景：

- 页面位于 ASR 更优判断详情页。
- “自动领取”开关处于开启状态。
- 点击“提交任务”后页面返回标注首页。
- 未出现可停留观察的确认弹窗。

另一次未完成包中点击 `提交任务` 时，前端必填校验先阻断，没有发出本接口。见 `20-submit-client-validation.md`。

## 触发操作

- 点击详情页顶部按钮：`提交任务`。

## 请求记录

- Method：`POST`
- URL：`/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/commit`
- Content-Type：`application/json`
- Request Header：
  - `labelsessionid: <REDACTED_LABEL_SESSION_ID>`
  - `Cookie: <REDACTED>`
- Request Body：

```json
{
  "subTaskId": "<REDACTED_SUBTASK_ID>"
}
```

- Status：`200`
- Response Body：本次提交后发生页面导航，DevTools 中响应体已不可读取。

## 脱敏请求示例

```http
POST /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/commit
Content-Type: application/json
labelsessionid: <REDACTED_LABEL_SESSION_ID>
Cookie: <REDACTED>

{
  "subTaskId": "<REDACTED_SUBTASK_ID>"
}
```

## 脱敏响应示例

```json
{
  "status": 200,
  "body": "<UNAVAILABLE_AFTER_NAVIGATION>"
}
```

## 后续请求链路

提交请求返回 `200` 后，因为自动领取处于开启状态，页面立即继续触发：

1. `POST /api/v1/label/center/<REDACTED_TASK_ID>/label/fetch`
2. 返回标注首页：`/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`
3. 首页加载“我的任务”和“可领取的任务”列表接口。

## 字段推断

- URL path 中的 `subTaskId` 与 body 中 `subTaskId` 一致。
- `labelsessionid` 是详情页会话相关请求头，不能记录真实值。
- 请求体只包含当前子任务 ID，未观察到提交当前页答案列表或 dataId 列表。
- 状态码 `200` 加后续页面跳转可判断提交请求被前端视为成功。

## Content Script 建议

- 扩展不应主动调用该接口。
- 如果需要识别用户提交行为，可被动监听该 URL。
- 被动监听时只记录 `method`、endpoint、status、是否触发后续 `label/fetch`、最终 URL，不记录真实 session/header/cookie。
- 由于提交后不可回退，调试逻辑不要自动点击“提交任务”。

## 未确认项

- 自动领取关闭时，提交成功后的跳转行为是否相同未采集。
- 服务端提交失败、网络失败的响应结构未采集。
- `commit` 成功响应 body 的结构本次不可读取，仍需在可安全复现时二次采集。
