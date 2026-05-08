# 单条最小写回能力计划

## 目的

本文件只约束一件事：
- 在不做保存、不做提交、不做批处理的前提下，为 `task-detail` 页面建立“单条 item 的 target textarea 最小本地写入”能力

它不是完整快速填入方案，也不是保存链路方案。

## 为什么这一步应先于保存链或完整快速填入

当前代码已经具备：
- `annotation-item-collector.js` 的 item 级只读快照
- `annotation-item-validator.js` 的只读校验结果
- `annotation-feedback.js` 的只读反馈摘要
- `annotation-item-collector.js` 内部稳定的 item 与 target textarea 定位规则

因此下一步最自然的是：
- 先验证“单条 item 的最小本地写入”是否稳定可控

而不是：
- 直接进入保存链
- 直接进入完整快速填入
- 直接同时处理 textarea 与 validity 两类写入

原因：
- target textarea 写入是最局部、最可回读验证的一条写路径
- 它可以借助现有只读链路立即做写后验证
- 它不必提前引入提交、保存、批处理、自动化状态机
- 它应优先复用现有只读入口已经证明可用的 item / textarea 定位结果，而不是重建第二套规则

## 当前已具备什么

当前代码已经具备：
- 稳定的 item 索引与 item 快照
- 稳定的 target textarea 定位规则来源
- 稳定的只读校验与反馈摘要回读入口
- 最小 content runtime 装配
- collector 可作为 writer 的只读 item / textarea 定位出口

结论：
- 当前代码已经完成“单条最小写回能力（不保存）”首轮

## 首轮唯一职责

本轮唯一职责是：
- 对单条 item 的 target textarea 执行最小本地写入

这里的“最小本地写入”只包含：
- 命中单条 item
- 命中该 item 的 target textarea
- 写入指定文本
- 派发最小必要输入事件
- 返回稳定写入结果

首轮不负责：
- 自动从 sourceText 生成目标文本
- 自动切换 validity
- 自动保存
- 自动提交
- 多条批量写入

## 为什么第一刀选 textarea，而不是 validity

本轮第一刀实际选：
- 方案 A：只做单条 target textarea 最小写入

原因：
- textarea 写入可以复用 legacy 中最小、局部、可控的 React textarea 赋值路径
- 写入后的结果可以立刻通过现有 collector / validator / feedback 回读验证
- validity 切换依赖 radio 点击语义，平台交互副作用更强，更容易和“业务状态改变”耦合

因此首轮不建议：
- 一开始就做单条 validity 最小切换
- 一开始就把 textarea + validity 同时并入

## 输入

当前输入结构为：

```typescript
interface AnnotationWriteRequest {
  itemIndex: number;
  targetText: string;
}
```

允许的辅助输入：
- 当前页面状态或 route 信息
- 现有 item 快照结果

不允许新增的输入：
- fetch 返回体
- 保存链路状态
- 自动化状态机
- 多条批量 payload

## 输出

当前输出是稳定的本地写入结果，而不是保存结果。

建议输出形态：

```typescript
interface AnnotationWriteResult {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  taskId: string | null;
  itemIndex: number;
  matched: boolean;
  wrote: boolean;
  reason:
    | "ok"
    | "non-target"
    | "non-task-detail"
    | "item-not-found"
    | "textarea-not-found"
    | "write-error";
  previousText: string | null;
  nextText: string | null;
}
```

要求：
- 只描述本地写入结果
- 不表示已保存
- 不表示已提交
- 写后可由现有只读链路继续回读验证

语义约束：
- `matched=true` 表示已命中目标 `itemIndex` 对应的 item
- `matched=false` 表示页面不适配或 item 未命中
- `wrote=true` 只表示本地 textarea 值已成功写入并完成最小输入事件派发
- `wrote=true` 不表示已保存，不表示已提交

## 实际落点

本轮实际新增：
- `extension/sites/alibaba-labelx/annotation-item-writer.js`

本轮最小修改：
- `extension/sites/alibaba-labelx/runtime-debug.js`
  用于暴露 writer 入口
- `extension/sites/alibaba-labelx/content.js`
  用于最小接线
- `extension/manifest.json`
  用于新增脚本装配顺序

## 与现有模块的最小衔接方式

- `annotation-item-collector.js`
  继续负责只读快照
  如 writer 需要 item / textarea 的定位结果，应优先复用 collector 暴露的只读定位入口，而不是在 writer 中重建规则
- `annotation-item-validator.js`
  继续只负责只读规则判断；writer 不得重建 validator 规则
- `annotation-feedback.js`
  继续只负责结果摘要；writer 可在写入后由调用方显式回读 feedback，但不得把 feedback 绑定为自动副作用
- `site-contract.js`
  继续作为 selector 真源；writer 不得新建第二套页面规则真源
- `content.js`
  最多做最小接线，不承担写入逻辑本体

当前实现约束：
- writer 会派发最小 `input / change` 事件以触发表单值更新语义
- writer 不会自动调用 collector / validator / feedback
- 写后回读验证仍由调用方显式触发
- writer 必须优先消费 collector 已命中的 item / textarea 定位结果
- 如果现有只读入口缺少写入所需定位信息，应优先在 collector 内补只读定位出口，而不是在 writer 中重写一套 item / textarea 查询规则

## 明确不做什么

- 不做自动填入策略
- 不做 sourceText 到 targetText 的业务转换
- 不做 validity 切换
- 不做保存
- 不做提交
- 不做批处理
- 不做 fetch 拦截
- 不做自动化动作

## 完成后的自然下一步

完成这一轮后，最自然的下一步是：
- 进入单条 validity 最小切换（不保存）

但该评估不属于本轮实现范围。

