# 01 列表首页 `/management/task-v2?page=1`

## 请求标识 / 目的

- `routeKey`: `task-v2-home`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 路由模式：
  - `/management/task-v2?page={page}`
- 当前样例：
  - `/management/task-v2?page=1`
- 本轮进入方式：
  - 地址栏直接访问列表首页
  - 从详情页通过 `from_pathname` 相关返回链路回到列表

## 请求摘要

- `requestClass`: `boot`
- `Method`: `GET`
- `Path`: `/management/task-v2`
- `Query`：
  - `page`
- `requestClass`: `data-read`
- `Path`：待补采（列表数据接口当前未在仓库内确认）
- `Query`：预计与分页、筛选或排序有关，需在独立 Edge 窗口里补采
- `requestClass`: `navigation-read`
- `Path`：
  - `/management/task-v2/{taskId}/mark-v3/{index}`
- `Query`：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`

## 请求体摘要

- 当前已确认的页面导航链路以路径参数和 query 为主。
- 列表数据接口的请求体、分页参数位置和筛选参数结构，当前都未补采。

## 响应摘要

- 当前已确认首页文档请求会落到 `task-v2` 管理页壳层。
- 当前可安全确认的详情跳转上下文包括：
  - `taskId`
  - `index`
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- 列表数据接口的真实响应字段当前未补采；首轮不能把任何字段名写成已确认契约。

## 关键字段

- `page`
- `taskId`
- `index`
- `from_pathname`
- `fs`
- `templateID`
- `templateType`

## 前端接入建议

- 列表页识别优先使用：
  - `location.pathname === "/management/task-v2"`
  - `page` query
- 详情页跳转识别优先使用完整路径与 query 组合，不要只依赖按钮文案或列表行顺序。
- 在真实页面补采前，不要假定列表接口的字段名、列头文案或筛选参数名。

## 风险 / 未确认项

- 当前未补到真实列表数据接口路径、Method 和响应结构。
- 当前未确认列表页是否存在多种视图、分页组件实现或服务端筛选模式。
- 当前未确认 `fs` 在跳转链路中的具体语义；首轮只把它视为详情页上下文字段。
