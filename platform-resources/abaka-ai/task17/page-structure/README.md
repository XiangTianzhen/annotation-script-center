# Abaka AI Task17 页面结构差异

## 目录定位

本文只记录 Task17 与 Abaka AI Task 页面公共结构、Task21 的差异。公共页面壳见 `../../page-structure/platform.md`。

## 已观察结构

- Task17 Data 页路径仍为 `/task-v2/data-item`。
- 任务名可见为 `TASK17-9`。
- 当前主要观察角色为内审角色，右上按钮为 `领取审核 / Claim Review`。
- 表格包含审核员、审核团队列。
- `/items` 查看页仍使用资源区、标注控件区、右侧条目列表、锁定状态、计时器结构。

## 与 Task21 差异

- Task17 主标注不是 Task21 `same_font`。
- Task17 详情页示例可携带多个 `selectIds`，右侧条目列表显示多条。
- Task17 领取审核空池可返回业务失败，不进入 `/items`。

## 边界

Task17 不作为当前功能主目标；除用户明确授权的空池响应外，不主动做状态变更测试。


