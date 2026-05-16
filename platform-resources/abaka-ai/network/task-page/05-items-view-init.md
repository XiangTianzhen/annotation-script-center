# POST /api/v2/item/get-view-item-permission 等查看页初始化

## 请求目的

进入 `/items?viewMode=true` 查看页时读取权限、条目、标签、问题、记录、AI 检查、无效帧、抽帧和右侧条目列表。

## 触发操作

在 Data 页点击 `View`，或直接打开 Task21 查看页 URL。

## 操作前页面状态

- 页面：Task21 Data 页。
- 操作：只读查看，不改变条目状态。

## 请求记录

- Method：`POST`
- URL：
  - `/api/v2/item/get-view-item-permission`
  - `/api/v2/item/get-item-history`
  - `/api/v2//item/check-operate-item-permission`
  - `/api/v2/item/get-item-info`
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
      "selectIds": ["{selectId}"],
      "pageNum": "number",
      "pageSize": "number"
    }

不同接口只取其中必要字段，例如 `find-labels` 主要使用 `itemId` + `taskId`。

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "permission": "<BOOLEAN_OR_OBJECT>",
        "item": "<ITEM_INFO_OBJECT>",
        "labels": [
          {
            "data": {
              "label": "Annotation Area_same_font",
              "value": "<ENUM_VALUE>"
            }
          }
        ],
        "records": [],
        "issues": []
      }
    }

## 后续请求链路

查看页加载后还会加载 `.webp` 图片、静态按钮图标和可能的 captcha / assets 资源。资源只记录类型和 pathname 模式。

## 页面反馈

页面显示资源区、same_font 只读结构、右侧条目列表、锁定提示和图片查看器按钮。

## 字段推断

- `get-view-item-permission` 决定只读权限。
- `find-labels` 是 same_font 历史标签读取来源。
- `find-items-base-info` 用于右侧条目列表。

## Content Script 建议

查看页适合只读解析当前条结构；不要在查看页触发保存或流转动作。

## 未确认项

- 查看页多 `selectIds` 右侧列表点击是否发起新请求，Task21 单条不足时待补。
