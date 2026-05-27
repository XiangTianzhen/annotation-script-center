# 标注脚本中心

本仓库用于维护“标注脚本中心”浏览器扩展与配套平台资料。

## 项目定位

- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。

* 当前扩展版本：以 `extension/manifest.json` 为准。
* 当前版本（待发布口径）：`v0.3.7`。
* 扩展源码目录：`extension/`（Chrome / Edge 共用同一套运行时代码）。
* 统一后端入口：`platform-resources/backend/server.js`。

## v0.3.7 当前状态

- 本轮包含 `v0.3.7` 小修：修复 Magic Data 客家话助手 AI 结果偶发繁体字残留的问题；非 `ASC_RELEASE` 正式发布流程。
- Magic Data 双助手（客家话/闽南语）已完成同平台互斥、AI 面板统一（模型方案 + 识别策略）、审核页支持与 options 保存稳定性修复。
- 客家话助手默认配置已按评测结论落地：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，thinking 默认关闭。
- 客家话助手后端现已在响应出口统一做“普通中文繁转简 + 客家话统一用字保留”收口，减少结果区与行内建议出现繁体字。

## 协作摘要

- 网页端默认以 `.md` 文件下载方式输出 Codex Prompt，不再默认在聊天消息中直接贴完整 Prompt。
- 任务依赖截图、文件、日志、Network、Console、原始 JSON、音频样例等资料时，网页端应先提醒用户上传，并提示脱敏要求。
- Git commit message 使用中文；允许保留英文范围标识，但描述必须是中文。
- 一个新的开发 / 修复 / 优化对话默认对应一个 patch 小版本；正式发布仍使用 `ASC_RELEASE`。
- 同一模块中重复代码超过 2 次时应优先抽取复用；新增样式优先变量化，有 SCSS 构建链时优先 SCSS。
- 详细项目级规则见 `AGENTS.md` 与 `docs/rules/project-collaboration-rules.md`。

## 当前重点平台与脚本

- 平台：Alibaba LabelX、标贝易采、Magic Data ANNOTATOR、Abaka AI（Task21助手：快捷键、AI 辅助填写、Prompt 规则、列表页统计入口）。
- 当前 CSV 对接字段口径：
  - LabelX 快判/转写：`有效时长(秒)_S` 与人员 `_P` 字段。
  - DataBaker 一检：`有效合格时长_S` 与 `质检人_P` 字段。
- LabelX 历史 CSV 修复脚本：`node platform-resources/alibaba-labelx/backend/legacy-csv-repair.js --dry-run`（运行数据目录修复，不提交 Git）。
- 脚本：
  - `extension/sites/alibaba-labelx/asr-judgement/`
  - `extension/sites/alibaba-labelx/asr-transcription/`
  - `extension/sites/data-baker/round-one-quality/`
  - `extension/sites/magic-data/`（`hakka-helper` + `minnan-helper`）
  - `extension/sites/abaka-ai/task-page/`（Task21助手 + 页面结构/Network 脱敏采集）

## 本地加载扩展

Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `C:\Projects\annotation-script-center\extension`

Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `C:\Projects\annotation-script-center\extension`

## 本地启动后端

在仓库根目录运行：

```
node platform-resources\backend\server.js
```

默认监听：

```
http://127.0.0.1:3333
```

## 服务器部署与重启

默认服务器目录示例：

```
/var/www/annotation-script-center
```

实际目录以服务器部署目录为准。\
PM2 进程名示例：`annotation-script-center`。

更新代码并重启：

```
cd /var/www/annotation-script-center
git pull origin main
pm2 restart annotation-script-center --update-env
```

只修改环境变量时重启：

```
cd /var/www/annotation-script-center
pm2 restart annotation-script-center --update-env
```

查看状态和日志：

```
pm2 status
pm2 logs annotation-script-center --lines 100
```

后端直接启动命令：

```
node platform-resources/backend/server.js
```

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

## 默认时间规则

- TTS 自动清除默认时间统一为 `60000ms`。
- AI / 模型请求默认超时时间统一为 `120000ms`。
- 该默认规则已写入仓库根目录 `AGENTS.md`。
- 用户在脚本高级设置中手动保存的非默认超时值应继续保留。
- 非 AI 模型类的上传、下载、统计与普通后端接口超时不受该规则影响。

### Fun-ASR 默认 REST provider 与 Python fallback

核心说明：

