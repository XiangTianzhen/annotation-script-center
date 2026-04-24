# Edge 扩展独立迁移项目

当前目录本身就是新的、独立维护的 Edge 扩展项目根目录，不再是假定存在于旧工程中的嵌套子目录。

本项目当前目标是：
- 在 `extension/` 下持续建设可本地加载的 Manifest V3 扩展。
- 用 `docs/` 固化迁移边界、目录说明和协作规则。
- 把旧油猴脚本与旧服务端代码降级为参考资料，只用于迁移分析，不直接覆盖新结构。

## 当前状态

截至 2026-04-22，当前项目已经进入“完整迁移底座阶段”：
- `extension/` 已经包含一个可本地加载的 MV3 扩展底座，并覆盖真实 LabelX 路由识别与 page-world 注入槽位。
- `docs/` 中以 `docs/alibaba-labelx-legacy-foundation-baseline.md` 作为 legacy 功能矩阵、MV3 替代机制与模块边界真源。
- `legacy-reference/` 已经明确作为旧代码参考区存在。
- `alibaba-labelx` 已经具备页面契约层、页面识别层、SPA 路由观察层、只读页面状态采集层，以及 MAIN world / ISOLATED world 双链注入底座。
- 共享存储层已经被 background / options / popup 统一消费。

需要明确的是：
- 当前项目已经可以独立维护。
- 当前项目还不是功能完整的业务扩展。
- 当前地基已经达到“足够支撑单脚本迁移主线”的标准，不需要继续为了未来多平台无限抽象。

## 当前目录结构

```text
.
  README.md
  docs/
    agent-workflow.md
    current-architecture.md
    dom-adapter-plan.md
    edge-migration-plan.md
    extension-skeleton.md
    module-boundaries.md
    low-risk-migration-plan.md
    minimal-writeback-plan.md
    minimal-validity-toggle-plan.md
    read-only-feedback-plan.md
    read-only-validation-plan.md
    project-inventory.md
    site-state-contract.md
    context-fields-contract.md
    content-assembly-plan.md
    single-script-migration-roadmap.md
  extension/
    manifest.json
    background/
      service-worker.js
    icons/
      .gitkeep
    options/
      options.html
      options.js
    popup/
      popup.html
      popup.js
    shared/
      constants.js
      storage.js
    sites/
      alibaba-labelx/
        annotation-item-collector.js
        annotation-item-validator.js
        annotation-feedback.js
        annotation-item-writer.js
        content.js
        runtime-debug.js
        runtime-gate.js
        page-detector.js
        page-state-collector.js
        route-observer.js
        site-contract.js
  legacy-reference/
    asr-script.user.js
    server.js
```

## 目录边界

- `extension/`
  当前正式扩展代码根目录，也是 Edge 本地加载时应选择的目录。
- `extension/background/`
  扩展后台入口与初始化逻辑。
- `extension/shared/`
  扩展正式共享代码，当前包含常量和共享存储层。
- `extension/sites/`
  站点专属适配代码目录，当前只有 `alibaba-labelx`。
- `extension/options/`
  扩展正式设置页代码。
- `extension/popup/`
  扩展正式弹窗代码。
- `docs/`
  项目治理文档，不参与扩展运行，但必须持续维护。
- `legacy-reference/`
  旧代码参考区。当前其中的 `asr-script.user.js` 和 `server.js` 只用于对照迁移，不是新扩展运行目录，也不能直接整段复制覆盖到 `extension/`。

## 当前已具备什么

- MV3 `manifest.json`
- 一个最小 background service worker
- 一个最小 options 页面
- 一个最小 popup 页面
- 一个共享设置模型与共享存储 API
- 非站点消费者对共享层的统一消费
- 站点层唯一页面规则真源 `site-contract.js`
- 页面识别层
- SPA 路由观察层
- 只读页面状态采集层
- 只读 DOM 适配层
- `task-detail` item 级只读快照入口
- item 快照之上的只读校验辅助
- `AnnotationFeedbackSummary` 只读反馈消费层
- 单条 target textarea 最小本地写入
- 低副作用的只读存在感验证

## 当前仍未做什么

- validity 切换
- fetch 拦截
- 保存链路
- 自动提交、自动抢单、批处理
- 完整文本写回能力
- AI 标点修复
- 音频控制
- 排行榜与服务端对接迁移

## 当前仍有的小毛刺

