# 标注脚本中心

本仓库用于维护“标注脚本中心”浏览器扩展与配套平台资料。

## 项目定位

- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。
- 当前扩展版本：以 `extension/manifest.json` 为准。
- 扩展源码目录：`extension/`（Chrome / Edge 共用同一套运行时代码）。
- 统一后端入口：`platform-resources/backend/server.js`。

## 当前重点平台与脚本

- 平台：Alibaba LabelX、标贝易采、Magic Data ANNOTATOR
- 脚本：
  - `extension/sites/alibaba-labelx/asr-judgement/`
  - `extension/sites/alibaba-labelx/asr-transcription/`
  - `extension/sites/data-baker/round-one-quality/`
  - `extension/sites/magic-data/annotator/`

## 本地加载扩展

Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `C:\Projects\annotation-script-center\extension`

Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `C:\Projects\annotation-script-center\extension`

## 本地启动后端

在仓库根目录运行：

    node platform-resources\backend\server.js

默认监听：

    http://127.0.0.1:3333

## CRX 发布说明（保留）

3.0 起正式发布使用 CRX 三件套：

- `dist/annotation-script-center-v<manifest.version>.crx`
- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

发布命令：

    node scripts/package-crx-release.js --notes "CRX enterprise release"

说明：企业托管自动安装仍属于未完成模块，详见 `docs/unfinished/crx-enterprise-managed-install.md`。

## 文档入口

- `AGENTS.md`：长期协作规则
- `extension/README.md`：扩展源码说明
- `platform-resources/backend/README.md`：统一后端说明
- `docs/README.md`：docs 文档导航
- `docs/workflow/codex-prompt-style.md`：Codex Prompt 格式规范
- `docs/external-docs/aliyun-bailian.md`：阿里云百炼官方文档索引
- `log.md`：长期修改日志与历史细节

历史版本演进、旧方案与详细变更记录统一沉淀在 `log.md` 与 `docs/archive/`，根 README 不再堆叠历史长文。
