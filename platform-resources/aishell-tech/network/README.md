# Aishell Tech 网络采集索引

## 目录定位

本目录是 Aishell Tech 数据处理工作平台网络请求资料的主维护位置。

## 当前阶段覆盖

- 首页初始化请求（3 API，含 Anlytics/GetIndexStatistics 统计总览）
- 我的任务列表请求（3 API，含响应结构）
- 任务详情页请求（2 API：detail + packageList）
- 数据标注页请求（8 API：含 SaveShortMark 实测 payload + 响应）
- 写操作接口清单与安全边界
- 我的团队请求（3 API）

## 文件列表

| 编号 | 文件 | 页面/内容 | 状态 |
|------|------|-----------|------|
| 01 | `01-index.md` | 首页 `/index` | 完成 |
| 02 | `02-mytask-index.md` | 我的任务列表 `/mytask/index` | 完成 |
| 03 | `03-mytask-detail.md` | 任务详情 `/mytask/detail/:taskId` | 完成 |
| 04 | `04-mytask-mark.md` | 数据标注 `/mytask/mark` | 完成（含 SaveShortMark 实测） |
| 05 | `05-sensitive-operations.md` | 标注/质检/验收侧写操作接口 | 完成（Bundle + 标注侧实测） |
| 06 | `06-organization.md` | 我的团队 `/organization/myteam` | 完成 |
| - | `pending-capture.md` | 待补采项清单 | 持续更新 |

## 脱敏规则

- 不记录 token/cookie/authorization/session。
- 不记录完整签名音频 URL（OSS `Signature` 参数已截断）。
- 不记录真实员工个人信息与客户敏感全文。
- 请求/响应示例只保留字段结构和脱敏样例。
