# 恢复已放弃 / 已跳过条目

## 请求目的

记录恢复已放弃或已跳过条目的入口。恢复属于 Abaka AI Task 页面公共状态流转能力，详细文档维护在 `../common/` 目录。

## 触发操作

已确认入口：

- Dropped：Data 页 `Dropped` Tab 选中单条，点击 `Recovery`，确认弹窗后调用 `recover-item`。见 `../common/05-restore-dropped-item.md`。
- Skipped：Data 页 `Skipped` Tab 选中单条，点击 `Label: 1`，调用 `receive-item` 重新进入标注。见 `../common/04-restore-skipped-item.md`。

## 操作前页面状态

- Dropped：`/task-v2/data-item?taskId={taskId}&vm=all&dm=abandoned`，表格选中一条 Dropped。
- Skipped：`/task-v2/data-item?taskId={taskId}&vm=all&dm=skipped`，表格选中一条 Skipped。

## 请求记录

- Dropped Method：`POST`
- Dropped URL：`/api/v2/item/recover-item`
- Skipped Method：`POST`
- Skipped URL：`/api/v2/item/receive-item`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段必须脱敏。
- Query keys：无。

## 脱敏请求体摘要

Dropped：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}"]
    }

Skipped：

    {
      "taskId": "{taskId}",
      "nodeId": "{nodeId}",
      "itemIds": ["{itemId}"]
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

- Dropped：`recover-item` 后刷新 `get-task-item-abandon-list`，列表为空时显示 `No Data`。
- Skipped：`receive-item` 后跳转 `/items`，继续 `get-item-info -> work -> find-labels` 等标注页初始化。

## 页面反馈

- Dropped：弹窗标题 `Restore Items`，确认后 Dropped 计数归零。
- Skipped：无恢复弹窗，按钮为 `Label: 1`；进入 `/items` 后状态回到 `LABELING` / `WORKING`。

## 字段推断

恢复属于高风险状态变更。Dropped 使用 `recover-item`；Skipped 本轮未观察到独立恢复接口，而是复用指定 item 的 `receive-item`。

## Content Script 建议

不实现任何自动恢复。若后续做辅助，只允许用户人工确认后点击平台原生按钮，并被动监听结果。

## 未确认项

- Dropped 恢复后准确进入哪个列表待补。
- Skipped 是否存在其他恢复入口待补。
- 批量恢复结构不主动采集。
