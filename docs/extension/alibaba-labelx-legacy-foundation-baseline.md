# Alibaba LabelX Legacy Foundation Baseline

## Purpose

本文件是 `legacy-reference/asr-script.user.js` 与当前 MV3 扩展底座之间的唯一对齐基线。

如果旧文档仍把项目描述成“skeleton / 骨架验证阶段”，以本文件为准。

本文件解决四件事：

1. 固定真实 LabelX 路由样本与当前 `pageType / routeName / routeKey` 契约。
2. 盘点旧油猴完整前端能力矩阵，作为后续 agent 的迁移真源。
3. 明确哪些旧机制必须替换为 MV3 等价物。
4. 固定当前扩展底座的模块边界、加载顺序和后续写入方式。

## 2026-04-22 Status Update

以下能力已完成首轮 MV3 等价迁移，不再属于“只有骨架、没有业务”的状态：

- `document-start` 页面级 hook 已通过 `extension/sites/alibaba-labelx/document-start.js` 注入页面脚本 `page-world-hook.js`，接管 fetch 拦截、dataList/currentPageTasks/subTask meta/timer 事件与 pending saves 状态。
- 保存链已接入 `legacy-save-coordinator.js`、`annotation-save-runner.js`、`annotation-submit-runner.js`、`annotation-page-flow-runner.js`，保留 pending saves、DOM 回读、手动安全保存、提交前强制安全保存与保存后刷新语义。
- 云端前端能力已迁入扩展：AI 标点修复、词库同步、词库上传待审、排行榜、导出统计上传、用户信息/时长上报。
- 列表页前端自动化已迁入扩展：自动抢单、列表拉取、下一任务自动流转、自动批量提交闭环。
- 设置面板、控制面板、工具栏与快捷键已接通上述能力入口。

当前明确保留的非完全等价点：

- 旧油猴 `@updateURL/@downloadURL` 不再可用；扩展改为浏览器版本检查 + 可选远端版本清单提示，不在运行时下载替换代码。
- 导出能力当前为 CSV 下载 + 统计上传，不等价复刻旧脚本的日期范围 Excel 导出与二进制下载链路。

## Authoritative Route Samples

以下 URL 是当前唯一权威样本：

| 页面 | 样本 URL | 当前契约 |
| --- | --- | --- |
| 标注首页 | `https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=1023` | `routeName=labelingTask` `pageType=task-list` `missionType=label` |
| 审核首页 | `https://labelx.alibaba-inc.com/corpora/labeling/checkTask?projectId=1023` | `routeName=checkTask` `pageType=task-list` `missionType=check` |
| 标注详情页 | `https://labelx.alibaba-inc.com/corpora/labeling/sdk?...missionType=label&projectId=1023&subTaskId=17863539` | `routeName=sdk` `pageType=task-detail` `missionType=label` |
| 审核详情页 | `https://labelx.alibaba-inc.com/corpora/labeling/sdk?...missionType=check&projectId=1023&subTaskId=19685353` | `routeName=sdk` `pageType=task-detail` `missionType=check` |

## Current Route Contract

### Stable route fields

当前 `site-contract.js` 对外提供这些稳定字段：

| 字段 | 说明 |
| --- | --- |
| `pathname` | 原始路径，例如 `/corpora/labeling/sdk` |
| `search` | 原始查询串，例如 `?missionType=check&projectId=1023&subTaskId=19685353` |
| `routeName` | 真实路由名，当前只允许 `labelingTask / checkTask / sdk / unknown` |
| `pageType` | 页面模型，当前只允许 `task-list / task-detail / unknown` |
| `missionType` | `label / check / null` |
| `projectId` | `projectId` 或 `appId` |
| `subTaskId` | SDK 详情页子任务 ID |
| `routeKey` | 稳定实例键，必须编码 mission/project/subTask，而不再只看 pathname |

### Route key rules

