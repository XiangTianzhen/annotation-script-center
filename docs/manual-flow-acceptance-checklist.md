# Edge 扩展联调与手动验收清单

## 目的

本清单用于 2026-04-22 收口阶段的真实页面联调。重点不是继续重构，而是固定当前整合状态，明确哪些能力已经接通，哪些还存在差异或风险，以及在真实 Edge 页面上应该怎么验证。

## 本轮静态校验

- `extension/**/*.js` 已执行全量 `node --check`，结果：`52/52` 通过。
- `extension/manifest.json` 已执行 JSON 解析校验，结果：通过。
- `manifest` 中声明的 `39` 个 content script 文件已核对存在性，未发现缺失。

## 本轮最小修整

- 已补上 `document_start` 阶段的旧保存链接线：
  - `sites/alibaba-labelx/document-start.js`
  - `sites/alibaba-labelx/page-world-hook.js` 通过注入脚本进入 page world
  - `sites/alibaba-labelx/legacy-save-coordinator.js`
- 已修复 `annotation-page-flow-runner.js` 仍按同步方式调用异步 `save-runner / submit-runner` 的整合 bug，flow 现在会真正等待保存和提交阶段结果。
- 已把 flow 成功判定与当前 runner 实际返回值对齐：
  - save 支持 `manual-save-success / local-click-dispatched`
  - submit 支持 `submit-dispatched`

## 四类真实联调 URL

当前仓库里没有保存用户本轮提供的完整真实 URL，先固定四类已确认的真实路由模板。联调时请替换实际 `projectId / subTaskId`，并把真实链接补回本文件和 `docs/edge-live-debug-log.md`。

1. 标注列表页  
   `https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=<projectId>`
2. 审核列表页  
   `https://labelx.alibaba-inc.com/corpora/labeling/checkTask?projectId=<projectId>`
3. 标注详情页  
   `https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=<projectId>&subTaskId=<subTaskId>`
4. 审核详情页  
   `https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=check&projectId=<projectId>&subTaskId=<subTaskId>`

## 旧脚本功能矩阵对照

| 功能项 | 状态 | 当前结论 | 相关文件 |
| --- | --- | --- | --- |
| manifest 装配顺序 | 已完成 | MAIN world bridge、ISOLATED world runtime、document-start 保存链的加载顺序已接通。 | `extension/manifest.json` |
| content script 启动时机 | 已完成 | MAIN/ISOLATED 两个 content script 都在 `document_start` 注入。 | `extension/manifest.json` |
| 真实路由识别 | 已完成 | 已覆盖 `labelingTask / checkTask / sdk(label) / sdk(check)`。 | `extension/sites/alibaba-labelx/site-contract.js`、`extension/sites/alibaba-labelx/page-state-collector.js` |
| page-world hook 接线 | 已完成，待真页验收 | `document-start.js` 已注入 `page-world-hook.js`，保存缓存和数据回读桥已可初始化。 | `extension/sites/alibaba-labelx/document-start.js`、`extension/sites/alibaba-labelx/page-world-hook.js` |
| 保存链 readback | 有差异 | 现在已有 pending-save 缓存和 manual save 协调器，但仍缺真实 Edge 页面网络回放确认。 | `extension/sites/alibaba-labelx/legacy-save-coordinator.js`、`extension/sites/alibaba-labelx/annotation-save-runner.js` |
| submit 链 | 有差异 | submit runner 已接 safe-save，但统计上报依赖 `legacy-user-context.js`，当前未装进 manifest。 | `extension/sites/alibaba-labelx/annotation-submit-runner.js`、`extension/sites/alibaba-labelx/legacy-user-context.js` |
| flow 链 | 已完成（本轮修整） | `flow` 现在会等待异步 save / submit 结果，不再把 Promise 当普通对象。 | `extension/sites/alibaba-labelx/annotation-page-flow-runner.js` |
| settings 持久化 | 已完成 | `shared/storage`、`annotation-runtime-config`、页面内 `settings-panel` 已接通。 | `extension/shared/storage.js`、`extension/sites/alibaba-labelx/annotation-runtime-config.js`、`extension/sites/alibaba-labelx/settings-panel.js` |
| control panel 接线 | 已完成 | 页面控制面板已挂载并可触发 preview/apply/save/submit/flow。 | `extension/sites/alibaba-labelx/annotation-control-panel.js`、`extension/sites/alibaba-labelx/content.js` |
| toolbar 接线 | 有差异 | `annotation-toolbar.js` 已存在，`content.js` 也会尝试启动，但当前未装入 manifest。 | `extension/sites/alibaba-labelx/annotation-toolbar.js`、`extension/sites/alibaba-labelx/content.js`、`extension/manifest.json` |
| 快捷键体系 | 有差异 / 有 bug 风险 | `annotation-shortcut-bus.js` 与快捷键设置都存在，但当前未装入 manifest；若后续启用，必须专项验证冲突。 | `extension/sites/alibaba-labelx/annotation-shortcut-bus.js`、`extension/sites/alibaba-labelx/settings-panel.js`、`extension/manifest.json` |
| popup / options 入口 | 有差异 | popup 目前只展示状态并打开 options；完整细粒度设置入口主要在页面内 `settings-panel`。 | `extension/popup/*`、`extension/options/*`、`extension/sites/alibaba-labelx/content.js` |
| validity 切换 | 已完成，待真页验收 | 本地切换与回读逻辑完整，但需要真实页面验证 `toggle-readback-mismatch` 是否触发。 | `extension/sites/alibaba-labelx/annotation-validity-writer.js` |
| 列表页自动流转 / 自动抢单 | 未完成 | 相关 legacy 文件存在，但未接入当前 manifest。 | `extension/sites/alibaba-labelx/legacy-auto-assign.js`、`extension/manifest.json` |
| 审核页与标注页差异 | 有 bug 风险 | 路由已区分 `label/check`，但 save/submit selector 仍需真实两类详情页横向对比。 | `extension/sites/alibaba-labelx/annotation-save-runner.js`、`extension/sites/alibaba-labelx/annotation-submit-runner.js` |

