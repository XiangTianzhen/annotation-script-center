# 模块边界与下一阶段约束

## 目的

本文件用于固定当前实际代码边界，并给下一阶段执行 Agent 提供稳定的写入范围和交付契约。

## 当前已核对的代码现状

当前 `alibaba-labelx` 站点模块已包含：
- `site-contract.js`
- `page-detector.js`
- `route-observer.js`
- `page-state-collector.js`
- `annotation-item-collector.js`
- `annotation-item-validator.js`
- `annotation-feedback.js`
- `annotation-item-writer.js`
- `annotation-validity-writer.js`
- `annotation-text-pipeline.js`
- `annotation-quickfill-runner.js`
- `annotation-apply-runner.js`
- `annotation-apply-policy.js`
- `annotation-policy-executor.js`
- `annotation-page-plan-preview.js`
- `annotation-page-report.js`
- `annotation-page-apply-runner.js`
- `annotation-save-runner.js`
- `annotation-submit-runner.js`
- `annotation-page-flow-runner.js`
- `annotation-flow-report.js`
- `annotation-control-panel.js`
- `annotation-action-history.js`
- `annotation-debug-snapshot.js`
- `runtime-gate.js`
- `runtime-debug.js`
- `content.js`

当前 `manifest.json` 的 content scripts 装配顺序为：
1. `sites/alibaba-labelx/site-contract.js`
2. `sites/alibaba-labelx/page-detector.js`
3. `sites/alibaba-labelx/route-observer.js`
4. `sites/alibaba-labelx/page-state-collector.js`
5. `sites/alibaba-labelx/annotation-item-collector.js`
6. `sites/alibaba-labelx/annotation-item-validator.js`
7. `sites/alibaba-labelx/annotation-feedback.js`
8. `sites/alibaba-labelx/annotation-item-writer.js`
9. `sites/alibaba-labelx/annotation-validity-writer.js`
10. `sites/alibaba-labelx/annotation-text-pipeline.js`
11. `sites/alibaba-labelx/annotation-quickfill-runner.js`
12. `sites/alibaba-labelx/annotation-apply-runner.js`
13. `sites/alibaba-labelx/annotation-apply-policy.js`
14. `sites/alibaba-labelx/annotation-policy-executor.js`
15. `sites/alibaba-labelx/annotation-page-plan-preview.js`
16. `sites/alibaba-labelx/annotation-page-report.js`
17. `sites/alibaba-labelx/annotation-page-apply-runner.js`
18. `sites/alibaba-labelx/annotation-save-runner.js`
19. `sites/alibaba-labelx/annotation-submit-runner.js`
20. `sites/alibaba-labelx/annotation-page-flow-runner.js`
21. `sites/alibaba-labelx/annotation-flow-report.js`
22. `sites/alibaba-labelx/annotation-control-panel.js`
23. `sites/alibaba-labelx/annotation-action-history.js`
24. `sites/alibaba-labelx/annotation-debug-snapshot.js`
25. `sites/alibaba-labelx/runtime-gate.js`
26. `sites/alibaba-labelx/runtime-debug.js`
27. `sites/alibaba-labelx/content.js`

