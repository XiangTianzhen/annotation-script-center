# 下次接续采集说明

## 当前上下文

本轮已完成并写入文档的内容包括：

- Data 页筛选模板、批次、列表和选择帧数结构。
- 领取标注 `receive-item` 成功路径。
- 领取审核 `receive-item` 成功路径。
- `/items` 标注页和内审页初始化链路。
- `item/work` 工作锁定接口。
- `Save` 复用 `save-labels`。
- `Drop` 调用 `abandon-item` 并自动领取下一条。
- `Skip` 调用 `skip-item` 并自动领取下一条。
- `Submit` 在 same_font 为空时前端校验阻断，无新增业务请求。
- `Submit` 在 same_font 填写最小有效值后会先 `save-labels`，再调用 `POST /api/v2/item/submit-item`；成功后 Data 页显示 `Labeled / Pending Review`。
- Skipped 列表加载：`POST /api/v2/item/get-task-item-skip-list`。
- Dropped 列表加载：`POST /api/v2/item/get-task-item-abandon-list`。
- Dropped 恢复：`Recovery` 确认弹窗后调用 `POST /api/v2/item/recover-item`，再刷新 Dropped 列表。
- Skipped 重新进入标注：选中后点击 `Label: 1`，调用 `POST /api/v2/item/receive-item` 并进入 `/items`，未观察到独立 `recover-item`。
- 标注内审角色已只读观察列表、Skipped / Dropped 空列表和 `View` 查看页初始化；未点击提交、通过、驳回或审核完成类动作。
- 领取标注 / 领取审核二次测试仍成功领取，未触发空池。
- 简体中文环境已补齐 Data 页和标注页主要动作文案。
- Dropped 恢复后目标状态确认进入 Todo / 待办项。
- `Label / 标注` 补测确认不是状态 Tab 专属 endpoint，而是角色区域；点击未观察到业务请求。
- `other_changes` textarea 自由文本暂存复用 `POST /api/v2/label/save-labels`，文本值在 `value` 字段，文档只记录 `<TEXT_VALUE>`。
- 语言切换补测未观察到独立偏好保存接口；切回简体中文时只捕获常规 `/api/message/list`。
- 跨页全选只补测到选择态、列表刷新和 `get-frame-count`；未执行批量标注、批量恢复、批量送审、批量领取。
- Task17 内审页点击 `领取审核` 已捕获空池失败响应：`receive-item` 返回“无条目可领”业务失败；页面出现验证组件后未继续操作。
- 资源文件加载类型。

## 下次优先采集

1. Task21 领取标注空池失败
   - 目标：确认 Task21 标注节点下 `receive-item` 空池响应。
2. 内审流转按钮
   - 目标：Reject / Label / Pass 的接口和风险；当前边界禁止采集，除非用户未来另行授权。
3. 异常弹窗
   - 目标：保存失败、提交失败、权限不足等失败响应；不主动构造越权或破坏性场景。

## 可跳过项

- Task17 状态变更。
- 跨页批量状态变更。
- 统计分析、工作流、成员配置页。
- 网络断开、越权、删除等异常构造。

## 脱敏提醒

- 不记录完整 cookie、token、authorization、session。
- 不记录完整资源 URL、base64、对象存储 query。
- 不记录客户原始文本和测试账号敏感信息。
- 请求体和响应体只保留结构摘要。
