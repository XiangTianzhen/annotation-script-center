# 单条 validity 最小切换计划

## 目的

本文件只约束一件事：
- 在不做保存、不做提交、不做批处理的前提下，为 `task-detail` 页面建立“单条 item 的 validity 最小切换”能力

它不是完整快速填入方案，也不是保存链路方案。

## 为什么这一步应先于完整快速填入或保存链

当前代码已经具备：
- `annotation-item-collector.js` 的 item 级只读快照
- `annotation-item-validator.js` 的只读校验结果
- `annotation-feedback.js` 的只读反馈摘要
- `annotation-item-writer.js` 的单条 textarea 最小本地写入
- 以 `selectedValidity` 为中心的只读当前值回读能力

因此下一步最自然的是：
- 先验证“单条 item 的 validity 目标值切换”是否稳定可控

而不是：
- 直接进入完整快速填入
- 直接进入保存链
- 直接把 validity 切换和保存前流程绑在一起

原因：
- validity 切换是第二个仍然局部、可回读验证的最小写入口
- 切换后可以立刻借助现有 collector / validator / feedback 做回读验证
- 它不必提前引入保存、提交、批处理或自动化状态机

## 当前已具备什么

当前代码已经具备：
- 稳定的 item 索引与 item 命中能力
- 稳定的当前 `selectedValidity` 读取结果
- 稳定的只读校验与反馈摘要回读入口
- 单条 textarea 最小本地写入作为第一条已验证写路径

结论：
- 当前已经适合推进“单条 validity 最小切换（不保存）”

## 首轮唯一职责

首轮唯一职责是：
- 对单条 item 的 validity 做最小目标值切换

这里的“最小目标值切换”只包含：
- 命中单条 item
- 命中目标值对应的 radio / label 控件
- 触发最小必要点击语义
- 通过显式回读确认当前 `selectedValidity` 已变为目标值
- 返回稳定切换结果

首轮不负责：
- 自动填写 textarea
- 自动保存
- 自动提交
- 多条批量切换
- 切换后自动联动其他字段

## 为什么第一刀建议只处理“未选 -> 目标值”

首轮最优建议是：
- 只支持“当前未选择有效性”的 item 切换到一个显式目标值

这比“任意值互切”更稳，原因是：
- 它直接服务于现有 validator 的 `missing-validity` 问题修复
- 它避免覆盖用户已经做出的有效性选择
- 它已经足够验证 radio 定位、点击语义和写后回读是否稳定

因此首轮不建议：
- 一开始就支持任意当前值到任意目标值的三向互切
- 一开始就把 textarea 写入与 validity 切换绑成一个复合动作

## 输入

建议输入形态：

```typescript
interface AnnotationValidityToggleRequest {
  itemIndex: number;
  targetValidity: "有效" | "无效" | "特殊";
}
```

建议首轮附加约束：
- 仅当当前 `selectedValidity === null` 时允许执行切换
- 如果当前已经存在任意 `selectedValidity`，必须拒绝覆盖

不允许新增的输入：
- fetch 返回体
- 保存链路状态
- 自动化状态机
- 多条批量 payload

## 输出

首轮输出应是稳定的本地切换结果，而不是保存结果。

建议输出形态：

```typescript
interface AnnotationValidityToggleResult {
  pageType: "task-list" | "task-detail" | "unknown";
  routeKey: string;
  taskId: string | null;
  itemIndex: number;
  matched: boolean;
  toggled: boolean;
  reason:
    | "ok"
    | "non-target"
    | "non-task-detail"
    | "item-not-found"
    | "already-selected"
    | "option-not-found"
    | "toggle-readback-mismatch"
    | "toggle-error";
  previousValidity: "有效" | "无效" | "特殊" | null;
  nextValidity: "有效" | "无效" | "特殊" | null;
}
```

要求：
- 只描述本地切换结果
- 不表示已保存
- 不表示已提交
- `toggled === true` 不能只表示已经触发 click
- 只有在显式回读确认 `selectedValidity === targetValidity` 后，才允许返回 `toggled === true`
- 切换后可由现有只读链路继续回读验证

## 建议落点

优先建议新增：
- `extension/sites/alibaba-labelx/annotation-validity-writer.js`

必要时允许最小修改：
- `extension/sites/alibaba-labelx/annotation-item-collector.js`
  仅用于补充只读的 validity 目标控件定位出口
- `extension/sites/alibaba-labelx/site-contract.js`
  仅用于补充 validity 控件定位所需的 selector 真源
- `extension/sites/alibaba-labelx/runtime-debug.js`
  仅用于暴露 validity writer 入口
- `extension/sites/alibaba-labelx/content.js`
  仅用于最小接线
- `extension/manifest.json`
  仅在新增脚本需要装配顺序时最小修改

## 与现有模块的最小衔接方式

- `annotation-item-collector.js`
  继续负责只读快照
  如切换模块需要 radio / label 的定位结果，应优先在 collector 中补只读定位出口，而不是在切换模块里重建第二套规则
  首轮建议由 collector 统一返回 item 命中结果、当前 `selectedValidity` 与目标 option 的只读定位结果
- `annotation-item-validator.js`
  继续只负责只读规则判断；切换模块不得重建 validator 规则
- `annotation-feedback.js`
  继续只负责结果摘要；切换后可由调用方显式回读 feedback，但不得把 feedback 绑定为自动副作用
- `annotation-item-writer.js`
  继续只负责 textarea 本地写入；不得和 validity 切换合并成复合写入器
- `content.js`
  最多做最小接线，不承担切换逻辑本体

## 明确不做什么

- 不做 textarea 自动填入
- 不做任意当前值互切
- 不做对已选 validity 的覆盖
- 不做保存
- 不做提交
- 不做批处理
- 不做 fetch 拦截
- 不做自动化动作

## 完成后的自然下一步

完成这一轮后，最自然的下一步才是继续评估：
- 是否进入更接近完整快速填入的中风险业务迁移

但该评估不属于本轮实现范围。
