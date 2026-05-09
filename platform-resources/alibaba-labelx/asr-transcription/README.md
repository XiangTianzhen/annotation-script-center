# Alibaba LabelX ASR 转写资料

## 当前状态（2026-05-09）

- 当前仍处于 `0.2.10` 修复阶段，版本不升级到 `0.2.11`。
- `extension/sites/alibaba-labelx/asr-transcription/` 已切换为轻量工具栏版。
- 旧版独立大表单、页面 overlay 设置面板已移除。
- options 已恢复转写轻量设置面板与当前功能快捷键配置（不包含统计上传开关）。
- 运行时只保留当前题与当前音频基础动作，不包含保存/提交/自动化/AI链路。
- 工具栏已改为页面内注入：优先 `.mark-toolbox`，找不到时回退到首条题卡前，不再默认顶部固定悬浮。
- 新增“转写统计导出”链路：复用快判上传架构口径，独立后端目录与独立 CSV 列；统计上传与定时上传运行时强制启用。

## 当前业务口径（与扩展运行时一致）

- 一条音频对应一个完整文本框。
- 仅保留按钮能力：
  - 当前题：快速填入、标有效、标无效、去空格、数字转换、焦点切换。
  - 当前音频：播放/暂停、前进/后退、倍速提高/降低/重置、音量提高/降低/重置、复制时长。
- 默认值由 `shared/constants.js -> DEFAULT_ASR_CONFIG` 提供，运行时读取项目 `asrConfig` 覆盖。
- options 转写轻量设置面板可配置：
  - 自动播放、默认倍速、重置倍速、倍速步进、前进/后退步长、默认音量
  - 当前题行为（默认有效、标有效自动填入、标无效自动清空）
  - 当前保留功能快捷键（含上传统计）
- 统计上传与定时上传不在 options 转写详情页提供开关。
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
- `transcription-stats-client.js`：浏览器端统计上传客户端，只做采集、上传、按钮和定时调度，不做 CSV 落盘。
- `shortcut-bus.js`：浏览器端转写快捷键运行时，只调当前保留动作，不引入保存/提交/AI/批量动作。
- `backend/`：Node 后端统计服务，负责 health/config/upload/download、分包合并、CSV 写入与下载。
- `active-item.js`：当前题定位。
- `item-actions.js`：当前题动作。
- `audio-controller.js`：当前音频动作。
- `text-utils.js`：文本处理。

## 转写统计导出口径

- 前端上传入口：
  - 顶部导航头像旁“上传转写统计”按钮。
  - 转写工具栏“上传统计”按钮。
- 详情接口取数口径：
  - 页面实测常见 `GET /api/v1/label/center/subTask/{subTaskId}/data?page=1&pageSize=10...`。
  - 扩展统计上传默认用 `pageSize=100`，并限制 `maxPages=3`、`maxItems=300` 以减少请求数。
  - 详情请求遇空页、重复页签名、`recordCount` 缺失会提前停止，避免请求风暴。
  - `subTaskId` 在拼 URL 前必须先做空白清洗（普通空格、Tab、换行、回车、全角空格）。
  - 首页列表最多抓 `5` 页，详情并发 `2`，单次上传最多处理 `50` 个转写子任务，且同一 `subTaskId` 单次只请求一次。
  - 上传锁：若上传中再次触发，返回 `upload-in-progress` 并跳过，不并发第二轮。
- 转写/快判识别口径：
  - 快判排除：`labelModel=vote` 或任务名命中 `ASR更优结果判断/ASR更优/更优结果判断/更优判断`（典型 `size=400`）。
  - 转写采集：`labelModel=single` 或任务名命中 `中文普通话asr任务/中文普通话asr/asr任务/普通话asr`（典型 `size=50`）。
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
- 资料与代码均不记录 cookie、token、完整音频 URL、完整签名 URL。

## 网络采集文档

- 已补充真实采集网络口径文档：`network.md`。
- 文档覆盖首页 `tasks/subTasks/tasks/process` 与详情页 `subTask/{id}/data|summary|board|getLabelTaskInfo`。
- 已明确 `subTaskId` 可能包含换行和空格编码，接口构造前必须先清洗。
- 已明确页面请求常见 `pageSize=10`，扩展统计上传策略为 `pageSize=100 + 硬上限`。
- 已新增转写页面结构文档：`page-structure.md`。
- 2026-05-09 已补充审核首页和审核详情页采集：`missionType=check`、`type=check`、`subTaskType=check`、有效性切换、转写文本自动保存、提交任务和自动领取链路。
- 已确认当前接口没有独立供应商字段；后续统计只能优先从 `taskName` / `name` 前缀推断，例如 `棋燊`、`希尔贝壳`。

## 后续约束

- 若未来要恢复已删旧能力，必须走“新需求 -> 新设计 -> 新实现 -> 新验收”，不能直接恢复旧文件或旧架构。
