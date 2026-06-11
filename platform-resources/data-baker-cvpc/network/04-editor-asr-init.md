# 04 编辑器初始化

## 请求标识 / 目的

- `routeKey`: `editor-asr`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 路由模式：
  - `/app/editor/asr/?project_id=<projectId>&task_id=<taskId>&process_id=<processId>&data_id=<dataId>&job_id=<jobId>&mode=<mode>&next=<bool>&job_status=<status>&next_job_status=<status>&terminal=<terminal>`
- 本轮进入方式：
  - 作业列表点击 `继续作业`

## 请求摘要

- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `boot`
- `queryKeys`: 无
- `requestClass`: `data-read`
- `queryKeys`：
- `requestClass`: `asset`
- `requestClass`: `data-read`
- `queryKeys`: 无

## 请求体摘要

- 当前记录未见独立 request body；以路径参数或 query 为主。

## 响应摘要

- 响应结构：
- 响应结构：
  - `data.datas[]`
  - `data.datas[0].entry_id`
  - `data.datas[0].entry_index`
  - `data.datas[0].name`
  - `data.datas[0].type`
  - `data.datas[0].content`
  - `data.datas[0].extra`
  - `data.anns[]`
  - `data.anns[0].entry_index`
  - `data.anns[0].entry_id`
  - `data.anns[0].unique_id`
  - `data.anns[0].ann_scope`

## 关键字段

- 当前重点继续以路径、query、响应字段名和脱敏占位为主。

## 前端接入建议

- 编辑器真正依赖的是 `project_id + task_id + process_id + data_id + job_id`
- `annotation/meta` 是核心总装接口：同时给条目列表、现有标注和模板规则
- `check_script` 是非持久化校验口，可视为提交前的只读验证

## 风险 / 未确认项

- 文档只保留当前有效结论；新增缺口统一回写稳定参考页或 `log.md`。
