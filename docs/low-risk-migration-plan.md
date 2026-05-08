# 低风险业务能力迁移首轮计划与落地结果

## 目的

本文件只约束一件事：
- 在不碰保存、提交、fetch 拦截和自动化动作的前提下，先把 `task-detail` 标注项的只读识别、文本源读取和目标节点定位迁进扩展

它不是未来通用 DOM 框架规划，也不是文本填充方案。

## 为什么第一刀选它

基于当前代码与 `legacy-reference/asr-script.user.js` 的实际内容，旧脚本后续多项能力都依赖同一组 item 级读入口：
- `getTargetTextarea(item)`
- `getSourceText(item)`
- item 级 radio / textarea / audio 等节点读取

这些入口同时服务于：
- 单条快速填入
- 只读校验辅助
- 轻量文本处理

因此第一刀最合适的不是抽象 DOM 工具层，也不是直接做文本写回，而是：
- 先把 item 级只读快照建起来

## 当前已具备什么

当前代码已经具备：
- `site-contract.js` 提供稳定页面类型与页面状态骨架
- `page-state-collector.js` 提供稳定的 `task-detail` 页面上下文与只读 DOM 适配结果
- `content.js` 已收紧为运行时装配入口
- `task-detail` 页已经可以稳定识别为目标页面

结论：
- 现在已经可以开始做 item 级只读业务迁移
- 不需要再回头扩装配层或未来多平台抽象

## 首轮唯一职责

首轮唯一职责是：
- 在 `task-detail` 页面建立“标注项只读快照”能力

这里的“标注项只读快照”至少应能稳定回答：
- 当前页面有哪些标注项
- 每个标注项的源文本是什么
- 每个标注项是否存在目标文本框
- 每个标注项当前目标文本框内容是什么
- 每个标注项当前是否已选择有效性

## 输入

首轮允许消费的输入：
- 当前 `SitePageState`
- 当前 `AlibabaLabelxDomAdapterResult`
- `task-detail` 页面上的只读 DOM

首轮不允许新增的输入：
- fetch 返回体
- 保存链路状态
- 服务端数据
- 自动化状态机

## 输出

首轮输出应是站点内可复用的只读结构化结果，而不是直接改 DOM。

当前首轮输出形态：

```typescript
interface AnnotationItemSnapshotResult {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  taskId: string | null;
  matched: boolean;
  itemCount: number;
  items: AnnotationItemSnapshot[];
}

interface AnnotationItemSnapshot {
  index: number;
  sourceText: string | null;
  targetText: string | null;
  hasTargetTextarea: boolean;
  selectedValidity: "有效" | "无效" | "特殊" | null;
}
```

要求：
- 未命中时返回空数组，而不是抛异常
- 只返回当前轮能稳定读取的字段
- 不在这一轮顺手加入写回方法
- 不把 item 快照回填进 `SitePageState`

## 建议落点

优先建议新增：
- `extension/sites/alibaba-labelx/annotation-item-collector.js`

必要时允许最小修改：
- `extension/sites/alibaba-labelx/site-contract.js`
  用于补充 item 级 selector 真源
- `extension/sites/alibaba-labelx/content.js`
  仅用于最小装配接线
- `extension/manifest.json`
  仅在新增脚本需要装配顺序时最小修改

## 与现有模块的最小衔接方式

- `site-contract.js`
  继续只做规则真源；如确有必要，只补 item 级 selector 常量，不扩页面状态字段
- `page-state-collector.js`
  保持现有职责不变，不把 item 级业务快照硬塞回 `SitePageState`
- `content.js`
  最多只做最小接线，不承担 item 提取逻辑本体

## 首轮当前落地结果

本轮已完成：
- 新增 `extension/sites/alibaba-labelx/annotation-item-collector.js`
- 由 `site-contract.js` 补充 item 级 selector 真源
- 通过最小 manifest 装配让 item collector 在 `content.js` 之前就绪
- 通过最小 content / runtime debug 接线暴露 item collector

当前首轮输出至少能稳定回答：
- 当前页面有哪些标注项
- 每个标注项的 `sourceText`
- 每个标注项是否存在目标 textarea
- 每个标注项当前 `targetText`
- 每个标注项当前 `selectedValidity`

## 首轮明确不做什么

- 不做自动填充
- 不做文本写回
- 不做保存
- 不做提交
- 不做 fetch 拦截
- 不做自动化动作
- 不把这一步扩成未来通用 DOM 工具框架
- 不把 item 级快照直接塞进全局页面状态对象

## 低风险链路后的承接关系

item 快照之后已经完成的几步是：
- 基于 item 快照做只读校验辅助
- 基于 validator 结果做只读反馈摘要
- 单条 textarea 最小本地写回
- 单条 validity 最小切换（不保存）

在这些前置链路成立后，已经完成的下一步承接是：
- “单条业务策略层（不保存）”第一版

