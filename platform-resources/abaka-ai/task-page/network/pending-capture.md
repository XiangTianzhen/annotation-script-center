# Abaka AI Task21 待补网络采集

## 当前缺口

| 动作 / 接口 | 风险 | 当前状态 | 待补内容 |
| --- | --- | --- | --- |
| 领取标注空池 | 中 | 本轮领取成功 | 空池业务响应结构 |
| 领取审核空池 | 中 | 本轮领取成功 | 空池业务响应结构 |
| 内审 Reject / Label / Pass | 高 | 本轮明确禁止测试 | 接口、确认弹窗、状态变化；除非用户未来另行授权，否则不采集 |
| 中文环境动作按钮 | 中 | 本轮主要 English 环境 | Save / Drop / Skip / Submit 中文精确文案 |
| 语言切换接口 | 低 | 未重新切换 | 是否有独立偏好保存接口 |
| textarea 保存 | 中 | 未输入测试文本 | `other_changes` 自由文本保存结构 |
| 异常弹窗 | 中 | 未构造失败 | 保存失败、提交失败、权限不足响应 |
| Label Tab 专属请求 | 低 | 本轮未单独确认 | `Label` Tab 点击后是否有独立 endpoint |
| Dropped 恢复后目标状态 | 中 | 已确认 `recover-item` 和 Dropped 列表移出 | 恢复后准确进入 Todo、Overview 还是其他状态 |

## 不主动构造项

- 网络断开。
- 越权访问。
- 批量跨页全选。
- 删除或跨项目操作。
- Task17 状态变更。

## 二次采集建议步骤

1. 先打开 DevTools Network，清空记录。
2. 注入只记录脱敏结构的临时监听器。
3. 每次只测试一个按钮。
4. 记录操作前 URL、页面状态、按钮文案。
5. 若有确认弹窗，只在 Task21 测试账号内确认一次。
6. 记录 endpoint、method、request shape、response shape、Toast、URL 变化。
7. 如果出现恢复按钮，优先恢复本次测试造成的状态变化；内审角色下仍不得点击提交 / 通过 / 驳回类按钮。
8. 更新对应编号文档和本待补清单。

## 脱敏要求

- 不记录 cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL。
- 不记录客户原始文本内容。
- 所有真实 ID 使用 `{taskId}` / `{itemId}` / `{nodeId}` / `<REDACTED_*>`。
