# 02 登录后壳层与首页

- `routeKey`: `home-shell`
- `riskLevel`: `readonly`

## 页面入口

- 路由：`#/home`
- 触发方式：
  - 有效会话访问 `app/web/`
  - 有效会话访问 `#/login` 后自动重定向

## 请求序列

1. `GET /httpapi/user/meta`
2. `GET /httpapi/user_center/info`
3. `POST /httpapi/upload/tellme`

## 核心接口与页面关系

### `GET /httpapi/user/meta`

- `requestClass`: `boot`
- `queryKeys`: 无
- 关键字段：
  - `data.menus[]`
  - `data.default_org_id`
  - `data.default_group_id`
  - `data.default_terminal`
- 首页依赖：
  - 左侧菜单项
  - 当前组织/分组上下文
  - 后续请求的 `baker-terminal`

### `GET /httpapi/user_center/info`

- `requestClass`: `boot`
- `queryKeys`: 无
- 关键字段：
  - `data.structures[]`
  - `data.structures[].roles`
  - `data.structures[].groups`
- 首页依赖：
  - 组织标签
  - 账户/权限上下文

### `POST /httpapi/upload/tellme`

- `requestClass`: `asset`
- `queryKeys`: 无
- 关键字段：
  - `data.provider`
  - `data.bucket`
  - `data.endpoint`
  - `data.expiration`
- 首页依赖：
  - 首页本身没有明显视觉回填
  - 更像是上传子系统的通用预热请求

## 壳层特征

- 顶部文本稳定包含：
  - `工作台`
  - `返回旧版`
  - `引导`
  - `消息`
  - `帮助`
  - `账户`
- 左侧菜单至少包含：
  - `首页`
  - `我的作业`
  - `个人账户`
- 主内容区是空壳欢迎页，中心只显示欢迎文案

## 字段复用建议

- 可直接用于后续脚本判断：
  - `menus[]`
  - `default_group_id`
  - `default_terminal`
- 只作风险提示，不落盘原值：
  - 用户姓名
  - 组织名称
  - 上传凭证

## 首轮结论

- 首页不是数据页，重点是确认壳层和终端上下文
- 后续真正业务入口应从 `我的作业` 开始，而不是首页主内容区
