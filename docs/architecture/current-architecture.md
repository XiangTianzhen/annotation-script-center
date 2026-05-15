# 当前架构边界

## 当前项目根边界

当前项目根目录就是本独立项目本身。

当前一级目录关系如下：
- `docs/` 负责项目治理与迁移说明。
- `extension/` 负责正式扩展运行代码。
- `legacy-reference/` 负责旧代码参考资料。

因此当前关系不是：
- `docs/`、`extension/`、`shared/`、`sites/`、`background/`、`options/`、`popup/` 同级并列。

而是：
- `background/`、`shared/`、`sites/`、`options/`、`popup/` 都位于 `extension/` 内部。

## 当前正式代码结构

```text
extension/
  manifest.json
  background/service-worker.js
  shared/constants.js
  shared/storage.js
  sites/alibaba-labelx/
    site-contract.js
    page-detector.js
    route-observer.js
    page-state-collector.js
    annotation-item-collector.js
    annotation-item-validator.js
    annotation-feedback.js
    annotation-item-writer.js
    annotation-validity-writer.js
    annotation-text-pipeline.js
    annotation-quickfill-runner.js
    annotation-apply-runner.js
    annotation-apply-policy.js
    annotation-policy-executor.js
    annotation-page-plan-preview.js
    annotation-page-report.js
    annotation-page-apply-runner.js
    annotation-save-runner.js
    annotation-submit-runner.js
    annotation-page-flow-runner.js
    annotation-flow-report.js
    annotation-control-panel.js
    annotation-action-history.js
    annotation-debug-snapshot.js
    runtime-gate.js
    runtime-debug.js
    content.js
  options/options.html
  options/options.js
  popup/popup.html
  popup/popup.js
```

正式代码职责划分：
- `extension/background/`
  负责扩展安装/启动时的初始化。
- `extension/shared/`
  负责共享常量和共享存储层。
- `extension/sites/alibaba-labelx/site-contract.js`
  负责页面规则真源、`routeKey` 规则、稳定字段结构、DOM 适配结果骨架、保存入口 selector 真源、提交入口 selector 真源与基础页面状态装配。
- `extension/sites/alibaba-labelx/page-detector.js`
  负责页面识别，只消费站点契约。
- `extension/sites/alibaba-labelx/route-observer.js`
  负责 SPA 路由观察，只消费站点契约。
- `extension/sites/alibaba-labelx/page-state-collector.js`
  负责只读 DOM 适配结果采集，并围绕站点契约把适配结果回填为页面状态。
- `extension/sites/alibaba-labelx/annotation-item-collector.js`
  负责在 `task-detail` 页面生成 item 级只读快照，输出源文本、目标文本框存在性、当前目标文本与当前有效性，并复用同一套规则提供只读 item / textarea 定位入口。
- `extension/sites/alibaba-labelx/annotation-item-validator.js`
  负责消费 item 级只读快照并返回稳定的只读校验结果，不修改页面、不接保存链路。
- `extension/sites/alibaba-labelx/annotation-feedback.js`
  负责消费现有只读校验结果并映射为人工可消费的反馈摘要与调试输出，不重新实现校验规则。
- `extension/sites/alibaba-labelx/annotation-item-writer.js`
  负责在 `task-detail` 页面按 `itemIndex` 命中单条 item 的目标 textarea，基于 collector 的只读定位结果执行最小本地写入并返回稳定结果，不联动保存或提交。
- `extension/sites/alibaba-labelx/annotation-validity-writer.js`
  负责在 `task-detail` 页面按 `itemIndex` 命中单条 item 的 validity 控件，仅在当前 `selectedValidity === null` 时切换到显式目标值，并以显式回读确认切换结果，不联动保存或提交。