当前准确判断：
- 页面规则真源已独立。
- 页面识别层已独立。
- 路由观察层已独立。
- 页面状态采集层已独立。
- 只读 DOM 适配层已在站点层内建立。
- item 级只读快照已在站点层内独立。
- item 级只读校验结果已在站点层内独立。
- item 级只读反馈摘要已在站点层内独立。
- item 级最小写回入口已在站点层内独立。
- item 级最小 validity 切换入口已在站点层内独立。
- item 级单条快速填入入口已在站点层内独立。
- item 级单条受控操作编排入口已在站点层内独立。
- item 级单条业务策略入口已在站点层内独立。
- writer 已改为优先复用 collector 暴露的只读 item / textarea 定位入口。
- validity writer 应优先复用 collector 暴露的只读 item / validity 定位入口。
- quickfill runner 应优先复用 collector 暴露的 item 快照与 annotation-item-writer 的本地写入入口。
- apply runner 应优先复用 collector、quickfill runner、validity writer、validator 与 feedback 的现有入口，不在编排层重建第二套规则。
- apply policy 应优先复用 collector、validator、feedback 与 annotation-text-pipeline 的现有结果，不在策略层直接调用 writer 或 validity writer。
- policy executor 应优先复用 apply policy、apply runner、collector、validator 与 feedback 的现有入口，不在执行助手层重建第二套策略、DOM 读取或写入逻辑。
- page plan preview 应优先复用 annotation-item-collector 与 annotation-apply-policy 的现有入口，不在预览层重建第二套 item 读取、校验或策略规则，也不自动调用 executor。
- page report 应只消费既有执行结果对象，并以真实 `annotation-page-apply-runner.js` 输出对象作为主输入；只有该主输入不存在时，才降级兼容单条 executor 结果或结果数组；它不在报告层调用 executor、apply runner 或任何写入逻辑。
- page apply runner 应优先复用 annotation-page-plan-preview 与 annotation-policy-executor 的现有入口，并直接消费 executor 已回读的 `feedbackAfter`；它不在整页执行层重建第二套 plan 生成、单条执行或反馈规则，也不联动保存、提交、重试或并发。
- save runner 应优先复用 `site-contract.js` 中的保存入口 selector 真源，以及现有 page-state / dom-adapter 入口；它不在保存触发层重建第二套页面规则，只负责单次 click 与单次辅助回读。
- submit runner 应优先复用 `site-contract.js` 中的提交入口 selector 真源，以及现有 page-state / dom-adapter / validator / feedback 入口；其中 `validator / feedback` 仅用于本地门禁辅助，不得冒充提交结果。
- page flow runner 应优先复用 `annotation-page-apply-runner.js`、`annotation-page-report.js`、`annotation-save-runner.js` 与 `annotation-submit-runner.js` 的现有入口，只负责单页顺序编排与统一结果收口；它不重写 apply/save/submit runner，不做自动重试、自动循环、并发执行、批处理或 fetch 拦截。
- flow report 应只消费 `annotation-page-flow-runner.js` 的真实输出对象，负责稳定的流程级人工摘要、阶段汇总和语义警告；它不调用任何执行入口，不写页面，不做任何保存、提交或自动化动作。
- control panel 应只复用现有 `annotation-page-plan-preview.js`、`annotation-page-apply-runner.js`、`annotation-page-report.js`、`annotation-save-runner.js`、`annotation-submit-runner.js`、`annotation-page-flow-runner.js` 与 `annotation-flow-report.js` 的入口，把它们暴露为手动按钮与只读结果区；它不新增业务链路，不自动执行，不做轮询，也不替换 runtime debug。
- action history 应只提供纯内存级最近记录缓冲与文本导出，输入仅来自外部显式调用；它不自动记录所有动作，不提供 UI，不做持久化，也不改变现有 runner / report 的任何行为。
- debug snapshot 应只负责汇总当前 runtime 可拿到的页面状态、control panel 状态、history 记录、flow report 摘要与 runtime 入口清单，并输出适合贴进联调缺陷记录的只读快照；它不执行任何 runner，不写页面，不做自动化。
- 站点运行时设置门禁已从 `content.js` 外移。
- badge / runtime debug 辅助已从 `content.js` 外移。
- 共享存储层与非站点消费者收口已基本完成。
- `content.js` 已进一步收敛为站点运行时装配入口；后续新增的 item 快照、校验、反馈、最小写回、page flow runner、flow report 与 control panel 都只通过装配接线暴露，不把逻辑回塞进 `content.js`。

## 当前共享边界

共享层：
- `extension/shared/constants.js`
- `extension/shared/storage.js`

非站点消费者：
- `extension/background/service-worker.js`
- `extension/options/options.js`
- `extension/popup/popup.js`

