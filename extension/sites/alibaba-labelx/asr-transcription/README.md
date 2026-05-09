# 阿里 ASR 转写（轻量工具栏版）

## 当前状态（2026-05-08）

- 当前仍处于 `0.2.10` 修复阶段，`manifest.version` 保持 `0.2.10`。
- `asr-transcription` 已删除旧版独立大表单与页面内 overlay 设置面板。
- 已恢复转写轻量设置面板与快捷键运行时（仅覆盖当前保留功能）。
- 当前保留转写详情页工具栏按钮能力，并允许通过 options 调整基础参数。
- 工具栏已改为页面内注入结构：优先挂载 `.mark-toolbox`，其次挂到首条题卡上方，不再默认固定悬浮在页面顶部中央。
- 新增转写统计导出能力：支持手动上传与定时上传，后端按分包合并 CSV。
- 转写统计上传地址不再在脚本详情页单独配置，统一由 options 首页顶部“后端接口地址”（`server/local`）控制。
- 转写统计上传与定时上传为脚本默认能力，运行时强制启用；转写详情页不提供统计开关。

## 保留能力（仅当前题 / 当前音频）

- 当前题：
  - 快速填入
  - 标有效 / 标无效
  - 去空格
  - 数字转换
  - 焦点切换
- 当前音频：
  - 播放 / 暂停
  - 前进 / 后退
  - 倍速提高 / 降低 / 重置
  - 音量提高 / 降低 / 重置
  - 复制时长

## 默认值与可配置项

- 默认值基于 `shared/constants.js -> DEFAULT_ASR_CONFIG`，运行时会从 `chrome.storage` 读取并覆盖。
- options 转写轻量设置面板可配置：
  - 自动播放 `autoPlay`
  - 默认倍速 `playbackRateValue` / 重置倍速 `resetRateValue`
  - 倍速步进 `rateStepValue`
  - 前进/后退步长 `seekStepSeconds`
  - 默认音量 `volumeValue`
  - 当前题行为 `defaultValid/fillOnValid/clearOnInvalid`
  - 当前保留功能快捷键（含“上传转写统计”）
- 统计上传与定时上传不在 options 转写详情页配置；运行时始终启用。

## 注入与页面命中策略

- content script 在 `document_start` 注入后不会一次性失败退出。
- 会在 `DOMContentLoaded`、`window.load`、`MutationObserver`、SPA 路由变化和短轮询下持续重试命中。
- 仅在 `labelx.alibaba-inc.com` 且路径包含 `/corpora/labeling/` 时继续等待转写详情页 DOM。
- 若检测到快判特征（如“哪个ASR更优”），不会启动转写工具栏。
- `PANEL_PING` 始终响应注入状态：
  - 已注入未命中：`injected=true, matched=false`
  - 已命中并运行：`injected=true, matched=true`
  - 真无响应才应视为注入失败
- 扩展在 `chrome://extensions` 重新加载后，旧页面可能出现 `Extension context invalidated`；当前已在 `shared/storage.js` 统一识别，并让转写运行时进入 `extension-context-invalidated` 停机状态（提示刷新页面），不再把它当普通配置错误反复告警。

## 工具栏布局（仿快判结构）

- 分组：`当前题`、`文本`、`音频`、`倍速`、`音量`、`状态`。
- 样式：浅色底、细边框、圆角、分组按钮白底蓝字、状态块浅绿提示。
- 状态块长期显示：启用状态、当前题定位、当前音频状态、最近动作结果。
- 页面 DOM 重绘后会自动重挂载，同一时刻只保留一个工具栏节点。

## 明确不做

- 不做时间戳、说话人区分。
- 不做 AI 初稿、AI 校对、AI 格式化、AI 标点。
- 不新增后端保存接口，不构建或注入自定义保存 payload。
- 不强制保存、不点击保存按钮。
- 不自动提交、不自动领取、不自动流转、不自动跳转下一任务。
- 不做整页受控执行与全页批量修改。
- 不提供旧版独立完整大表单和 overlay 设置面板。

## 转写统计导出（新增）