- `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
  负责首轮快速填入所需的最小纯文本处理规则，输入源文本，输出可解释的本地生成文本，不接保存、提交或自动化逻辑。
- `extension/sites/alibaba-labelx/annotation-quickfill-runner.js`
  负责在 `task-detail` 页面按 `itemIndex` 读取单条 item 的 `sourceText`，通过纯文本规则生成 `targetText`，再调用现有 textarea writer 执行本地写入，不联动 validity、保存或提交。
- `extension/sites/alibaba-labelx/annotation-apply-runner.js`
  负责在 `task-detail` 页面按显式输入编排已有单条能力：可选执行 quickfill、可选执行 validity 最小切换，并显式回读 collector / validator / feedback 形成统一结果；它不重建 DOM 读取、文本规则或写入逻辑，也不联动保存或提交。
- `extension/sites/alibaba-labelx/annotation-apply-policy.js`
  负责在 `task-detail` 页面基于单条 item 当前快照、当前校验结果与现有 quickfill 文本规则，生成保守、可解释的“建议动作计划”；它只输出 `suggestedApplyInput` 供 apply runner 显式消费，不直接执行写入或切换。
- `extension/sites/alibaba-labelx/annotation-policy-executor.js`
  负责在 `task-detail` 页面按单条 `itemIndex` 先调用现有 apply policy 生成计划；仅当计划可安全执行且存在 `suggestedApplyInput` 时，才显式调用现有 apply runner，再显式回读 collector / validator / feedback；它不重写策略、不重写执行逻辑，也不联动保存或提交。
- `extension/sites/alibaba-labelx/annotation-page-plan-preview.js`
  负责在 `task-detail` 页面收集当前页 item 快照，并对每个 item 显式调用现有 apply policy 生成整页只读计划预览；它只汇总整页 plan 结果与预览摘要，不执行 apply runner，不写入 textarea，也不切换 validity。
- `extension/sites/alibaba-labelx/annotation-page-report.js`
  负责优先消费现有 `annotation-page-apply-runner.js` 的真实整页执行结果对象，并兼容单条执行结果、执行结果数组或其他整页结果容器对象，生成稳定、可读的页面级执行结果报告摘要；它不调用任何执行入口，不写页面，也不联动保存或提交。
- `extension/sites/alibaba-labelx/annotation-page-apply-runner.js`
  负责在 `task-detail` 页面先调用现有 page plan preview 获取整页计划，再按受控顺序逐条调用现有 policy executor 执行单条计划，并汇总整页执行结果与执行后反馈；它不重写整页计划、不直接调用 apply runner、不保存、不提交，也不做重试或并发执行。
- `extension/sites/alibaba-labelx/annotation-save-runner.js`
  负责在 `task-detail` 页面基于 `site-contract.js` 中的保存入口 selector 真源定位当前保存控件，并在满足最小条件时只触发一次本地保存点击；它只返回保存触发结果与前后控件只读信息，不提交、不重试、不批处理，也不把 `clicked` 伪装成“已保存完成”。
- `extension/sites/alibaba-labelx/annotation-submit-runner.js`
  负责在 `task-detail` 页面基于 `site-contract.js` 中的提交入口 selector 真源定位当前提交控件，并在最小门禁通过时只触发一次本地提交 click；它只返回提交触发结果、提交前校验/反馈门禁信息与控件前后只读信息，不自动保存、不自动重试、不批处理，也不把 `clicked` 伪装成“已提交完成”。
- `extension/sites/alibaba-labelx/annotation-page-flow-runner.js`
  负责在 `task-detail` 页面编排“apply -> save -> submit”这一条单页完整受控流程：先复用现有 `annotation-page-apply-runner.js`，仅当 apply 结果里存在实际执行项时才允许尝试 save，再仅当 `annotation-save-runner.js` 返回允许继续的本地结果时才允许尝试 submit；它显式返回统一流程结果，但不自动重试、不并发、不批处理、不做 fetch 拦截，也不把 `completed` 或 `clicked` 伪装成“服务端已完成”。
- `extension/sites/alibaba-labelx/annotation-flow-report.js`
  负责只读消费现有 `annotation-page-flow-runner.js` 的真实输出对象，并生成稳定的流程级验收摘要、分阶段文本与风险警告；它不执行任何动作、不写页面、不补做保存或提交，也不创建第二套 flow runner。
- `extension/sites/alibaba-labelx/annotation-control-panel.js`
  负责在页面内提供一个轻量、手动触发的操作面板，把现有 `annotation-page-plan-preview.js`、`annotation-page-apply-runner.js`、`annotation-page-report.js`、`annotation-save-runner.js`、`annotation-submit-runner.js`、`annotation-page-flow-runner.js` 与 `annotation-flow-report.js` 暴露为可点击入口；它只更新本地面板状态与只读结果区，不自动执行任何动作，不新增业务链路，也不替换现有 runtime debug 体系。
- `extension/sites/alibaba-labelx/annotation-action-history.js`
  负责提供纯内存级的最近操作历史缓冲：它只接收外部显式传入的 `actionName / result`，按固定上限缓存最近记录，并暴露 `push / list / clear / exportText`；它不自动采集页面动作，不做持久化，不提供 UI，也不新增任何业务执行能力。
- `extension/sites/alibaba-labelx/annotation-debug-snapshot.js`
  负责汇总当前 runtime 可拿到的关键联调信息，并输出适合粘贴到缺陷记录里的只读调试快照；它只读取 page state、control panel、history 与 flow report 相关摘要，不执行任何业务动作，不写页面，也不新增业务链路。
- `extension/sites/alibaba-labelx/runtime-gate.js`
  负责站点运行时的最小设置读取与平台启用门禁。
- `extension/sites/alibaba-labelx/runtime-debug.js`
  负责调试 badge 注入与最小 runtime 调试对象暴露，包括 item 快照、只读校验结果、反馈摘要、最小写回入口、validity 最小切换入口、quickfill 入口、apply runner 入口、apply policy 入口、policy executor 入口、page plan preview 入口、page report 入口、page apply runner 入口、save runner 入口、submit runner 入口、page flow runner 入口、flow report 入口、control panel 入口、action history 入口与 debug snapshot 入口。
- `extension/sites/alibaba-labelx/content.js`
  当前是站点入口文件，只负责 iframe 守卫、依赖检查、目标站点门禁、初始化顺序与启动时机，并把已独立的 observer / collector / item 级 helper 接线到运行时；即使新增 page flow runner、flow report 或 control panel，也只做最小装配，不内嵌面板逻辑或流程逻辑。
- `extension/options/`
  负责设置页。
- `extension/popup/`
  负责扩展弹窗。

## 当前参考代码结构

```text
legacy-reference/
  asr-script.user.js
  server.js
