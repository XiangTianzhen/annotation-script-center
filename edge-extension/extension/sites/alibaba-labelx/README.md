# Alibaba LabelX 站点目录

这个目录只保留 LabelX 站点下的脚本项目目录。站点根目录不再放运行时 JS，所有 LabelX 相关代码和资料必须归属到具体脚本。

## 当前目录结构

```text
extension/sites/alibaba-labelx/
  README.md
  asr-judgement/
    README.md
    page-structure/
  asr-transcription/
    README.md
    page-structure/
    page-world/
    *.js
```

## 脚本项目

- `asr-judgement/`
  - 中文名：阿里 ASR 语音判别 / ASR 快判
  - 负责快判/更优判断项目的资料、运行时骨架和脚本详情页配置。
  - 当前归属文件：`README.md`、`page-structure/` 下的快判页面结构资料。
  - 设置入口：options 快判详情页使用独立简化表单，不复用转写完整设置面板。
- `asr-transcription/`
  - 中文名：阿里 ASR 语音转写
  - 负责语音转写项目的完整运行时、页面注入、设置面板和页面结构资料。
  - 当前归属文件：`content.js`、`document-start.js`、`runtime-*.js`、`annotation-*.js`、`legacy-*.js`、`settings-panel.js`、`page-world/`、`page-structure/`。

## 站点根目录策略

站点根目录只保留站点级说明文件，不再直接放 LabelX 运行时 JS。`manifest.json`、options 和 popup 如果引用 LabelX 文件，路径必须显式指向 `asr-transcription/` 或 `asr-judgement/`。

## 公共目录策略

暂时不创建公共目录。快判和转写先按两个独立脚本维护，避免在边界未稳定前把选择器、运行时状态和设置模型提前耦合。

后续只有同时满足这些条件时，才考虑创建公共目录：

- 同一能力已经被 `asr-judgement/` 和 `asr-transcription/` 同时实际使用。
- 两边的 DOM 选择器、消息协议或状态模型已经稳定，抽取后不会引入跨脚本回归。
- 对应脚本 README 已记录复用点、调用方和验证步骤。

可能适合后续抽取的能力包括：

- 站点路由识别
- LabelX 页面等待工具
- 音频控制基础能力
- DOM 安全读写工具
- 运行时消息协议

## 后续迁移原则

1. 新增或移动 LabelX JS 时必须放入具体脚本目录。
2. 修改加载路径时同步检查 `manifest.json`、options、popup 和脚本文档。
3. 每次迁移后至少运行 `node --check` 覆盖 `extension` 下所有 JS。
4. 涉及真实 LabelX 页面行为时，必须在 Edge 扩展中人工验证 popup 命中、runtime ping 和脚本详情页跳转。
