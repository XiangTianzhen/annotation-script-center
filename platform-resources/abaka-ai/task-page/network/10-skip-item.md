# POST /api/v2/item/skip-item

## 请求目的

由标注页 `Skip` 按钮触发，用于跳过当前条目。

## 触发操作

在 Task21 标注页点击 `Skip`。本轮未观察到二次确认弹窗，点击后直接发出请求。

## 操作前页面状态

- 页面：Task21 `/items` 标注页。
- 当前条未提交。
- 底部按钮：`Save / Drop / Skip / Submit`。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/skip-item`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

    {
      "nodeId": "{nodeId}",
      "itemId": "{itemId}",
      "workTime": "number"
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

实测链路：

1. `POST /api/v2/label/save-labels`，空变更保存。
2. `POST /api/v2/item/skip-item`。
3. `POST /api/v2/item/receive-item`，自动领取下一条。
4. 下一条 `/items` 初始化链路。

## 页面反馈

- 页面出现 `Skiped Successfully`。
- 随后出现 `Submitted successfully, has automatically received the next`。
- URL 切换到下一条 `{itemId}`，并追加 `currentIds`。

## 字段推断

- HTTP 200 且 `data=true` 表示跳过成功。
- 跳过会改变当前条目状态，并触发自动领取。

## Content Script 建议

高风险动作。扩展不得自动触发；只允许被动监听 endpoint、status、业务结果和跳转行为。

## 未确认项

- 跳过失败响应待补。
- 跳过后的恢复接口待补。
