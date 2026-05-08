# 站点上下文字段契约

## 目的

本文件用于固定当前 `alibaba-labelx` 站点层在“站点上下文提取稳定化”阶段应遵守的字段来源、优先级和边界。

它只回答一件事：
- `taskId / taskTitle / domSignals / contextInfo` 应该如何从 DOM 适配结果稳定回填到 `SitePageState`

## 当前前提

当前已经具备：
- `SitePageState` 稳定字段结构
- DOM 适配层统一输出结构
- `task-list / task-detail / unknown` 的统一空结果约定
- 由 `page-state-collector.js` 消费 DOM 适配结果并回填页面状态

因此下一阶段不再重做 DOM 适配层，而是收紧字段来源和优先级。
并且继续保持：
- DOM 适配结果只负责只读输出
- `SitePageState` 的 `domSignals / contextInfo` 只允许由 `page-state-collector.js` 单向回填

## 输入

站点上下文提取稳定化应只消费以下输入：
- 当前 `SitePageState` 基础骨架
- 当前 `AlibabaLabelxDomAdapterResult`
- 当前 `location.pathname`
- 当前 `document.title`

约束：
- 不直接新增 fetch 输入
- 不读取保存链路状态
- 不引入旧油猴的自动化或服务端状态

## 输出

这一步的输出仍然是原有 `SitePageState`，不新增第二套状态对象。

允许稳定化的字段只有：
- `domSignals.hasTaskListContainer`
- `domSignals.hasTaskDetailContainer`
- `domSignals.hasMainContent`
- `contextInfo.taskId`
- `contextInfo.taskTitle`

## `domSignals` 回填规则

`hasTaskListContainer`
- 仅在 `pageType === "task-list"` 时为真
- 由 `domAdapterResult.probes.hasPageContainer / hasPrimaryRegion / hasTaskRows` 推导

`hasTaskDetailContainer`
- 仅在 `pageType === "task-detail"` 时为真
- 由 `domAdapterResult.probes.hasPageContainer / hasPrimaryRegion / hasMetadataGroup` 推导

`hasMainContent`
- 直接来自 `domAdapterResult.probes.hasMainContent`

要求：
- 不再回退到单独的旧 selector 检查
- 同一字段只能有一套映射规则
- `unknown` 页面三个 `domSignals` 都允许稳定为 `false`

## `taskId` 来源优先级

固定为：
1. `domAdapterResult.metadata.taskId`
2. 从 `pathname` 提取的任务 ID
3. `null`

要求：
- 不再依赖分散的临时 DOM 扫描作为并行第二真源
- 路径提取只作为详情页的兜底来源
- `task-list / unknown / 非目标站点` 一律返回 `null`

## `taskTitle` 来源优先级

固定为：
1. `domAdapterResult.metadata.taskTitle`
2. `domAdapterResult.metadata.headerText`
3. `null`

要求：
- 不直接把 `document.title` 当成稳定任务标题
- 标题来源必须优先来自 DOM 适配层已命中的详情页结构
- `task-list / unknown / 非目标站点` 一律返回 `null`

## `contextInfo` 回填约束

`task-list`
- `contextInfo.taskId = null`
- `contextInfo.taskTitle = null`

`task-detail`
- 允许按上述优先级回填 `taskId / taskTitle`

`unknown`
- `contextInfo.taskId = null`
- `contextInfo.taskTitle = null`

要求：
- 不因为页面仍是目标站点就盲目保留上一次详情页上下文
- 页面类型变化后必须得到可预测的空值结果
- `task-detail` 如果本轮未取到值，也必须显式回填 `null`，不能沿用旧值

## collector 去重约束

当前代码中的两层去重需要分开理解：
- `route-observer.js` 按 `pathname + routeKey` 去重路由变化回调
- `page-state-collector.js` 按 `pathname + routeKey + pageType + domSignals + contextInfo` 的页面状态签名去重

当前稳定约束：
- 去重不能挡住同一路由下的上下文稳定化验证
- 至少要让 `domSignals / contextInfo` 的变化有机会被重新采集和观察
- collector 去重比较应至少覆盖：`pathname`、`routeKey`、`domSignals`、`contextInfo`
- 允许提供显式强制采集入口用于人工验证同一路由下的变化

允许的做法：
- 扩展去重比较条件
- 在保持只读前提下引入更细粒度的变化判断

不允许的做法：
- 为了绕过去重而引入高频轮询
- 顺手把这一步扩成业务事件系统

## 与 `content.js` 的边界

这一步不以收口 `content.js` 为目标。

`content.js` 在本阶段最多只应做：
- 最小接线调整
- 最小日志调整

不应做：
- 大范围装配层重构
- 共享存储层改造
- badge 体系重写

## 当前明确不做什么

- 不改 DOM 适配层的统一输出结构
- 不新增高风险页面操作
- 不接入 fetch 拦截
- 不接入保存链路
- 不引入自动提交、自动抢单、批处理
- 不把这一步演变成业务逻辑层

