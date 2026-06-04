# 01 登录与启动链

- `routeKey`: `login-shell`
- `riskLevel`: `readonly`

## 页面入口

- 目标入口：`https://cvpc.data-baker.com/app/web/#/login`
- 2026-06-05 观察：在有效登录态下访问 `#/login`，页面直接回到 `#/home`
- 登录提交请求链来自同浏览器会话中的真实保留请求；本轮没有重新输入账号密码

## 请求序列

1. `POST /httpapi/captcha/login`
2. `POST /httpapi/user/login`
3. `GET /httpapi/user/meta`
4. `GET /httpapi/user_center/info`
5. `POST /httpapi/upload/tellme`

## 核心接口

### 1. `POST /httpapi/captcha/login`

- `requestClass`: `write`
- `queryKeys`: 无
- 请求体结构：
  - `mobile`
  - `rand_str`
  - `ticket`
- 响应结构：
  - `code`
  - `data.status`
- 列表路径：无
- 总数字段：无
- 上下游 ID 传递：不产出业务 ID，只为下一步登录校验铺路
- 后续可复用字段：无
- 风险字段：
  - `mobile`
  - `ticket`
  - 任意验证码相关值

### 2. `POST /httpapi/user/login`

- `requestClass`: `write`
- `queryKeys`: 无
- 请求体结构：
  - `login_type`
  - `username_mobile_email`
  - `password_captcha`
- 响应结构：
  - `code`
  - `data.token`
- 列表路径：无
- 总数字段：无
- 上下游 ID 传递：
  - `token` 进入后续鉴权头
- 后续可复用字段：无。`token` 只能运行时读取，不能写入资料
- 风险字段：
  - 用户名/手机号/邮箱
  - 密码/验证码
  - `token`

### 3. `GET /httpapi/user/meta`

- `requestClass`: `boot`
- `queryKeys`: 无
- 请求体结构：无
- 响应结构：
  - `code`
  - `data.user_id`
  - `data.name`
  - `data.is_authed`
  - `data.auth_type`
  - `data.menus[]`
  - `data.default_org_id`
  - `data.default_group_id`
  - `data.default_terminal`
  - `data.org_logo`
  - `data.org_dataset_menu`
  - `data.org_push2data`
  - `data.org_push2dataset`
- 列表路径：`data.menus`
- 总数字段：无
- 上下游 ID 传递：
  - `default_group_id` + `default_terminal` 组合成后续 `baker-terminal`
  - `menus[]` 决定左侧路由入口
- 后续可复用字段：
  - `menus[]`
  - `default_org_id`
  - `default_group_id`
  - `default_terminal`
- 风险字段：
  - `name`
  - `org_logo`

### 4. `GET /httpapi/user_center/info`

- `requestClass`: `boot`
- `queryKeys`: 无
- 请求体结构：无
- 响应结构：
  - `code`
  - `data.id`
  - `data.name`
  - `data.username`
  - `data.password`
  - `data.mobile`
  - `data.email`
  - `data.auth_type`
  - `data.create_date`
  - `data.structures[]`
  - `data.structures[0].org_id`
  - `data.structures[0].org_name`
  - `data.structures[0].is_active`
  - `data.structures[0].is_expired`
  - `data.structures[0].roles`
  - `data.structures[0].groups`
- 列表路径：`data.structures`
- 总数字段：无
- 上下游 ID 传递：
  - `structures[]` 提供组织、角色、组信息，支撑壳层与权限判断
- 后续可复用字段：
  - `structures[].org_id`
  - `structures[].roles`
  - `structures[].groups`
- 风险字段：
  - 个人身份字段
  - 手机/邮箱
  - 密码字段

### 5. `POST /httpapi/upload/tellme`

- `requestClass`: `asset`
- `queryKeys`: 无
- 请求体结构：未在正文保留；接口用于申请上传配置
- 响应结构：
  - `code`
  - `data.path`
  - `data.provider`
  - `data.bucket`
  - `data.endpoint`
  - `data.sign_endpoint`
  - `data.region`
  - `data.signature_version`
  - `data.access_key`
  - `data.access_secret`
  - `data.security_token`
  - `data.expiration`
- 列表路径：无
- 总数字段：无
- 上下游 ID 传递：给上传组件提供临时凭证与目标桶
- 后续可复用字段：
  - `provider`
  - `bucket`
  - `endpoint`
  - `region`
- 风险字段：
  - `access_key`
  - `access_secret`
  - `security_token`
  - 任何临时签名配置

## 首轮结论

- `user/meta` 是壳层、菜单、终端头的主来源
- `user_center/info` 补足组织与角色层级
- `upload/tellme` 在登录后很早就出现，说明平台把上传配置当作通用启动资源
