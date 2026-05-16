# POST /api/v2/item/get-frame-count

## 请求目的

Data 页勾选条目后统计选中条目的有效帧和无效帧数量，并驱动底部选择状态。

## 触发操作

- 单选一条 checkbox。
- 多选两条 checkbox。
- 2026-05-16 补测底部 `跨页全选`，仅观察选择态和请求结构，未执行批量标注、批量恢复、批量送审或批量领取。

## 操作前页面状态

- 页面：Task21 Data 页。
- 右上按钮：`Claim Label` 或 `View`。
- 底部状态：`Selected 0 entry, 0 frame`。

## 请求记录

- Method：`POST`
- URL：`/api/v2/item/get-frame-count`
- Content-Type：`application/json`
- Status：`200`
- Request Header 摘要：敏感字段已脱敏。
- Query keys：无。

## 脱敏请求体摘要

单选：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}"]
    }

多选：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}", "{itemId}"]
    }

跨页全选前置列表刷新：

    {
      "taskId": "{taskId}",
      "pageNum": "number",
      "pageSize": "number",
      "search": {
        "type": "AND",
        "units": []
      },
      "nodeId": "{nodeId}",
      "enableCrossPageSelection": "boolean"
    }

跨页全选后的帧数统计：

    {
      "taskId": "{taskId}",
      "itemIds": ["{itemId}", "{itemId}", "{itemId}", "{itemId}"]
    }

## 脱敏响应示例

    {
      "code": 0,
      "data": {
        "validCount": "number",
        "invalidCount": "number"
      }
    }

## 后续请求链路

单选、多选未观察到除 `get-frame-count` 以外的业务请求。跨页全选会先刷新当前列表，再调用 `get-frame-count` 统计选中条目的帧数。

## 页面反馈

- 单选后：`Label: 1`，`Selected 1 entry, 0 frame`。
- 多选后：`Label: 2`，`Selected 2 entry, 0 frame`。
- 跨页全选补测后：简体中文按钮显示 `标注：4条`，底部显示 `已选择4条目，0帧`。

## 字段推断

- `itemIds.length` 与选中条目数一致。
- `validCount + invalidCount` 用于底部 frame 统计。
- `enableCrossPageSelection` 表示跨页选择状态；本轮只确认当前可见 4 条被纳入 `itemIds`，未测试跨页翻页后的累计行为。

## Content Script 建议

可以被动监听该接口识别当前选择数量；禁止自动触发跨页全选、批量送审、批量恢复、批量领取。

## 未确认项

- 点击 `标注：4条` 进入批量标注页未确认；本轮尝试点击未触发跳转或业务请求。
- 真正跨页翻页后的累计选择与批量操作请求待补；不建议主动采集。