- 统一后端启动命令始终是：`node platform-resources/backend/server.js`
- PM2 / systemd 也只是管理这个 Node 后端进程，不管理独立 Python 服务。
- Fun-ASR 默认 provider 已改为 Node RESTful API：由 Node 后端直接提交异步任务并轮询任务状态。
- Python 不单独启动；Python SDK 只保留为 fallback / 调试方案，不再作为默认主链路。
- DataBaker 当前有两种识别模式：
  - `two_stage`：显示“听音模型 + 比较模型”
  - `omni_single`：只显示“AI 模型”
- `two_stage` 且听音模型选择 `fun-asr` 时，默认走 Node REST 单条调用，不依赖 Python 虚拟环境。
- `omni_single` 以及 `two_stage + Qwen Omni` 都不依赖 Python 虚拟环境；当前 DataBaker Omni 可选模型包含 `qwen3.5-omni-plus`、`qwen3.5-omni-flash`、`qwen3.5-omni-flash-2026-03-15`、`qwen3-omni-flash`、`qwen3-omni-flash-2025-12-01`、`qwen3-omni-flash-2025-09-15`。
- Fun-ASR REST 是异步任务模式：
  - 提交任务：`POST /api/v1/services/audio/asr/transcription`
  - 查询任务：`POST /api/v1/tasks/{task_id}`
- 本轮只启用单条 REST 调用，不启用 `file_urls` batch。
- DataBaker 单条“AI 推荐文本”仍走同步 recommend。
- DataBaker “AI并发分析并连续填入合格项”默认直接发送 `POST /api/data-baker/round-one-quality/ai/recommend`。
- 当前页有 N 条合格项，就会为 N 条任务发送对应请求。
- 前端按 `30ms` 错峰发起；“AI连续填入合格项并发数量”已移到 DataBaker 的“ASR 语音 AI 设置”区域，并按当前模型动态归一：
  - Omni：默认 `15`，范围 `1~25`
  - Fun-ASR：默认 `25`，范围 `1~50`
