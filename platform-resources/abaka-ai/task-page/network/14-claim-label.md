# POST /api/v2/item/receive-item 领取标注

## 请求目的

由 Data 页 `Claim Label` 按钮触发，用于领取 Task21 标注条目并进入 `/items` 标注页。

## 触发操作

在 Task21 Data 页点击 `Claim Label`。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=all&dm=all`。
- 语言：English。
- 列表可为空；按钮仍可点击。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/receive-item`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "nodeId": "{labelNodeId}",
      "search": {
        "type": "AND",
        "units": []
      }
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": ["{itemId}"]
    }

## 后续请求链路

领取成功后进入 `/items`，随后触发：

1. `POST /api/v2/item/get-item-history`
2. `POST /api/v2//item/check-operate-item-permission`
3. `POST /api/v2/item/get-item-info`
4. `POST /api/v2/item/work`
5. `POST /api/v2/label/find-labels`
6. `POST /api/v2/label/find-issues`
7. `POST /api/v2/label/find-label-records`
8. `POST /api/v2/label/get-ai-check-result`
9. `POST /api/v2/item/find-invalidate-frame/`
10. `POST /api/v2/item/sampling/get-frames-data`
11. `POST /api/v2/item/find-items-base-info`

## 页面反馈

URL 从 Data 页切换到 `/items?...itemId={itemId}&nodeId={labelNodeId}`，页面显示 `Successfully Claimed` 或进入加载态后显示标注页。

## 字段推断

- `nodeId` 为标注节点。
- `data[]` 返回领取到的 `{itemId}`。
- 领取会改变任务占用状态。

## Content Script 建议

高风险动作。扩展不得自动调用，只能被动监听用户点击后的结果。

## 未确认项

- 无可领取数据时的失败响应待补。
- 中文环境领取提示待补。
