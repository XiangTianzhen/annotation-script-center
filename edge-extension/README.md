# 标注脚本中心 Edge 扩展

`edge-extension/` 是当前浏览器扩展的事实功能源头。现阶段优先在 Edge MV3 扩展中集中开发和验证，功能稳定后再迁移 / 适配到 Chrome 扩展，避免 Edge 和 Chrome 并行维护两套业务逻辑。

## 当前状态

- `extension/` 是可直接在 Edge 中本地加载的 MV3 扩展目录。
- `extension/shared/` 提供扩展级常量和存储封装。
- `extension/options/` 提供脚本中心设置页，当前包含转写和快判两个脚本项目配置。
- `extension/popup/` 提供当前页面运行状态入口。
- `extension/sites/alibaba-labelx/` 是当前唯一站点目录。
- `Alibaba LabelX` 下当前有两个独立脚本项目：
  - `asr-transcription/`：阿里 ASR 语音转写。
  - `asr-judgement/`：阿里 ASR 语音判别 / ASR 快判。
- 快判运行时已经完成模块拆分，音频、分页、总时长、判别动作、快捷键、提示、工具栏和网络捕获分别由小文件维护。

## 当前目录结构

```text
edge-extension/
  README.md
  docs/
  extension/
    manifest.json
    background/
      service-worker.js
    options/
      options.html
      options.js
    popup/
      popup.html
      popup.js
    shared/
      constants.js
      storage.js
    sites/
      alibaba-labelx/
        README.md
        asr-transcription/
          README.md
          content.js
          settings-panel.js
          annotation-*.js
          legacy-*.js
          page-world/
          page-structure/
        asr-judgement/
          README.md
          content.js
          page-detector.js
          judgement-*.js
          audio-*.js
          page-world/
          page-structure/
```

## 目录边界

- `extension/`
  Edge 本地加载时选择的扩展根目录。
- `extension/background/`
  MV3 service worker。
- `extension/shared/`
  扩展级共享常量和存储。这里不放 LabelX 业务运行时。
- `extension/options/`
  脚本中心设置页。脚本详情页可以引用具体脚本目录的设置面板或简化配置。
- `extension/popup/`
  当前页面状态入口，负责展示脚本命中和运行状态。
- `extension/sites/alibaba-labelx/`
  LabelX 站点目录。站点根目录只放说明，不放业务 JS。
- `extension/sites/alibaba-labelx/asr-transcription/`
  转写脚本运行时。当前保留完整转写能力和设置面板。
- `extension/sites/alibaba-labelx/asr-judgement/`
  快判脚本运行时。当前重点维护目录。
- `docs/`
  历史迁移、架构和计划文档。部分文档记录的是阶段性计划，读取时应以当前 README、根目录 `AGENTS.md` 和代码结构为准。

## 当前开发重点

当前重点是 `asr-judgement/`：

- 顶部主导航显示 400 条数据总时长。
- 支持默认每页条数设置，`all` 模式尝试改写 LabelX data 请求为 `pageSize=400`。
- 支持音量、倍速、自动播放、播放暂停。
- 支持 `1~5` 判别快捷键和工具栏按钮。
- 支持 MAIN world 网络请求监听和 data 响应摘要。

## Edge 本地加载

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择 `C:\Projects\annotation-script-center\edge-extension\extension`。
5. 确认扩展名称显示为“标注脚本中心”。

## 开发原则

- Edge 版本是当前业务功能源头。
- 不要同时维护 Edge 和 Chrome 两套业务逻辑。
- 快判和转写先保持独立，不提前抽公共业务目录。
- 涉及 LabelX 页面 DOM 时，先查对应脚本目录下的 `page-structure/`。
- 修改 `manifest.json` 后必须确认脚本路径存在并重新加载扩展验证。
- 修改 JS 后至少运行 `node --check` 覆盖变更文件。

项目级 Codex 维护规则见仓库根目录 `AGENTS.md`，长期修改日志见仓库根目录 `log.md`。
