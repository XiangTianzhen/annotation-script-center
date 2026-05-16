# 语言切换请求观察

## 请求目的

记录 Abaka AI 简体中文 / English 切换是否产生独立业务接口。

## 触发操作

本轮未重新执行语言切换。既有采集已确认页面存在用户菜单 `Language / 切换语言`，语言选项包含 `English`、`Simplified Chinese`、`Japanese`。

## 操作前页面状态

本轮实测主要在 English 环境完成，按钮文案包括：

- `Claim Label`
- `Claim Review`
- `View`
- `Label: N`
- `Save`
- `Drop`
- `Skip`
- `Submit`

## 请求记录

- Method：待补。
- URL：待补。
- Content-Type：待补。
- Status：待补。
- Query keys：待补。

## 脱敏请求体摘要

    {
      "language": "<LANGUAGE_CODE>"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

待补。可能只是本地语言状态变化后重新加载业务接口，也可能存在独立偏好保存接口。

## 页面反馈

English 环境下确认的关键按钮：

- Data 页：`Claim Label`、`Claim Review`、`View`、`Label: 1`、`Label: 2`。
- 标注页：`Save`、`Drop`、`Skip`、`Submit`。
- 内审页：`Save`、`Skip`、`Reject`、`Label`、`Pass`。

## 字段推断

不能只依赖中文按钮文案。后续定位应优先使用 route、query keys、区域结构、role / aria / data-col-key，再使用双语文案兜底。

## Content Script 建议

语言切换不应由脚本自动触发。脚本需要兼容 English 和简体中文按钮文本。

## 未确认项

- 语言切换是否有独立接口。
- 中文环境下 `Drop / Skip / Submit / Save` 的精确文案需复测。