- 前端和后端都会对超范围并发值做归一；前端显示和后端诊断都以归一后的值为准。
- 谁先返回，谁先进入待填队列；填入仍然顺序消费。
- 后端 provider queue / RPM 限流继续保护上游；异步 job 接口如保留，仅作为历史兼容 / 调试入口。
- DataBaker `qwen3.5-omni-flash` / `qwen3.5-omni-plus` 及新增 Omni 版本当前默认优先走 Omni legacy 快速路径，参考提交 `9677e4cea98de222b70f89c9e0af1d89971dc471`；默认按前端并发直接请求 Qwen，上游不再做后端平滑排队，除非显式设置 `DATABAKER_AI_QWEN_SMOOTH_ENABLED=1`。
- `fun-asr` 仍走当前 Node REST provider，不走 Omni legacy 快速路径。
- 统一 Python 虚拟环境固定放在 `platform-resources/backend/.venv`。
- Fun-ASR Python 脚本固定放在 `platform-resources/backend/ai/python/funasr_client.py`。
- Fun-ASR Python 依赖固定放在 `platform-resources/backend/ai/python/requirements.txt`。
- `platform-resources/backend/ai/python/requirements.txt` 现包含 `opencc-python-reimplemented`，用于 Fun-ASR 源头繁转简。
- DataBaker 闽南词表参考资料固定放在 `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`。
- DataBaker 后端业务层当前收敛为 `ai-routes.js + ai-service.js`；公共 provider、队列、缓存和 Python 辅助脚本统一在 `platform-resources/backend/ai/`。
- `DATABAKER_AI_FUN_ASR_PROVIDER=rest` 时，Node 不会启动 Python 子进程。
- `DATABAKER_AI_FUN_ASR_PROVIDER=python` 时，Node 后端调用 Fun-ASR Python 子进程会显式设置 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`。
- `platform-resources/backend/ai/python/funasr_client.py` 仍会按 UTF-8 输出 stdout JSON，避免 Windows 默认控制台编码导致“AI 听音文本”出现 `�` / 黑菱形乱码。
- Fun-ASR 若返回繁体或繁简混合字形，默认 REST 链路会在 DataBaker 结果组装阶段统一繁转简；若显式切到 Python provider，则还会先在 Python 阶段做一次繁转简。
- `阮 / 汝 / 伊 / 诶` 等命中闽南词表的建议用字会被保护，不会被普通繁简转换覆盖。
- 不再使用 `platform-resources/backend/.venv-funasr`。
- 不再使用 `platform-resources/data-baker/round-one-quality/backend/.venv-funasr`。
- `platform-resources/backend` 是统一后端聚合目录，所以 Python 辅助环境也放这里统一管理。

默认 REST provider 相关环境变量：

```
DATABAKER_AI_FUN_ASR_PROVIDER=rest
DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=
DATABAKER_AI_FUN_ASR_REST_BASE_URL=
DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS=1000
```

Python fallback / 调试环境只在以下情况需要准备：

- `DATABAKER_AI_FUN_ASR_PROVIDER=python`
- 或显式设置 `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=python`

Windows 本地准备（仅 Python fallback / 调试时需要）：

```
cd C:\Projects\annotation-script-center\platform-resources\backend
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -U pip
.venv\Scripts\python.exe -m pip install -r ai\python\requirements.txt
node server.js
```

Linux 服务器准备（仅 Python fallback / 调试时需要）：

```
cd /var/www/annotation-script-center/platform-resources/backend
python3 -m venv .venv
.venv/bin/python -m pip install -U pip
.venv/bin/python -m pip install -r ai/python/requirements.txt
node server.js
```

如果使用 PM2，仍然只重启 Node 后端：

```
pm2 restart annotation-script-center --update-env
```

可选环境变量：

- `DATABAKER_AI_FUN_ASR_PROVIDER` 默认 `rest`。
- `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK` 默认空；仅显式设为 `python` 时，REST 失败后才允许退回 Python。
- `DATABAKER_AI_FUN_ASR_REST_BASE_URL` 可选；留空时按 `DASHSCOPE_BASE_URL` 推导到 `/api/v1`。
- `DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS` 默认 `1000`。
- `DATABAKER_FUNASR_PYTHON_BIN` 一般不需要配置，仅 `provider=python` 时使用。
- `provider=python` 且 `DATABAKER_FUNASR_PYTHON_BIN` 留空时，后端自动使用 `platform-resources/backend/.venv`。
- `requirements.txt` 位于 `platform-resources/backend/ai/python/requirements.txt`。
- 上面的 `pip install -r ai/python/requirements.txt` 命令是在 `platform-resources/backend` 目录内执行。
- 如服务器 Python 路径特殊，且显式切到 `provider=python`，可设置：
  `DATABAKER_FUNASR_PYTHON_BIN=/var/www/annotation-script-center/platform-resources/backend/.venv/bin/python`
- Windows 本地同理：
  `DATABAKER_FUNASR_PYTHON_BIN=C:\Projects\annotation-script-center\platform-resources\backend\.venv\Scripts\python.exe`

迁移提醒：

- 新部署推荐直接创建 `platform-resources/backend/.venv` 并重新安装依赖。
- 旧服务器如果还在使用 `.venv-funasr`，可以临时把 `DATABAKER_FUNASR_PYTHON_BIN` 指向旧路径过渡，但默认口径已统一为 `.venv`。

可选验证，不是启动步骤：

Windows：

```
cd C:\Projects\annotation-script-center\platform-resources\backend
.venv\Scripts\python.exe -m py_compile ai\python\funasr_client.py
```

Linux：

```
cd /var/www/annotation-script-center/platform-resources/backend
.venv/bin/python -m py_compile ai/python/funasr_client.py
```

验证接口：

```
GET /api/data-baker/round-one-quality/ai/recommend/health
GET /api/data-baker/round-one-quality/ai/recommend/defaults
```

期望：

- `defaults` 返回 `listenModelOptions` 和 `compareModelOptions`。
- `listenModelOptions` 包含 `fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`、`qwen3.5-omni-flash-2026-03-15`、`qwen3-omni-flash`、`qwen3-omni-flash-2025-12-01`、`qwen3-omni-flash-2025-09-15`。
- `compareModelOptions` 包含 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`。
- `funAsrModel` 为 `fun-asr`。
- `funAsrProvider` 默认 `rest`。
- `funAsrRestConfigured` 与 `funAsrPythonConfigured` 都应可见。
- `omniModel` 默认为 `qwen3.5-omni-flash`，并允许切换到上述 DataBaker Omni 模型列表。
- `compareModel` 为 `qwen3.5-plus`。
- queue groups 应继续返回 `qwen_omni / fun_asr / text_compare`，并带 `maxConcurrent` 或等价并发信息。
- 默认 REST provider 下，即使未配置 Python 虚拟环境，`fun-asr` 也可调用。
- 只有显式切到 `provider=python` 或 `fallback=python` 时，才依赖 Python 环境。

