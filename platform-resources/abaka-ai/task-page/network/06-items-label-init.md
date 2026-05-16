# POST /api/v2/item/get-item-info 等标注页初始化

## 请求目的

进入 `/items` 标注页时加载当前条基础信息、历史、权限、标签、资源和右侧列表。

## 触发操作

- 点击 Data 页 `Claim Label` 成功后自动进入 `/items`。
- 点击 Data 页选中条目的 `Label: N`。
- 直接打开 Task21 标注页 URL。

## 操作前页面状态

本轮实测从 Data 页点击 `Claim Label` 后进入标注页，页面先显示 `The current item is loading and is inoperable`，随后显示 same_font 主标注区。

## 请求记录

- Method：`POST`
- URL：
  - `/api/v2/item/get-item-history`
  - `/api/v2//item/check-operate-item-permission`
  - `/api/v2/item/get-item-info`
  - `/api/v2/item/work`
  - `/api/v2/label/find-labels`
  - `/api/v2/label/find-issues`
  - `/api/v2/label/find-label-records`
  - `/api/v2/label/get-ai-check-result`
  - `/api/v2/item/find-invalidate-frame/`
  - `/api/v2/item/sampling/get-frames-data`
  - `/api/v2/item/find-items-base-info`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "itemId": "{itemId}",
      "nodeId": "{nodeId}",
      "pageNum": "number",
      "pageSize": "number"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "_id": "{itemId}",
        "taskId": "{taskId}",
        "nodeId": "{nodeId}",
        "status": "<ITEM_STATUS>",
        "processStatus": {
          "label": "<LABEL_STATUS>",
          "check": "<CHECK_STATUS>"
        },
        "permission": [
          {
            "nodeId": "{nodeId}",
            "status": "<WORK_STATUS>"
          }
        ],
        "info": {
          "data": [
            {
              "type": "<RESOURCE_OR_TEXT_TYPE>",
              "content": "<MASKED_CONTENT>"
            }
          ]
        }
      }
    }

## 后续请求链路

初始化完成后用户操作 `Save`、`Drop`、`Skip`、`Submit` 会触发状态变更或前端校验。

## 页面反馈

可见 `same_font`、资源图片、右侧条目列表、`Save / Drop / Skip / Submit`、锁定状态和计时器。

## 字段推断

- `processStatus.label`、`processStatus.check` 可用于判断当前条流转状态。
- `permission[].status` 显示当前用户对该节点的工作状态。

## Content Script 建议

从初始化响应中只提取结构化状态和 same_font 相关字段，不保存客户原始文本、图片 URL 或完整响应。

## 未确认项

- 初始化失败、权限不足、锁定冲突响应待补。