站点层：
- `extension/sites/alibaba-labelx/site-contract.js`
- `extension/sites/alibaba-labelx/page-detector.js`
- `extension/sites/alibaba-labelx/route-observer.js`
- `extension/sites/alibaba-labelx/page-state-collector.js`
- `extension/sites/alibaba-labelx/annotation-item-collector.js`
- `extension/sites/alibaba-labelx/annotation-item-validator.js`
- `extension/sites/alibaba-labelx/annotation-feedback.js`
- `extension/sites/alibaba-labelx/annotation-item-writer.js`
- `extension/sites/alibaba-labelx/annotation-validity-writer.js`
- `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
- `extension/sites/alibaba-labelx/annotation-quickfill-runner.js`
- `extension/sites/alibaba-labelx/annotation-apply-runner.js`
- `extension/sites/alibaba-labelx/annotation-apply-policy.js`
- `extension/sites/alibaba-labelx/annotation-policy-executor.js`
- `extension/sites/alibaba-labelx/annotation-page-plan-preview.js`
- `extension/sites/alibaba-labelx/annotation-page-report.js`
- `extension/sites/alibaba-labelx/annotation-page-apply-runner.js`
- `extension/sites/alibaba-labelx/annotation-save-runner.js`
- `extension/sites/alibaba-labelx/annotation-submit-runner.js`
- `extension/sites/alibaba-labelx/annotation-page-flow-runner.js`
- `extension/sites/alibaba-labelx/annotation-flow-report.js`
- `extension/sites/alibaba-labelx/annotation-control-panel.js`
- `extension/sites/alibaba-labelx/annotation-action-history.js`
- `extension/sites/alibaba-labelx/annotation-debug-snapshot.js`
- `extension/sites/alibaba-labelx/runtime-gate.js`
- `extension/sites/alibaba-labelx/runtime-debug.js`
- `extension/sites/alibaba-labelx/content.js`

## 当前已知小毛刺

- 当前 content script 运行时尚未装配 `extension/shared/storage.js`，站点启用门禁仍由 `runtime-gate.js` 在站点层内部负责。
- `task-detail` 的 `routeKey` 对 query/hash 场景仍可能继续细化。
- `domSignals / contextInfo` 虽已稳定字段名，但 selector 可靠性仍需在 DOM 适配层验证。
- 当前站点运行时设置门禁仍未直接消费 shared 存储层。
- item 级只读快照当前只覆盖 `task-detail` 首轮稳定字段，不处理写回或保存链。
- 只读校验结果当前只覆盖首轮问题识别，不处理高亮、滚动、保存或提交联动。
- 只读反馈摘要当前只覆盖 console/runtime debug 消费，不处理复杂 UI。
- 最小写回当前只覆盖单条 textarea 本地写入，不处理 validity、保存或批处理。
- 首轮 validity 切换只应覆盖“未选 -> 显式目标值”的本地切换，不处理已选覆盖、保存或批处理。
- 首轮 quickfill 只应覆盖“单条 item -> 最小纯文本生成 -> 本地写入”的局部流程，不处理 validity 联动、保存或批处理。
- 首轮 apply runner 只应覆盖“显式决定是否 quickfill / 是否切 validity -> 调用已有模块 -> 显式回读”的局部编排，不处理保存、提交或自动修复。
- 首轮 apply policy 只应覆盖“单条当前快照 + 当前校验结果 -> 建议动作计划”的保守策略输出，不处理实际执行、保存、提交或整页自动推断。
- 首轮 policy executor 只应覆盖“单条计划 -> 单条显式执行 -> 单条显式回读”的局部执行助手能力，不处理重试、批量执行、整页自动应用或保存链。
- 首轮 page plan preview 只应覆盖“整页 item 快照 -> 逐条 plan 汇总 -> 只读摘要”的局部预览能力，不处理单条执行、批量执行、保存链或任何自动化动作。
- 首轮 page report 只应覆盖“消费真实整页执行结果对象 -> 输出稳定页面级摘要与逐条文本”的局部报告能力，不处理执行、保存、提交或自动化动作。
- 首轮 page apply runner 只应覆盖“整页只读预览 -> 顺序执行已有单条计划 -> 显式回读汇总”的受控执行能力，不处理保存、提交、自动重试、并发执行、滚动、高亮或任何站点外批处理。
- 首轮 save runner 只应覆盖“task-detail 页面保存入口定位 -> 单次本地点击 -> 单次辅助回读”的最小保存触发能力，不处理提交、fetch、自动重试、批处理、自动滚动或自动化动作。
- 首轮 submit runner 只应覆盖“task-detail 页面提交入口定位 -> validator / feedback 本地门禁辅助 -> 单次本地点击 -> 单次辅助回读”的最小提交触发能力，不处理自动保存、完整提交链、fetch、自动重试、批处理、自动滚动或自动化动作。
- 首轮 page flow runner 只应覆盖“task-detail 页面 apply -> save -> submit 的单页完整受控流程编排”，并且必须以现有 runner 的本地返回结果作为唯一推进依据；它不处理自动化动作、自动重试、并发整页执行、多页面批处理、fetch 拦截、服务端成功确认、UI 面板、自动滚动或自动高亮。
- 首轮 flow report 只应覆盖“消费单页完整受控流程真实输出 -> 生成稳定流程级摘要、阶段文本与语义警告”的验收支撑能力，不处理执行、保存、提交、fetch、自动重试、页面 UI、自动滚动或任何自动化动作。
- 首轮 control panel 只应覆盖“页面内轻量手动入口 + 最近一次结果只读展示”的操作面板能力，不处理自动执行、自动保存、自动提交、自动批处理、自动滚动、自动高亮、拖拽、主题系统或任何新的业务 runner。
- 首轮 action history 只应覆盖“最近 N 条显式传入结果对象的内存缓冲 + 读取 / 清空 / 文本导出”，不处理页面 UI、持久化、自动记录、自动执行或任何新的业务链路。
- 首轮 debug snapshot 只应覆盖“汇总当前 runtime 可拿到的关键联调信息 + 输出一份适合贴进缺陷记录的文本快照”，不处理业务执行、页面 UI、自动记录、持久化或任何新的业务链路。

## 最近操作历史缓冲与导出（首版）

当前阶段的轻量增强允许新增：
- 一个纯内存的 `annotation-action-history.js`
- 一个最小的 runtime debug 暴露入口

当前阶段明确不允许：
- 改 `content.js`
- 改 `manifest.json`
- 改已有 runner / report 的内部逻辑
- 自动采集所有动作
- 页面 UI 或持久化

为什么它仍然只是轻量增强：
- 它不执行任何现有能力
- 它只缓存显式传入结果
- 它只服务于人工调试、人工留痕与纯文本导出

这些问题不阻塞当前进入“真实 Edge 页面联调收尾”的只读支撑层。

## 当前地基停止线

站在“尽快把当前单脚本迁进扩展”的目标上，下面这些部分已经够用：
- 共享存储层
- 非站点消费者统一消费
- 站点契约真源
- 页面识别层
- 路由观察层
- 页面状态采集层

因此下一阶段不应再把重点放在：
- 为未来第二个平台预抽象更复杂基础设施
- 为未来多脚本中心预建设点框架
- 在没有迁移压力前继续重构共享层或装配层

## 当前阶段定位

当前阶段是：
- 联调缺陷记录与修复支撑（首版）

前提：
- `content.js` 已收紧为更清晰的运行时装配入口。
- 站点内 helper 已承接局部设置门禁与 badge/debug/runtime 辅助。
- `task-detail` item 级只读快照入口已建立。
- item 快照之上的只读校验结果已建立。
- item 级只读反馈摘要与调试输出已建立。
- 单条 textarea 最小本地写回已建立。
- 单条 validity 最小切换已建立。
- 单条快速填入已建立。
- 单条受控操作编排已建立。
- 单条业务策略层已建立。
- 单条策略执行助手已建立。
- 整页只读计划预览器已建立。
- 整页受控执行器已建立。
- 单页最小保存触发器已建立。
- 单页最小提交触发器已建立。
- 单页完整受控流程编排已建立。
- 总验收支撑层已建立。

当前阶段的首轮切口：
- 新增联调缺陷记录文档
- 新增只读 debug snapshot 导出模块
- 让 control panel、action history、flow report 与 debug snapshot 可以配合做问题记录
- 继续保持 `content.js` 只做最小装配，不把联调逻辑回塞进入口文件

## 为什么保持单任务更稳

- 现有主线能力已经齐了，当前主要缺的是“如何在真实页面稳定复现、解释和留档问题”
- control panel、history、flow report 与 runtime debug 已经接近可用，只差一个统一的只读快照导出与联调记录模板
- 如果继续扩业务，会把联调发现的问题和主链增强混在一起，增加不必要的判断噪音

因此当前更合理的是：
- 保持单任务推进，并一次形成“缺陷记录模板 + 只读调试快照”的闭环

## 下一阶段任务边界

允许修改：
- `README.md`
- `docs/architecture/current-architecture.md`
- `docs/archive/edge-migration-plan.md`
- `docs/` 下的 `extension-skeleton.md`
- `docs/architecture/module-boundaries.md`
- `docs/architecture/site-state-contract.md`
- `docs/dom-adapter-plan.md`
- `docs/archive/content-assembly-plan.md`
- `extension/sites/alibaba-labelx/**`
- 如确有必要，可最小修改 `extension/manifest.json`

禁止触碰：
- `extension/shared/**`
- `extension/background/**`
- `extension/options/**`
- `extension/popup/**`
- `legacy-reference/**`
- fetch 拦截
- 保存链路
- 自动提交、自动抢单、批处理
- 文本填充、校验、AI 标点修复、音频控制

交付重点：
- 保持页面规则、状态对象、DOM 适配结果与 collector 行为不变
- 保持现有只读链路可继续使用
- 在 `task-detail` 页面上形成稳定的单页最小提交触发入口
- 保持 submit runner 与现有 save / apply / page-apply / report 分层不变
- 只复用现有站点契约与页面状态入口，不重建第二套页面规则
- 不把 item 定位能力扩成未来通用 DOM 框架
- 不把提交触发结果联动到自动化入口或完整提交链

## 当前阶段后的自然下一步

完成单页完整受控流程编排后，最自然的下一步才是继续评估：
- 是否进入更接近完整快速填入的中风险业务迁移

高风险链路仍应最后迁移。


