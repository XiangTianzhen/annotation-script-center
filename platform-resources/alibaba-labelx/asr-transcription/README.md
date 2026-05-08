# Alibaba LabelX ASR 转写资料

## 当前状态（2026-05-08）

- `extension/sites/alibaba-labelx/asr-transcription/` 已切换为轻量工具栏版。
- 独立设置页、页面 overlay 设置面板、快捷键配置已全部移除。
- 运行时只保留当前题与当前音频基础动作，不包含保存/提交/自动化/AI链路。
- 工具栏已改为页面内注入：优先 `.mark-toolbox`，找不到时回退到首条题卡前，不再默认顶部固定悬浮。
- 新增“转写统计导出”链路：复用快判上传架构口径，独立后端目录与独立 CSV 列。

## 当前业务口径（与扩展运行时一致）

- 一条音频对应一个完整文本框。
- 仅保留按钮能力：
  - 当前题：快速填入、标有效、标无效、去空格、数字转换、焦点切换。
  - 当前音频：播放/暂停、前进/后退、倍速提高/降低/重置、音量提高/降低/重置、复制时长。
- 固定默认值由运行时内置，不在 options 暴露：
  - `autoPlay=false`、`playbackRateValue=1`、`resetRateValue=1`、`rateStepValue=0.1`
  - `seekStepSeconds=1`、`volumeValue=100`
  - `fillOnValid=true`、`clearOnInvalid=true`、`defaultValid=false`
- 仍不实现时间戳、说话人区分、AI 初稿/校对/格式化/标点。
- 仍不实现自动保存、自动提交、自动跳转、全页批量修改。

## 注入状态与 popup 口径

- content script 在 `document_start` 注入后保持 pending，不因首轮 DOM 未就绪而永久停机。
- 通过 `DOMContentLoaded`、`load`、`MutationObserver`、SPA 路由变化、短轮询持续重试。
- popup 状态区分：
  - 已注入但未命中详情页：显示“已注入，等待转写详情页”。
  - 已命中并启动：显示“运行成功”。
  - 真正无响应：显示“注入失败”。

## 目录职责（轻量版）

- `content.js`：页面命中重试 + 运行时编排 + ping。
- `toolbar.js`：页面内工具栏挂载、分组渲染、状态块与重挂载。
- `runtime-config.js`：启用状态与固定默认值。
- `transcription-stats-server.js`：统计采集、手动上传按钮、自动上传调度。
- `active-item.js`：当前题定位。
- `item-actions.js`：当前题动作。
- `audio-controller.js`：当前音频动作。
- `text-utils.js`：文本处理。

## 转写统计导出口径

- 前端上传入口：
  - 顶部导航头像旁“上传转写统计”按钮。
  - 转写工具栏“上传统计”按钮。
- 上传接口：
  - `https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload`
  - `http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload`
- 下载接口：
  - `https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/download`
  - `http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download`
- 默认定时上传：`10:00`、`16:00`，jitter `10` 分钟。
- 后端目录：`platform-resources/alibaba-labelx/asr-transcription/backend/`。
- 统计写入目录：`platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`。
- CSV 列：
  `任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`。
- 同一分包按 `mergeKey.batchId` 合并标注与审核记录。
- 服务器下载地址需部署最新后端后可用；本地可先用 `127.0.0.1:3333` 验证。

## 后续约束

- 若未来要恢复已删旧能力，必须走“新需求 -> 新设计 -> 新实现 -> 新验收”，不能直接恢复旧文件或旧架构。
