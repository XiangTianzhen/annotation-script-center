# Abaka AI Task21 动作与状态变更边界

## 动作分级

| 等级 | 含义 | 后续脚本策略 |
| --- | --- | --- |
| `safe-read` | 页面加载、查询、查看、只读结构采集 | 可以自动读取脱敏结构 |
| `ui-local` | 只改变当前前端选中态或展开态 | 可以辅助，但需避免误触发批量选择 |
| `state-change-test` | 采集阶段已在测试账号内最小范围测试的状态变更 | 文档可记录结构，正式脚本必须人工确认 |
| `danger-confirm` | 保存、提交、领取、流转、放弃、跳过、恢复等高风险动作 | 必须二次确认，不得静默执行 |
| `forbidden-auto` | 跨页全选、批量流转、删除、越权或跨项目动作 | 禁止自动执行 |

## 已测试动作

| 动作 | 页面 | 等级 | 请求文档 | 观测接口 / 结果 | 是否可恢复 | 后续限制 |
| --- | --- | --- | --- | --- | --- | --- |
| 查看页打开 | `/items?viewMode=true` | `safe-read` | `network/task-page/05-items-view-init.md` | 查看权限、条目信息、标注数据、右侧条目列表等只读请求 | 不涉及 | 可作为结构读取入口 |
| 单选条目 | `/task-v2/data-item` | `ui-local` | `network/task-page/04-data-page-selection-frame-count.md` | 触发 `/api/v2/item/get-frame-count`，按钮变为 `Label: 1` | 不涉及 | 不自动跨页全选 |
| 多选条目 | `/task-v2/data-item` | `ui-local` | `network/task-page/04-data-page-selection-frame-count.md` | `itemIds` 数组长度随选择数量变化，按钮变为 `Label: 2` | 不涉及 | 不自动跨页全选 |
| 跨页全选 | `/task-v2/data-item` | `ui-local` / `forbidden-auto` | `network/task-page/04-data-page-selection-frame-count.md` | 触发列表刷新和 `/api/v2/item/get-frame-count`，按钮变为 `标注：4条` | 不涉及 | 禁止自动触发跨页和批量状态变更 |
| 领取标注 | `/task-v2/data-item` | `state-change-test` / `danger-confirm` | `network/task-page/14-claim-label.md` | `/api/v2/item/receive-item` 成功后进入标注 `/items` | 未测试释放 | 不自动领取 |
| 领取审核 | `/task-v2/data-item?role={reviewRoleId}` | `state-change-test` / `danger-confirm` | `network/task-page/15-claim-review.md` | `/api/v2/item/receive-item` 成功后进入内审 `/items` | 未测试释放 | 不自动领取 |
| same_font + 派生字段暂存 | `/items` 标注页 | `state-change-test` / `danger-confirm` | `task21/network/08-label-save-labels.md`、`network/task-page/12-stash-save.md` | 点击 `Save` 触发 `/api/v2/label/save-labels`，页面提示 `Staging` | 标签可继续编辑 | 正式脚本不得自动写入标签 |
| other_changes 文本暂存 | `/items` 标注页 | `state-change-test` / `danger-confirm` | `task21/network/08-label-save-labels.md` | textarea 文本进入 `save-labels.data.create[].value`，页面提示 `暂存成功` | 标签可继续编辑 | 不记录真实文本，不自动保存 |
| 放弃条目 | `/items` 标注页 | `state-change-test` / `danger-confirm` | `network/task-page/09-abandon-item.md` | 空变更 `save-labels` 后调用 `/api/v2/item/abandon-item`，再自动 `receive-item` 下一条 | 本轮未看到恢复按钮 | 必须人工确认，不做批量放弃 |
| 跳过条目 | `/items` 标注页 | `state-change-test` / `danger-confirm` | `network/task-page/10-skip-item.md` | 空变更 `save-labels` 后调用 `/api/v2/item/skip-item`，再自动 `receive-item` 下一条 | 本轮未看到恢复按钮 | 必须人工确认，不做批量跳过 |
| 送审 / 提交 | `/items` 标注页 | `danger-confirm` | `network/task-page/11-submit-review.md` | same_font 为空时前端校验阻断；填写后可触发成功提交 | 视场景而定 | 必须人工确认 |
| 送审成功 | `/items` 标注页 | `state-change-test` / `danger-confirm` | `network/task-page/23-label-submit-success.md` | `save-labels -> submit-item`，成功后 Data 页显示 `Labeled / Pending Review` | 送审后进入审核流，不按恢复处理 | 必须人工确认，不自动送审 |
| Skipped 列表 | `/task-v2/data-item?dm=skipped` | `safe-read` | `network/task-page/19-skipped-list.md` | `/api/v2/item/get-task-item-skip-list` | 不涉及 | 可只读识别 |
| Dropped 列表 | `/task-v2/data-item?dm=abandoned` | `safe-read` | `network/task-page/20-dropped-list.md` | `/api/v2/item/get-task-item-abandon-list` | 不涉及 | 可只读识别 |
| 资源加载 | `/items` | `safe-read` | `network/task-page/17-resource-files.md` | 加载 assets、captcha、`.webp` 对象存储图片 | 不涉及 | 不记录完整 URL |

