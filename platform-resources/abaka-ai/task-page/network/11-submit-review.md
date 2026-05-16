# Submit / 送审客户端校验阻断

## 请求目的

记录 Task21 标注页点击 `Submit` 时的前端校验行为。本轮当前条未填写 same_font，前端阻断，没有发出提交请求。

## 触发操作

在 Task21 标注页直接点击 `Submit`。

## 操作前页面状态

- 当前条 same_font 为空。
- 底部按钮：`Save / Drop / Skip / Submit`。

## 请求记录

本次操作未观察到新增 XHR/fetch 请求。

## 脱敏请求体摘要

无请求体。前端校验先阻断。

## 脱敏响应示例

无服务端响应。

## 后续请求链路

无业务请求、无 URL 跳转。

## 页面反馈

页面显示：

    Pre Check Error
    There are no markup results that can be submitted
    same_font: Empty

## 字段推断

- 前端会在提交前检查 same_font 是否存在可提交结果。
- 未通过校验时不会调用提交 / 送审接口。

## Content Script 建议

不要把用户点击 `Submit` 等同于真实提交成功。判断提交必须监听实际提交 endpoint；当前提交 endpoint 待补。

## 未确认项

- same_font 完整填写后提交成功接口待补。
- 提交失败响应和成功后后续链路待补。
- 中文环境校验提示待补。