这一步做什么：
- 命中单条 item
- 读取当前 item 快照
- 读取当前 item 对应的校验问题
- 复用现有 quickfill 文本规则判断是否存在安全的文本生成建议
- 输出保守、可解释的建议动作计划
- 把结果收敛为单条 `suggestedApplyInput`，供现有 apply runner 显式消费

这一步不做什么：
- 不直接执行 quickfill
- 不直接切换 validity
- 不自动调用 apply runner
- 不保存
- 不提交
- 不做批处理
- 不做自动化动作
- 不迁移 legacy 里的完整业务编排、保存链或自动提交逻辑

这一步的输入边界应固定为：
- `itemIndex: number`

这一步的输出边界应至少覆盖：
- `pageType / routeKey / taskId / itemIndex / matched / actionable / reason`
- `currentSnapshot / currentValidationIssues`
- `recommendedQuickfill / recommendedValidity`
- `suggestedApplyInput`

首轮策略规则范围应克制到：
- item 不存在时不建议动作
- `sourceText` 缺失时不建议动作
- `target textarea` 不存在时不建议动作
- 当前已选 validity 时不自动建议覆盖 validity
- 当前文本为空、且现有 quickfill 文本规则可生成非空文本时，才建议 quickfill
- 当前未选 validity、且满足保守文本条件时，才建议把 `recommendedValidity` 设为 `有效`

为什么这一步仍然不是自动化层：
- apply policy 只产出建议动作计划，不直接执行写入
- `suggestedApplyInput` 只是单条 apply runner 的显式输入，不会自动触发执行
- 它不批量推断整页动作，不调用保存按钮、不提交表单、不接 fetch

它与 apply runner 的关系是：
- apply policy 只负责“建议什么”
- apply runner 只负责“如果明确要求执行，就如何按现有模块执行”
- 两者分开后，策略和执行都仍停留在单条、非保存、非自动化边界内

这一阶段的详细边界见：
- `docs/read-only-validation-plan.md`
- `docs/read-only-feedback-plan.md`
- `docs/minimal-writeback-plan.md`
- `docs/minimal-validity-toggle-plan.md`

## 第二批低风险文本规则扩充

本轮范围只限定在：
- 继续使用 `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
- 不新增第二套文本规则入口
- 不改变 `run(sourceText)` 的输入输出契约
- 不改变 `annotation-quickfill-runner.js` 的调用方式

本轮允许做的事只有：
- 在现有文本管线里追加少量确定性、纯函数、可解释的规则
- 让 `appliedRules` 明确反映这些新增规则是否命中
- 把规则边界和验证方式文档化

本轮明确不做：
- 不接入 AI、云端词典、用户配置
- 不迁入 legacy 的自定义替换、数字转换、批处理或自动保存逻辑
- 不修改 `annotation-apply-policy`、`apply-runner`、writer、validator、feedback
- 不修改 `content.js`、`runtime-debug.js`、`manifest.json`

本轮规则细节见：
- `docs/text-pipeline-rules-v2.md`

## 第三批低风险文本规则扩充

本轮范围只限定在：
- 继续使用 `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
- 不新增第二套文本规则入口
- 不改变 `run(sourceText)` 的输入输出契约
- 不改变 `annotation-quickfill-runner.js` 的调用方式

本轮允许做的事只有：
- 在现有文本管线里继续追加少量确定性、纯函数、可解释的规则
- 让 `appliedRules` 明确反映这些新增规则是否命中
- 只处理局部、保守、可文档化的文本噪声

本轮明确不做：
- 不接入 AI、云端词典、用户配置
- 不迁入 legacy 的自定义替换、数字转换、批处理或自动保存逻辑
- 不修改 `annotation-apply-policy`、`annotation-policy-executor`、`apply-runner`、writer、validator、feedback
- 不修改 `content.js`、`runtime-debug.js`、`manifest.json`

本轮规则细节见：
- `docs/text-pipeline-rules-v3.md`

## 第四批低风险文本规则扩充

本轮范围只限定在：
- 继续使用 `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
- 不新增第二套文本规则入口
- 不改变 `run(sourceText)` 的输入输出契约
- 不改变 `annotation-quickfill-runner.js` 的调用方式

本轮允许做的事只有：
- 在现有文本管线里继续追加少量确定性、纯函数、可解释的规则
- 让 `appliedRules` 明确反映这些新增规则是否命中
- 只处理局部、保守、可文档化的文本噪声

本轮明确不做：
- 不接入 AI、云端词典、用户配置
- 不迁入 legacy 的自定义替换、数字转换、批处理或自动保存逻辑
- 不修改 `annotation-apply-policy`、`annotation-policy-executor`、`annotation-page-apply-runner`、`annotation-page-report`、writer、validator、feedback
- 不修改 `content.js`、`runtime-debug.js`、`manifest.json`

本轮规则细节见：
- `docs/text-pipeline-rules-v4.md`

