# 标注脚本中心

本仓库用于维护“标注脚本中心”浏览器扩展与配套平台资料。

## 项目定位

- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。
- 当前扩展版本：以 `extension/manifest.json` 为准。
- 扩展源码目录：`extension/`（Chrome / Edge 共用同一套运行时代码）。
- 统一后端入口：`platform-resources/backend/server.js`。

## 当前重点平台与脚本

- 平台：Alibaba LabelX、标贝易采、Magic Data ANNOTATOR、Abaka AI（Task21 快捷键 + AI 分析调试阶段）
- 统一 CSV 对接字段：有效时长（用于平台系统自动计算）。
- LabelX 历史 CSV 修复脚本：`node platform-resources/alibaba-labelx/backend/legacy-csv-repair.js --dry-run`（运行数据目录修复，不提交 Git）。
- 脚本：
  - `extension/sites/alibaba-labelx/asr-judgement/`
  - `extension/sites/alibaba-labelx/asr-transcription/`
  - `extension/sites/data-baker/round-one-quality/`
  - `extension/sites/magic-data/annotator/`
  - `extension/sites/abaka-ai/task-page/`（Task21 快捷键 + AI 分析调试 + 页面结构/Network 脱敏采集）

## 本地加载扩展

Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `C:\Projects\annotation-script-center\extension`

Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `C:\Projects\annotation-script-center\extension`

## 本地启动后端

在仓库根目录运行：

    node platform-resources\backend\server.js

默认监听：

    http://127.0.0.1:3333

## 服务器部署与重启

默认服务器目录示例：

    /var/www/annotation-script-center

实际目录以服务器部署目录为准。  
PM2 进程名示例：`annotation-script-center`。

更新代码并重启：

    cd /var/www/annotation-script-center
    git pull origin main
    pm2 restart annotation-script-center --update-env

只修改环境变量时重启：

    cd /var/www/annotation-script-center
    pm2 restart annotation-script-center --update-env

查看状态和日志：

    pm2 status
    pm2 logs annotation-script-center --lines 100

后端直接启动命令：

    node platform-resources/backend/server.js

统一后端会读取以下环境配置文件（系统环境变量优先级最高）：

- `config/env/backend.env`
- `config/env/backend.local.env`
- `config/env/ai.env`
- `config/env/ai.local.env`
- `.env.local`
- `ASC_ENV_FILE` 指向的外部文件

安全说明：

- 不要提交真实 `backend.env`、`ai.env`、`local.env`。
- 不要提交 API Key、cookie、token、authorization、JWT secret、CRX 私钥。
- 修改环境变量后必须执行 `pm2 restart annotation-script-center --update-env`，否则新变量可能不生效。

详细后端配置见 `platform-resources/backend/README.md`。
详细 API 清单见 `platform-resources/README.md` 的“统一后端 API 清单”。

## 发布产物说明

企业部署未完成前，每个版本默认同时生成：

- `dist/annotation-script-center-v<manifest.version>.crx`
- `dist/annotation-script-center-v<manifest.version>.zip`

其中 `CRX + ZIP` 作为当前手工分发文件。  
企业自动更新预留文件继续生成：

- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

发布命令：

    node scripts/package-crx-release.js --notes "CRX enterprise release"

说明：ZIP 是当前过渡分发产物，不替代未来企业自动更新；企业托管自动安装仍属于未完成模块，详见 `docs/unfinished/crx-enterprise-managed-install.md`。

## 文档入口

- `AGENTS.md`：长期协作规则
- `extension/README.md`：扩展源码说明
- `platform-resources/backend/README.md`：统一后端说明
- `platform-resources/abaka-ai/README.md`：Abaka AI 平台资料入口
- `docs/README.md`：docs 文档导航
- `docs/platforms/index.md`：平台与脚本文档索引
- `docs/workflow/codex-prompt-style.md`：Codex Prompt 格式规范
- `docs/external-docs/aliyun-bailian.md`：阿里云百炼官方文档索引
- `log.md`：长期修改日志与历史细节

历史版本演进、旧方案与详细变更记录统一沉淀在 `log.md` 与 `docs/archive/`，根 README 不再堆叠历史长文。