| 场景 | `routeKey` 规则 |
| --- | --- |
| `labelingTask` | `task-list:label:project:<projectId>` |
| `checkTask` | `task-list:check:project:<projectId>` |
| `sdk` | `task-detail:<missionType>:project:<projectId>:subtask:<subTaskId>` |
| 目标站未知路径 | `unknown:<pathname>` |
| 非目标站点 | `non-target` |

### Compatibility rule

为兼容现有站点模块，`pageType` 继续保持 `task-list / task-detail` 两级语义，不在这一轮把所有 consumer 改成 `labeling-task-list / check-task-list / check-detail / label-detail`。

真实模式差异通过 `routeName / missionType / routeKey / subTaskId` 继续表达。

## Legacy Capability Matrix

以下矩阵来自实际代码检查，不是猜测。

### 1. Pure Page Interaction

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| 单条快速填入 | `performQuickFill()` | 已有基础 runner，但还未做到旧脚本完整语义 |
| 全页标有效并填充 | `markAllValid()` | 旧脚本会进入 bulk 模式并联动保存 |
| 单条标有效 / 标无效 | `setRadioValue()` `applyRadioSideEffects()` | 与快捷键、自动清空、自动填入联动 |
| 当前条去空格 | `removeCurrentItemSpaces()` | 页面交互能力 |
| 全页去空格 | `removeAllSpaces()` | bulk 模式，旧脚本会联动手动保存 |
| 全页 AI 标点修复 | `fixPunctuationAll()` | 依赖云端接口 `/asr/fix-punctuation` |
| 数字转换 | `convertChineseNumberStr()` `convertAllChineseNums()` | 与单条输入/快捷键联动 |
| 音频播放/暂停 | `handleGlobalInput()` `triggerShortcutEvent()` | 需要读取当前活跃 audio |
| 音频前进/后退 | `adjustAudioTime()` | 纯页面控制 |
| 倍速升降/重置 | `adjustAudioRate()` | 支持默认倍速和自定义倍速快捷键 |
| 音量升降/重置 | `adjustVolume()` `setAudioVolume()` | 全局音频能力 |
| 自动播放 | `config.autoPlay` | 页面切换时自动处理 |
| 播完切下条 | `config.autoNext` | 与页面内导航联动 |
| 切换输入焦点 | `shortcutToggleFocus` `handleGlobalInput()` | 页面交互能力 |
| 本页时长 DOM 计算 | `calcDurationFromDOM()` `updateDurationDisplay()` | 只依赖当前 DOM / dataList |
| 复制本页时长 | `copyToClipboard()` `durationLi.onclick` | 纯前端能力 |
| 页面内工具栏按钮 | `injectToolbarButtons()` | 旧脚本直接把按钮插进平台页面 |
| 菜单按钮与面板入口 | `injectMenuButton()` | 包括脚本设置、排行榜、批量打开 |
| Toast / Loading mask / 高亮 | `showToast()` `showLoadingMask()` `showErrorHighlight()` | 属于联调与人工反馈层 |

### 2. Settings And Shortcuts

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| 持久化配置 | `GM_getValue / GM_setValue` 全局配置加载 | 必须替换成 `chrome.storage.local` |
| 设置面板 | `createSettingsPanel()` | 旧脚本是 DOM 内嵌面板，不适合直接照搬 |
| 快捷键录制/冲突检测 | `createShortcutRow()` `checkShortcutConflict()` `handleGlobalInput()` | 必须保留契约，但不要求本 agent 完整重写 UI |
| 自定义倍速档位 | `customRates` `renderCustomRatesUI()` | 与快捷键录制联动 |
| 自定义纠错词库 | `customReplacements` `renderCustomReplacementsUI()` | 同时影响 quickfill / AI 标点修复 |
| 自动填充开关 | `fillOnValid` `autoFillOnLoad` | 与页面交互、保存链联动 |
| 自动清空开关 | `clearOnInvalid` `autoClearInvalidValidation` | 与校验链联动 |
| 自动校验/自动提交开关 | `validateBeforeSubmit` `autoSubmitAfterValidation` | 与保存/提交流联动 |
| 自动领取开关 | `autoReceiveOnSubmit` | 审核/标注流程不同 |
| 抢单配置 | `autoAssign*` 配置项 | 属于列表页能力，不在本 agent 范围 |
| 调试环境切换 | `isDebugMode` | 云端接口本地/远程切换 |
| 版本升级与缓存清理 | `checkAndUpdateLifecycle()` `showUpgradeResetNotification()` | 旧油猴专有生命周期 |

