# 01 首页（welcome）网络摘要

## 页面

- URL：`https://work.magicdatatech.com/#/welcome`

## 请求 1：用户信息

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/user-service/sys/user/info`
- query keys：无
- payload 字段：无
- response 顶层字段：`code,data,message`
- 用途推断：登录态下拉取当前用户基础信息
- ID 字段：可能包含 `id`（脱敏）
- 是否敏感操作：否（读）
- 自动化边界：可观察

## 请求 2：抽检能力判断

- method：`GET`
- hostname：`work.magicdatatech.com`
- pathname：`/api/management-service/customer/sampling/ifHasCustomeSamp`
- query keys：无
- payload 字段：无
- response 顶层字段：`code,data,message`
- data 样例字段（脱敏）：`customerSampling`
- 用途推断：判断是否启用客户抽检相关能力
- 是否敏感操作：否（读）
- 自动化边界：可观察