- 页面入口：顶部导航头像附近“上传转写统计”按钮；工具栏“上传统计”按钮也可触发。
- 上传能力强制启用：`statsUploadEnabled=true`、`statsAutoUploadOnSchedule=true`。
- 默认定时：`10:00`、`16:00`，jitter `10` 分钟；会优先读取上传接口返回的 schedule。
- 平台页面实测详情请求常见 `pageSize=10`；扩展统计上传为减少请求量，优先使用 `pageSize=100` 一次抓取。
- 详情抓取硬上限：最多 `3` 页、最多 `300` 条；遇空页、重复页签名、`recordCount` 缺失均会提前停止，避免请求风暴。
- 首页列表抓取上限：最多 `5` 页；详情并发上限 `2`；单次上传最多处理 `50` 个转写子任务。
- 单次上传内同一 `subTaskId` 只请求一次详情（按清洗后 ID 去重）。
- 上传锁：上传中重复点击或定时触发会返回 `upload-in-progress` 并跳过，不会并发第二轮上传。
- `subTaskId` 会在请求前清洗：去除普通空格、Tab、换行、回车、全角空格以及 decode 后残留空白。
- 任务识别规则：
  - 排除快判：`labelModel=vote`，或任务名包含 `ASR更优结果判断/ASR更优/更优结果判断/更优判断`。
  - 采集转写：`labelModel=single`，或任务名包含 `中文普通话asr任务/中文普通话asr/asr任务/普通话asr`，或 `size=50`（且未命中快判排除）。
- 上传接口由全局后端模式拼接：
  - `server`：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload`
  - `local`：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload`
- 下载接口由全局后端模式拼接：
  - `server`：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/download`
  - `local`：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download`
- CSV 列固定为：`任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`。
- `csvPatch` 只承载基础字段：`任务名称/任务ID/分包ID/题数/有效时长(秒)`。
- 标注/审核字段只允许由 `roleRecord` 按 `role` 写入；`role=label` 仅写标注字段，`role=audit` 仅写审核字段。
- 后端会忽略 `csvPatch` 里误传的角色字段；`role` 缺失或非法会拒绝写入，避免污染 CSV。
- 统计导出只采集和上传统计数据，不保存平台、不提交平台、不自动流转平台任务。
- 统计日志和提示不输出 cookie、token、完整音频 URL、完整签名 URL。

## 文件职责

- `content.js`：页面命中重试、运行时编排、工具栏、popup ping 响应。
- `runtime-config.js`：脚本中心启用状态读取 + 转写轻量设置规范化（含快捷键与统计配置）。
- `active-item.js`：当前题与当前音频定位（含“首个可见题卡”兜底）。
- `item-actions.js`：当前题文本与有效/无效动作。
- `audio-controller.js`：当前音频控制与时长复制。
- `text-utils.js`：去空格、轻量数字转换。
- `transcription-stats-client.js`：浏览器端转写统计上传客户端，仅负责统计采集、手动/定时上传、按钮状态回传。
- `shortcut-bus.js`：转写快捷键运行时，仅映射当前保留动作，普通输入不误拦截。
- `platform-resources/alibaba-labelx/asr-transcription/backend/`：Node 后端服务目录，负责路由、分包合并、CSV 落盘与下载。

## 真实浏览器验证步骤

1. 在 Chrome / Edge 重新加载 `extension/`。
2. 打开普通 LabelX 页面，确认 popup 不误报“注入失败”，应显示“已注入，等待转写详情页”或同义状态。
3. 打开 LabelX 转写详情页并等待题目 DOM 出现，确认工具栏自动出现。
4. 确认工具栏没有“设置”按钮。
5. 验证所有保留按钮动作。
6. 打开 options 转写详情页，确认仅保留轻量设置面板，不出现独立后端地址下拉框。
7. 切换到 `asr-judgement` 页面，确认不出现转写工具栏，快判功能不受影响。

## 后续约束

- 若未来恢复已删能力，必须走“新需求 + 新设计 + 新验收”，不能直接恢复旧脚本。
