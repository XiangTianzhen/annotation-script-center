# 阿里 ASR 语音判别

这个目录对应 LabelX 上的 ASR 快判 / 更优判断脚本。

## 当前状态

- 已归档真实页面结构资料：`page-structure/`
- 快判在 options 中拥有独立脚本详情页和简化设置表单。
- 快判已接入独立运行时，入口文件为 `content.js`、`audio-controller.js`、`page-world/network-observer.js`；音量、倍速、播放、分页、总时长、判别动作、快捷键、toast、工具栏、网络协议等能力已拆成小文件。
- `content.js` 当前只作为入口编排层，不再承载具体功能实现。

## 负责范围

- 当前页面命中后，脚本中心以 `judgement` 作为快判脚本 ID 管理启停状态。
- options 快判详情页负责保存快判专属设置：全局音量、当前倍速、倍速步进、切换倍速重置、默认每页条数、自动播放音频、快捷键。
- 快判提供实验性窗口化显示开关，开启后只展开当前题前后 5 题，其他题卡折叠为 0 高度。
- `page-structure/` 负责沉淀快判详情页和任务列表页 DOM 资料，供后续运行时实现使用。
- 运行时只读取 `shared/constants.js` 和 `shared/storage.js`，不复用转写业务模块。
- 当前运行时不实现保存、提交、自动流转，也不点击会产生业务动作的按钮。

## 快捷键动作清单

默认 `1`~`5` 分别对应“哪个ASR更优”的五个选项；默认“播放/暂停当前音频”为 `Space`。其余快捷键默认为空，需要在脚本中心的“阿里ASR语音判别”详情页手动录制并保存。

- 选择：第一个更好
- 选择：第二个更好
- 选择：都不好
- 选择：不确定或差不多
- 选择：其他方言或语种
- 增大音量
- 减小音量
- 重置音量
- 提高倍速
- 降低倍速
- 重置倍速
- 播放/暂停当前音频

快捷键支持键盘组合和鼠标按键。运行时如果焦点在 `input`、`textarea`、`select` 或 `contenteditable` 内，不触发全局快捷键。
删除快捷键后保存即可清空；录制时按 `Esc` 退出，不保存。

## DOM 选择器依据

当前音频能力只依赖已采集的快判详情页结构：

- 单条题卡：`.labelRender-item[data-index]`
- 当前选中题卡：`.labelRender-item-selected`
- 音频播放器容器：`.dt-audio-base-container`
- 音频元素：`audio[controls]`
- 顶部工具栏区域：`.mark-toolbox`
- 顶部主导航区域：`.header-component-container`

运行时工具栏挂载在 `.mark-toolbox` 内，优先放在 `.mark-toolbox-breadcrumb-wrapper` 后方；如果页面结构变化，则回退到 `.mark-toolbox` 内部首位或末尾。总时长挂载在顶部主导航栏，优先插入 `.header-component-container` 的菜单后方。
后续新增快判运行时动作时，除页面已有等价控件的动作外，应同步在这个工具栏中增加按钮入口。

题卡列表和音频节点是异步加载的，运行时使用 `MutationObserver` 监听新增节点，并对已有和后续加载的 `audio` 同步音量与倍速。

## 分页与总时长

- 快判设置字段为 `itemsPerPage`，默认值为 `100 条/页`。
- 页面原生分页选择器只包含 `1/2/3/4/5/10/20/30/40/50 条/页`；`100/150/200/400 条/页` 属于扩展自定义档位，运行时会先让原生选择器保持 `50 条/页`，再把页面 `data` 请求的 `pageSize` 改写为配置值。
- 历史配置中的 `all`、`全部`、`全部（400 条）` 会自动兼容为 `400 条/页`，但设置页不再展示“全部”选项。
- 顶部主导航栏会展示总时长，来源是 `/api/v1/label/center/subTask/{subTaskId}/data` 返回的 `data.dataList[].data.duration`。
- 总时长统计仍按完整子任务包读取，先尝试 `pageSize=400`；如果响应不足总数，会按 50 条分页只读补齐并求和。总时长不依赖当前页面实际渲染条数。
- `400 条/页` 会让 LabelX 页面一次渲染大量题卡、音频控件、单选项和文本框，卡顿主要来自宿主页面 DOM / React 渲染压力。扩展侧更稳的方案是默认使用 `100` 或 `150`，保留总时长全量统计；真正想让 400 条不卡，需要宿主列表虚拟滚动或窗口化渲染，这属于侵入式改造，当前不建议由 content script 强行接管。

## 窗口化显示

- 设置字段为 `virtualWindowEnabled`，默认关闭。
- 开启后，`judgement-virtual-window.js` 会优先从当前选中题卡的 `.labelRender-answerNav-status` 文本解析题号，例如 `第 1 题`；解析失败时回退到 `.labelRender-item[data-index]`。
- 当前题前后各 5 题保持展开，其余 `.labelRender-item[data-index]` 会添加 `asr-edge-judgement-window-hidden`，通过高度、边距、内边距和边框归零降低页面渲染压力。
- 该功能不删除 DOM、不主动保存、不改写 LabelX 数据，只做样式折叠；如果发现滚动定位、题卡选中或校验异常，可以在 options 中关闭。

## 人工验证步骤