### 3. Save And Submit Flow

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| `document-start` 页面内 `fetch` 拦截 | 文件头 `@run-at document-start` + `window.fetch = async function(...args)` | 本轮必须保留 MV3 可承载这类能力的底座 |
| 自动保存拦截与待保存队列 | `data-asr-disable-autosave` `__asr_pending_saves` | 旧逻辑核心之一 |
| 从 DOM 反构 payload | `buildAndInjectPayloadFromDOM()` | 旧逻辑把页面当前状态重新打包进 pending saves |
| 手动合并保存 | `performManualSave()` `ASR_TriggerManualSave` | 依赖 page-world 事件桥和 pending save 队列 |
| blur flush 防丢数据 | `performManualSave(reloadAfter, flushFirst)` | 保存前需要先把 React 输入值刷回页面状态 |
| 全页校验 | `validateAllItems()` | 与自动清空、自动填入、提交流联动 |
| 智能提交 | `performQuickSubmit()` | 先校验，再视模式执行保存/提交 |
| 提交并结束 / 提交任务 | `executeActualSubmit()` | 审核与标注分支不同 |
| 校验后自动提交 | `autoSubmitAfterValidation` | 自动化链入口之一 |
| 自动批量提交流转 | `autoBatchSubmit` `autoNavigateToNextTask()` | 高风险自动化，不在本 agent 范围 |

### 4. Cloud API Capability

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| 云端词库同步 | `/asr/asr-dict.json` `syncDictFromCloud()` | 旧脚本通过 `GM_xmlhttpRequest` 访问 |
| 本地词库上传待审 | `/asr/submit-dict-review` | 属于云端写接口能力 |
| AI 标点修复 | `/asr/fix-punctuation` | 云端代理 Qwen/GLM/Kimi 等模型 |
| 排行榜读取 | `/asr/leaderboard?date=...` | 有独立可拖拽面板与自动刷新 |
| 统计上传 | `/asr/upload-stats` | 提交/导出链都会用到 |
| 版本检查与脚本下载 | `/asr/asr-script.user.js` + `@updateURL/@downloadURL` | 旧油猴自更新机制，必须换成扩展自己的发布/update 流程 |
| 调试服务器切换 | `getApiBase()` | 本地 `127.0.0.1:3101` 与远程 `47.108.254.138:3101` 切换 |

### 5. List Page Capability

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| 列表页识别 | `isListPage()` | 真实路径就是 `labelingTask / checkTask` |
| 列表页分页切换 | `tryCheckPagination()` `executePaginationChange()` | 旧脚本主动修改每页条数 |
| 批量打开当前页审核任务 | `批量打开当前页任务` 按钮逻辑 | 只在 `checkTask` 场景下出现 |
| 拉取当前页任务列表 | `ASR_CurrentPageTasksReady` `subTasks?type=` | 同时服务于批量打开和自动导航 |
| 导出 CSV/统计 | `showExportDialog()` `exportTasksToExcel()` `fetchByDateBinary()` | 包含已完成/未完成、大批量分页抓取、上传服务端 |
| 自动抢单 | `executeAutoAssign()` `startAutoAssignPoll()` | 需要额外后台/网络策略 |
| 自动跳转下一题 | `autoNavigateToNextTask()` | 列表页自动化能力 |

### 6. Debug And Acceptance

