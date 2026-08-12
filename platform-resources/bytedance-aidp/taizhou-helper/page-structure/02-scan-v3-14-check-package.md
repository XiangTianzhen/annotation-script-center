# 检查包只读识别页

## 页面标识 / 路由 / 前置条件

- 路由：`/management/task-v2/{taskId}/scan-v3/{nodeId}/{itemId}`，或 `/management/task-v2/{taskId}/mark-package/{packageId}/{nodeId}?itemID={itemId}`；`nodeId` 仅白名单 `14、17`，不表示任意节点开放。
- 前置条件：已进入 AIDP 检查包浏览页，并已收到对应当前 `itemId` 的 `GetWorkItem` 响应，或在缺少该响应时收到带 `snapshotVersion: 1` 的同页最小 `Receive` 快照。

## 页面总览

- 页面展示当前题的音频波形与一个或多个现有分段。
- 台州话辅助面板在此模式提供单段识别、人工选择当前可见分段、批量识别、停止、预览与复制；批量默认不选择任何分段，也不按审核状态自动选择。默认折叠的录音结果区同时提供受上下文约束的“添加数据”、结果刷新，以及必须由用户点击“开始”的“全自动导入并押后”。

## DOM 树 / 区域结构

- 分段行：Arco 虚拟表格行，类名包含 `arco-table-tr`。
- 行标识：`data-neeko-table-row-key`。
- 转写框：行内 `textarea`，其 `id` 会动态变化，不能用于分段关联。

## 稳定选择器表

| 目标 | 选择器 / 字段 | 用途 |
| --- | --- | --- |
| 分段行 | `.arco-table-tr[data-neeko-table-row-key]` | 获取页面可见分段 ID |
| 转写框 | 行内 `textarea` | 仅作页面状态读取，不写入 |
| 分段 ID | `data-neeko-table-row-key` | 与 `Answer.data.regions[*].id` 对齐 |

## 动态区域 / 重渲染风险

- Arco 表格可虚拟化和重绘；每次 DOM 同步均按行键重新关联。
- textarea ID 不是稳定标识，禁止缓存或据此定位分段。

## 可挂载点建议

- 复用台州话现有辅助面板与行内“识别音频”入口。
- 检查包模式不注入清空画段、填语言或分段建议应用控件；仅在录音能力开启且同题上下文有效时，于辅助面板注入“添加数据”和自动化开始/停止区，不复制 `mark-v3` 顶部按钮。

## 页面区域与接口映射

| 页面区域 | 只读数据来源 |
| --- | --- |
| 媒体信息 | `GetWorkItem.Item.Content`，或回退 `Receive.Item.Content` |
| 分段选择与行内识别 | `GetWorkItem.Answer.data.regions` / `dataMap.regions`，或回退 `Receive.TempAnswer.Content` 中的同字段 |
| 批量结果预览 | 台州话 AI 识别返回的 `listenText` |
| 录音导入 | 优先同题、未过期的 Search Item；否则回退同题、未过期的 `GetWorkItem.Item.Content` / `Receive.Item.Content`，只读取 `asr_text`、`audio`、`video` |
| 自动押后 | 页面真实、唯一且可见的“押后”控件与“押后原因”弹层；扩展不直接调用 AIDP 写接口 |

## 写操作边界 / 未确认项

- 此页面禁止修改行内转写 textarea，禁止调用 `SubmitTempItemAnswer`，禁止暂存、提交、领取、扩展直接切题或删除当前选区；所有写入型快捷键必须拒绝执行。唯一写操作例外是用户显式启动后，在唯一“押后原因”弹层写入 `1` 并点击同层“确定”，以及由此触发的平台原生押后。
- 自动化只接受 `AVAILABLE`、`SUBMITTED`，锁定当前页面类型、taskId 与 packageId/nodeId 范围；范围变化、DOM 歧义、网络 20 秒未结算、上下文错误或下一题未验证均立即停止，绝不点击“提交”或领取。
- 停止批量后不再发起新的 AI 请求；已发出的请求可返回并仅显示结果。
