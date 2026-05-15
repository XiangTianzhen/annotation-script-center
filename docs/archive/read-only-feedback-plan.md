# 只读人工辅助提示与调试输出计划

## 目的

本文件只约束一件事：
- 在不做文本写回、不做保存、不做提交的前提下，消费现有 `AnnotationValidationResult`，把只读校验结果变成人可以直接消费的提示或调试输出

它不是最小写回能力方案，也不是自动化流程方案。

## 为什么这一步应先于最小写回能力

当前代码已经具备：
- `annotation-item-collector.js` 的 item 级只读快照
- `annotation-item-validator.js` 的稳定只读校验结果

本轮补齐的缺口是：
- 把校验结果变成可供人工直接使用的反馈层

因此本轮最合适的是：
- 先验证“结果是否可被稳定消费”

而不是：
- 直接开始文本写回、最小修复或提交相关能力

原因：
- 它继续保持完全只读
- 它直接验证 `AnnotationValidationResult` 是否足够支撑人工使用
- 它可以为后续更高风险能力提供稳定反馈入口，而不提前触碰页面值写入

## 当前已具备什么

当前代码已经具备：
- `AnnotationValidationResult` 稳定结果结构
- 5 条只读规则
- runtime debug 暴露 item collector 与 validator 的入口
- `content.js` 的最小运行时装配

结论：
- 现在已经适合推进“只读人工辅助提示 / 调试输出”
- 不需要再回头继续抽象 DOM 地基或重做校验层

## 唯一职责

本轮唯一职责是：
- 消费现有 `AnnotationValidationResult`，产出稳定的人工辅助提示或调试输出

这一轮不负责：
- 文本写回
- DOM 表单值修改
- 自动高亮修复
- 自动滚动到问题项
- 保存或提交联动

## 输入

主输入：
- `AnnotationValidationResult`

可选便捷输入：
- 无显式输入时，由反馈模块内部调用现有 validator 的 `validate()` 获取同结构结果

不允许新增的输入：
- fetch 返回体
- 服务端数据
- 保存链路状态
- 自动化状态机

## 输出

本轮输出是“人类可消费的只读反馈”，而不是页面写回行为。

当前输出形态：
- 稳定的反馈摘要对象
- 控制台或 runtime debug 可查看的摘要输出
- 本轮未引入页面内轻提示，保持 console/runtime debug 为主

建议摘要结构：

```typescript
interface AnnotationFeedbackIssueSummary {
  index: number;
  code: string;
  severity: "error";
  message: string;
}

interface AnnotationFeedbackSummary {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  taskId: string | null;
  matched: boolean;
  valid: boolean;
  itemCount: number;
  issueCount: number;
  status:
    | "non-target"
    | "non-task-detail"
    | "empty-task-detail"
    | "ok"
    | "has-issues";
  summaryText: string;
  issueLines: string[];
  issues: AnnotationFeedbackIssueSummary[];
}
```

输出至少应能表达：
- 当前页面是否匹配校验场景
- 当前 item 总数
- 当前问题总数
- 每条问题的 `index / code / message`
- 一条可直接在 console 中阅读的摘要文本

空场景语义：
- 非目标站点或 `unknown`：`status="non-target"`，问题列表为空
- `task-list`：`status="non-task-detail"`，问题列表为空
- `task-detail` 但未命中 item：`status="empty-task-detail"`，问题列表为空
- `task-detail` 且无问题：`status="ok"`
- `task-detail` 且有问题：`status="has-issues"`

## 实际落点

本轮实际新增：
- `extension/sites/alibaba-labelx/annotation-feedback.js`

本轮最小修改：
- `extension/sites/alibaba-labelx/runtime-debug.js`
  用于暴露 feedback 入口
- `extension/sites/alibaba-labelx/content.js`
  用于最小接线
- `extension/manifest.json`
  用于新增脚本装配顺序

## 与现有模块的最小衔接方式

- `annotation-item-validator.js`
  保持只负责返回只读校验结果，不承担提示展示逻辑
- `annotation-feedback.js`
  只负责把校验结果映射为人工可消费反馈，不新增写回、保存或自动化入口
  不允许重新实现 validator 规则，也不允许重建第二套 DOM 读取逻辑
- `runtime-debug.js`
  最多补充 feedback 调试暴露，不承接业务逻辑本体
- `content.js`
  最多做最小初始化接线，不承担反馈规则实现

## 明确不做什么

- 不做文本写回
- 不做自动修复
- 不做 DOM 表单值修改
- 不做保存
- 不做提交
- 不做 fetch 拦截
- 不做自动化动作
- 不把这一步扩成未来通用提示框架

## 完成后的自然下一步

完成这一轮后，已完成的承接步骤是：
- 进入“单条最小写回能力（不保存）”并完成首轮实现

在该承接完成后，最自然的下一步是：
- 进入“单条 validity 最小切换（不保存）”评估与首轮实现

但在这一轮内不做该判断对应的实现。

