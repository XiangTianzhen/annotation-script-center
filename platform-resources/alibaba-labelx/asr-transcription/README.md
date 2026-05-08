# Alibaba LabelX ASR 转写资料

## 当前状态（2026-05-08）

- `extension/sites/alibaba-labelx/asr-transcription/` 已完成“删除旧目录 + 轻量重写”。
- 当前只保留“当前题 + 当前音频”的基础转写能力。
- 旧 legacy、保存、提交、批量、自动化、AI、导出、排行榜、整页执行链路已全部移除。

## 当前业务口径（与扩展运行时一致）

- 一条音频对应一个完整文本框。
- 保留能力：
  - 当前题快速填入、标有效、标无效、去空格、数字转换、焦点切换。
  - 当前音频播放/暂停、前进/后退、倍速调整/重置、音量调整/重置、复制时长。
- 设置项仅保留：
  - `itemsPerPage`、`autoPlay`、`defaultValid`、`fillOnValid`、`clearOnInvalid`
  - `playbackRateValue` / `resetRateValue`
  - `rateStepValue`、`seekStepSeconds`、`volumeValue`
  - `shortcuts`、`customReplacements`、`customRates`
- 不实现时间戳、说话人区分、AI 初稿/校对/格式化/标点。
- 不新增后端保存接口，不构建/注入自定义保存 payload。
- 不强制保存、不自动提交、不自动领取、不自动流转、不自动跳转下一任务。

## 目录职责（轻量版）

- `content.js`：页面命中、运行时编排、工具栏、消息桥接。
- `runtime-config.js`：转写配置读取/归一化/保存。
- `settings-panel.js`：options 页与页面内基础设置面板。
- `active-item.js`：当前题与当前音频定位（含首个可见题卡兜底）。
- `item-actions.js`：当前题文本与有效/无效动作。
- `audio-controller.js`：当前音频控制与时长复制。
- `shortcut-bus.js`：快捷键匹配与触发。
- `text-utils.js`：去空格、数字转换、自定义替换。

## 后续约束

- 若未来要恢复已删旧能力，必须走“新需求 -> 新设计 -> 新实现 -> 新验收”。
- 不允许直接恢复旧脚本或旧文件名链路。
