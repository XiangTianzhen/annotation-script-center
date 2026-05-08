# 阿里 ASR 语音转写

本目录对应 LabelX 的 ASR 转写运行时代码。

## 当前阶段定位

- 当前为“基础转写阶段”。
- 一条音频对应一个完整文本框。
- 以平台自动保存为准，不额外接管保存链路。

## 当前范围

- 保留基础音频与文本能力：
  - 播放 / 暂停
  - 当前音频前进 / 后退
  - 当前音频倍速调整 / 重置
  - 当前音频音量调整 / 重置
  - 基础焦点切换
  - 基础文本处理（当前题去空格、数字转换、快速填入）
  - 当前题有效 / 无效标记
  - 复制当前音频时长
- 保留设置项：
  - `itemsPerPage`
  - `autoPlay`
  - `defaultValid`
  - `fillOnValid`
  - `clearOnInvalid`
  - `resetRateValue` / `playbackRateValue`
  - `rateStepValue`
  - `seekStepSeconds`
  - `volumeValue`
  - `shortcuts`
  - `customReplacements`
  - `customRates`

## 当前禁用项

- 不实现时间戳。
- 不实现说话人区分。
- 不实现 AI 初稿、AI 校对、AI 格式化。
- 不新增自定义后端保存接口。
- 不构建/注入自定义保存 payload。
- 不触发扩展侧手动强制保存、保存后 reload。
- 不自动提交、不自动领取、不自动跳转下一任务、不批量流转。
- 不启用 AI 标点、自动抢单、排行榜、导出等与基础转写无关入口。
- 不保留全页批量修改动作（全页标有效并填充 / 全页去空格 / 全页校验自动修复）。

## 本轮删除说明（2026-05-08）

- 已物理删除旧自动化与旧保存链路文件：
  - `annotation-save-runner.js`
  - `annotation-submit-runner.js`
  - `annotation-page-flow-runner.js`
  - `legacy-save-coordinator.js`
  - `legacy-ai-punctuation.js`
  - `legacy-auto-assign.js`
  - `legacy-batch-flow.js`
  - `legacy-export.js`
  - `legacy-leaderboard.js`
- 已删除全页批量动作入口（工具栏、快捷键、交互执行分支）。
- 后续如果要恢复上述能力，必须按新需求重新设计、重新实现、重新验收；不从旧脚本直接恢复。

## 真实页面人工验证步骤

1. 在 Edge 或 Chrome 重新加载 `extension/`。
2. 打开 LabelX ASR 转写任务详情页。
3. 确认转写运行时只在转写页面生效。
4. 确认页面内不再出现“全页标有效并填充 / 全页去空格 / 自动提交 / 自动流转 / AI 标点 / 抢单 / 排行榜 / 导出”等入口。
5. 验证当前题快速填入、当前题有效/无效、当前题去空格、当前题数字转换可用。
6. 验证播放/暂停、前进/后退、音量、倍速、自动播放可用。
7. 验证普通文本输入不被无关快捷键打断。
8. 验证不会触发扩展自定义保存、强制保存、reload、自动提交、自动跳转、批量流转。
9. 切换到 `asr-judgement` 页面，确认快判功能不受影响。