## 高风险点专项验收

| 高风险点 | 当前结论 | 真实页面怎么验 | 相关文件 |
| --- | --- | --- | --- |
| 真实路由识别 | 已完成 | 在四类 URL 执行 `await rt.getStateCollector().collectForced('route-check')`，核对 `pageType / routeKey / contextInfo.taskId`。 | `extension/sites/alibaba-labelx/site-contract.js`、`extension/sites/alibaba-labelx/page-state-collector.js` |
| document_start 页面 hook | 已接线，待真页验 | 刷新详情页后执行 `window.__ASREdgeAlibabaLabelxLegacyBridge?.getSnapshot()`，确认 `ready === true`。 | `extension/sites/alibaba-labelx/document-start.js`、`extension/sites/alibaba-labelx/page-world-hook.js` |
| 保存链 readback | 已接线，待真页验 | 在详情页执行 `await rt.getAnnotationSaveRunner().run({ forceClick: false })`，检查 `manualSaveSupported / saved / reason / manualSaveResult`。 | `extension/sites/alibaba-labelx/annotation-save-runner.js` |
| validity 切换 | 待真页验 | 对可操作 item 执行 `rt.getAnnotationValidityWriter().toggle({ itemIndex: 0, targetValidity: '有效' })`，核对 `nextValidity`。 | `extension/sites/alibaba-labelx/annotation-validity-writer.js` |
| 快捷键冲突 | 当前不可验收通过 | 模块文件存在但未装配；不要误判为“已启用待测”。 | `extension/sites/alibaba-labelx/annotation-shortcut-bus.js`、`extension/manifest.json` |
| 设置持久化 | 已完成，待跨页回归 | 在 options 与页面内设置面板修改设置，刷新当前页和重新打开 popup，确认回读一致。 | `extension/shared/storage.js`、`extension/sites/alibaba-labelx/settings-panel.js`、`extension/popup/popup.js` |
| 列表页自动流转 | 当前不可验收通过 | legacy 自动流转文件未接线。 | `extension/sites/alibaba-labelx/legacy-auto-assign.js`、`extension/manifest.json` |
| 审核页与标注页差异 | 高风险待验 | 在 `missionType=label` 与 `missionType=check` 页面分别执行 save / submit / flow，比较 `matched / clickable / reason`。 | `extension/sites/alibaba-labelx/annotation-save-runner.js`、`extension/sites/alibaba-labelx/annotation-submit-runner.js` |

## 真实 Edge 页面验收步骤

### 1. 基础准备

