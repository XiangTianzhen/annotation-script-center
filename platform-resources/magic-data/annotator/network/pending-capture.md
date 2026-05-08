# 待补采项（pending capture）

## DOM 相关

- `mark/list`、`checkTask` 操作列按钮的精确 selector。
- `mark/details`、`checkdata/taskDetail` 列表容器与分页容器的精确 selector。
- `asrmark`、`asrmarkCheck` 的播放器按钮（播放/暂停/倍速/进度）精确 selector。
- `asrmarkCheck` 审核通过/驳回/退回按钮与问题类型选择器 selector。

## 网络相关

- 写操作接口的失败分支（仅在用户明确授权后采）。
- 不同审核状态下的额外校验接口。

## 采集限制说明

- 本轮遵循“只读采集”约束，未触发写操作。
- 采集工具在登录态 DOM 导出能力有限，已通过请求链路与 bundle 关键词交叉验证补充。
