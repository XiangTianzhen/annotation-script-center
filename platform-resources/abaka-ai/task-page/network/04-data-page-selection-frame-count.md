# POST /api/v2/item/get-frame-count

## 请求目的

Data 页勾选条目后统计选中条目的有效帧和无效帧数量，并驱动底部选择状态。

## 触发操作

- 单选一条 checkbox。
- 多选两条 checkbox。
- 本轮未测试跨页全选。

## 操作前页面状态

- 页面：Task21 Data 页。
- 右上按钮：`Claim Label` 或 `View`。
- 底部状态：`Selected 0 entry, 0 frame`。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/get-frame-count`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

单选：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}"]
    }

多选：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}", "{itemId}"]
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "validCount": "number",
        "invalidCount": "number"
      }
    }

## 后续请求链路

未观察到除 `get-frame-count` 以外的业务请求。页面只更新选中态和按钮文案。

## 页面反馈

- 单选后：`Label: 1`，`Selected 1 entry, 0 frame`。
- 多选后：`Label: 2`，`Selected 2 entry, 0 frame`。

## 字段推断

- `itemIds.length` 与选中条目数一致。
- `validCount + invalidCount` 用于底部 frame 统计。

## Content Script 建议

可以被动监听该接口识别当前选择数量；禁止自动触发跨页全选。

## 未确认项

- 跨页全选和大批量选择时 request shape 待补。
