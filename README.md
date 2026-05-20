# 标注脚本中心

本仓库用于维护“标注脚本中心”浏览器扩展与配套平台资料。

## 项目定位

- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。
- 当前扩展版本：以 `extension/manifest.json` 为准。
- 当前发布版本：`v0.3.3`。
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

### Fun-ASR Python 环境部署

核心说明：

- 统一后端启动命令始终是：`node platform-resources/backend/server.js`
- PM2 / systemd 也只是管理这个 Node 后端进程，不管理独立 Python 服务。
- Python 不单独启动，只作为 Node 后端内部调用 Fun-ASR Python SDK 的辅助运行环境。
- 只有把 DataBaker“听音模型”切到 `fun-asr` 时才需要 Python 虚拟环境。
- 选择 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash` 时不依赖 Python 虚拟环境。
- 统一 Python 虚拟环境固定放在 `platform-resources/backend/.venv`。
- Fun-ASR Python 脚本固定放在 `platform-resources/backend/ai/python/funasr_client.py`。
- Fun-ASR Python 依赖固定放在 `platform-resources/backend/ai/python/requirements.txt`。
- Node 后端调用 Fun-ASR Python 子进程时会显式设置 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`。
- `platform-resources/backend/ai/python/funasr_client.py` 会按 UTF-8 输出 stdout JSON，避免 Windows 默认控制台编码导致“AI 听音文本”出现 `�` / 黑菱形乱码。
- 不再使用 `platform-resources/backend/.venv-funasr`。
- 不再使用 `platform-resources/data-baker/round-one-quality/backend/.venv-funasr`。
- `platform-resources/backend` 是统一后端聚合目录，所以 Python 辅助环境也放这里统一管理。

Windows 本地准备：

    cd C:\Projects\annotation-script-center\platform-resources\backend
    py -3 -m venv .venv
    .venv\Scripts\python.exe -m pip install -U pip
    .venv\Scripts\python.exe -m pip install -r ai\python\requirements.txt
    node server.js

Linux 服务器准备：

    cd /var/www/annotation-script-center/platform-resources/backend
    python3 -m venv .venv
    .venv/bin/python -m pip install -U pip
    .venv/bin/python -m pip install -r ai/python/requirements.txt
    node server.js

如果使用 PM2，仍然只重启 Node 后端：

    pm2 restart annotation-script-center --update-env

可选环境变量：

- `DATABAKER_FUNASR_PYTHON_BIN` 一般不需要配置。
- 留空时，后端自动使用 `platform-resources/backend/.venv`。
- `requirements.txt` 位于 `platform-resources/backend/ai/python/requirements.txt`。
- 上面的 `pip install -r ai/python/requirements.txt` 命令是在 `platform-resources/backend` 目录内执行。
- 如服务器 Python 路径特殊，可显式设置：
  `DATABAKER_FUNASR_PYTHON_BIN=/var/www/annotation-script-center/platform-resources/backend/.venv/bin/python`
- Windows 本地可设置：
  `DATABAKER_FUNASR_PYTHON_BIN=C:\Projects\annotation-script-center\platform-resources\backend\.venv\Scripts\python.exe`

迁移提醒：

- 新部署推荐直接创建 `platform-resources/backend/.venv` 并重新安装依赖。
- 旧服务器如果还在使用 `.venv-funasr`，可以临时把 `DATABAKER_FUNASR_PYTHON_BIN` 指向旧路径过渡，但默认口径已统一为 `.venv`。

可选验证，不是启动步骤：

Windows：

    cd C:\Projects\annotation-script-center\platform-resources\backend
    .venv\Scripts\python.exe -m py_compile ai\python\funasr_client.py

Linux：

    cd /var/www/annotation-script-center/platform-resources/backend
    .venv/bin/python -m py_compile ai/python/funasr_client.py

验证接口：

    GET /api/data-baker/round-one-quality/ai/recommend/health
    GET /api/data-baker/round-one-quality/ai/recommend/defaults

期望：

- `defaults` 返回 `listenModelOptions` 和 `compareModelOptions`。
- `listenModelOptions` 包含 `fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`。
- `compareModelOptions` 包含 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`。
- `funAsrModel` 为 `fun-asr`。
- `omniModel` 为 `qwen3.5-omni-flash`。
- `compareModel` 为 `qwen3.5-plus`。
- 未配置 Python 虚拟环境时，`qwen3.5-omni-plus / qwen3.5-omni-flash` 仍可用；只有 `fun-asr` 会报 Python 环境缺失。

Fun-ASR 返回 `403` 时，常见原因优先排查：

- DashScope API Key 无权限。
- 百炼服务地域或模型未开通。
- Fun-ASR 不支持当前账号或地域。
- 平台 `audioUrl` 对阿里云模型服务不可访问。
- 音频 URL 已过期或签名权限不足。

临时恢复生产使用时，优先切换到 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash`。

如果 `fun-asr` 曾出现听音文本乱码，修复部署后需要重启 `node platform-resources/backend/server.js`，清空旧内存缓存。`qwen3.5-omni-plus` / `qwen3.5-omni-flash` 不经过 Python 子进程，因此不受该编码问题影响。

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
