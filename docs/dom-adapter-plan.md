# DOM 适配层规划与首版落地结果

## 目的

本文件用于定义 `alibaba-labelx` 只读 DOM 适配层的职责、输入输出、边界和验证方式，并记录首版已落地的最小实现。

## 当前前置条件

当前已经具备：
- 页面规则真源 `site-contract.js`
- 页面识别层
- SPA 路由观察层
- 只读页面状态采集层

这意味着 DOM 适配层可以直接建立在：
- `pageType`
- `routeKey`
- `domSignals`
- `contextInfo`
- `pageTitle`

这些稳定输入之上。

结论：
- 当前前置地基已经够用。
- DOM 适配层已经完成首版落地，并已支撑站点上下文提取稳定化。

## DOM 适配层要做什么

- 提供统一的 DOM 查询入口。
- 针对 `task-list` 和 `task-detail` 提供只读元素探针。
- 输出稳定的只读适配结果结构。
- 与当前页面状态对象形成清晰衔接。

## DOM 适配层明确不做什么

- 不接入 fetch 拦截
- 不接入保存链路
- 不实现 DOM 写回
- 不实现自动提交、自动抢单、批处理
- 不实现文本填充、校验、AI 标点修复、音频控制

## 最终输入

DOM 适配层函数当前以 `SitePageState` 为主要输入：

```typescript
type SitePageState = {
  isTargetSite: boolean;
  hostname: string;
  pathname: string;
  pageType: string;
  routeKey: string;
  timestamp: string;
  pageTitle: string;
  domSignals: Record<string, boolean>;
  contextInfo: Record<string, string | null>;
};
```

## 最终输出

当前输出统一的只读适配结果：

```typescript
interface DomAdapterResult {
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

说明：
- `matched`
  表示当前页面是否命中了该适配器的最低识别条件。
- `elements`
  返回关键容器节点，但不做写回。
- `probes`
  返回更细粒度的只读布尔探针。
- `metadata`
  返回适配层额外提取到的只读元信息。

约束：
- `task-list` 与 `task-detail` 只允许字段值不同，不允许结构不同。
- `unknown` 或未命中页面必须返回完整空骨架。
- 不探测提交、保存、操作按钮等高风险节点。

## 当前落点

当前实现只扩展：
- `extension/sites/alibaba-labelx/`

当前实现方式：
- 由 `site-contract.js` 提供 DOM 适配结果空骨架与稳定字段名。
- 由 `page-state-collector.js` 内部建立统一 DOM 查询入口并暴露只读 DOM 适配 API。
- 由页面状态采集层消费 DOM 适配结果回填 `domSignals / contextInfo`。

约束：
- 不为了未来第二个平台预做新的通用站点框架。
- 只围绕当前 `alibaba-labelx` 单脚本迁移需要补最小可用适配层。
- 下一阶段不应再扩 DOM 适配层表面结构，而应优先稳定 collector 对其结果的消费方式。

## 与页面状态采集层的分工

页面状态采集层负责：
- 稳定页面状态对象
- 消费 DOM 适配结果并回填轻量 DOM 信号
- 消费 DOM 适配结果并回填轻量上下文提取
- 在不改 DOM 适配结果结构的前提下，对上下文字段应用固定优先级与去重约束

DOM 适配层负责：
- 更细粒度的元素定位
- 页面关键区域查询入口
- 为后续下游模块提供只读结构化结果

两者边界：
- DOM 适配层不应重新定义 `SitePageState`
- 页面状态采集层不应承担复杂 DOM 查询职责

## 验证要求

首版至少应验证：
- `task-list` 页面可以得到稳定的只读探针结果
- `task-detail` 页面可以得到稳定的只读探针结果
- 未命中页面时返回清晰的只读空结果，而不是抛异常
- Console 日志能区分状态采集结果与 DOM 适配结果

## 首版探针范围

`task-list` 当前探测：
- `mainContent`
- `pageContainer`
- `headerRegion`
- `primaryRegion`
- `secondaryRegion`
- `hasTaskRows`

`task-detail` 当前探测：
- `mainContent`
- `pageContainer`
- `headerRegion`
- `primaryRegion`
- `secondaryRegion`
- `taskTitle`
- `hasMetadataGroup`

## 当前已知风险

- 现有 selector 只经过首版整理，可靠性仍需通过真实页面验证。
- `task-detail` 的 `routeKey` 对 query/hash 场景仍可能继续细化。
- `content.js` 仍残留局部设置读取与 badge 注入，但这不阻塞只读 DOM 适配层首版落地。
- `metadata.taskId / taskTitle` 仍然依赖启发式 DOM 识别，后续只能在真实页面验证中小修。
- DOM 适配层本身当前不应再继续扩表面结构。

当前阶段判断：
- DOM 适配层本身已达到当前主线所需的“够用”标准。
- 下一步不应继续扩 DOM 适配层，而应转入 `content.js` 装配层继续收口。

