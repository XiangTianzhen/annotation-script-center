# 语言切换请求观察

## 请求目的

记录 Abaka AI 简体中文 / English 切换是否产生独立业务接口。

## 触发操作

2026-05-16 补测在 Task21 标注权限 Data 页执行：

1. 打开左下用户菜单。
2. 点击 `切换语言`。
3. 从 `简体中文` 切到 `English`。
4. 再从 `Switch Language` 切回 `简体中文`。

页面语言选项包含 `English`、`简体中文`、`日本語`。

## 操作前页面状态

本轮实测覆盖简体中文和 English。English 环境按钮文案包括：

- `Claim Label`
- `Claim Review`
- `View`
- `Label: N`
- `Save`
- `Drop`
- `Skip`
- `Submit`

## 请求记录

- Method：未观察到独立语言偏好保存接口。
- URL：未观察到独立语言偏好保存接口。
- Content-Type：不适用。
- Status：不适用。
- Query keys：不适用。

切回简体中文后捕获到常规消息轮询：

- Method：`GET`
- URL：`/api/message/list`
- Content-Type：`application/json`
- Status：`200`
- Query keys：无。

## 脱敏请求体摘要

未观察到语言切换专属 request body。

## 脱敏响应示例

常规消息轮询响应：

    {
      "code": 200,
      "data": []
    }

## 后续请求链路

从简体中文切换到 English 时，UI 文案立即切换，未捕获 XHR / fetch。切回简体中文时仅捕获到 `/api/message/list` 常规请求，未观察到独立偏好保存接口。

## 页面反馈

English 环境下确认的关键按钮：

- Data 页：`Claim Label`、`Claim Review`、`View`、`Label: 1`、`Label: 2`。
- 标注页：`Save`、`Drop`、`Skip`、`Submit`。
- 内审页：`Save`、`Skip`、`Reject`、`Label`、`Pass`。

简体中文环境下确认的关键按钮：

- Data 页：`查看`、`领取标注`、`领取审核`、`标注：N`。
- 标注页：`暂存`、`放弃`、`跳过`、`送审`。

## 字段推断

不能只依赖中文按钮文案。后续定位应优先使用 route、query keys、区域结构、role / aria / data-col-key，再使用双语文案兜底。

## Content Script 建议

语言切换不应由脚本自动触发。脚本需要兼容 English 和简体中文按钮文本。

## 未确认项

- 是否存在非 XHR/fetch 的持久化方式未确认；本轮不读取 localStorage / sessionStorage / cookie。
