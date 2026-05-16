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
- 资源文件加载类型。

## 下次优先采集

1. 领取空池失败
   - 目标：确认 `receive-item` 空池响应。
2. 中文语言环境动作按钮
   - 目标：确认 Save / Drop / Skip / Submit / Claim Label / Claim Review 中文文案。
3. Dropped 恢复后的目标列表
   - 目标：确认恢复后准确进入 Todo、Overview 还是其他状态。
4. Label Tab 专属请求
   - 目标：确认 `Label` Tab 是否有独立 endpoint。
5. 内审流转按钮
   - 目标：Reject / Label / Pass 的接口和风险；当前边界禁止采集，除非用户未来另行授权。

## 可跳过项

- Task17 状态变更。
- 跨页全选和批量操作。
- 网络断开、越权、删除等异常构造。

## 脱敏提醒

- 不记录完整 cookie、token、authorization、session。
- 不记录完整资源 URL、base64、对象存储 query。
- 不记录客户原始文本和测试账号敏感信息。
- 请求体和响应体只保留结构摘要。