1. 重新加载扩展。
2. 在 options 脚本中心启用“阿里ASR语音判别”。
3. 在快判设置中将“默认每页条数”设为 `100 条/页` 或 `150 条/页`，保存。
4. 打开快判详情页，确认 popup 状态不是“注入失败”。
5. 确认页面最顶部主导航空白区域显示 `总时长`，并确认 `.mark-toolbox` 附近的快判工具栏显示当前每页档位。
6. 打开 DevTools Network，确认 `subTask/{id}/data` 请求的 `pageSize` 被改写为设置页选择的档位；若总时长接口未返回全量，确认后续只读分页请求能补齐总时长。
7. 在快判设置中改为 `20 条/页` 保存并刷新详情页，确认页面原生分页切换到 `20 条/页`。
8. 需要压测时，再分别设置 `100/150/200/400 条/页`，记录页面渲染耗时、DOM 数量和操作流畅度。
9. 开启“窗口化显示”，确认只展开当前题前后 5 题，切换当前题后可见窗口同步移动；关闭后确认题卡恢复展开。
10. 在快判详情页验证音量、重置音量、倍速、重置倍速、播放/暂停快捷键。
11. 在快判详情页按 `1`~`5`，确认当前选中题卡的“哪个ASR更优”会切换到对应选项。
12. 确认工具栏按钮可执行判别、音量和倍速动作；播放/暂停不额外添加按钮。
13. 触发快捷键或按钮后，确认页面右上角会出现短提示。
14. 将 active project 切回“阿里ASR语音转写”，刷新 LabelX 页面，确认快判快捷键和工具栏不再触发。

## 已知限制

- 浏览器自动播放策略可能拒绝无用户手势的 `audio.play()`，运行时只记录失败原因，不重复刷屏。
- 快判的“切换倍速重置”已强制启用；设置页不再提供开关，只保留重置目标倍速。
- 快捷键动作只改变当前页面运行态，不自动写回存储；需要持久化默认值时仍在 options 中保存。
- 鼠标左键这类通用按键可以录制，但会拦截页面点击，建议优先使用组合键或侧键。
- `100/150/200/400 条/页` 依赖当前 LabelX 接口接受对应 `pageSize`；如果页面或服务端限制条数，扩展只保证总时长通过只读分页补齐，页面实际渲染条数需要以实测为准。
- `400 条/页` 的卡顿风险较高，建议只在机器性能、浏览器内存和 LabelX 当前页面状态都允许时使用。
- 本目录不包含提交、保存、自动领取、自动流转逻辑。

## 当前文件结构

```text
asr-judgement/
  README.md
  content.js
  page-detector.js
  judgement-actions.js
  judgement-shortcuts.js
  judgement-toast.js
  judgement-toolbar.js
  judgement-page-size.js
  judgement-duration-summary.js
  judgement-virtual-window.js
  audio-controller.js
  audio-volume-controller.js
  audio-rate-controller.js
  audio-playback-controller.js
  page-world/
    network-protocol.js
    network-config.js
    network-url-rewriter.js
    network-summary.js
    network-observer.js
  page-structure/
    README.md
    asr-judgement-detail/
    labeling-task-home/
    network-capture/
```

项目级维护规则与修改日志放在仓库根目录：

- `AGENTS.md`
- `log.md`

## 页面结构资料

`page-structure/` 记录通过 Google Chrome DevTools MCP 采集到的 LabelX 快判页面 DOM 结构。

已包含：

- `asr-judgement-detail/`
  - 快判详情页
  - 多题卡结构
  - 音频播放器
  - ASR 更优单选组
  - 特殊情况文本框
  - 顶部提交与自动领取区域
- `labeling-task-home/`
  - 标注任务列表页
  - 我的任务
  - 可领取任务
  - 领取 / 标注 / 释放按钮结构

## 运行时模块边界

- `content.js`：只保留设置加载、启停编排、状态聚合、网络桥接、总时长状态和模块串联。
- `judgement-actions.js`：维护判别选项定义、快捷键动作顺序和“哪个ASR更优”写入逻辑。
- `judgement-shortcuts.js`：维护键盘 / 鼠标快捷键匹配、事件拦截和 follow-up 事件抑制。
- `judgement-toast.js`：维护右上角运行时提示。
- `judgement-toolbar.js`：维护 `.mark-toolbox` 工具栏和顶部主导航总时长挂载。
- `judgement-page-size.js`：维护默认每页条数、原生分页选择器点击和重试逻辑。
- `judgement-duration-summary.js`：维护总时长请求、分页补齐和网络摘要归一化。
- `judgement-virtual-window.js`：维护实验性窗口化显示，按当前题号折叠窗口外题卡。
- `audio-controller.js`：只保留音频扫描、配置、状态和动作路由。
- `audio-volume-controller.js`：维护音量与 Web Audio gain 逻辑。
- `audio-rate-controller.js`：维护倍速、倍速显示和重置逻辑。
- `audio-playback-controller.js`：维护播放、暂停、自动播放和相邻音频播放。
- `page-world/network-*.js`：运行在 MAIN world，负责 data 请求改写、响应摘要和 `postMessage`。

后续继续拆分时，优先保持 `content.js` 作为入口编排层，不要把具体 DOM 操作重新塞回入口。

新增快判 JS 时应直接放入 `asr-judgement/`，并同步更新 `manifest.json` 或相应动态加载入口。不要复制 `asr-transcription/settings-panel.js` 给快判；快判保持独立简化设置页。

## 加载顺序要求

快判依赖 `manifest.json` 的数组顺序加载，不使用打包器或 ES module：

- MAIN world：`network-protocol.js`、`network-config.js`、`network-url-rewriter.js`、`network-summary.js`、`network-observer.js`。
- ISOLATED world：`page-detector.js`、音频小模块、`audio-controller.js`、分页/总时长/窗口化模块、判别/提示/快捷键/工具栏模块、`content.js`。

调整文件名或新增模块时，必须同步更新 `manifest.json` 并验证脚本路径存在。

## 公共目录策略

当前不创建公共目录。只有当快判和转写确实复用同一能力，并且 README 中记录了复用点、调用方和验证步骤后，才考虑抽取公共代码。
