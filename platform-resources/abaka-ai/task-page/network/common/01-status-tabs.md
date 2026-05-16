# Abaka AI Task 页面状态 Tab 请求

## 请求目的

记录 Data 页状态 Tab 的公共列表加载规则。该能力属于 Abaka AI Task 页面公共能力，不是 Task21 `same_font` 专属能力。

## 触发操作

在 Task21 Data 页点击 `Overview`、`Todo`、`Skipped`、`Dropped`。本轮 English 环境实测；`Label` Tab 文案存在，但未单独确认其点击后的专属请求。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=all&dm={mode}`。
- 角色：标注角色、标注内审角色均观察到同一类 Tab。
- 表格字段包括 Item ID、Frames、Invalid Frames、Import Round、Batch、Stage、Label Status、Review Status 等。

## 请求记录

- Method：`POST`
- URL / Path：
  - Overview：`/api/v2/item/get-task-item-list-lite`
  - Todo：`/api/v2/item/get-task-item-todo-list-lite`
  - Skipped：`/api/v2/item/get-task-item-skip-list`
  - Dropped：`/api/v2/item/get-task-item-abandon-list`
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
              "label": "<LABELING|LABELED|SKIP>",
              "check": "<UNCHECKED|CHECKING>",
              "nodesCheckStatus": "<object>",
              "nodesSubmitTimes": "<object>"
            },
            "permission": ["<permission shape>"],
            "labelSpaceId": "{spaceId}",
            "sourceNodeId": "{nodeId}"
          }
        ],
        "total": "<number>"
      }
    }

## 后续请求链路

列表返回非空后，页面通常继续按当前页 itemIds 拉取：

1. `POST /api/v2/item/get-item-detail`
2. `POST /api/v2/item/find-items-file`
3. `POST /api/v2//item/get-item-node-operator-info`

## 页面反馈

- URL 中 `dm` 会随 Tab 变化：
  - Overview：`dm=all`
  - Todo：`dm=todo`
  - Skipped：`dm=skipped`
  - Dropped：`dm=abandoned`
- Skipped 有数据时显示跳过条目数量。
- Dropped 恢复后 Dropped 计数刷新为 0。
- 标注送审成功后 Overview 行可显示 `Labeled / Pending Review`。

## 字段推断

- `dm` 是 Data 页面状态视图标识。
- `processStatus.label` 是标注状态主字段。
- `processStatus.check` 和 `nodesCheckStatus` 表示审核状态。
- 不同 Tab 主要通过 endpoint 区分，不是在同一个 endpoint 中传 status 字段。

## Content Script 建议

- 可以根据 URL `dm`、Tab 文案和列表 endpoint 被动识别当前状态视图。
- 不要自动点击跨页全选。
- 不要根据单一中文文案定位，应结合 endpoint、URL、表头结构和 English 文案兜底。

## 未确认项

- `Label` Tab 单独点击后的 endpoint 待补。
- 简体中文环境下各 Tab 精确文案待补。
- 分页、筛选条件叠加状态 Tab 时的请求结构待补。
