# 03 平台暂存写回

## 请求标识 / 目的

- `requestName`: `SubmitTempItemAnswer`
- `purpose`: 把当前详情页临时答案写回平台暂存态；当前脚本只改写其中的分段数组

## 页面入口 / 触发动作

- 页面：`/management/task-v2/{taskId}/mark-v3/{index}`
- 触发动作：
  - 页面初始化后的平台自动暂存
  - 人工改动当前条后触发的平台临时保存
  - 当前脚本应用分段建议时复用这条写契约

## 请求摘要

- `Method`: `POST`
- `Path`: `/api/dispatch/SubmitTempItemAnswer`
- `Query`: 当前样例带平台签名参数，文档中不保留
- 关键请求头：
  - `content-type: application/json`
  - 平台当前会话下发的 CSRF 头

## 请求体摘要

```json
{
  "AuditAnswers": [
    {
      "ItemID": "{itemId}",
      "Content": "{tempAnswerContentJsonString}",
      "ControlData": "{\"Discard\":false,\"extraAnswer\":[]}"
    }
  ],
  "NodeID": "1",
  "StagingTime": "604800",
  "TaskID": "{taskId}"
}
```

## 响应摘要

```json
{
  "BaseResp": {
    "StatusCode": 0,
    "StatusMessage": ""
  }
}
```

## 关键字段

- `AuditAnswers[0].ItemID`
- `AuditAnswers[0].Content`
- `AuditAnswers[0].ControlData`
- `NodeID`
- `StagingTime`
- `TaskID`
- `BaseResp.StatusCode`

## 前端接入建议

- 当前脚本应用分段建议时，只改写 `Content` 里与 `regions`、`valid_duration` 直接相关的字段：
  - `data.regions`
  - `dataMap.regions`
  - `data.valid_duration`
  - `dataMap.valid_duration`
- `discard`、`duration` 和 `ControlData` 默认优先保留平台当前值。
- 由于签名 query 和平台当前会话下发的 CSRF 头具备时效性，前端应优先复用页面当前会话里捕获到的最新请求快照。

## 风险 / 未确认项

- 当前不记录完整签名 query、完整请求体原文或鉴权头全文。
- 当前未确认平台是否允许“已有文本/语音种类”的分段行被安全重排；当前脚本已按 fail closed 停止这类自动应用。
- 当前脚本不直接调用平台 `提交 / 下一题`，只调用暂存链路。
