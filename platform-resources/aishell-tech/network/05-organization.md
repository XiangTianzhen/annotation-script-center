# 05-我的团队 网络请求

- 页面路由：`/organization/myteam`
- 访问方式：顶部菜单「我的团队」

## 请求 1：机构列表

- **方法**：GET
- **URL**：`/api/organization/list?page=1&size=999`

## 请求 2：用户列表

- **方法**：GET
- **URL**：`/api/user/list?orgId=<orgId>&teamId=<teamId>&page=1&size=30`

## 请求 3：团队列表

- **方法**：GET
- **URL**：`/api/team/list?orgId=<orgId>`

## 说明

我的团队页面非核心标注链路，未做详细响应结构采集。
