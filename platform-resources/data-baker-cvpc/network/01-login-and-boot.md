# 01 登录与启动链

## 请求标识 / 目的

- `routeKey`: `login-shell`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 目标入口：`https://cvpc.data-baker.com/app/web/#/login`
- 2026-06-05 观察：在有效登录态下访问 `#/login`，页面直接回到 `#/home`
- 登录提交请求链来自同浏览器会话中的真实保留请求；本轮没有重新输入账号密码

## 请求摘要

- `requestClass`: `write`
- `queryKeys`: 无
- `requestClass`: `write`
- `queryKeys`: 无
- `requestClass`: `boot`
- `queryKeys`: 无
- `requestClass`: `boot`
- `queryKeys`: 无
- `requestClass`: `asset`
- `queryKeys`: 无

## 请求体摘要

- 当前记录未见独立 request body；以路径参数或 query 为主。

## 响应摘要

- 响应结构：
  - `data.status`
- 响应结构：
  - `data.token`
- 响应结构：
  - `data.user_id`
  - `data.name`
  - `data.is_authed`
  - `data.auth_type`
  - `data.menus[]`
  - `data.default_org_id`
  - `data.default_group_id`
  - `data.default_terminal`
  - `data.org_logo`

## 关键字段

- 当前重点继续以路径、query、响应字段名和脱敏占位为主。

## 前端接入建议

- `user/meta` 是壳层、菜单、终端头的主来源
- `user_center/info` 补足组织与角色层级
- `upload/tellme` 在登录后很早就出现，说明平台把上传配置当作通用启动资源

## 风险 / 未确认项

- 文档只保留当前有效结论；新增缺口统一回写稳定参考页或 `log.md`。
