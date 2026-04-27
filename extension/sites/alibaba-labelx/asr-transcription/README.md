# 阿里 ASR 语音转写

这个目录对应 LabelX 上的 ASR 语音转写脚本。

## 当前状态

- 转写运行时代码和完整设置面板已归入当前目录。
- `options/options.html` 中的转写详情页加载当前目录下的 `settings-panel.js`。
- 当前没有把判断脚本的页面结构资料放入这里，避免两个项目继续混在一起。
- `content.js` 会等待 `runtime-contract.js` 完成注入后再组装转写运行时；如果当前扩展包缺失该契约或注入失败，会以 info 级日志跳过转写运行时，避免在快判首页等非转写场景刷扩展错误。

## 负责范围

- 在 LabelX 转写页面注入完整转写运行时。
- 响应 popup 的 LabelX runtime ping，用于显示当前页面注入状态。
- 提供转写脚本详情页的完整设置面板。
- 承载转写相关的文本处理、快捷键、批量填充、AI 标点、保存提交、批量流转等能力。

## 当前归属文件

当前目录包含：

- `content.js`
- `document-start.js`
- `settings-panel.js`
- `runtime-*.js`
- `annotation-*.js`
- `legacy-*.js`
- `site-contract.js`
- `page-detector.js`
- `route-observer.js`
- `page-state-collector.js`
- `page-world/`
- `page-world-hook.js`
- `page-structure/`

## 暂不创建公共目录

判断和转写先完全分开。只有当能力已经在两个脚本里都需要，并且选择器、消息协议或行为确实一致时，再提升到公共目录。抽取前需要先在两个脚本 README 中记录实际复用点和验证步骤。
