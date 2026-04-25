# 阿里 ASR 语音判别

这个目录对应 LabelX 上的 ASR 快判 / 更优判断脚本。

## 当前状态

- 已归档真实页面结构资料：`page-structure/`
- 快判在 options 中拥有独立脚本详情页和简化设置表单。
- 快判已接入独立运行时，入口文件为 `content.js`、`audio-controller.js`、`page-world/network-observer.js`；音量、倍速、播放、分页、总时长、判别动作、快捷键、toast、工具栏、网络协议、ASR 差异视图和轻量题卡摘要等能力已拆成小文件。
- `content.js` 当前只作为入口编排层，不再承载具体功能实现。

## 负责范围

- 当前页面命中后，脚本中心以 `judgement` 作为快判脚本 ID 管理启停状态。
- options 快判详情页负责保存快判专属设置：全局音量、当前倍速、倍速步进、切换倍速重置、默认每页条数、自动播放音频、ASR 对齐差异视图、轻量题卡摘要、选择后辅助流转、快捷键。
- `page-structure/` 负责沉淀快判详情页和任务列表页 DOM 资料，供后续运行时实现使用。
- 运行时只读取 `shared/constants.js` 和 `shared/storage.js`，不复用转写业务模块。
- 当前运行时不实现保存、提交、自动流转，也不点击会产生业务动作的按钮。

## 能力路线

快判脚本的核心目标是服务标注员，提高“听音频、看两个 ASR 文本、判断哪个更好”的效率。后续能力按以下顺序推进：

1. 提效脚本：只改善页面展示、播放、快捷键、提示和信息聚合，不替标注员做业务判断。
2. 半自动人工：脚本给出差异摘要、疑似建议或风险提示，但最终选择仍由标注员确认。
3. 全自动：脚本自动选择、保存、提交或流转任务。只有在规则、接口、异常路径和回滚策略都充分验证后才允许进入这一阶段。

当前优先做第一阶段；第二阶段只做可解释建议；第三阶段暂不作为近期目标。

## ASR 对齐差异视图

- `judgement-asr-diff-view.js` 会读取“两个ASR文本”中的 `asr_text1` 与 `asr_text2`，隐藏原始双行文本，并生成扩展自己的对齐差异视图。
- 对齐算法使用字符级编辑距离：缺字 / 多字位置会用空白占位对齐；同一位置不同字会高亮显示；仅标点或空格不同会使用独立颜色。
- 题卡内会显示差异摘要，例如“完全相同”“仅标点或空格不同”“存在缺字或多字”“长度差异较大”“存在 N 处差异”。
- 该功能属于提效脚本，只增强阅读，不自动判断哪个 ASR 更好，不写入答案。
- 设置字段为 `asrDiffViewEnabled`，默认开启；可在 options 快判设置中关闭，关闭后恢复 LabelX 原始文本展示。
- 如果后续发现页面结构变更导致误判，应先更新 `page-structure/` 再调整选择器。

## 选择后辅助流转

- 设置字段为 `autoAdvanceAfterChoice`，默认关闭。
- 开启后，通过 `1~5` 快捷键或快判工具栏按钮选择“哪个ASR更优”后，会自动点击当前页下一条 `.labelRender-item[data-index]` 并滚动到中间。
- 该功能只在当前页内移动，不自动翻页，不自动提交，不自动领取新任务。
- 自动下一题内部派发的合成点击不会再触发快捷键动作，避免跳题时误写入下一题选项。

## 提效功能池

- ASR 文本差异高亮：已实现字符级对齐差异视图，用颜色标出新增、缺失、替换和仅标点差异，帮助标注员快速定位不同点。
- 差异摘要：已实现“完全相同 / 仅标点或空格不同 / 存在缺字或多字 / 长度差异较大 / 存在 N 处差异”等短标签。
- 差异导航：一题内如果差异较多，提供跳转到上一个 / 下一个差异的轻量按钮或快捷键。
- 文本布局增强：已将两条 ASR 文本改成更容易对齐阅读的双行显示，保留原文内容，不改变 LabelX 原始数据。
- 选择后辅助流转：已支持在选择 `1~5` 后自动滚动到当前页下一题，仍不自动提交。
- 轻量题卡摘要：已支持在每个题卡内显示“两个ASR文本”和“哪个ASR更优”的当前状态，可在 options 中开启或关闭；配合 LabelX 样式设置隐藏内容区 / 回答区和卡片大小调整，可以减少需要关注的可见内容。

## 轻量题卡摘要

