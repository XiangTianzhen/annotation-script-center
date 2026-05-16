# Submit / 送审

## 请求目的

记录 Abaka AI Task 标注页点击 `Submit / 送审` 时的行为。Task21 same_font 为空时前端校验阻断；填写最小有效值后，成功送审链路已拆到公共 Task 页面文档 `../common/06-label-submit-success.md`。

## 触发操作

在 Task21 标注页点击 `Submit`。

## 操作前页面状态

- same_font 为空时：前端阻断，无新增业务请求。
- same_font 填写最小有效值时：发出 `save-labels -> submit-item`。
- 底部按钮：`Save / Drop / Skip / Submit`。

## 请求记录

校验阻断场景未观察到新增 XHR/fetch 请求。

成功场景：

- Method：`POST`
- URL：`/api/v2/item/submit-item`
- Content-Type：`application/json`
- Status：`200`
- 详细结构：见 `../common/06-label-submit-success.md`。

## 脱敏请求体摘要

校验阻断场景无请求体。成功场景摘要：

    {
      "taskId": "{taskId}",
      "nodeId": "{nodeId}",
      "itemId": "{itemId}",
      "approve": "<boolean>",
      "workTime": "<number>"
    }

## 脱敏响应示例

校验阻断场景无服务端响应。成功场景摘要：

    {
      "code": 0,
      "data": true
    }

## 后续请求链路

校验阻断场景无业务请求、无 URL 跳转。

成功场景链路：

1. `POST /api/v2/label/save-labels`
2. `POST /api/v2/item/submit-item`
3. `POST /api/v2//item/check-operate-item-permission`
4. `POST /api/v2/item/get-view-item-permission`
5. `POST /api/v2/item/get-item-info`
6. 标注数据和资源相关只读刷新接口。

## 页面反馈

页面显示：

    Pre Check Error
    There are no markup results that can be submitted
    same_font: Empty

成功场景：

- 页面进入加载态。
- 底部按钮变为 `Claim`。
- Data 页 Overview 中该条显示 `Labeled / Pending Review`。

## 字段推断

- 前端会在提交前检查 same_font 是否存在可提交结果。
- 未通过校验时不会调用提交 / 送审接口。
- 送审成功 endpoint 为 `/api/v2/item/submit-item`。

## Content Script 建议

不要把用户点击 `Submit` 等同于真实提交成功。判断提交必须监听实际提交 endpoint 和后续 `get-item-info` 状态；正式脚本不得主动调用提交接口。

## 未确认项

- 提交失败响应和成功后后续链路待补。
- 中文环境校验提示待补。
