# POST /api/v2/item/get-task-item-skip-list

## 请求目的

加载 Task 页面 Skipped 列表，显示已跳过条目。该接口属于 Task 页面公共状态列表能力。

## 触发操作

在 Task21 Data 页点击 `Skipped` Tab。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=all&dm=all`。
- 角色：标注角色已实测；标注内审角色也只读观察过空列表。
- 本轮标注角色 Skipped 列表有 1 条测试数据。

## 请求记录

- Method：`POST`
- URL / Path：`/api/v2/item/get-task-item-skip-list`
- Content-Type：`application/json`
- Status：`200`
- Query keys：无
- Request Header 摘要：敏感字段已脱敏。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "pageNum": "<number>",
      "pageSize": "<number>",
      "search": {
        "type": "AND",
        "units": []
      },
      "nodeId": "{nodeId}"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "data": [
          {
            "_id": "{itemId}",
            "taskId": "{taskId}",
            "nodeId": "{nodeId}",
            "status": "PROCESSING",
            "processStatus": {
              "label": "SKIP",
              "check": "UNCHECKED"
            },
            "permission": ["<permission shape>"]
          }
        ],
        "total": "<number>"
      }
    }

## 后续请求链路

列表返回后页面继续请求：

1. `POST /api/v2/item/get-item-detail`
2. `POST /api/v2/item/find-items-file`
3. `POST /api/v2//item/get-item-node-operator-info`

选中单条 Skipped 行后：

1. `POST /api/v2/item/get-frame-count`
2. 顶部按钮从 `Claim Label` 变成 `Label: 1`

## 页面反馈

- URL 变为 `/task-v2/data-item?taskId={taskId}&vm=all&dm=skipped`。
- Skipped Tab 显示数量。
- 表格行的 Label Status 显示 `Skipped`。
- 选中行后未出现 `Recovery` 按钮。

## 字段推断

- `processStatus.label = SKIP` 是 Skipped 状态判定依据。
- Skipped 列表恢复入口不是 Dropped 的 `Recovery` 按钮，而是选中后进入 `Label: 1` 重新标注。

## Content Script 建议

- 可以被动监听该接口识别 Skipped 列表。
- 不主动点击 `Label: N`，因为它会调用领取接口并把条目重新带入工作态。
- 正式脚本如提供恢复辅助，必须显示二次确认。

## 未确认项

- Skipped 空列表在标注角色下的完整页面提示待补。
- 简体中文环境下 `Skipped` 精确文案待补。
