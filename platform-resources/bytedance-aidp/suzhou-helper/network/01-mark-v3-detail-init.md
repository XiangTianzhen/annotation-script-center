# 01 `mark-v3` 详情页初始化

## 请求标识 / 目的

- `routeKey`: `suzhou-mark-v3-detail`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 路由模式：
  - `/management/task-v2/{taskId}/mark-v3/{index}`
- 当前样例 query：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- 本轮进入方式：
  - 列表页行级入口跳转
  - 地址栏直接打开已知详情页 URL

## 请求摘要

- `requestClass`: `boot`
- `Method`: `GET`
- `Path`：
  - `/management/task-v2/{taskId}/mark-v3/{index}`
- `Query`：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- `requestClass`: `detail-init`
- `Path`：待补采（详情初始化接口当前未在仓库内确认）
- `Query`：预计至少关联 `taskId`、`templateID` 或当前条目上下文，需独立 Edge 窗口补采
- `requestClass`: `data-read`
- `Path`：待补采（字段、媒体、状态类接口当前未在仓库内确认）

## 请求体摘要

- 当前已确认的详情页导航链路以路径参数和 query 为主。
- 详情初始化接口的请求体位置、字段结构和分页或条目参数当前都未补采。

## 响应摘要

- 当前已确认详情页会绑定以下路由上下文：
  - `taskId`
  - `index`
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- 当前预计详情页初始化至少需要：
  - 当前条目上下文
  - 模板或字段定义
  - 媒体或内容展示数据
  - 当前任务状态信息
- 上述真实接口路径和响应字段名均未补采；首轮不能写成已确认契约。

## 关键字段

- `taskId`
- `index`
- `from_pathname`
- `fs`
- `templateID`
- `templateType`

## 前端接入建议

- 详情页识别优先使用完整路径匹配，不要只依赖标题文本或单个按钮。
- 后续如果要接脚本运行时，先基于 `taskId + index + templateID` 做当前页上下文识别，再补真实字段和媒体结构。
- 在真实页面补采前，不要预设字段键名、请求参数名或提交载荷格式。

## 风险 / 未确认项

- 当前未补到详情初始化接口的真实路径、Method 和响应字段。
- 当前未确认详情页是否包含 iframe、画布、富文本容器或独立媒体播放器实现。
- 保存、提交、领取、切条等写链路均不在本轮范围内。
