# POST /api/v2/item/recover-item 恢复 Dropped 条目

## 请求目的

记录 Dropped 条目通过 `Recovery` 按钮恢复的请求链路。该能力属于 Abaka AI Task 页面公共状态流转能力。

## 触发操作

1. 打开 `Dropped` Tab。
2. 选中一条 Dropped 测试数据。
3. 点击顶部 `Recovery`。
4. 在确认弹窗中点击 `Confirm`。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=all&dm=abandoned`。
- Dropped 列表中有 1 条测试数据。
- 顶部按钮：`View`、`Recovery`。
- 弹窗：
  - 标题：`Restore Items`
  - 正文：`Do you want to restore these items?`
  - 按钮：`Cancel`、`Confirm`

## 请求记录

- Method：`POST`
- URL / Path：`/api/v2/item/recover-item`
- Content-Type：`application/json`
- Status：`200`
- Query keys：无
- Request Header 摘要：敏感字段已脱敏。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}"]
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

1. `POST /api/v2/item/recover-item`
2. `POST /api/v2/item/get-task-item-abandon-list`

恢复后 Dropped 列表重新加载，返回：

    {
      "code": 0,
      "data": {
        "data": [],
        "total": 0
      }
    }

## 页面反馈

- 弹窗关闭。
- Dropped 计数从 1 刷新为 0。
- 表格显示 `No Data`。
- URL 仍停留在 `dm=abandoned`。
- 本轮未观察到跳转 `/items` 或自动领取下一条。

## 字段推断

- `recover-item` 至少支持 Dropped 恢复。
- 请求体只需要 `taskId` 和 `itemIds`，未观察到 `nodeId`。
- 恢复后条目从 Dropped 列表移出，后续会回到可处理列表或工作状态，具体目标状态待进一步按 Data 页筛选确认。

## Content Script 建议

- 可以被动监听 `recover-item` 并刷新本地状态摘要。
- 不得自动触发 `recover-item`。
- 如果未来提供恢复辅助，应限制单条、显示二次确认，并禁止跨页全选。

## 未确认项

- 恢复后条目准确进入 Todo、Overview 还是其他状态待补。
- 批量选择多个 Dropped 条目时的 request shape 待补，不建议主动采集。
- Skipped 是否支持同一个 `recover-item` endpoint 未观察到。