Fun-ASR 返回 `403` 时，常见原因优先排查：

- DashScope API Key 无权限。
- 百炼服务地域或模型未开通。
- Fun-ASR 不支持当前账号或地域。
- 平台 `audioUrl` 对阿里云模型服务不可访问。
- 音频 URL 已过期或签名权限不足。

临时恢复生产使用时，优先切换到 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash`。

如果 `fun-asr` 曾出现听音文本乱码，修复部署后需要重启 `node platform-resources/backend/server.js`，清空旧内存缓存。当前默认 REST provider 不会启动 Python 子进程；仅显式切到 `provider=python` 时才受 Python stdout 编码影响。
如果 `fun-asr` 曾出现听音文本或推荐文本繁体残留，默认 REST provider 下先重启 `node platform-resources/backend/server.js` 清空旧内存缓存；只有显式切到 `provider=python` 或 `fallback=python` 时，才需要重新执行 `pip install -r ai/python/requirements.txt` 后再重启后端。

批量并发诊断要点：

- 前端“AI连续填入合格项”是“并发发起 AI 请求 + 顺序填入页面”的两段流程。
- 前端并发由 `aiQualifiedAutofillConcurrency` 控制：
  - Omni：默认 `15`，范围 `1~25`
  - Fun-ASR：默认 `25`，范围 `1~50`
- 后端 Fun-ASR 并发由 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 控制，默认 `2`；Compare 并发由 `DATABAKER_AI_TEXT_CONCURRENCY` 控制，默认 `5`。
- DataBaker 批量连续填入默认直接调用同步 recommend；异步 job 接口不再作为默认 AI 结果接收链路。
- `DATABAKER_AI_ASYNC_JOBS_ENABLED=0`
- `DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED=0`（历史兼容）
- `DATABAKER_AI_JOB_TIMEOUT_MS=120000`（仅兼容 job 接口时生效）
- `DATABAKER_AI_JOB_TTL_MS=1800000`
- `DATABAKER_AI_JOB_MAX_SIZE=600`
- `DATABAKER_AI_QUEUE_MAX_SIZE=600`
- `DATABAKER_AI_REQUEST_STAGGER_MS=30`（前端错峰发起间隔说明）
- 超过 2 分钟仍未返回的 AI 请求，默认认为不适合当前项目，应优化模型、Prompt、任务拆分或后端策略，而不是继续拉长超时。
- DataBaker 平台当前实际的自动清除时间字段位于前端顶部统计悬浮窗 `autoHideMs`，默认仍为 `60000ms`。
- Fun-ASR 不支持 thinking；不要给 Fun-ASR Python 传 `enable_thinking`。
- Compare 阶段若启用 thinking 可能明显变慢；未勾选时后端会显式关闭 compare thinking。
- 如果批量执行看起来像串行，先看前端悬浮窗里的 `前端并发 / 已发起AI请求 / 前端活跃AI请求 / AI已返回 / 待填队列`，再看 `health` 中 `queue.groups.fun_asr.activeCount/maxConcurrent` 是否能超过 `1`。
- Fun-ASR 失败时，前端现在会优先区分：
  - 鉴权/权限错误
  - 平台音频 URL 不可访问
  - 模型名错误
  - 上游限流
  - 任务失败
  - 转写结果下载失败
- 失败列表继续保留“查看原始AI返回”，弹出的 debug JSON 会脱敏，不包含完整 `audioUrl`、签名 URL、cookie、token 或 API Key。

详细后端配置见 `platform-resources/backend/README.md`。
详细 API 清单见 `platform-resources/README.md` 的“统一后端 API 清单”。

## 发布产物说明

企业部署未完成前，每个版本默认同时生成：

- `dist/annotation-script-center-v<manifest.version>.crx`
- `dist/annotation-script-center-v<manifest.version>.zip`

其中 `CRX + ZIP` 作为当前手工分发文件。\
企业自动更新预留文件继续生成：

- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

发布命令：

```
node scripts/package-crx-release.js --notes "CRX enterprise release"
```

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

## DataBaker 批量请求诊断

- 闽南语助手“AI连续填入合格项”默认直接发送同步 recommend 请求，不默认走异步 jobs。
- 每次批量运行会生成 `batchRunId`；前端会跳过同批次重复 `processKey`，并在悬浮窗展示唯一任务数、重复跳过数、已发起请求和 AI 已返回数。
- 若怀疑重复请求，先看前端悬浮窗统计，再看后端 health 中的 `dedupe.joinedCount`。
