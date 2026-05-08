# 阿里 ASR 转写（轻量基础版）

## 当前说明

- 本目录已在 2026-05-08 执行“删除旧目录 + 轻量重写”。
- 旧 legacy、保存、提交、批量、自动化、AI、导出、排行榜、整页执行链路全部删除。
- 当前只保留“当前题 + 当前音频”基础能力。

## 保留能力

- 当前题：
  - 快速填入
  - 标有效 / 标无效
  - 去空格
  - 数字转换
  - 焦点切换
- 当前音频：
  - 播放 / 暂停
  - 前进 / 后退
  - 倍速调整 / 重置
  - 音量调整 / 重置
  - 复制时长
- 基础设置：
  - `itemsPerPage`
  - `autoPlay`
  - `defaultValid`
  - `fillOnValid`
  - `clearOnInvalid`
  - `playbackRateValue` / `resetRateValue`
  - `rateStepValue`
  - `seekStepSeconds`
  - `volumeValue`
  - `shortcuts`
  - `customReplacements`
  - `customRates`

## 明确不做

- 不做时间戳、说话人区分。
- 不做 AI 初稿、AI 校对、AI 格式化、AI 标点。
- 不新增后端保存接口，不构建或注入自定义保存 payload。
- 不强制保存、不点击保存按钮。
- 不自动提交、不自动领取、不自动流转、不自动跳转下一任务。
- 不做整页受控执行与全页批量修改。
- 不恢复旧 legacy 架构。

## 文件职责

- `content.js`：转写运行时入口、页面命中判断、工具栏、消息桥接。
- `runtime-config.js`：配置读取/归一化/保存（复用 shared constants + storage）。
- `settings-panel.js`：options 页与页面内基础设置面板。
- `active-item.js`：当前题与当前音频定位（含“首个可见题卡”兜底）。
- `item-actions.js`：当前题文本与有效/无效动作。
- `audio-controller.js`：当前音频播放、进退、倍速、音量与时长复制。
- `shortcut-bus.js`：快捷键匹配与触发，避免普通输入被无关拦截。
- `text-utils.js`：去空格、轻量数字转换与自定义替换。

## 真实浏览器验证步骤

1. 在 Chrome / Edge 重新加载 `extension/`。
2. 打开 Alibaba LabelX 转写任务详情页。
3. 确认顶部出现“转写轻量工具栏”。
4. 验证当前题：快速填入、标有效、标无效、去空格、数字转换、焦点切换。
5. 验证当前音频：播放/暂停、前进/后退、倍速调整/重置、音量调整/重置、复制时长。
6. 打开设置面板，修改基础配置并保存，刷新后确认生效。
7. 在 textarea 普通输入时，确认未命中快捷键不会被无关拦截。
8. 确认页面内没有保存、提交、AI、批量、自动流转、排行榜、导出、整页执行入口。
9. 切换到 `asr-judgement` 页面，确认快判功能不受影响。

## 后续约束

- 若未来要恢复已删旧能力，必须走“新设计 + 新验收”，不能直接恢复旧脚本。
