# POST /api/v2/package/get-package-list 与批次筛选

## 请求目的

读取 Task21 批次列表、批次筛选项和导入轮次筛选项。

## 触发操作

- 打开 Task21 批次页。
- 切换 `By Batch` / 批次视图。
- Data 页筛选区初始化。

## 操作前页面状态

- 页面：`/task-v2/data-item?taskId={taskId}&vm=batch&dm=all&batchId={batchId}`。
- 可见批次示例：`批次_1`、`批次_2`。

## 请求记录

- Method：`POST`
- URL：
  - `/api/v2/package/get-package-list`
  - `/api/v2//package/get-package-filter-list`
  - `/api/v2//import/get-import-filter-list`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "pageNum": "number",
      "pageSize": "number",
      "search": "<OPTIONAL_SEARCH_TEXT>",
      "filters": "<OPTIONAL_FILTER_OBJECT>"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "total": "number",
        "data": [
          {
            "_id": "{batchId}",
            "name": "<PUBLIC_BATCH_NAME>",
            "count": "number",
            "status": "<STATUS_ENUM>"
          }
        ]
      }
    }

## 后续请求链路

选中批次后触发条目列表接口，列表请求会携带 `{batchId}` 或批次筛选条件。

## 页面反馈

左侧批次栏显示批次名、数量和 checkbox；批次页表格随批次变化刷新。

## 字段推断

- `/api/v2//package/get-package-filter-list` 和 `/api/v2//import/get-import-filter-list` 实采路径包含双斜杠，应按观测事实记录。
- 批次名可用于人工核对，但脚本定位应优先使用 URL query 与接口返回结构。

## Content Script 建议

只读取批次结构和当前选中状态，不自动勾选跨批次或跨页全选。

## 未确认项

- 批次分页字段在大批次任务中的完整结构待补。
