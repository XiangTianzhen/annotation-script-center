# Abaka AI 通用网络请求（脱敏）

## 目录定位

本文件记录 Abaka AI 多页面共用的初始化、权限、任务和资源类接口。Task 页面公共请求已经上移到根级 `network/` 目录，任务差异分别维护在 `task21/` 和 `task17/`：

- Task 页面公共网络索引：`network/README.md`
- Task 页面公共 Data / `/items` 请求：`network/task-page/`
- Task 页面公共状态流转：`network/task-page/18-status-tabs.md` 起的编号文档
- Task21 same_font 专项：`task21/network/README.md`
- Task17 对比资料：`task17/network.md`

## 采集范围

- 采集日期：2026-05-16。
- 采集方式：Google Chrome DevTools MCP、DevTools DOM snapshot、只读 Console 结构脚本、Network 面板结构观察。
- 页面：登录后任务列表、Task21 Data 页、Task21 `/items` 页、Task17 对比页。
- 说明：本文件只记录平台通用接口结构，不放 Task21 same_font 专属细节。

## 脱敏规则

- 不记录 cookie、authorization、token、access_token、refresh_token、password、secret、sign、signature、credential、session。
- 不记录完整 audio、url、file、download、oss、src、href、path 字符串。
- 资源字段只记录字段名、类型、长度、是否 masked、可能的扩展名。
- 请求和响应只记录字段结构、列表路径、分页字段、触发页面和安全备注。

## 登录后初始化请求

### 用户信息

- Method：`POST`
- Path：`/api/auth-center/user/user-info`
- Query：无。
- Request：`{}`
- Response：
  - `code`
  - `data.mfa`
  - `data.username`
  - `data.platform`
  - `data.spaceRole`
  - `data.nickname`
  - `data.email`
  - `data.other`
  - `data.space`
  - `data.space.users[]`
- 触发页面：登录后任务列表、Task Data 页、`/items` 工作页。
- 安全备注：响应包含用户和空间成员结构，只记录字段，不记录真实账号信息。

### 权限模块树

- Method：`GET`
- Path：`/api/permission/module-tree/space`
- Query：无。
- Request：无。
- Response：
  - `code`
  - `data[]`
    - `title`
    - `key`
    - `router`
    - `buttons`
- 触发页面：登录后初始化。
- 安全备注：用于导航和按钮权限，只记录结构。

### 空间合约配置

- Method：`GET`
- Path：`/api/contract/space`
- Query：无。
- Request：无。
- Response：
  - `code`
  - `data.current`
  - `data.tool[]`
  - `data.module[]`
  - `data.models[]`
  - `data.scripts[]`
  - `data.exportScripts[]`
- 触发页面：登录后初始化。
- 安全备注：空间能力配置，不记录完整脚本资源 URL。

### 空间存储配置

- Method：`POST`
- Path：`/api/auth-center/space/storage`
- Query：无。
- Request：`{}`
- Response：
  - `code`
  - `data.type`
  - `data.bucket`
  - `data.private`
  - `data.expiration`
  - `data.ak`
  - `data.sk`
  - `data.token`
  - `data.end_point`
  - `data.storageType`
- 触发页面：登录后初始化。
- 安全备注：`ak/sk/token/end_point` 均按敏感或资源字段处理，文档只保留字段名。

### 空间列表

- Method：`POST`
- Path：`/api/auth-center/space/list`
- Query：无。
- Request：
  - `type`
  - `relation`
  - `name`
- Response：
  - `code`
  - `data[]`
    - `users[]`
    - `name`
    - `ownerId`
    - `type`
    - `domainId`
    - `points.total`
    - `points.current`
    - `points.used`
- 触发页面：任务详情页和筛选初始化。
- 安全备注：成员信息只记录结构。

### 消息列表

- Method：`GET`
- Path：`/api/message/list`
- Query：无。
- Request：无。
- Response：
  - `code`
  - `data[]`
- 触发页面：登录后轮询。
- 安全备注：无业务状态变更。

## 任务与权限通用请求

### 任务基础列表

- Method：`POST`
- Path：`/api/v2/task/get/task-basic-info-list`
- Query：无。
- Request：
  - `pageNum`
  - `pageSize`
  - `search`
  - `taskStatus`
- Response：
  - `code`
  - `data.total`
  - `data.data[]`
    - `status`
    - `type`
    - `name`
    - `domainId`
    - `version`
    - `agreement`
    - `isCollected`
- 触发页面：动态任务列表、Task 页面加载。
- 安全备注：Task21 行可由 `#HM_395_v2` 和 `Task21` 识别，但后续脚本不应硬编码单一行位置。

### Task 详情

- Method：`POST`
- Path：`/api/v2/task/get/task-info`
- Query：无。
- Request：
  - `taskId`
- Response：
  - `code`
  - `data.status`
  - `data.type`
  - `data.name`
  - `data.domainId`
  - `data.setting`
  - `data.agreement`
  - `data.createdAt`
  - `data.updatedAt`
- 触发页面：进入 Task Data 页和 `/items` 工作页。
- 安全备注：`data.setting.toolSetting.layout` 是页面布局来源；`exportScripts[].url` 按 URL 字段脱敏。

### Workflow 详情

- Method：`POST`
- Path：`/api/v2/workflow/get/workflow-info`
- Query：无。
- Request：
  - `taskId`
- Response：
  - `code`
  - `data.taskId`
  - `data.nodes[]`
  - `data.stashNodes[]`
  - `data.packageMode`
  - `data.config`
  - `data.delNodes[]`
- 触发页面：进入 Task Data 页和 `/items` 工作页。
- 安全备注：节点内包含 submit、move、skip 配置，只记录结构，不主动调用。

### 任务权限

- Method：`POST`
- Path：`/api/v2/task/get/permission`
- Query：无。
- Request：
  - `taskId`
- Response：
  - `code`
  - `data.taskId`
  - `data.workflowId`
  - `data.nodes[]`
  - `data.taskRole`
- 触发页面：进入 Task Data 页。
- 安全备注：用于判断可见角色和按钮。

### 协议状态

- Method：`POST`
- Path：`/api/v2/task/check-agreement-status`
- Query：无。
- Request：
  - `taskId`
- Response：
  - `code`
  - `data`
- 触发页面：进入 Task Data 页和 `/items` 工作页。
- 安全备注：页面加载自然请求。

## 资源请求规则

- 静态资源路径示例：`/assets/{name}.{hash}.{ext}`。
- 业务图片资源来自对象存储域，常见扩展名 `.webp`。
- 验证码或第三方安全资源可能来自第三方 captcha 域名。
- 文档只允许记录：
  - 资源类型。
  - 扩展名。
  - pathname 模式。
  - 字符串长度。
  - `masked: true`。
- 禁止记录完整对象存储 URL、完整签名 query、完整图片 URL、完整文件 URL。