| 能力 | 旧脚本入口/证据 | 迁移备注 |
| --- | --- | --- |
| 全量控制台日志 | 几乎所有函数都有 `[ASR]` 日志 | 当前扩展继续保留 debug 输出 |
| 事件总线 | `ASR_DataLoaded` `ASR_TimerTriggered` `ASR_ManualSaveResult` 等 | MV3 需要拆成 page-world 与 isolated-world 事件桥 |
| 用户名探测 | `ensureUserName()` `unsafeWindow.INITIAL_STATE` + pointer 交互 | 不能继续依赖 `unsafeWindow` |
| 升级提示/刷新提示 | `showFloatingUpdatePrompt()` `showRefreshReminder()` | 旧油猴自更新配套 |
| 页面错误高亮 | `showErrorHighlight()` | 适合迁入调试/验收层 |
| 顶部状态与时长展示 | `updateDurationDisplay()` | 属于联调可见性能力 |

## Required MV3 Replacements

| 旧机制 | 旧脚本做法 | MV3 等价物 |
| --- | --- | --- |
| `GM_getValue / GM_setValue` | 油猴脚本级 KV 存储 | `extension/shared/storage.js` 封装的 `chrome.storage.local` |
| `GM_xmlhttpRequest` | 对远程词库、排行榜、AI、更新服务发请求 | 背景页/扩展页 `fetch()` + `host_permissions`；如必须保留页面同源语义，则走 page-world fetch |
| `@updateURL / @downloadURL` | 油猴脚本自更新 | 扩展版本由 `manifest.version`、发布包和更新流程负责，不再在运行时下载替换脚本 |
| `unsafeWindow` | 直接读页面 JS 上下文变量 | `MAIN world` content script + `CustomEvent` bridge；必要时由 page-world 模块读页面变量后经事件回传 |
| 自定义内联注入 `<script>...</script>` | 在 `document-start` 向页面上下文塞拦截器 | MV3 静态声明 `world: "MAIN"` + `run_at: "document_start"` 的 page-world bridge |
| 页面内 pending save 全局变量 | `window.__asr_pending_saves` 等 | `page-world bridge` 下的受控 page-world 状态命名空间，避免散落在 isolated world |

## Current MV3 Replacement Notes

### `document-start` / pending saves

当前等价实现为：

1. `document-start.js` 在 isolated world 提前初始化 `window.__ASREdgeAlibabaLabelxLegacyBridge`。
2. 该 bridge 注入 `page-world-hook.js` 到页面上下文，接管旧脚本依赖的页面级 `fetch` 拦截。
3. 页面上下文缓存 `cachedDataList / currentPageTasks / subTaskMeta / itemDurations / pendingSaves`。
4. isolated world 通过 `CustomEvent` 向 page world 发出 `inject-pending-saves / manual-save-request / clear-pending-saves / set-autosave-interception` 命令。
5. 保存与提交 runner 必须优先走 `legacy-save-coordinator` 的 DOM 回读与手动安全保存语义，只有在没有 legacy 数据上下文时才回退到本地按钮 click。

### 提交前安全保存 / 自动闭环

当前等价实现为：

- `annotation-submit-runner.js` 在提交前强制执行安全保存，并在需要时上传统计。
- `annotation-page-flow-runner.js` 串联整页填充/报告/安全保存/提交。
- `legacy-batch-flow.js` 负责 task-detail 与 task-list 两类页面的自动闭环调度，并在流转前后保留状态位、报告结果与延时跳转。

### 版本检查替代

旧 userscript 的 `@updateURL/@downloadURL` 已替换为：

- 前端“手动检查更新”入口调用 `chrome.runtime.requestUpdateCheck()`。
- 如设置中额外提供远端版本清单 URL，则后台同步读取该 JSON 并回显远端版本。
- 扩展运行时不会像 userscript 一样下载并替换自身代码；真正更新依赖浏览器扩展更新机制与发布包。

## Current MV3 Foundation

### Manifest decisions

当前 manifest 已固定这些规则：

