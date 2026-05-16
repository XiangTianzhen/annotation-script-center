# Abaka AI Task 页面公共请求索引

## 目录定位

本目录维护 Task17、Task21 都复用的 Data 页、`/items` 工作页、领取、暂存、放弃、跳过、送审、语言切换和资源加载请求。Task21 `same_font` 专项保存结构维护在 `../../task21/network/08-label-save-labels.md`。

## 文件列表

| 文件 | 请求 / 行为 | 说明 |
| --- | --- | --- |
| `01-data-page-search-template.md` | `/api/v2/item/get-item-search-template-list` | Data 页筛选模板 |
| `02-data-page-package-list.md` | `/api/v2/package/get-package-list` 等 | 批次列表和筛选 |
| `03-data-page-item-list.md` | `/api/v2/item/get-task-item-list-lite` 等 | 条目列表 |
| `04-data-page-selection-frame-count.md` | `/api/v2/item/get-frame-count` | 单选 / 多选 / 跨页选择帧数 |
| `05-items-view-init.md` | 查看页初始化链 | 只读查看页 |
| `06-items-label-init.md` | 标注页初始化链 | 可编辑工作页 |
| `07-item-work-lock.md` | `/api/v2/item/work` | 工作开始 / 锁定 |
| `09-abandon-item.md` | `/api/v2/item/abandon-item` | Drop / 放弃 |
| `10-skip-item.md` | `/api/v2/item/skip-item` | Skip / 跳过 |
| `11-submit-review.md` | `/api/v2/item/submit-item` / 前端校验阻断 | Submit / 送审 |
| `12-stash-save.md` | `/api/v2/label/save-labels` | Save / 暂存按钮 |
| `13-restore-item.md` | `recover-item` / `receive-item` | 恢复入口概览 |
| `14-claim-label.md` | `/api/v2/item/receive-item` | 领取标注 |
| `15-claim-review.md` | `/api/v2/item/receive-item` | 领取审核 |
| `16-language-switch.md` | 语言切换观察 | 未观察到独立偏好保存接口 |
| `17-resource-files.md` | assets / object storage / captcha | 资源文件 |
| `pending-capture.md` | 待补 | 缺口清单 |
| `next-session-handoff.md` | 接续说明 | 下次采集上下文 |

## 状态流转公共文档

状态 Tab、Skipped / Dropped、Recovery 和内审只读边界维护在 `../common/`。
