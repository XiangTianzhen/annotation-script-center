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
- 资源文件加载类型。

## 下次优先采集

1. 完整填写 same_font 后点击 `Submit`
   - 目标：确认真实送审 endpoint。
   - 记录：request / response、成功 Toast、是否自动领取下一条或返回列表。
2. Drop / Skip 后恢复
   - 目标：找到恢复入口和接口。
   - 记录：恢复后状态变化和后续请求链路。
3. 领取空池失败
   - 目标：确认 `receive-item` 空池响应。
4. 中文语言环境动作按钮
   - 目标：确认 Save / Drop / Skip / Submit / Claim Label / Claim Review 中文文案。
5. 内审流转按钮
   - 目标：Reject / Label / Pass 的接口和风险。

## 可跳过项

- Task17 状态变更。
- 跨页全选和批量操作。
- 网络断开、越权、删除等异常构造。

## 脱敏提醒

- 不记录完整 cookie、token、authorization、session。
- 不记录完整资源 URL、base64、对象存储 query。
- 不记录客户原始文本和测试账号敏感信息。
- 请求体和响应体只保留结构摘要。