- 设置字段为 `compactCardEnabled`，默认开启；可在 options 快判设置中关闭，关闭后运行时会移除已生成的摘要块。
- `judgement-compact-card.js` 会监听 `.labelRender-item[data-index]`，开关开启时在 `.labelRender-scrollable` 下、对应原题卡前方插入扩展摘要块，并给原题卡根节点添加 `data-asr-edge-judgement-compact-item` 作为关联标记。
- 摘要块不放进 `.labelRender-item`、`.labelRender-item-content` 或 `.labelRender-item-answer`，因此开启 LabelX 的“隐藏内容区 / 隐藏回答区”并压缩原题卡后仍可见。
- ASR 文本优先从原始 `.dt-text-container` 解析；如果原始容器被 ASR 差异视图隐藏或重绘，则回退读取差异视图的 `data-asr-edge-signature`。
- 摘要块显示 `asr_text1`、`asr_text2` 和“哪个ASR更优”的当前选择；未选中时显示“未选择”。
- 该能力不替代原生单选写入；选择仍通过 `1~5` 快捷键、快判工具栏按钮或关闭隐藏样式后操作原页面完成。
- 卡片大小仍由 LabelX 的“样式设置”控制，扩展只补充轻量摘要内容，不接管宿主列表布局。
- 如果不使用 LabelX 隐藏样式，摘要块也会显示，但会与原内容 / 原回答区并存；不需要时直接在 options 关闭。

## 半自动功能池

- 规则建议：根据文本差异类型给出“疑似第一个更好 / 疑似第二个更好 / 建议人工复听”的可解释提示，但不自动选中。
- 风险提示：当两条文本完全相同、只有标点差异、长度差异过大或疑似漏字时，在题卡内提醒复核。
- 一键采用建议：只有在建议足够可解释并经过人工验证后，才考虑提供按钮写入单选项。

## 全自动边界

- 自动选择、自动保存、自动提交、自动领取和自动流转属于全自动能力。
- 进入全自动前必须补齐保存、提交、失败响应、校验阻断、自动领取成功 / 失败等网络采集，并在 `README.md`、`page-structure/` 和 `log.md` 中记录验证范围。
- 未验证前，不允许让脚本静默提交或批量改写标注结果。

## 快捷键动作清单

