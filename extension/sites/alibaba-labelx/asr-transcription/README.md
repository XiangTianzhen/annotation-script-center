# 阿里 ASR 转写（轻量工具栏版）

## 当前状态（2026-05-08）

- `asr-transcription` 已删除独立设置页和页面内 overlay 设置面板。
- 已删除转写快捷键配置与快捷键运行时。
- 当前只保留转写详情页的工具栏按钮能力。
- 工具栏已改为页面内注入结构：优先挂载 `.mark-toolbox`，其次挂到首条题卡上方，不再默认固定悬浮在页面顶部中央。
- 新增转写统计导出能力：支持手动上传与定时上传，后端按分包合并 CSV。

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

## 固定默认值（不再提供 UI 配置）

- `autoPlay=false`
- `playbackRateValue=1`
- `resetRateValue=1`
- `rateStepValue=0.1`
- `seekStepSeconds=1`
- `volumeValue=100`
- `fillOnValid=true`
- `clearOnInvalid=true`
- `defaultValid=false`

## 注入与页面命中策略

- content script 在 `document_start` 注入后不会一次性失败退出。
- 会在 `DOMContentLoaded`、`window.load`、`MutationObserver`、SPA 路由变化和短轮询下持续重试命中。
- 仅在 `labelx.alibaba-inc.com` 且路径包含 `/corpora/labeling/` 时继续等待转写详情页 DOM。
- 若检测到快判特征（如“哪个ASR更优”），不会启动转写工具栏。
- `PANEL_PING` 始终响应注入状态：
  - 已注入未命中：`injected=true, matched=false`
  - 已命中并运行：`injected=true, matched=true`
  - 真无响应才应视为注入失败

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
- 不提供独立完整设置页、overlay 设置面板或快捷键配置。

## 转写统计导出（新增）

- 页面入口：顶部导航头像附近“上传转写统计”按钮；工具栏“上传统计”按钮也可触发。
- 默认定时：`10:00`、`16:00`，jitter `10` 分钟；会优先读取上传接口返回的 schedule。
- 上传接口：
  - 服务器：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/upload`
  - 本机：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload`
- 下载接口：
  - 服务器：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/download`
  - 本机：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download`
- CSV 列固定为：`任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`。
- 统计导出只采集和上传统计数据，不保存平台、不提交平台、不自动流转平台任务。

## 文件职责

- `content.js`：页面命中重试、运行时编排、工具栏、popup ping 响应。
- `runtime-config.js`：脚本中心启用状态读取 + 固定默认值输出。
- `active-item.js`：当前题与当前音频定位（含“首个可见题卡”兜底）。
- `item-actions.js`：当前题文本与有效/无效动作。
- `audio-controller.js`：当前音频控制与时长复制。
- `text-utils.js`：去空格、轻量数字转换。
- `transcription-stats-server.js`：转写统计采集、手动上传入口、定时上传调度、上传状态回传。

## 真实浏览器验证步骤

1. 在 Chrome / Edge 重新加载 `extension/`。
2. 打开普通 LabelX 页面，确认 popup 不误报“注入失败”，应显示“已注入，等待转写详情页”或同义状态。
3. 打开 LabelX 转写详情页并等待题目 DOM 出现，确认工具栏自动出现。
4. 确认工具栏没有“设置”按钮。
5. 验证所有保留按钮动作。
6. 打开 options 转写详情页，确认不再出现完整设置表单。
7. 切换到 `asr-judgement` 页面，确认不出现转写工具栏，快判功能不受影响。

## 后续约束

- 若未来恢复已删能力，必须走“新需求 + 新设计 + 新验收”，不能直接恢复旧脚本。
