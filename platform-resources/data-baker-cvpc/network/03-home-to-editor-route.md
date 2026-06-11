# 03 首页到编辑器的导航请求链

## 请求标识 / 目的

- `routeKey`: `home-to-editor`
- `riskLevel`: `safe-ui`

## 页面入口 / 触发动作

- 当前文件未补充额外入口说明；默认按对应页面自然加载或用户显式操作触发。

## 请求摘要

- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：

## 请求体摘要

- 当前记录未见独立 request body；以路径参数或 query 为主。

## 响应摘要

- 响应结构：
  - `data.datas[]`
  - `data.datas[0].id`
  - `data.datas[0].data_mode`
  - `data.datas[0].name`
  - `data.datas[0].preview_path`
  - `data.total`
- 列表路径：`data.datas`
- 总数字段：`data.total`
  - `data.datas[].id -> <projectId>`
- 响应结构：
  - `data.name`
  - `data.id`
  - `data.data_mode`

## 关键字段

- 当前重点继续以路径、query、响应字段名和脱敏占位为主。

## 前端接入建议

- 接入时优先复用当前页已有稳定锚点，只做只读监听或最小范围辅助。

## 风险 / 未确认项

- 文档只保留当前有效结论；新增缺口统一回写稳定参考页或 `log.md`。
