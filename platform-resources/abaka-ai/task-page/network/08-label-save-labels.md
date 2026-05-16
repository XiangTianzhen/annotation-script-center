# POST /api/v2/label/save-labels

## 请求目的

保存 Task21 same_font 主标注和派生字段。当前实测中，点击 same_font / 派生字段本身只改变前端状态；点击 `Save` 时发送保存请求。

## 触发操作

- 点击 `same_font = true`。
- 点击派生字段 `image_b_texts_removed = true`。
- 点击派生字段 `other_changes = unsure`。
- 点击页面底部 `Save`。

## 操作前页面状态

- 页面：Task21 标注页。
- 当前条显示 `same_font`，选择 `true` 后展开 `image_b_texts_removed`、`other_changes`。

## 请求记录

- Method：`POST`
- URL：`/api/v2/label/save-labels`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

单选和派生字段保存：

    {
      "nodeId": "{nodeId}",
      "itemId": "{itemId}",
      "taskId": "{taskId}",
      "workTime": "number",
      "data": {
        "create": [
          {
            "id": "number",
            "hash": "<REDACTED_HASH>",
            "label": "Annotation Area_same_font",
            "value": "true",
            "drawType": "QUESTION",
            "count": "number",
            "frameIndex": "number"
          },
          {
            "label": "Annotation Area_same_font_true_image_b_texts_removed",
            "value": "true"
          },
          {
            "label": "Annotation Area_same_font_true_other_changes",
            "value": "unsure"
          }
        ],
        "update": [],
        "delete": []
      }
    }

空变更保存：

    {
      "nodeId": "{nodeId}",
      "itemId": "{itemId}",
      "taskId": "{taskId}",
      "workTime": "number",
      "data": {
        "create": [],
        "update": [],
        "delete": []
      }
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "insertData": [
          {
            "_id": "<REDACTED_LABEL_ID>",
            "hash": "<REDACTED_HASH>",
            "dataId": "number"
          }
        ],
        "updateCount": "number",
        "updateData": [],
        "deleteCount": "number",
        "deleteData": []
      }
    }

## 后续请求链路

本轮点击 `Save` 后未观察到 `find-labels` 刷新；`Drop` 和 `Skip` 前会自动补发一次空变更 `save-labels`。

## 页面反馈

点击 `Save` 后页面出现 `Staging` 提示。点击字段本身未观察到自动保存请求。

## 字段推断

- `data.create[]` 放新增标签。
- `data.update[]` 放更新标签。
- `data.delete[]` 放删除标签。
- `label` 使用 `Annotation Area_...` 层级表达 same_font 与派生字段。
- `value` 保存公开枚举值，例如 `true`、`unsure`。

## Content Script 建议

扩展只被动监听该接口。AI 建议不得自动写入 `data.create/update/delete`，必须由用户人工确认。

## 未确认项

- `textarea` 自由文本保存结构未在本轮写入测试文本，避免记录客户原始内容；字段结构待补。
- 保存失败响应待补。