1. `MAIN world` content script 在 `document_start` 注入，专门保留页面上下文能力槽位。
2. `ISOLATED world` content scripts 也在 `document_start` 注入，但业务装配继续由 `content.js` 在脚本加载和 `DOMContentLoaded` 两个阶段收口。
3. `host_permissions` 已显式放开 `https://labelx.alibaba-inc.com/*`、`http://47.108.254.138:3101/*`、`http://127.0.0.1:3101/*`，用于 legacy server 的扩展背景请求。
4. `web_accessible_resources` 已对白名单暴露 `sites/alibaba-labelx/page-world-hook.js`，供 `document-start.js` 在页面世界注入。

### Startup sequence

当前启动顺序固定为：

1. `shared/constants.js`
2. `shared/storage.js`
3. `sites/alibaba-labelx/runtime-contract.js`
4. `sites/alibaba-labelx/site-contract.js`
5. `sites/alibaba-labelx/page-world/bridge.js` in `MAIN world`
6. `sites/alibaba-labelx/document-start.js`
7. `page-detector -> route-observer -> page-state-collector`
8. annotation modules + legacy modules (`legacy-api-client / legacy-user-context / legacy-dictionary-sync / legacy-ai-punctuation / legacy-export / legacy-leaderboard / legacy-version-check / legacy-auto-assign / legacy-batch-flow`)
9. `runtime-gate.js`
10. `runtime-debug.js`
11. `content.js`

### Runtime contract

`extension/sites/alibaba-labelx/runtime-contract.js` 现在是运行时模块表真源：

- 统一声明 `RUNTIME_MODULES`
- 固定 `PAGE_WORLD_BRIDGE` 事件名/全局名/状态 attribute
- 固定启动阶段 `STARTUP_SEQUENCE`

后续 agent 如果新增 isolated-world 模块：

1. 先在 `runtime-contract.js` 增加 module descriptor。
2. 再把文件按顺序接到 `manifest.json`。
3. 除非引入了新的启动阶段，否则不要改 `content.js`。

后续 agent 如果新增 page-world 模块：

1. 文件放到 `extension/sites/alibaba-labelx/page-world/`
2. 由 manifest 的 `MAIN world document_start` entry 继续声明
3. 与 isolated world 的通信只走 `PAGE_WORLD_BRIDGE` 对应的 `CustomEvent`

## Explicit Non-Goals Of This Baseline

本基线明确不包含：

- 完整设置面板重做
- 完整工具栏迁移
- 完整保存链、提交链、pending save 业务实现
- AI 标点、排行榜、导出、词库云同步、自动抢单、自动批处理
- 任何会把当前最小底座升级成完整业务产品的跨模块重写

## Current Write Boundaries

当前应优先修改的区域：

- `extension/manifest.json`
- `extension/shared/constants.js`
- `extension/shared/storage.js`
- `extension/sites/alibaba-labelx/runtime-contract.js`
- `extension/sites/alibaba-labelx/site-contract.js`
- `extension/sites/alibaba-labelx/page-detector.js`
- `extension/sites/alibaba-labelx/route-observer.js`
- `extension/sites/alibaba-labelx/page-state-collector.js`
- `extension/sites/alibaba-labelx/runtime-gate.js`
- `extension/sites/alibaba-labelx/runtime-debug.js`
- `extension/sites/alibaba-labelx/content.js`
- `extension/sites/alibaba-labelx/page-world/*.js`

不应在这个阶段抢写完的区域：

- 完整设置 UI
- 完整保存与提交业务
- 云端业务 client
- 列表页自动化
- 排行榜/导出/AI/词库全部业务细节

## Acceptance Baseline For Later Agents

后续 agent 至少要基于本文件满足这些前提，再继续迁业务：

1. `labelingTask / checkTask / sdk` 不能再被误判成 `non-target` 或 `non-task-detail`。
2. `pageType` 继续保持对现有 consumer 兼容。
3. `routeKey` 必须编码 mission/project/subTask，而不是只看 pathname。
4. page-world document-start 槽位必须保留，不能再退回 isolated-only。
5. 新增业务模块时，优先追加契约和 manifest，不要把 `content.js` 再变回“大杂烩入口”。
