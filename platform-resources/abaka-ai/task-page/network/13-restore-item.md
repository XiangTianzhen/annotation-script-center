# 恢复已放弃 / 已跳过条目（待补）

## 请求目的

记录恢复已放弃或已跳过条目的接口。本轮 Drop 和 Skip 后未在 `/items` 页面观察到恢复按钮。

## 触发操作

待补。可能入口：

- Data 页 `Dropped` / `Skipped` Tab。
- 已放弃或已跳过行的操作列。
- `/items` 右侧条目列表或状态提示区。

## 操作前页面状态

待补。本轮 Drop 后页面自动领取下一条，Skip 后也自动领取下一条。

## 请求记录

- Method：待补。
- URL：待补。
- Content-Type：待补。
- Status：待补。
- Request Header 摘要：敏感字段必须脱敏。
- Query keys：待补。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "itemId": "{itemId}",
      "nodeId": "{nodeId}",
      "operateType": "<RESTORE_OPERATION>"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

待补。

## 页面反馈

待补。

## 字段推断

恢复属于高风险状态变更，不能按按钮文案推断接口。

## Content Script 建议

恢复接口未确认前，不实现任何恢复自动化。

## 未确认项

- 恢复入口。
- 恢复接口 path。
- 是否支持恢复已放弃和已跳过两类状态。
- 恢复是否会重新进入工作态。
