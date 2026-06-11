# 04-数据标注 网络请求

## 请求标识 / 目的

- 页面路由：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`
- 入口：任务详情页 → 点击分包"查看"按钮
- 鉴权：`Authorization: Bearer <JWT>`

## 页面入口 / 触发动作

| 序号 | URL | 方法 | 用途 |
|------|-----|------|------|
| 1 | `/api/account/info` | POST | 当前用户信息与角色 |
| 2 | `/api/task/detail/<taskId>` | GET | 任务详情（含 `dataRoot`、模板 ID） |
| 3 | `/api/taskItem/packageItemList/<packageId>` | GET | **全量条目列表**（`pageSize=9999`，不分页） |
| 4 | `/api/template/detail/<templateId>` | GET | 模板字段配置 |

## 请求摘要

- 当前文件未补充更细的请求摘要。

## 请求体摘要

- 当前记录未见独立 request body；以路径参数或 query 为主。

## 响应摘要

- **响应**：`{ "roles": "a", "curRole": "a" }`（`a` = 标注员）
- **响应关键字段**：
- **响应结构**：
- **响应关键字段**：
- **响应关键字段**：
- **未标注时响应**：`{ "data": { "result": null, "isSucceed": true } }`
- **成功响应**：`{ "status": 200, "data": { "isSucceed": true, "message": "" } }`

## 关键字段

- **URL**：`GET /api/template/detail/<templateId>`
- **响应关键字段**：
  ```json
  {
    "name": "闽南标注",
    "templateItems": [{
      "name": "文本",
      "fieldName": "text",
      "necessary": true,
      "type": 0
    }]
  }
  ```
- `fieldName: "text"` 表明保存时 `mark` 字段的内容格式为 `{"text":"..."}` 的 JSON 字符串

## 前端接入建议

- 接入时优先复用当前页已有稳定锚点，只做只读监听或最小范围辅助。

## 风险 / 未确认项

- 文档只保留当前有效结论；新增缺口统一回写稳定参考页或 `log.md`。