默认 `1`~`5` 分别对应“哪个ASR更优”的五个选项；默认“增大音量”为 `[`，“减小音量”为 `]`，“重置音量”为 `\`，“播放/暂停当前音频”为 `Space`。其余快捷键默认为空，需要在脚本中心的“阿里ASR语音判别”详情页手动录制并保存。

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
运行时只响应浏览器真实用户事件；页面初始化、脚本派发的合成点击或合成按键不会触发判别动作。
判别写入必须能定位到当前题卡：优先使用 `.labelRender-item-selected`，其次使用正在播放的音频题卡，再回退到 `.labelRender-answerNav-status` 解析出的题号；无法定位时不会默认选择第一页第一题。
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

- 快判设置字段为 `itemsPerPage`，默认值为 `50 条/页`。
- 页面原生分页选择器只包含 `1/2/3/4/5/10/20/30/40/50 条/页`；这些原生档位只通过 LabelX 分页选择器切换，不走网络改写。
- `100/150/200/400 条/页` 自定义大页数暂不在 options 前端开放；历史配置中的 `all`、`全部`、`100/150/200/400 条/页` 会自动回退为 `50 条/页`。
- 顶部主导航栏会展示总时长，来源是 `/api/v1/label/center/subTask/{subTaskId}/data` 返回的 `data.dataList[].data.duration`。
- 总时长统计仍按完整子任务包读取，先尝试 `pageSize=400`；如果响应不足总数，会按 50 条分页只读补齐并求和。总时长不依赖当前页面实际渲染条数。

## 未完成能力

- `judgement-virtual-window.js`：实验性窗口化显示暂不启用，options 前端不展示开关，`content.js` 会强制把 `virtualWindowEnabled` 视为 `false`。
- 已尝试按当前题号只展开前后 5 题，并对窗口外 `.labelRender-item[data-index]` 写入 `asr-edge-judgement-window-hidden` 和 LabelX inline CSS 变量；实测未能稳定压缩宿主页面题卡，后续需要重新确认 LabelX 真实渲染层级和样式生效点。
- 暂存实现保留在代码中，后续继续处理时优先检查：题卡外层真实高度来源、`.labelRender-scrollable` 的滚动计算、React 重渲染是否覆盖 inline CSS 变量。
- `100/150/200/400 条/页` 自定义大页数显示暂不开放：当前 LabelX 页面在 100 条及以上仍有显示和交互稳定性问题，后续需要重新设计窗口化或其他降载方案，再恢复 options 入口。
- 轻量题卡摘要内的直接选择按钮暂不实现；后续如要在摘要块内提供直接选择按钮，必须先验证 Ant Design Radio 受控状态和保存请求是否可靠触发。

## 人工验证步骤

1. 重新加载扩展。
2. 在 options 脚本中心启用“阿里ASR语音判别”。
3. 在快判设置中确认“默认每页条数”只显示 `1/2/3/4/5/10/20/30/40/50 条/页`，并保存为 `50 条/页`。
4. 打开快判详情页，确认 popup 状态不是“注入失败”。
5. 确认页面最顶部主导航空白区域显示 `总时长`，并确认 `.mark-toolbox` 附近的快判工具栏显示当前每页档位。
6. 打开 DevTools Network，确认 `subTask/{id}/data` 请求的 `pageSize` 与 LabelX 原生分页档位一致，且点击第 2 页或更后页时 `page` 保持为页面真实页码，不会被改回 `1`；若总时长接口未返回全量，确认后续只读分页请求能补齐总时长。
7. 在快判设置中改为 `20 条/页` 保存并刷新详情页，确认页面原生分页切换到 `20 条/页`。
8. 确认 options 前端不能选择 `100/150/200/400 条/页`，历史保存过的大页数配置会回退显示为 `50 条/页`。
9. 在快判设置中确认“轻量题卡摘要”开启，保存并刷新详情页，确认 `.labelRender-scrollable` 下每个原题卡前方出现 `data-asr-edge-judgement-compact-card` 摘要块，并包含 `asr_text1`、`asr_text2` 与“哪个ASR更优”的当前状态。
10. 在快判设置中关闭“轻量题卡摘要”，保存并刷新详情页，确认扩展摘要块被移除；重新开启后摘要块恢复。
11. 在 LabelX 样式设置中开启“隐藏内容区”和“隐藏回答区”，确认每个题卡仍显示扩展轻量摘要块。
12. 在 LabelX 样式设置中调整“卡片大小”，确认轻量摘要块跟随题卡保留，不挤出分页和顶部工具栏。
13. 在隐藏内容区和回答区的状态下，按 `1`~`5` 或点击快判工具栏判别按钮，确认轻量摘要里的当前选择会更新。
14. 确认“两个ASR文本”位置显示扩展生成的对齐差异视图，缺字位置为空白占位，不同字符高亮。
15. 在快判设置中关闭“ASR 差异高亮”，保存并刷新详情页，确认恢复 LabelX 原始双行文本。
16. 在快判设置中重新开启“ASR 差异高亮”，保存并刷新详情页，确认对齐差异视图恢复。
17. 在快判设置中开启“选择后自动下一题”，保存并刷新详情页。
18. 在快判详情页按 `1`~`5`，确认当前选中题卡的“哪个ASR更优”会切换到对应选项，并自动跳到当前页下一题。
19. 关闭“选择后自动下一题”，保存并刷新详情页，确认选择后不再自动移动题卡。
20. 在快判详情页验证音量、重置音量、倍速、重置倍速、播放/暂停快捷键；默认增大音量为 `[`，减小音量为 `]`，重置音量为 `\`。
21. 确认工具栏按钮可执行判别、音量和倍速动作；播放/暂停不额外添加按钮。
22. 触发快捷键或按钮后，确认页面右上角会出现短提示。
23. 将 active project 切回“阿里ASR语音转写”，刷新 LabelX 页面，确认快判快捷键和工具栏不再触发。
24. 打开一个未标注的全新快判详情页，不按快捷键、不点工具栏，确认脚本不会自动选中“哪个ASR更优”的任一选项；若页面本身返回了已保存答案，应以接口数据或页面原始状态为准。

## 已知限制

- 浏览器自动播放策略可能拒绝无用户手势的 `audio.play()`，运行时只记录失败原因，不重复刷屏。
- 快判的“切换倍速重置”已强制启用；设置页不再提供开关，只保留重置目标倍速。
- 快捷键动作只改变当前页面运行态，不自动写回存储；需要持久化默认值时仍在 options 中保存。
- 鼠标左键这类通用按键可以录制，但会拦截页面点击，建议优先使用组合键或侧键。
- `100/150/200/400 条/页` 自定义大页数入口已暂停开放；如后续恢复，必须重新验证翻页、保存、答案回显和页面渲染稳定性。
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
  judgement-asr-diff-view.js
  judgement-compact-card.js
  judgement-auto-advance.js
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
- `judgement-virtual-window.js`：暂存未完成的实验性窗口化显示代码，当前不启用。
- `judgement-asr-diff-view.js`：维护 ASR 文本对齐差异视图、差异摘要和高亮展示。
- `judgement-compact-card.js`：维护轻量题卡摘要，并支持配合隐藏内容区 / 回答区使用。
- `judgement-auto-advance.js`：维护选择判别结果后的当前页自动下一题。
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
- ISOLATED world：`page-detector.js`、音频小模块、`audio-controller.js`、分页/总时长模块、暂存窗口化模块、ASR 差异视图、轻量题卡摘要、自动下一题、判别/提示/快捷键/工具栏模块、`content.js`。

调整文件名或新增模块时，必须同步更新 `manifest.json` 并验证脚本路径存在。

## 公共目录策略

当前不创建公共目录。只有当快判和转写确实复用同一能力，并且 README 中记录了复用点、调用方和验证步骤后，才考虑抽取公共代码。
