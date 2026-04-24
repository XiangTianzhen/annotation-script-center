# 只读校验辅助计划与落地结果

## 目的

本文件只约束一件事：
- 在不做文本写回、不做保存、不做提交的前提下，消费 item 级只读快照并返回稳定的只读校验结果

它不是最小写回能力方案，也不是自动化流程方案。

## 为什么这一步应排在最小写回能力之前

基于 `legacy-reference/asr-script.user.js` 的实际逻辑，旧脚本里的 `validateAllItems()` 可以拆成两部分：
- 低风险部分：识别哪一条有问题、问题类型是什么
- 高风险部分：自动清空、自动填入、构建 payload、提交联动

当前扩展已经具备 item 快照：
- `sourceText`
- `hasTargetTextarea`
- `targetText`
- `selectedValidity`

因此当时最自然的下一步是：
- 先迁“问题识别”

而不是：
- 直接迁“问题修复”或“最小写回”

## 当前已具备什么

当前代码已经具备：
- `site-contract.js` 中的 item 级 selector 真源
- `annotation-item-collector.js` 返回结构化 item 快照
- `annotation-item-validator.js` 返回稳定的 `AnnotationValidationResult`
- `runtime-debug.js` 已暴露 validator 调试入口
- `content.js` 仍保持最小接线

结论：
- 只读校验辅助已经有足够输入
- 不需要再继续补抽象地基

## 唯一职责

这一阶段的唯一职责是：
- 基于 item 快照返回“当前页面有哪些校验问题”

这一轮不负责：
- 自动清空无效文本
- 自动填入有效文本
- DOM 高亮
- 滚动定位
- 提交前联动保存

## 输入

主输入：
- `AnnotationItemSnapshotResult`

可选便捷输入：
- 无显式输入时，由 `annotation-item-validator.js` 内部调用 `annotation-item-collector.js` 的 `collect()` 获取同结构快照结果

不允许新增的输入：
- fetch 返回体
- 服务端数据
- 保存链路状态
- 自动化状态机

## 输出

最终输出形态：

```typescript
interface AnnotationValidationIssue {
  index: number;
  code:
    | "missing-validity"
    | "invalid-has-text"
    | "valid-missing-textarea"
    | "valid-empty-text"
    | "special-selected";
  severity: "error";
  message: string;
  sourceText: string | null;
  selectedValidity: "有效" | "无效" | "特殊" | null;
  hasTargetTextarea: boolean;
}

interface AnnotationValidationResult {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  taskId: string | null;
  matched: boolean;
  itemCount: number;
  valid: boolean;
  issueCount: number;
  issues: AnnotationValidationIssue[];
}
```

要求：
- 只返回问题，不修改页面
- 未命中页面时返回空问题列表
- 结果结构稳定，便于后续调试输出或 UI 提示复用

三类页面的空值语义：
- `unknown`：`matched=false`、`itemCount=0`、`issueCount=0`、`issues=[]`
- `task-list`：`matched=false`、`itemCount=0`、`issueCount=0`、`issues=[]`
- `task-detail` 但未命中 item：`matched=false`、`itemCount=0`、`issueCount=0`、`issues=[]`

## 建议落点

优先建议新增：
- `extension/sites/alibaba-labelx/annotation-item-validator.js`

必要时允许最小修改：
- `extension/sites/alibaba-labelx/runtime-debug.js`
  仅用于调试暴露
- `extension/sites/alibaba-labelx/content.js`
  仅用于最小接线
- `extension/manifest.json`
  仅在新增脚本需要装配顺序时最小修改

## 首轮建议规则

基于当前旧脚本，首轮只建议覆盖这些只读规则：
- 未选择有效性
- 选择了“特殊”
- 选择“无效”但 `targetText` 非空
- 选择“有效”但不存在目标文本框
- 选择“有效”但 `targetText` 为空

其中“`targetText` 非空 / 为空”在校验阶段必须按以下语义判断：
- 先去掉零宽字符
- 再执行 `trim()`
- 再判断是否为空字符串

原因：
- `annotation-item-collector.js` 当前保留的是“可读快照值”，不会替下一步偷做校验语义。
- 旧脚本里的 `validateAllItems()` 对 textarea 的空值判断本身就是“去零宽字符后再 trim”。

首轮不建议覆盖：
- 自动填入失败后的重试判断
- 自动清空后的二次确认
- 提交联动校验
- 与保存链路耦合的规则

## 规则输入来源

所有规则都只消费 `annotation-item-collector.js` 已返回的快照字段：

- `missing-validity`
  输入来源：`selectedValidity`
- `special-selected`
  输入来源：`selectedValidity`
- `invalid-has-text`
  输入来源：`selectedValidity` + `targetText`
- `valid-missing-textarea`
  输入来源：`selectedValidity` + `hasTargetTextarea`
- `valid-empty-text`
  输入来源：`selectedValidity` + `hasTargetTextarea` + `targetText`

其中 `targetText` 的空值判断必须在 validator 中再次按 legacy 语义处理：
- 去掉零宽字符
- 执行 `trim()`
- 再判断是否为空字符串

这一步不允许把 `annotation-item-collector.js` 中的原始 `targetText` 直接当成最终校验语义。

## 与现有模块的最小衔接方式

- `annotation-item-collector.js`
  继续只负责返回快照，不承担校验规则
- `annotation-item-validator.js`
  只负责把 item 快照映射为只读校验结果，不新增写回、保存或自动化入口
- `page-state-collector.js`
  保持现有职责，不接管 item 校验
- `content.js`
  最多做最小接线，不承担规则实现

## 当前落地结果

当前代码已实际覆盖的只读规则：
- 未选择有效性
- 选择了“特殊”
- 选择“无效”但 `targetText` 非空
- 选择“有效”但不存在目标文本框
- 选择“有效”但 `targetText` 为空

当前结果边界：
- validator 只消费 item 快照，不建立第二套 DOM 读取规则
- `targetText` 的空值语义在 validator 内按 legacy 规则执行“去零宽字符后再 trim”
- 结果结构已经足够支撑下一步的人工辅助提示或调试输出

## 明确不做什么

- 不做文本写回
- 不做 DOM 高亮
- 不做自动滚动
- 不做自动保存
- 不做自动提交
- 不做 fetch 拦截
- 不把这一步扩成自动化层

## 完成后的自然下一步

当前已完成的承接步骤是：
- 消费现有 `AnnotationValidationResult` 做只读人工辅助提示 / 调试输出

在该承接完成后，下一步最自然的是：
- 进入“单条最小写回能力（不保存）”并完成首轮实现

在该承接继续完成后，下一步最自然的是：
- 进入“单条 validity 最小切换（不保存）”的评估与首轮实现

下一步仍应保持：
- 单条
- 最小
- 不进入保存、提交、批处理、自动化链路