## 未完整测试动作

| 动作 | 当前状态 | 风险 | 待补内容 |
| --- | --- | --- | --- |
| 领取标注空池 | 待补 | 可能改变任务占用或分配状态 | 无可领取数据时的 response shape |
| 领取审核空池 | 待补 | 可能改变审核分配状态 | 无可领取数据时的 response shape |
| 内审 Reject / Label / Pass | 禁止采集 | 改变审核流转状态 | 当前边界下不得点击；除非用户未来另行授权 |
| Label Tab 专属请求 | 待补 | 只读风险低 | `Label` Tab 是否有独立列表 endpoint |

## 操作按钮边界

| 按钮 | 中文文案 | English 文案 | 页面 | 是否危险 | 是否已测试 | Network 用途 | 后续脚本建议 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 领取标注 | 领取标注 | Claim Label | 数据条目页 | 是 | 是 | `network/task-page/14-claim-label.md` | 只做入口提示，必须人工确认 |
| 查看 | 查看 | View | 数据条目页 | 否 | 是 | 查看页只读加载 | 可作为只读入口 |
| 标注 | 标注 | Label: N | 数据条目页 | 是 | 是 | 进入工作页、可能锁定 | 进入前提示当前任务与条目 |
| 放弃 | 放弃 | Drop | 标注页 | 是 | 是 | `network/task-page/09-abandon-item.md` | 二次确认，禁止批量 |
| 跳过 | 跳过 | Skip | 标注页 | 是 | 是 | `network/task-page/10-skip-item.md` | 二次确认，禁止批量 |
| 送审 | 送审 | Submit | 标注页 | 是 | 是 | `network/task-page/11-submit-review.md`、`network/task-page/23-label-submit-success.md` | 二次确认，禁止自动送审 |
| 恢复已放弃 | 恢复 | Recovery | Dropped Tab | 是 | 是 | `network/task-page/22-restore-dropped-item.md` | 二次确认，禁止批量恢复 |
| 恢复已跳过 | 待补 | Label: N | Skipped Tab | 是 | 是 | `network/task-page/21-restore-skipped-item.md` | 二次确认，提示会重新进入工作态 |
| 内审查看 | 查看 | View | 标注内审 Data 页 | 否 | 是 | `network/task-page/24-review-role-no-submit.md` | 只读入口 |
| 内审提交 / 通过 / 驳回 | 提交 / 通过 / 驳回 待补 | Pass / Reject / Label | 标注内审工作页 | 是 | 禁止 | 待补 | 当前边界下不实现、不采集 |
| 筛选 | 筛选 | 待补 | 数据条目页 | 否 | 是 | 条目列表查询 | 只读采集筛选字段 |
| 搜索 | 搜索 | Search | 数据条目页 | 否 | 是 | 条目列表查询 | 可辅助定位 Task21 |
| 切换角色 | 标注 / 标注内审 | Label / Claim Review | 数据条目页 | 可能 | 是 | 角色相关查询 | 只读切换需明确角色 |
| 切换语言 | 切换语言 | Language | 用户菜单 | 否 | 部分 | `network/task-page/16-language-switch.md` | 只记录文案，不依赖单一语言 |
| 分页 | 上一页 / 下一页 / 10/页 | Previous / Next / 10/page 待补 | 数据条目页 | 否 | 是 | 条目列表查询 | 只做当前页读取 |
| 全选 / 多选 | 选择框 | checkbox | 数据条目页 | 可能 | 部分 | 帧数统计或列表状态 | 禁止跨页批量自动操作 |
| 领取审核空池 | 领取审核 | Claim Review | Task17 内审 Data 页 | 可能 | 是 | `task17/network.md`、`network/task-page/15-claim-review.md` | 只记录失败结构，不继续操作验证组件 |

## 后续脚本规则

- 读取类能力可以自动化，但只保存脱敏结构和当前页面状态。
- 状态变更类动作必须由用户人工点击或通过二次确认层触发。
- AI 建议只能辅助展示，不自动保存、提交、领取、流转、放弃、跳过或恢复。
- 标注内审权限下不得自动提交、通过、驳回或完成审核。
- 跨页全选、批量放弃、批量送审、批量领取默认禁止自动触发。
- 同一动作在简体中文和 English 下都要有定位兜底，不得只依赖中文文案。
- 未采集到接口的动作必须保持“待补”，不得按按钮文案推断接口路径。
- `Label / 标注` 在 Task21 Data 页是角色区域，不作为状态 Tab 专属 endpoint 处理。