```

参考代码职责：
- `legacy-reference/asr-script.user.js`
  旧油猴实现参考。
- `legacy-reference/server.js`
  旧服务端实现参考。

约束：
- 参考代码只能用于理解旧逻辑、旧接口和迁移拆分点。
- 参考代码不能直接整段复制覆盖到 `extension/`。
- 参考代码不属于当前扩展运行时装配的一部分。

## 已核对的当前代码事实

本轮实际检查结果：
- 页面类型规则已经有唯一真源，位于 `site-contract.js`。
- 页面状态对象字段名已经统一为 `isTargetSite / hostname / pathname / pageType / routeKey / timestamp / pageTitle / domSignals / contextInfo`。
- DOM 适配结果字段名已经统一为 `elements / probes / metadata / matched`，并由 `site-contract.js` 提供空结果骨架。
- item 级只读快照已独立于 `SitePageState`，不再把 item 级字段硬塞回页面状态对象。
- item 级只读校验结果已独立于 `SitePageState`，不把校验问题回写到页面状态对象。
- item 级反馈摘要已独立于 `SitePageState`，只消费 `AnnotationValidationResult`，不回写页面状态对象。
- item 级最小写回结果已独立于 `SitePageState`，只描述本地写入结果，不表示保存或提交。
- item 级 validity 最小切换结果已独立于 `SitePageState`，只描述本地切换结果，不表示保存或提交。
- item 级快速填入结果已独立于 `SitePageState`，只描述本地生成与本地写入结果，不表示保存或提交。
- item 级受控操作编排结果已独立于 `SitePageState`，只描述单条本地操作链及其显式回读结果，不表示保存或提交。
- item 级业务策略结果已独立于 `SitePageState`，只描述单条建议动作计划，不触发本地写入、切换、保存或提交。
- item 级策略执行助手结果已独立于 `SitePageState`，只描述单条计划是否可执行、是否已显式执行以及执行后的显式回读结果，不表示保存或提交。
- 整页计划预览结果已独立于 `SitePageState`，只描述整页 plan 汇总与预览摘要，不触发单条或整页执行。
- 整页执行结果报告已独立于 `SitePageState`，主输入是 `annotation-page-apply-runner.js` 的真实整页执行结果对象；它只消费现有执行结果并输出页面级摘要文本，不触发任何执行。
- 整页受控执行结果已独立于 `SitePageState`，只描述整页受控执行汇总、逐条执行结果与执行后显式反馈，不表示保存或提交。
- 单页最小保存触发结果已独立于 `SitePageState`，只描述当前保存入口本地是否可点、是否已派发点击以及点击前后的控件只读状态；`clicked` 不表示已保存完成。
- 单页最小提交触发结果已独立于 `SitePageState`，只描述当前提交入口本地是否允许点击、是否已派发点击、点击前校验/反馈门禁信息与点击前后的控件只读状态；`clicked` 不表示已提交完成，`validationBefore / feedbackBefore` 也不是提交结果。
- 单页完整受控流程结果已独立于 `SitePageState`，只描述单页 `apply -> save -> submit` 本地编排的阶段结果、停止位置与本地 runner 原始结果；其中 `completed` 只表示“本地受控流程已经跑完并给出明确阶段结果”，不表示服务端保存或提交已经完成。
- 流程级验收报告结果已独立于 `SitePageState`，只描述单页完整受控流程的人工可读摘要、阶段汇总与风险警告；它只解释已有 flow 输出，不追加任何新动作，也不把本地结果升级成服务端完成结论。
- 轻量操作面板状态已独立于 `SitePageState`，只维护 `visible / lastAction / lastSummary / lastResult` 这类本地展示状态；它只把现有能力变成页面内手动入口，不新增保存、提交、fetch 或自动化能力。
- 最近操作历史缓冲结果已独立于 `SitePageState`，只描述显式传入的 `actionName / result` 历史记录；它只提供内存级缓冲与文本导出，不自动采集任何动作，也不把历史缓冲升级成新的执行链路。
- 联调调试快照结果已独立于 `SitePageState`，只汇总当前 runtime 可拿到的页面状态、control panel 状态、history 记录、flow report 摘要与 runtime 入口清单；它只服务于真实页面问题记录，不执行任何动作，也不把本地状态升级成服务端结论。
- writer 已改为优先复用 collector 的 item / textarea 只读定位结果，不再在 writer 内单独维护第二套定位规则。
- validity writer 应优先复用 collector 暴露的 item / validity 只读定位结果，不在 writer 内维护第二套 validity 控件命中规则。
- quickfill runner 应优先复用 collector 暴露的 item 快照和 annotation-item-writer 的本地写入入口，不在 runner 内维护第二套 item / textarea 定位规则。
- apply policy 应优先复用 collector、validator、feedback 与 annotation-text-pipeline 的现有结果，并把输出收敛为单条 `suggestedApplyInput`，不在策略层直接调用 writer。
- policy executor 应优先复用 apply policy、apply runner、collector、validator 与 feedback 的现有入口，不在执行助手层重建第二套策略、DOM 读取或写入逻辑。
- page plan preview 应优先复用 annotation-item-collector 与 annotation-apply-policy 的现有入口，不在预览层重建第二套 item 读取、校验或策略规则，也不自动调用 executor。
- page report 应只消费既有执行结果对象，并以真实 page apply runner 输出对象为主输入来源；只有在该主输入不存在时，才降级兼容单条 executor 结果或结果数组；它不在报告层调用 executor、apply runner 或任何写入逻辑。
- page apply runner 应优先复用 annotation-page-plan-preview 与 annotation-policy-executor 的现有入口，并直接消费 executor 已回读的 `feedbackAfter`；它不在整页执行层重建第二套 plan 生成、单条执行或反馈规则，也不联动保存、提交、重试或并发。
- save runner 应优先复用 `site-contract.js` 中的保存入口 selector 真源与现有 page-state / dom-adapter 入口；它只允许单次本地点击与单次辅助回读，不在保存触发层重建第二套页面规则，也不联动提交链。
- submit runner 应优先复用 `site-contract.js` 中的提交入口 selector 真源与现有 page-state / dom-adapter 入口，并只把 validator / feedback 用作提交前本地门禁辅助；它只允许单次本地点击与单次辅助回读，不在提交触发层重建第二套页面规则，也不联动自动保存或完整提交链。
- page flow runner 应优先复用 `annotation-page-apply-runner.js`、`annotation-page-report.js`、`annotation-save-runner.js` 与 `annotation-submit-runner.js` 的现有入口，只负责单页顺序编排与统一结果收口；它不重写 apply/save/submit runner，不做自动重试、不自动循环、不自动批处理，也不绕过本地门禁强推 submit。
- flow report 应只消费现有 `annotation-page-flow-runner.js` 的真实输出对象，并把 `applyPhase / savePhase / submitPhase`、`completed / reason`、各阶段原始结果与语义警告收口为稳定验收摘要；它不在报告层调用任何 runner，不重放 click，不触发保存、提交或任何自动化动作。
- control panel 应只复用现有 preview/apply/report/save/submit/flow/flow report 入口，把它们收口为页面内手动操作按钮与只读结果显示区；它不自动点击、不自动调用任何 runner、不做后台轮询，也不把面板层升级为自动化层。
- action history 应只接受显式传入的 `actionName / result`，并在模块内部做固定上限的最近记录缓冲；它不监听页面事件，不自动采集 control panel 或 Console 调用，也不触碰现有 runner / report 内部逻辑。
- `page-detector / route-observer / page-state-collector / annotation-item-collector / annotation-item-validator / annotation-feedback / annotation-item-writer / annotation-validity-writer / annotation-text-pipeline / annotation-quickfill-runner / annotation-apply-runner / annotation-apply-policy / annotation-policy-executor / annotation-page-plan-preview / annotation-page-report / annotation-page-apply-runner / annotation-save-runner / annotation-submit-runner / annotation-page-flow-runner / annotation-flow-report / annotation-control-panel / annotation-action-history / annotation-debug-snapshot / content` 已围绕同一契约协作。
- `manifest.json` 应按 `site-contract.js -> page-detector.js -> route-observer.js -> page-state-collector.js -> annotation-item-collector.js -> annotation-item-validator.js -> annotation-feedback.js -> annotation-item-writer.js -> annotation-validity-writer.js -> annotation-text-pipeline.js -> annotation-quickfill-runner.js -> annotation-apply-runner.js -> annotation-apply-policy.js -> annotation-policy-executor.js -> annotation-page-plan-preview.js -> annotation-page-report.js -> annotation-page-apply-runner.js -> annotation-save-runner.js -> annotation-submit-runner.js -> annotation-page-flow-runner.js -> annotation-flow-report.js -> annotation-control-panel.js -> annotation-action-history.js -> annotation-debug-snapshot.js -> runtime-gate.js -> runtime-debug.js -> content.js` 的顺序装配 content scripts。
- `content.js` 已不再直接承担局部设置读取与 badge 注入，也不再内嵌 item 级快照、校验、反馈或写回逻辑本体。

## 单页完整受控流程编排（首版）

当前新增的 `annotation-page-flow-runner.js` 只覆盖 `task-detail` 页面上的单页完整受控流程编排，顺序固定为：
- 先调用现有 `annotation-page-apply-runner.run(...)`
- 仅当 apply 结果存在实际执行项时，才允许尝试 save
- 仅当 `annotation-save-runner.run(...)` 返回允许继续的本地结果时，才允许尝试 submit
- 任一阶段不满足继续条件时，立即显式中止并返回统一流程结果

首版明确做了什么：
- 把单页 `apply -> save -> submit` 三阶段顺序编排收口到独立模块
- 给三阶段返回统一 `applyPhase / savePhase / submitPhase`
- 输出 `pageType / routeKey / taskId / matched / completed / reason` 与各 runner 原始结果
- 把 apply 后的页面级摘要固定为 `pageReportAfterApply`

首版明确没做什么：
- 不自动化，不自动重试，不自动循环，不并发执行
- 不批处理多个页面，不跨页面流转
- 不做 fetch 拦截，不做服务端保存或提交确认
- 不把 `clicked` 或 `completed` 伪装成“服务端已保存/已提交成功”
- 不新增 UI 面板、自动滚动、自动高亮，也不为未来多平台继续抽象框架

三阶段顺序和中止条件：
- apply 阶段总是先跑；若页面不是目标页或不是 `task-detail`，流程直接结束
- apply 阶段若没有实际执行项，流程以 `apply-not-needed` 结束，不进入 save
- save 阶段只在 apply 存在实际执行项时触发；若本地门禁未通过或未形成允许继续的本地结果，流程以 `save-skipped` 或 `save-failed` 结束
- submit 阶段只在 save 返回允许继续的本地结果时触发；若本地门禁未通过或未形成允许继续的本地结果，流程以 `submit-skipped` 或 `submit-failed` 结束

为什么它仍然不是自动化层：
- 它只处理当前页面的一次显式调用，不自行发起循环或批处理
- 它只复用现有本地 runner 的最小 click 结果，不做服务端完成确认
- 它不实现 fetch 拦截、自动重试、自动抢单、自动翻页或自动提交链
- 即使 `forceSaveClick / forceSubmitClick` 为 `true`，也只是把是否越过本地门禁显式交给调用方，不表示推荐，更不表示系统自动升级为自动化

## 总验收支撑层（首版）

当前新增的 `annotation-flow-report.js` 只覆盖“验收与真实页面联调支撑”这一层，固定输入是 `annotation-page-flow-runner.js` 的真实输出对象。

这一步明确做了什么：
- 为单页完整受控流程新增稳定的流程级摘要对象
- 输出 `phaseSummary / summaryText / lines / warnings`
- 把 `clicked / applied / completed` 等字段的语义边界转成可人工核对的警告文本
- 为真实 Edge 页面手动联调准备配套验收清单文档

这一步明确没做什么：
- 不新增任何 writer、runner、policy 或业务动作
- 不增强保存链，不增强提交链，不做 fetch 拦截
- 不改 `annotation-page-flow-runner.js` 的核心流程逻辑
- 不做页面 UI 面板、自动滚动、自动高亮或自动化动作

为什么它仍然只是验收支撑层：
- 它只解释已有 flow 结果，不发起任何执行
- 它不写 DOM，不追加 click，不改变任一阶段是否继续的门禁判断
- 它的价值是让人工验收、真实页面联调和结果解释更稳定，而不是增加新能力

## 页面内轻量操作面板（首版）

当前新增的 `annotation-control-panel.js` 只覆盖“页面内手动入口”这一层，固定目标是把现有 runtime 能力做成 task-detail 页面上的轻量面板。

这一步明确做了什么：
- 提供页面计划预览、整页受控执行、整页结果报告、单页保存触发、单页提交触发、单页完整流程这六个手动入口
- 提供只读结果区，展示最近一次动作名称、最近一次动作摘要与最近一次动作原始结果的精简版
- 提供显示 / 隐藏能力，但保持 UI 轻量，不做拖拽、主题系统或复杂美化
- 非 task-detail 页面上仍允许看到面板入口，但动作按钮会保持禁用并显示“当前页面不是 task-detail”的本地说明

这一步明确没做什么：
- 不新增任何业务 runner、writer、policy
- 不在页面加载后自动调用 preview / apply / save / submit / flow
- 不做自动重试、后台轮询、批处理、fetch 拦截或自动化动作
- 不替换现有 runtime debug 体系，也不把主要工作塞回 `content.js`

为什么它仍然只是手动操作面板，不是自动化层：
- 所有动作都只能由用户点击触发
- 面板只复用现有能力，不改变现有能力的成功语义、门禁判断或执行顺序
- 面板展示的是本地结果与摘要，不会把点击动作自动升级成后台流程

## 最近操作历史缓冲与导出（首版）

当前新增的 `annotation-action-history.js` 只覆盖“最近操作历史缓冲”这一层，固定目标是给已有手动调试或手动面板调用提供一个纯内存级缓冲区。

这一步明确做了什么：
- 提供 `push(actionName, result)` 用于显式写入一条最近操作记录
- 提供 `list()` 读取当前缓存
- 提供 `clear()` 清空缓存
- 提供 `exportText()` 生成纯文本导出结果

这一步明确没做什么：
- 不持久化，不写 `localStorage`，不写 `chrome.storage`
- 不自动采集任何页面动作
- 不新增页面 UI
- 不新增业务动作，不新增执行链路

为什么它仍然只是历史缓冲，不是新业务能力：
- 它不会调用任何 runner / report
- 它的输入只能来自外部显式传入
- 它的价值只是帮助人工调试或人工留痕，不改变任何现有流程的行为

真实手动验证时的解释边界：
- `applied === true` 只表示本地 apply 编排已经完成并得到显式回读，不表示已保存或已提交
- `clicked === true` 只表示本地 click 已派发，不表示服务端已经保存或提交成功
- `completed === true` 只表示本地 flow 已经结束并形成明确阶段结果，不表示服务器最终完成
- 只有结合平台真实页面反馈、页面跳转、状态变化或人工复核，才能判断是否接近“服务端完成”；报告层不会替代这个判断

## 联调缺陷记录与修复支撑（首版）

当前新增的 `annotation-debug-snapshot.js` 与 `docs/edge-live-debug-log.md` 只覆盖“真实 Edge 页面联调收尾支撑”这一层。

这一步明确做了什么：
- 新增一份可持续追加的联调缺陷记录文档
- 新增一个只读 debug snapshot 导出模块，用于汇总当前 runtime 可拿到的页面状态、control panel 状态、history 记录、flow report 摘要与 runtime 入口清单
- 让 control panel、history、flow report 与 debug snapshot 可以配合做问题记录

这一步明确没做什么：
- 不新增任何 writer、runner、policy 主链路
- 不增强保存链、提交链、fetch、自动重试、自动批处理或自动化动作
- 不重构 control panel，不新增复杂 UI 系统

为什么当前阶段进入联调收尾：
- 主线模块已经齐备，当前更缺的是“如何在真实页面稳定复现、解释和留档问题”
- 真实联调需要把本地结果、页面现象与最近动作历史放到同一份记录里，而不是继续扩主业务模块

如何使用控制面板、history、flow report 与 debug snapshot 做问题记录：
- 先通过 control panel 或 Console 手动触发一次需要复现的现有能力
- 如果 action history 可用，读取最近几条记录，保留 `actionName / reason / summaryText`
- 如果 flow report 可取，保留最近一次 `summaryText / phaseSummary / warnings`
- 再导出 debug snapshot 文本，粘贴进 `docs/edge-live-debug-log.md` 的一条记录中

哪些现象不能误读成服务端完成：
- `clicked === true` 只表示本地 click 已派发
- `applied === true` 只表示本地 apply 编排已回读完成
- `completed === true` 只表示本地 flow 已结束并形成明确阶段结果
- `reason === 'ok'` 只表示当前本地层级的成功语义成立

## 共享存储层判断

当前共享层已经形成稳定模型，且 background / options / popup 的统一消费已经成立。

当前共享设置模型包含：
- `stage`
- `platforms`
- `meta`

当前共享存储 API 包含：
- `getSettings()`
- `saveSettings()`
- `patchSettings()`
- `isPlatformEnabled()`

## 站点层当前状态

当前站点层已经完成：
- 页面规则真源收口
- 页面识别
- SPA 路由观察
- 只读页面状态采集
- 只读 DOM 适配结果采集
- 站点运行时装配层首版收口
- `task-detail` item 级只读快照首版
- item 快照之上的只读校验辅助首版
- 只读人工反馈摘要与调试输出首版
- 单条 textarea 最小本地写回首版
- 单条 validity 最小切换首版
- 单条快速填入（不保存）首版
- 单条受控操作编排（不保存）首版
- 单条业务策略层（不保存）首版
- 单条策略执行助手（不保存）首版
- 整页只读计划预览器（不保存）首版
- 整页执行结果报告层（只读消费结果）首版
- 整页受控执行器（不保存）首版
- 单页最小保存触发器（不提交）首版
- 单页最小提交触发器（不自动化）首版
- 单页完整受控流程编排（apply -> save -> submit，不自动化）首版
- 总验收支撑层（不新增业务能力）首版
- 页面内轻量操作面板（手动触发）首版

当前站点层仍保留的小毛刺：
- 当前 `manifest.json` 只向 content script 装配站点层脚本，`extension/shared/storage.js` 尚未进入站点运行时。
- `task-detail` 的 `routeKey` 在 query/hash 场景仍可能继续细化。
- DOM 适配层 selector 与提取可靠性还需要继续在真实页面上验证。
- 站点运行时的启用门禁仍位于 `extension/sites/alibaba-labelx/`，还没有切到 shared 存储消费者。
- item 级 selector 首版已经收口，但仍需在真实 `task-detail` 页面上继续验证不同题型的稳定性。

这些问题都属于低风险或结构验证问题，不阻塞下一步继续评估更接近完整快速填入的中风险业务迁移。

## 当前扩展骨架已具备的能力

- MV3 `manifest.json`
- 基于 `chrome.storage.local` 的最小设置初始化
- `Alibaba LabelX` 模块总开关
- popup 对当前状态的读取与展示
- 页面契约层
- 页面识别层
- SPA 路由观察层
- 只读页面状态采集层
- 只读 DOM 适配层
- 站点内运行时设置门禁 helper
- 站点内 badge/debug/runtime helper
- `task-detail` 标注项只读快照入口
- `task-detail` 标注项只读校验入口
- `task-detail` 标注项只读反馈摘要入口
- `task-detail` 标注项单条 textarea 最小写回入口
- `task-detail` 标注项单条 validity 最小切换入口
- `task-detail` 标注项单条快速填入入口
- `task-detail` 标注项单条受控操作编排入口
- `task-detail` 标注项单条业务策略入口
- `task-detail` 标注项单条策略执行助手入口
- `task-detail` 标注项整页只读计划预览入口
- `task-detail` 调试态执行结果页面级报告入口
- `task-detail` 标注项整页受控执行入口
- `task-detail` 页面单页最小保存触发入口
- `task-detail` 页面单页最小提交触发入口
- `task-detail` 页面单页完整受控流程编排入口
- `task-detail` 页面单页完整流程验收报告入口
- `task-detail` 页面内轻量手动操作面板入口
- content script 在目标站点的只读存在感注入

## 当前扩展骨架未具备的能力

- 完整文本写回与自动修复工具
- 词库同步客户端
- 保存链路改造
- 自动化动作
- 服务端保存/提交完成确认
- 结果 UI 面板
- 自动执行面板动作

## 当前运行边界

当前真正参与扩展运行的是：
- `extension/manifest.json`
- `extension/background/service-worker.js`
- `extension/shared/constants.js`
- `extension/shared/storage.js`
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
- `extension/sites/alibaba-labelx/runtime-gate.js`
- `extension/sites/alibaba-labelx/runtime-debug.js`
- `extension/sites/alibaba-labelx/content.js`
- `extension/options/*`
- `extension/popup/*`

当前不参与扩展运行的是：
- `docs/*`
- `legacy-reference/*`

## 当前架构判断

结论：
- 当前项目已经是一个可独立维护的扩展项目。
- 当前地基已经达到“支撑单脚本迁移主线”的够用标准。
- “站点层契约统一”“只读 DOM 适配层首版”“站点上下文提取稳定化”都已与实际代码对齐。
- “content.js 装配层继续收口”也已与实际代码对齐。
- “item 快照之上的只读校验辅助”也已与实际代码对齐。
- “只读人工辅助提示 / 调试输出”也已与实际代码对齐。
- “单条最小写回能力（不保存）”也已与实际代码对齐。
- “单条 validity 最小切换（不保存）”也已与实际代码对齐。
- “单条快速填入（不保存）”也已与实际代码对齐。
- “单条受控操作编排（不保存）”也已与实际代码对齐，并继续保持在站点层内，以已有单条模块编排与显式回读为边界，而不是并入保存链。
- “单条业务策略层（不保存）”也已与实际代码对齐，并继续保持在站点层内，以建议动作计划与 `suggestedApplyInput` 输出为边界，而不是升级为自动化层。
- “单条策略执行助手（不保存）”也已与实际代码对齐，并继续保持在站点层内，以“执行已有单条计划 + 显式回读”为边界，而不是升级为整页自动应用器。
- “整页只读计划预览器（不保存）”也已与实际代码对齐，并继续保持在站点层内，以“整页汇总 plan + 只读摘要”为边界，而不是升级为批量执行器。
- “整页执行结果报告层”也已与实际代码对齐，并继续保持在站点层内，以“消费真实整页执行结果对象并输出摘要与逐条文本”为边界，而不是升级为执行层。
- “整页受控执行器（不保存）”应继续保持在站点层内，以“复用整页只读预览 + 顺序执行已有单条计划 + 显式回读”为边界，而不是升级为保存链、批处理器或自动化层。
- “单页最小保存触发器（不提交）”应继续保持在站点层内，以“定位保存入口 + 单次本地点击 + 单次辅助回读”为边界；其中 `clicked` 只表示 click 已派发，不表示保存完成，更不是提交链。
- “单页最小提交触发器（不自动化）”应继续保持在站点层内，以“定位提交入口 + 本地门禁判断 + 单次本地点击 + 单次辅助回读”为边界；其中 `clicked` 只表示 click 已派发，不表示提交完成，`validationBefore / feedbackBefore` 只用于门禁辅助而不是提交结果。
- “单页完整受控流程编排（apply -> save -> submit，不自动化）”应继续保持在站点层内，以“复用既有 apply/save/submit runner、按显式本地结果顺序推进、任一阶段不满足条件就立即返回”为边界；其中 `completed` 只表示本地流程已经结束并形成明确阶段结果，不表示服务端已保存或已提交完成。
- “总验收支撑层（不新增业务能力）”应继续保持在站点层内，以“消费真实 flow 输出、生成人工可读摘要、明确语义警告与手动验收步骤”为边界；它不执行任何动作，也不把报告层升级为保存链、提交链或自动化层。
- “页面内轻量操作面板（手动触发）”应继续保持在站点层内，以“暴露现有能力的手动按钮 + 结果区只读展示”为边界；它不自动执行任何动作，也不把面板升级成自动化层、后台层或新业务链路。

## 为什么 DOM 适配层首版已足够支撑下一步

- 页面类型规则已有唯一真源，不再散落重复定义。
- 页面状态对象字段名已经稳定，足以作为 DOM 适配层输入。
- `content.js` 的装配顺序已经清晰，不会阻碍只读 DOM 适配层接入。
- 当前剩余问题都属于“选择器可靠性”和“装配壳进一步瘦身”，不属于 DOM 适配层的前置阻塞项。

## 哪些地基已经够了

对于“先把当前单脚本迁进扩展”的目标，下面这些地基已经够用：
- 共享存储层
- 页面规则真源
- 页面识别与 SPA 路由观察
- 只读页面状态采集
- 站点层状态契约统一

这些部分接下来应以“小修小补”维护为主，而不是继续扩成更大的未来通用基建。

## 哪些地基现在可以暂时不做

当前不建议优先继续投入：
- 面向未来第二个平台的更复杂注册中心
- 进一步拆分共享层，只为了抽象而抽象
- 在没有真实业务迁移压力前，继续把 `content.js` 纯壳化
- 为 query/hash 的所有边缘路由预先做完整体系

## 对下一阶段的判断

下一阶段最适合进入：
- 评估更接近完整快速填入的中风险业务迁移

原因：
- 单条 textarea 最小写回、单条 validity 最小切换、单条快速填入和单条受控操作编排都已经落地。
- 直接进入保存链仍然过大，但继续评估更接近完整快速填入的中风险迁移已经具备前提。

建议先保持单任务推进，而不是提前把中风险迁移直接扩成保存链或自动化链。

原因：
- 当前阶段已经完成多个单条能力验证与单条受控编排。
- 接下来更合理的是在不碰保存链的前提下，继续评估更接近完整快速填入的中风险边界。

单脚本迁移主线阶段图见 `docs/archive/single-script-migration-roadmap.md`。
详细边界见 `docs/archive/content-assembly-plan.md`、`docs/archive/low-risk-migration-plan.md`、`docs/archive/read-only-validation-plan.md`、`docs/archive/read-only-feedback-plan.md`、`docs/archive/minimal-writeback-plan.md`、`docs/archive/minimal-validity-toggle-plan.md`。


