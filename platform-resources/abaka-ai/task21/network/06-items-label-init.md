# POST /api/v2/item/get-item-info（Task21 标注页脱敏结构）

## 说明

- 来源：2026-05-18 DevTools MCP 快照（目标 URL 已打开）+ 历史公共文档 `../../network/task-page/06-items-label-init.md`。
- 页面：`/items?...&itemId={itemId}&nodeId={nodeId}`（非 `viewMode=true`）。
- 用途：服务 Task21 前端 AI 调试采集（图片/文本/位置）与字段按钮挂载验证。

## 本轮页面结构确认（MCP snapshot）

- 标注区外层：`.grid-board`
- 字段块：`.l-item`
- 字段标题：`.l-title-text`
- 标题动作区：`.l-header-actions`
- 图片标题：`.content-title span`（`image_a` / `image_b` / `image_b_removed`）
- 图片区域：`.content-image-view img`

## 请求摘要

- Method：`POST`
- URL：`/api/v2/item/get-item-info`
- Content-Type：`application/json`
- credentials：`include`（浏览器已有登录会话）

## 脱敏请求体

    {
      "taskId": "{taskId}",
      "itemId": "{itemId}",
      "nodeId": "{nodeId}"
    }

## 脱敏响应结构（Task21 采集目标）

    {
      "code": 0,
      "data": {
        "...": "...",
        "<images_path>": {
          "image_a|imageA": "<masked>",
          "image_b|imageB": "<masked>",
          "image_b_removed|imageBRemoved": "<masked>"
        },
        "<texts_path>": {
          "image_a_texts|imageATexts": "<string-or-array>",
          "image_b_texts|imageBTexts": "<string-or-array>",
          "text_positions|textPositions|positions|bbox|boxes": "<object-or-array>"
        }
      }
    }

## 前端采集策略（本轮实现口径）

1. 优先读取 `get-item-info`。
2. 通过候选 key 递归匹配提取：
   - 图片：`image_a`、`image_b`、`image_b_removed`
   - 文本：`image_a_texts`、`image_b_texts`
   - 位置：`text_positions`
3. 若接口字段缺失或请求失败，回退 DOM（`.content-title span` + `.content-image-view img`）。
4. UI/日志只展示 `fieldName/mime/width/height/bytes/sourceKind`，不展示完整 URL 或完整 dataUrl。

## 安全边界

- 不写入 token/cookie/authorization/access-token/trace-id。
- 不落原始响应体、不提交 HAR/JSON/截图。
- AI 只辅助分析，不自动写入、不自动保存、不自动提交。