1. 在 Edge 扩展管理页重新加载当前 unpacked extension。
2. 打开一个真实 `https://labelx.alibaba-inc.com/*` 页面，并确认右下角出现 `ASR Edge` badge。
3. 打开 DevTools，勾选 Preserve log。
4. 在 Console 取 runtime 入口：

```js
const rt = window.__ASREdgeAlibabaLabelxRuntime;
```

### 2. 路由与 page-world 预检

在四类页面分别执行：

```js
await rt.getStateCollector().collectForced("acceptance-route-check");
window.__ASREdgeAlibabaLabelxLegacyBridge?.getSnapshot();
rt.getPageBridge()?.getStatus();
```

预期：

- 列表页得到 `task-list:label` 或 `task-list:check`
- 详情页得到 `task-detail:label:<subTaskId>` 或 `task-detail:check:<subTaskId>`
- `LegacyBridge.ready === true`
- `pageBridge.status === 'ready'` 或至少已有 ready detail

### 3. settings / popup / options 验收

1. 打开 options，切换平台总开关并保存。
2. 回到目标页刷新，确认运行时状态跟随变化。
3. 如果页面内设置面板已挂出，修改一个明显设置项并保存。
4. 再次刷新页面并重新打开 popup，核对状态是否持久化。

重点记录：

- 页面内设置是否能回读
- popup 是否仍只显示基础状态
- options 与页面内设置是否出现写入覆盖

### 4. 保存链验收

在标注详情页和审核详情页各执行一次：

```js
await rt.getAnnotationSaveRunner().run({
  forceClick: false,
  blurFirst: true,
  reloadAfter: false,
  buildPayload: true
});
```

重点看：

- `manualSaveSupported`
- `saved`
- `reason`
- `buildResult`
- `manualSaveResult`
- `controlBefore / controlAfter`

如果 `manualSaveSupported === false` 或 `reason === 'save-control-not-found'`，留档并对照 `docs/edge-live-debug-log.md` 新增记录。

### 5. validity 切换验收

在有可操作 item 的详情页执行：

```js
rt.getAnnotationValidityWriter().toggle({
  itemIndex: 0,
  targetValidity: "有效"
});
```

重点看：

- `toggled`
- `reason`
- `previousValidity`
- `nextValidity`

### 6. 提交流程验收

```js
await rt.getAnnotationSubmitRunner().run({
  forceClick: false,
  requireSafeSave: true,
  uploadStats: true
});
```

重点看：

- `safeSaveResult`
- `statsUploadResult`
- `submitAction`
- `reason`

如果 `statsUploadResult.reason === 'legacy-user-context-missing'`，这是当前已知接线差异，不要误记成页面 DOM 故障。

### 7. 单页完整流程验收

```js
const flowResult = await rt.getAnnotationPageFlowRunner().run({
  onlyActionable: true,
  maxItems: null,
  forceSaveClick: false,
  forceSubmitClick: false
});

const flowReport = rt.getAnnotationFlowReport().report(flowResult);
console.log(flowResult);
console.log(flowReport);
```

重点看：

- `applyPhase / savePhase / submitPhase`
- `saveResult / submitResult`
- `reason`
- `warnings`

说明：

- `reason === 'ok'` 只表示本地 flow 成功，不表示服务端最终成功。
- `savePhase.reason === 'ok'` 现在允许由 `manual-save-success / local-click-dispatched` 推导而来。
- `submitPhase.reason === 'ok'` 现在允许由 `submit-dispatched` 推导而来。

### 8. 列表页专项验收

在标注列表页和审核列表页执行：

```js
await rt.getStateCollector().collectForced("list-page-check");
```

当前只验：

- 是否识别为正确 `task-list:*`
- 控制面板执行类按钮是否被正确限制

当前不验收通过：

- 自动抢单
- 自动流转
- 自动跳下一题

## 已覆盖验证项

- `manifest` 装配顺序
- `document_start` 注入时机
- 真实路由识别静态检查
- page-world hook 代码装配
- save / submit / flow / validity 的静态链路检查
- settings-panel、control-panel、popup、options 的代码接线检查
- `node --check`、manifest JSON、manifest 文件存在性校验

## 未覆盖验证项

- 真实 Edge 页面网络层 readback
- 标注页与审核页 selector 差异回归
- shortcut 冲突真页验证
- 列表页自动流转真页验证
- 统计上报链路真页验证