- `content.js` 仍然不是绝对纯壳，但当前已经只承担运行时装配；局部设置读取与 badge/debug/runtime 辅助都已外移到站点内 helper。
- content script 运行时仍未接入 `extension/shared/storage.js`，当前仍由站点内 helper 负责最小启用门禁。
- `task-detail` 的 `routeKey` 对 query/hash 场景仍可能继续细化。
- DOM 适配层首版已经接入，但 selector 可靠性仍需要继续在真实页面上验证。
- `page-state-collector.js` 当前已经通过 DOM 适配结果回填 `domSignals / contextInfo`，后续仍可继续收紧提取来源。
- `page-state-collector.js` 当前已经固定 `taskId / taskTitle / domSignals / contextInfo` 的主要来源与优先级，并已支持同一路由下的上下文签名变化采集。
- `content.js` 仍然保留 iframe 守卫、依赖检查、目标站点门禁、observer/stateCollector 初始化顺序和启动时机。
- 下一步如果继续推进，应沿最小写入主线继续补齐第二个最小写入口，而不是回头重做本轮已收口的 helper 边界。
- 单条 textarea 最小本地写入已经落地，下一步最自然的是进入“单条 validity 最小切换（不保存）”。

## 哪些地基已经够了

对于“先把当前这一支单脚本迁进扩展”这个目标，下面这些地基已经够用：
- 共享设置模型与共享存储层
- 非站点消费者对共享层的统一消费
- `alibaba-labelx` 页面规则真源
- 页面识别与 SPA 路由观察
- 只读页面状态采集
- 站点层页面模型、字段名与状态对象契约

这些部分现在应视为：
- 够用即可
- 继续只做小修，不再优先扩成“未来多脚本中心”的大地基

## 哪些地基现在可以暂时不做

当前不应优先继续投入：
- 为未来第二个平台提前设计更复杂的平台注册中心
- 进一步拆分共享层，只为了抽象而抽象
- 提前把 `content.js` 完全做成纯壳
- 为 query/hash 的全部边缘场景预先做完整路由体系
- 任何服务端客户端化、排行榜、词库同步前置抽象

这些都不是“当前单脚本迁移主线”前的必要条件。

## 当前下一阶段

从现在开始，应切入单脚本迁移主线。

当前已经完成的第一阶段是：
- 只读 DOM 适配层

当前已经完成的第二阶段是：
- 站点上下文提取稳定化

当前已经完成的第三阶段是：
- `content.js` 装配层继续收口

这一步当前已完成：
- 在站点目录内外移局部设置读取与启用门禁
- 外移 badge 注入与 runtime debug 暴露
- 把 `content.js` 收紧为更明确的运行时装配入口，并只负责把已独立的 observer / collector / item 辅助模块接线到运行时

下一步最自然的第一刀应是：
- 中风险业务能力迁移的最小入口
- 下一轮优先聚焦“单条 validity 最小切换（不保存）”
- 仅允许单条 item、单次目标值切换，不进入提交、保存、fetch 拦截或自动化动作

已完成的 DOM 适配层当前只覆盖：
- 统一的 DOM 查询入口
- `task-list / task-detail` 的低风险结构性探针
- 稳定的只读适配结果结构
- 与当前页面状态对象的稳定衔接

主线阶段图见 `docs/single-script-migration-roadmap.md`。
详细边界见 `docs/dom-adapter-plan.md`、`docs/site-state-contract.md`、`docs/context-fields-contract.md`、`docs/content-assembly-plan.md`、`docs/module-boundaries.md`、`docs/low-risk-migration-plan.md`、`docs/read-only-validation-plan.md`、`docs/read-only-feedback-plan.md`、`docs/minimal-writeback-plan.md`、`docs/minimal-validity-toggle-plan.md`。

## 如何在 Edge 中本地加载

1. 打开 `edge://extensions/`
2. 开启右上角“开发人员模式”
3. 点击“加载解压缩的扩展”
4. 选择当前项目根目录下的 `extension/`
5. 确认扩展名称显示为 `Ali ASR Edge`

## 迁移基本原则

- 当前项目根目录就是唯一基准，所有路径说明优先使用相对路径。
- 每一轮先更新 `docs/`，再做对应代码变更。
- 旧代码只作为参考实现，不直接整段复制。
- 优先迁移低副作用、只读能力。
- 先建立模块边界，再迁移具体逻辑。
- 每一轮只交付一个可验证的小增量。
