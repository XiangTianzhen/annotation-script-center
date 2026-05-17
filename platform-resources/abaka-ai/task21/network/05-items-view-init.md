# POST /api/v2/item/get-item-info（Task21 查看页脱敏结构）

## 说明

- 来源：2026-05-18 DevTools MCP + 既有公共文档 `../../network/task-page/05-items-view-init.md`。
- 页面：`/items?...&viewMode=true`。
- 目标：只记录 Task21 需要的字段结构（图片/文本/位置），不记录敏感 header、完整 URL、原始响应体。

## 请求摘要

- Method：`POST`
- URL：`/api/v2/item/get-item-info`
- Content-Type：`application/json`
- credentials：浏览器同源会话（不手写 token/cookie）

## 脱敏请求体

    {
      "taskId": "{taskId}",
      "itemId": "{itemId}",
      "nodeId": "{nodeId}"
    }

## 脱敏响应结构（Task21 关键信息）

    {
      "code": 0,
      "data": {
        "...": "...",
        "<path_to_images>": {
          "image_a|imageA": "<masked-url-or-object>",
          "image_b|imageB": "<masked-url-or-object>",
          "image_b_removed|imageBRemoved": "<masked-url-or-object>"
        },
        "<path_to_texts>": {
          "image_a_texts|imageATexts": "<string-or-array>",
          "image_b_texts|imageBTexts": "<string-or-array>",
          "text_positions|textPositions|positions|bbox|boxes": "<object-or-array>"
        }
      }
    }

## 备注

- 查看页仍可用于只读分析，不允许自动写入、自动保存、自动提交。
- 具体字段路径在不同任务/版本可能变化，运行时代码使用候选 key 递归匹配，不依赖单一路径。
