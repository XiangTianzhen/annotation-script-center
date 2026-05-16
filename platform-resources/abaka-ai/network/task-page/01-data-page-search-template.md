# POST /api/v2/item/get-item-search-template-list

## 请求目的

读取 Task21 Data 页筛选模板，用于渲染筛选区字段和可选条件。

## 触发操作

进入 `/task-v2/data-item` Data 页或刷新页面。

## 操作前页面状态

- 页面：Task21 Data 页。
- 语言：本轮实测为 English，既有文档已记录中文文案。
- 角色：标注或标注内审均会加载筛选模板。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/get-item-search-template-list`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏，不记录 cookie / authorization。
- Query keys：无。

## 脱敏请求体摘要

    {
      "taskId": "{taskId}",
      "nodeId": "{nodeId}",
      "role": "{roleId} 或缺省",
      "module": "<FILTER_MODULE>"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": [
        {
          "field": "<FIELD_NAME>",
          "label": "<PUBLIC_LABEL>",
          "type": "<CONTROL_TYPE>",
          "options": [
            {
              "label": "<PUBLIC_OPTION_LABEL>",
              "value": "<ENUM_VALUE>"
            }
          ]
        }
      ]
    }

## 后续请求链路

筛选模板加载后，Data 页继续加载批次筛选、导入轮次筛选、处理人和条目列表接口。

## 页面反馈

筛选区显示 `Search by ID or filename...`、`Filter`、搜索 / 重置控件。

## 字段推断

- `taskId` 用于确定当前任务模板。
- 模板返回字段决定筛选区控件类型，后续脚本不应硬编码所有筛选项。

## Content Script 建议

只被动读取模板结构，用于识别筛选区；不要保存用户输入的筛选值。

## 未确认项

- 不同角色下筛选模板字段是否完全一致仍待补。
