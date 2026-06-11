# 02 登录后壳层与首页

## 请求标识 / 目的

- `routeKey`: `home-shell`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 路由：`#/home`
- 触发方式：
  - 有效会话访问 `app/web/`
  - 有效会话访问 `#/login` 后自动重定向

## 请求摘要

- `requestClass`: `boot`
- `queryKeys`: 无
- `requestClass`: `boot`
- `queryKeys`: 无
- `requestClass`: `asset`
- `queryKeys`: 无

## 请求体摘要

- 当前记录未见独立 request body；以路径参数或 query 为主。

## 响应摘要

- `data.menus[]`
  - `data.default_org_id`
  - `data.default_group_id`
  - `data.default_terminal`
  - `data.structures[]`
  - `data.structures[].roles`
  - `data.structures[].groups`
  - `data.provider`
  - `data.bucket`
  - `data.endpoint`
  - `data.expiration`

## 关键字段

- 可直接用于后续脚本判断：
  - `menus[]`
  - `default_group_id`
  - `default_terminal`
- 只作风险提示，不落盘原值：
  - 用户姓名
  - 组织名称
  - 上传凭证

## 前端接入建议

- 首页不是数据页，重点是确认壳层和终端上下文
- 后续真正业务入口应从 `我的作业` 开始，而不是首页主内容区

## 风险 / 未确认项

- 文档只保留当前有效结论；新增缺口统一回写稳定参考页或 `log.md`。
