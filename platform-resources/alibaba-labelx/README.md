# Alibaba LabelX 平台资源

## 平台范围

本目录保存 Alibaba LabelX 相关的平台资料和调试工具，供 Chrome / Edge 共用的 `extension/` 扩展源码共同参考。

当前已整理的脚本项目：

- `asr-judgement/`：阿里 ASR 语音判别 / ASR 快判。
- `asr-transcription/`：阿里 ASR 语音转写，目前仅建立占位说明，后续按需迁移。

## 通用约定

- 页面结构和网络接口以真实采集为准，不凭印象写选择器。
- 项目级资料放到具体脚本项目目录，不提前抽公共 shared。
- 只有确认判断和转写确实复用的 LabelX 平台级事实，才放在本目录根级 README 中。
- 涉及人员、任务、音频签名、token、cookie、session 的内容必须脱敏。

## 已确认通用事实

- LabelX 是 React 单页应用，页面主要挂载在 `#root`。
- 顶部导航右侧头像下拉结构可用于读取当前用户展示名，当前共享片段保存在 `asr-judgement/page-structure/common-top-nav-avatar-dropdown.html`。
- 页面中的 `data-aplus-*`、`data-spm-*`、`aria-describedby` 和运行时随机 class 不作为稳定选择器依据。
