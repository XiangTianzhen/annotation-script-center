# Edge 真实页面联调缺陷记录

## 目的

本文件用于持续记录真实 Edge 页面联调中的整合问题、复现步骤、修复状态和剩余风险。当前阶段以收口为主，重点记录“哪里还差、哪里可能有 bug、怎么复现”，不再继续做大规模重构。

## 2026-04-22 静态基线

- `extension/**/*.js` 执行全量 `node --check`：`52/52` 通过。
- `extension/manifest.json` JSON 解析通过。
- `manifest` 中声明的 `39` 个 content script 文件全部存在。

## 2026-04-22 已修整的整合问题

### 已修复：manifest 缺少 document-start 保存链接线

- 现象：
  - `annotation-save-runner.js` 已依赖 `__ASREdgeAlibabaLabelxLegacyBridge`
  - `legacy-save-coordinator.js` 已存在
  - `document-start.js` 与 `page-world-hook.js` 已存在
  - 但此前 `manifest` 没有把 `document-start.js` 和 `legacy-save-coordinator.js` 装进去
- 修整结果：
  - 已把 `sites/alibaba-labelx/document-start.js` 装入 ISOLATED content script
  - 已把 `sites/alibaba-labelx/legacy-save-coordinator.js` 装入 `annotation-save-runner.js` 之前
- 涉及文件：
  - `extension/manifest.json`

### 已修复：flow runner 按同步方式调用异步 save / submit

- 现象：
  - `annotation-save-runner.run()` 和 `annotation-submit-runner.run()` 已是异步函数
  - `annotation-page-flow-runner.js` 仍按同步返回值处理
  - 这会让 flow 阶段把 `Promise` 当普通对象，导致 `savePhase / submitPhase` 判定失真
- 修整结果：
  - `runPageFlow()` 已改成异步串行执行
  - flow 成功判定已对齐当前 runner 的实际返回值
- 涉及文件：
  - `extension/sites/alibaba-labelx/annotation-page-flow-runner.js`
  - `extension/sites/alibaba-labelx/annotation-flow-report.js`

## 本轮四类联调页面

当前仓库里没有保存用户本轮提供的完整真实 URL，下面先固定四类已确认的真实路由模板。联调时请替换成真实 `projectId / subTaskId` 并把实际链接贴进记录。

- 标注列表：`https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=<projectId>`
- 审核列表：`https://labelx.alibaba-inc.com/corpora/labeling/checkTask?projectId=<projectId>`
- 标注详情：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=<projectId>&subTaskId=<subTaskId>`
- 审核详情：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=check&projectId=<projectId>&subTaskId=<subTaskId>`

## 当前未修复 / 待真页确认风险

### 风险：submit 统计上报依赖未装配

- 页面场景：详情页提交前的 `uploadStatsBeforeSubmit`
- 复现步骤：
  1. 打开任一真实详情页
  2. 在 Console 执行 `await rt.getAnnotationSubmitRunner().run({ uploadStats: true })`
  3. 查看 `statsUploadResult`
- 当前结论：
  - `annotation-submit-runner.js` 依赖 `legacy-user-context.js`
  - `legacy-user-context.js` 又依赖 `legacy-api-client.js` 与 legacy bridge
  - 这两项当前仍未装入 manifest
- 预期：
  - 如果需要保留旧统计上报链，必须明确决定是否把 `legacy-user-context.js` 与 `legacy-api-client.js` 一起接入并做真页回归
- 涉及文件：
  - `extension/sites/alibaba-labelx/annotation-submit-runner.js`
  - `extension/sites/alibaba-labelx/legacy-user-context.js`
  - `extension/sites/alibaba-labelx/legacy-api-client.js`
  - `extension/manifest.json`

### 风险：toolbar / shortcut bus 文件存在，但当前未装配

- 页面场景：页面内快捷操作工具条、全局快捷键
- 复现步骤：
  1. 打开真实详情页
  2. 查看页面顶部附近是否出现工具条
  3. 在 Console 执行 `rt.getAnnotationToolbar()` 与 `rt.getAnnotationShortcutBus()`
- 当前结论：
  - `content.js` 已写好 `toolbar.start()` 与 `shortcutBus.start()`
  - `annotation-toolbar.js` 与 `annotation-shortcut-bus.js` 也都存在
  - 但 manifest 还未加载这两个模块
- 预期：
  - 后续如果要启用，必须把“接线”与“快捷键冲突验收”一起做，不能只补 manifest
- 涉及文件：
  - `extension/sites/alibaba-labelx/annotation-toolbar.js`
  - `extension/sites/alibaba-labelx/annotation-shortcut-bus.js`
  - `extension/sites/alibaba-labelx/content.js`
  - `extension/manifest.json`

### 风险：列表页自动流转仍未接线

- 页面场景：列表页自动抢单、自动流转、自动跳下一题
- 复现步骤：
  1. 打开真实列表页
  2. 检查 runtime 和页面表现
- 当前结论：
  - `legacy-auto-assign.js` 已在仓库中
  - 当前 manifest 未加载该模块
- 预期：
  - 在没有明确接线与回归前，本项不能算验收通过
- 涉及文件：
  - `extension/sites/alibaba-labelx/legacy-auto-assign.js`
  - `extension/manifest.json`

### 风险：审核页与标注页仍需横向回归

- 页面场景：`missionType=label` 与 `missionType=check`
- 复现步骤：
  1. 分别打开真实标注详情页和审核详情页
  2. 在两个页面分别执行 save / submit / flow
  3. 对比 `matched / clickable / reason / controlBefore / controlAfter`
- 当前结论：
  - 路由识别已能区分 `label/check`
  - 但 save / submit 命中的 DOM 仍需真实页面确认
- 预期：
  - 两类页面至少要各留一份 `route-check / save / submit / flow` 记录
- 涉及文件：
  - `extension/sites/alibaba-labelx/annotation-save-runner.js`
  - `extension/sites/alibaba-labelx/annotation-submit-runner.js`
  - `extension/sites/alibaba-labelx/annotation-page-flow-runner.js`

## 推荐留档材料

每次真实 Edge 页面联调建议至少保留：

- 页面 URL 与当前页面场景
- `collectForced('route-check')` 结果
- `window.__ASREdgeAlibabaLabelxLegacyBridge?.getSnapshot()` 输出
- save / submit / flow 结果对象
- `annotationFlowReport.report(flowResult)` 摘要
- 页面人工观察到的变化、按钮状态和错误提示

## 记录模板

```md
## 记录：YYYY-MM-DD - 简短标题

- 日期：
- 页面场景：
- 页面 URL：
- 复现步骤：
- 实际结果：
- 预期结果：
- 是否已修复：
- 涉及文件：
- Console / Snapshot：

### 补充观察

- route-check：
- legacy bridge snapshot：
- save 结果：
- submit 结果：
- flow 结果：
- 其他备注：
```

## 当前建议优先追加的真页记录

1. 标注详情页：`save -> submit -> flow`
2. 审核详情页：`save -> submit -> flow`
3. 标注详情页：页面内设置面板改值后刷新回读
4. 审核详情页：safe-save + stats-upload 行为
