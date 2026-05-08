# Site State Contract

本文件只描述当前扩展真实使用的站点契约。

如与旧的 skeleton 阶段文档冲突，以 `docs/alibaba-labelx-legacy-foundation-baseline.md` 和 `extension/sites/alibaba-labelx/site-contract.js` 为准。

## Rule Source

唯一规则真源：

- `extension/sites/alibaba-labelx/site-contract.js`

消费方：

- `page-detector.js`
- `route-observer.js`
- `page-state-collector.js`
- `content.js`
- 所有依赖 `pageType / routeKey / contextInfo` 的站点模块

## Stable Route Names

当前真实路由名只允许：

- `labelingTask`
- `checkTask`
- `sdk`
- `unknown`

## Stable Page Types

为兼容现有 consumer，当前页面模型仍只允许：

- `task-list`
- `task-detail`
- `unknown`

其中：

- `labelingTask` 与 `checkTask` 都映射到 `task-list`
- `sdk` 映射到 `task-detail`
- 标注/审核差异继续通过 `missionType` 表达

## Stable Route Fields

当前 `SitePageState` 顶层至少包含：

```ts
interface SitePageState {
  isTargetSite: boolean;
  hostname: string;
  pathname: string;
  search: string;
  hash: string;
  routeName: "labelingTask" | "checkTask" | "sdk" | "unknown";
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  missionType: "label" | "check" | null;
  projectId: string | null;
  subTaskId: string | null;
  timestamp: string;
  pageTitle: string;
  domSignals: {
    hasTaskListContainer: boolean;
    hasTaskDetailContainer: boolean;
    hasMainContent: boolean;
  };
  contextInfo: {
    taskId: string | null;
    subTaskId: string | null;
    projectId: string | null;
    missionType: "label" | "check" | null;
    taskTitle: string | null;
  };
}
```

## Route Key Rules

当前 `routeKey` 规则固定如下：

- `labelingTask`
  `task-list:label:project:<projectId>`
- `checkTask`
  `task-list:check:project:<projectId>`
- `sdk`
  `task-detail:<missionType>:project:<projectId>:subtask:<subTaskId>`
- 目标站未知路径
  `unknown:<pathname>`
- 非目标站点
  `non-target`

## Why `pageType` Is Still Two-Level

当前站点层已有大量 consumer 只判断：

- `pageType === "task-list"`
- `pageType === "task-detail"`

因此这一轮不把所有 consumer 改造成更多细分类别，避免无关重构。

真实模式差异改由：

- `routeName`
- `missionType`
- `projectId`
- `subTaskId`
- `routeKey`

继续表达。

## DOM Adapter Contract

当前 DOM adapter 仍返回统一结构：

```ts
interface AlibabaLabelxDomAdapterResult {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  matched: boolean;
  elements: {
    mainContent: Element | null;
    pageContainer: Element | null;
    headerRegion: Element | null;
    primaryRegion: Element | null;
    secondaryRegion: Element | null;
  };
  probes: {
    hasMainContent: boolean;
    hasPageContainer: boolean;
    hasHeaderRegion: boolean;
    hasPrimaryRegion: boolean;
    hasSecondaryRegion: boolean;
    hasTaskRows: boolean;
    hasMetadataGroup: boolean;
  };
  metadata: {
    taskId: string | null;
    taskTitle: string | null;
    headerText: string | null;
  };
}
```

要求：

- `task-list` 与 `task-detail` 都必须返回完整对象
- 未命中页面也必须返回空骨架
- DOM adapter 只负责读，不负责页面写入

## Context Rules

当前 `contextInfo` 规则：

- `taskId`
  优先 DOM 提取，其次退回 `subTaskId`
- `subTaskId`
  直接来自 SDK 查询参数
- `projectId`
  直接来自 `projectId/appId`
- `missionType`
  `label / check / null`
- `taskTitle`
  优先详情页头部文本

## Route Observer Rules

当前路由观察去重基于：

- `pathname`
- `search`
- `routeKey`

这样 `sdk` 在 pathname 不变但 `missionType / subTaskId / projectId` 变化时，仍会触发重新采集。

## Module Boundary

这些模块只能消费契约，不再复制定义：

- `page-detector.js`
- `route-observer.js`
- `page-state-collector.js`
- `annotation-*`
- `content.js`

如果要新增字段：

1. 先改 `site-contract.js`
2. 再改相关 consumer
3. 同步更新 `docs/alibaba-labelx-legacy-foundation-baseline.md`

