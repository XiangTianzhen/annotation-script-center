# Abaka AI Task21 专项网络采集索引

## 目录定位

本目录只维护 Task21 `same_font` 专项请求。Task 页面公共请求已上移到 `../../network/`，避免 Task17 / Task21 重复维护同一套 Data 页和状态流转文档。

## 当前阶段

本目录记录通过 Google Chrome DevTools MCP 采集到的 Task21 专项标签保存结构。当前已覆盖：

- `same_font` 单选保存。
- `image_b_texts_removed` 派生字段保存。
- `other_changes` 枚举保存。
- `other_changes` textarea 自由文本暂存保存。

## 来源页面

- Task21 标注页：`/items?version=latest&taskId={taskId}&itemId={itemId}&nodeId={nodeId}`

## 文件列表

| 文件 | 请求 / 行为 | 说明 |
| --- | --- | --- |
| `08-label-save-labels.md` | `/api/v2/label/save-labels` | same_font 和派生字段保存 |
| `../../network/README.md` | 公共网络入口 | Data 页、领取、查看、状态流转、语言、资源 |

## 脱敏规则

- 不记录完整 cookie、token、authorization、session、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL 或 base64 data URL。
- 不记录测试账号、人员姓名、客户原始文本内容。
- 所有真实 ID 统一写成 `{taskId}`、`{itemId}`、`{nodeId}`、`{roleId}`、`{selectId}` 或 `<REDACTED_*>`。
- 保存请求里如果包含标签内容，只保留字段名、枚举值和结构。

## Content Script 总体建议

- 默认只被动监听 XHR/fetch。
- 不主动调用保存、提交、领取、放弃、跳过、送审、恢复接口。
- 状态变更必须人工确认。
- AI 建议只辅助展示，不自动保存或提交。
- 对 `save-labels` 只记录脱敏结构和结果，不记录完整 payload。
