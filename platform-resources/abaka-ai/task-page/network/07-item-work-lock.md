# POST /api/v2/item/work

## 请求目的

进入 `/items` 标注或内审页时建立当前条工作状态 / 锁定状态。

## 触发操作

- 领取标注成功进入 `/items`。
- 领取审核成功进入 `/items`。
- 直接打开可编辑 `/items` URL。

## 操作前页面状态

页面显示加载态和锁定/解锁状态，随后出现可操作按钮。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/work`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

    {
      "nodeId": "{nodeId}",
      "itemId": "{itemId}"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {}
    }

## 后续请求链路

通常与 `get-item-info`、`find-labels`、`find-issues`、`find-label-records`、`sampling/get-frames-data` 同组出现。

## 页面反馈

页面显示 `Lock`、`Unlocked state supports modification tags`、计时器和操作按钮。

## 字段推断

该接口会改变或刷新工作占用状态，属于状态相关接口。

## Content Script 建议

后续扩展不得主动调用；只可被动监听，记录是否进入工作态。

## 未确认项

- 锁定失败、他人占用、长时间暂停后的重新工作接口待补。
