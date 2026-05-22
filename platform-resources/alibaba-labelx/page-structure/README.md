# Alibaba LabelX 通用页面结构（脱敏）

## 目录定位

本文件记录 ASR 转写和 ASR 快判共用的 LabelX 页面结构。项目专属题型结构仍维护在：

- `asr-transcription/page-structure/README.md`
- `asr-judgement/page-structure/`

## 已确认页面

- 标注首页：`/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`
- 标注详情页：`/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 审核首页：`/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
- 审核详情页：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`

## 顶部导航

稳定结构：

- 页面根：React SPA，主要内容挂载在 `#root`。
- 顶部导航容器：`.header-component-container`
- 左侧产品入口：
  - `智能标注`
  - `标注中心`
  - `帮助文档`
  - `Chatbot`
- 右侧项目选择区域：
  - Ant Design Select / combobox。
  - 当前项目名可在顶部导航区域读取。
- 用户区域：
  - 头像 / 用户名下拉结构与快判资料中的 `common-top-nav-avatar-dropdown.html` 属于同一类结构。

开发建议：

- 不使用运行时随机 class、`data-spm-*`、`data-aplus-*` 作为稳定选择器。
- 读取当前用户时优先使用顶部头像 hover 后的下拉展示名；失败时再回退接口或页面其他短文本。

## 首页通用结构

标注首页和审核首页布局相同，差异主要是路由和按钮文案。

稳定区域：

- 左侧菜单：
  - `标注任务`
  - `质检任务`
  - `验收任务`
- 主区域标题：`我的任务`
- tab：
  - `未完成`
  - `已完成`
- 搜索区：
  - 文案：`任务名称：`
  - 输入框 placeholder：`请输入任务名称`
- 我的任务表格列：
  - `任务名称`
  - `任务ID`
  - `子任务ID`
  - `分包ID`
  - `任务状态`
  - `领取时间`
  - `操作`
- 我的任务操作按钮：
  - 标注页常见：`标注`、`释放`
  - 审核页常见：`检查`、`释放`、`驳回原因`
- 分页：
  - Ant Design Pagination。
  - 页码、上一页、下一页、跳页输入框。
- 可领取任务区域：
  - 标题：`可领取的任务`
  - 任务卡 / 表格行显示 `任务名称`、`任务ID`、`已领取/总数`
  - 操作按钮：`领取`、`分人员领取`

当前供应商可见性：

- DOM 中没有独立供应商字段。
- 任务名称中可见供应商前缀，例如 `棋燊-...`。

## 详情页通用结构

稳定区域：

- 顶部详情工具栏：`.mark-toolbox`
- 面包屑容器：`.mark-toolbox-breadcrumb-wrapper`
- 面包屑内容：
  - 首页入口，例如 `质检任务`
  - 任务名称
  - `子任务标注`
- 状态摘要：
  - 例如 `被驳回 : 1 / 50`
  - `错误 : N`
  - `总数 : N`
  - `准确率 : N%`
- 顶部操作：
  - 审核详情页可见 `驳 回`
  - 标注详情页本轮未见 `驳 回`
  - `自动领取` switch
  - `提交任务`
  - 下拉按钮
- 提交下拉菜单：
  - `提交并结束`
  - `释放并结束`
  - `跳过必填校验` switch
- 题卡工具栏：`.labelRender-toolbox`
- 题卡分页：
  - `.labelRender-toolbox-item-pagination`
  - 默认可见 `10 条/页`
  - 每页条数下拉可见 `1/2/3/4/5/10/20/30/40/50 条/页`
- 筛选入口：
  - 顶部工具栏文本 `筛选`
  - 展开后显示筛选面板
  - 面板字段包括 `按内容区数据`、`按任务状态`、`按回答区数据(仅支持选择题)`、`条件关系`
  - 操作按钮：`重 置`、`确 定`
- 当前题号：
  - `.labelRender-answerNav`
  - `.labelRender-answerNav-status`
- 题卡滚动区：
  - `.labelRender-scrollable`
- 单条题卡：
  - `.labelRender-item`
- 当前题卡：
  - `.labelRender-item-selected`
- 内容区：
  - `.labelRender-item-content`
- 回答区：
  - `.labelRender-item-answer`

## 音频结构

当前转写审核详情页使用原生 `audio` 标签。

补采转写标注详情页时，音频结构与审核详情页一致，仍是原生 `audio` 标签加平台自定义前进、后退、重载和倍速控件。

可见结构：

- `audio`
- 播放按钮：浏览器原生 `播放`
- 时间进度条：浏览器原生 slider
- 音量 slider
- 静音按钮
- 平台自定义按钮：
  - `fast-backward`
  - `fast-forward`
  - `reload`
- 倍速下拉：
  - 文案：`倍速`
  - 当前值：`1x`
- 音频状态文本：
  - `音频已加载`

安全记录方式：

- 可记录 `audio.duration`、`paused`、`playbackRate`、`volume`。
- 只记录音频 URL 的 hostname、pathname 后缀、是否有签名 query。

## 高风险按钮

以下按钮会改变真实任务状态或数据，采集前必须获得用户明确授权：

- `提交任务`
- `驳 回`
- `自动领取`
- `领取`
- `释放`
- `分人员领取`
- `有效`
- `无效`
- `特殊`
- `标记错误`
- `取消标记错误`
- `撤销修改`
- 转写文本输入框编辑

## 待补采

- 快判详情页当前项目实时 DOM 与历史资料差异。
- 样式设置面板展开后的 DOM。
- 扩展启用后的转写工具栏 DOM 和按钮状态。

