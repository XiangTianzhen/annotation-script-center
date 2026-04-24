# 整页受控执行器计划

## 目的

本文件只约束一件事：
- 在 `task-detail` 页面实现“整页受控执行器（不保存）”第一版

它不是：
- 保存链
- 提交链
- 自动化器
- 新的整页策略系统

## 模块落点

新增模块：
- `extension/sites/alibaba-labelx/annotation-page-apply-runner.js`

允许最小接线：
- `extension/sites/alibaba-labelx/runtime-debug.js`
- `extension/sites/alibaba-labelx/content.js`
- `extension/manifest.json`

## 复用边界

整页受控执行器必须复用：
- `annotation-page-plan-preview.preview(...)`
- `annotation-policy-executor.run({ itemIndex })`

整页受控执行器不允许：
- 重写整页计划生成规则
- 重写单条执行规则
- 重写 apply runner / validator / feedback

说明：
- 单条执行后的 `feedbackAfter` 直接复用现有 `annotation-policy-executor` 的显式回读结果
- 整页受控执行器自身不再重建第二套 feedback 汇总逻辑

## 输入契约

输入对象至少包含：

```js
{
  onlyActionable: boolean,
  maxItems: number | null,
}
```

约束：
- `onlyActionable` 默认为 `true`
- `maxItems` 仅用于限制最大执行条数
- 不支持自动重试
- 不支持并发执行

## 输出契约

输出对象至少包含：

```js
{
  pageType: string,
  routeKey: string,
  taskId: string | null,
  matched: boolean,
  itemCount: number,
  plannedCount: number,
  executedCount: number,
  successCount: number,
  failedCount: number,
  results: [],
  summaryText: string,
}
```

其中 `results` 的每个元素至少包含：

```js
{
  itemIndex: number,
  executable: boolean,
  executed: boolean,
  reason: string,
  plan: object | null,
  applyResult: object | null,
  feedbackAfter: object | null,
}
```

## 执行顺序

整页受控执行器只允许做以下顺序：
1. 调用现有 `annotation-page-plan-preview.preview(...)`
2. 取其中允许执行的 plans
3. 按顺序逐条调用现有 `annotation-policy-executor.run({ itemIndex })`
4. 汇总整页执行结果

执行顺序约束：
- 不并发
- 不自动重试
- 不滚动页面
- 不高亮页面
- 不触发保存或提交

## 非目标场景

如果页面不是 `task-detail`：
- 必须返回稳定空结果
- 不抛异常
- `results` 为空数组

如果 `task-detail` 页面没有可执行计划：
- 必须返回稳定空执行结果
- 不抛异常
- 不强行执行任何 item
