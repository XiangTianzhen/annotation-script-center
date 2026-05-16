# POST /api/v2/item/get-task-item-abandon-list

## 请求目的

加载 Task 页面 Dropped 列表，显示已放弃条目。该接口属于 Task 页面公共状态列表能力。

## 触发操作

在 Task21 Data 页点击 `Dropped` Tab。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=all&dm=all`。
- 角色：标注角色已实测；标注内审角色只读观察过空列表。
- 本轮标注角色 Dropped 列表有 1 条测试数据。

## 请求记录

- Method：`POST`
- URL / Path：`/api/v2/item/get-task-item-abandon-list`
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
              "label": "LABELING",
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

1. `POST /api/v2//item/get-item-node-operator-info`
2. `POST /api/v2/item/find-items-file`
3. `POST /api/v2/item/get-item-detail`

选中单条 Dropped 行后：

1. `POST /api/v2/item/get-frame-count`
2. 顶部 `Recovery` 按钮启用。

## 页面反馈

- URL 变为 `/task-v2/data-item?taskId={taskId}&vm=all&dm=abandoned`。
- Dropped Tab 显示数量。
- 表格行 Label Status 显示 `Dropped`。
- 顶部主按钮为 `Recovery`，未选中时 disabled，选中一条后可点击。

## 字段推断

- Dropped 视图使用 `dm=abandoned`。
- Dropped 列表 endpoint 名称使用 `abandon`，页面文案使用 `Dropped`。

## Content Script 建议

- 可以被动监听该接口识别 Dropped 列表。
- 不主动点击 `Recovery`。
- 恢复必须由用户人工确认，且只允许单条测试或用户明确选择的条目。

## 未确认项

- Dropped 空列表在标注角色下的中文提示待补。
- Dropped 列表分页、筛选叠加结构待补。
