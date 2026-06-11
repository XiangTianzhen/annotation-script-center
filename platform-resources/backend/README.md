# 平台资源统一后端

## 目录用途

本目录是 `platform-resources/` 下所有浏览器无关后端工具的统一启动入口。后续新增平台或脚本项目 API 时，应优先在对应项目目录实现业务逻辑，再通过 `registry.js` 注册到这里。

## 启动方式

在仓库根目录运行：

```powershell
node platform-resources\backend\server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

服务器若使用 PM2，推荐进程名统一为 `annotation-script-center`。首次启动示例：

```bash
cd /var/www/annotation-script-center
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

启动时会自动读取统一后端环境配置文件，顺序为：

1. `config/env/backend.env`
2. `config/env/backend.local.env`
3. `config/env/ai.env`
4. `config/env/ai.local.env`
5. `.env.local`
6. 可选 `ASC_ENV_FILE` 指向的外部文件

系统环境变量优先级最高，不会被配置文件覆盖。文件不存在时跳过；读取失败时只输出脱敏 `warn`，不输出文件内容。
`config/env/ai.env`、`config/env/ai.local.env` 为忽略文件，真实生产内容建议只保留 `DASHSCOPE_API_KEY` 与少量非默认覆盖项。

## 服务器部署与更新

### 首次部署

Linux / PM2 示例：

```bash
cd /var/www
git clone <your-repo-url> annotation-script-center
cd /var/www/annotation-script-center
cp config/env/backend.env.example config/env/backend.env
cp config/env/ai.env.example config/env/ai.env
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

Windows 示例：

```powershell
Set-Location C:\Projects
git clone <your-repo-url> annotation-script-center
Set-Location C:\Projects\annotation-script-center
Copy-Item config\env\backend.env.example config\env\backend.env
Copy-Item config\env\ai.env.example config\env\ai.env
node platform-resources\backend\server.js
```

首次部署后至少检查：

- `pm2 status` 或当前终端输出中确认进程已监听
- `http://127.0.0.1:3333/` 可返回根 JSON
- 关键脚本 health/defaults 接口可以访问

### 日常更新

当前仓库没有根级 `package.json`；服务器更新通常不是 `npm install`，而是“拉代码 + 复核 env + 重启进程 + 检查接口”。

Linux / PM2 推荐流程：

```bash
cd /var/www/annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
curl http://127.0.0.1:3333/
pm2 logs annotation-script-center --lines 100
```

Windows / PM2 推荐流程：

```powershell
Set-Location C:\Projects\annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
Invoke-WebRequest http://127.0.0.1:3333/ | Select-Object -ExpandProperty Content
pm2 logs annotation-script-center --lines 100
```

更新时必须注意：

- 不要直接覆盖服务器本地的 `config/env/backend.env`、`config/env/ai.env`、`config/secrets/*`。
- 如果仓库里的 `.example` 或 README 更新了环境变量说明，只手动把新增项合并到服务器私有配置。
- 如果这次只改后端代码，通常不需要重新生成或替换 `dist/` 静态包。
- 如果这次只替换扩展下载包，通常不需要重启 Node 后端。

### 更新后检查清单

1. `pm2 status` 中 `annotation-script-center` 为 `online`
2. `pm2 logs annotation-script-center --lines 100` 中没有连续启动报错
3. `GET /` 根接口返回 `success=true`
4. 至少抽查一个脚本 health 接口，例如：
   - `/api/aishell-tech/minnan-helper/ai/recommend/health`
   - `/api/data-baker/round-one-quality/ai/recommend/health`
5. 若本轮涉及下载中心或 CRX 分发，再额外检查静态文件 URL 是否可访问

## 官方文档核对入口

- 阿里云百炼官方文档索引：`docs/external-docs-aliyun-bailian.md`
- 涉及模型名、`enable_thinking`、结构化输出、Qwen-Omni、Web Search、限流、调用地区时，必须先核对该索引中的官方文档。
- 如果官方文档在本地无法访问，必须在输出中明确说明“未能联网核对官方文档”，不得伪造结论。

## AI 消耗统一口径

- 所有已接入 AI 服务默认返回统一 `cost` 对象，价格统一读取 `config/aliyun-bailian-model-pricing.json`。
- AI 请求记录 CSV 公共列与脚本扩展列统一使用中文表头。
- 单阶段 AI 调用默认记录总 token，并可补当前调用阶段人民币估算；多阶段 AI 调用默认拆分阶段 token 与阶段预估人民币。
- 缺少价格配置的模型仍允许继续调用；页面可显示 `没有数据源`，CSV 金额列保持空白，不写状态文本。

可用环境变量：

- 仓库内所有 `*_ENABLE_THINKING` 变量只保留历史兼容读取；实际请求统一固定 `enable_thinking=false`，不再通过前端配置或环境变量开启 thinking。

- `PLATFORM_RESOURCES_SERVER_HOST`：统一后端监听地址，默认 `127.0.0.1`。
- `PLATFORM_RESOURCES_SERVER_PORT`：统一后端监听端口，默认 `3333`。
- `ASR_JUDGEMENT_SERVER_HOST` / `ASR_JUDGEMENT_SERVER_PORT`：兼容旧快判本地服务启动配置。
- `ASR_JUDGEMENT_AI_LISTEN_MODEL`：快判 AI 听音模型，默认 `qwen3.5-omni-flash`。
- `ASR_JUDGEMENT_AI_COMPARE_MODEL`：快判 AI 文本比较模型，默认 `qwen3.5-plus`。
- `ASR_JUDGEMENT_AI_TIMEOUT_MS`：快判 AI 请求超时，默认 `60000`。
- `ASR_JUDGEMENT_AI_ENABLE_THINKING`：历史兼容变量；当前快判链路统一固定 `enable_thinking=false`。
- `ASR_JUDGEMENT_AI_WEB_SEARCH_ENABLED`：默认 `1`；快判 compare 阶段默认显式启用 Web Search。
- `ASR_JUDGEMENT_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `1`，允许前端请求体覆盖模型名。
- `ASR_JUDGEMENT_AI_MODEL`：历史兼容 compare model fallback（建议迁移到 `ASR_JUDGEMENT_AI_COMPARE_MODEL`）。
- 快判 AI 请求支持脚本级 `aiOptions`，但后端只按白名单接收：`temperature/top_p/max_tokens/max_completion_tokens/presence_penalty/frequency_penalty/seed/stop/enable_thinking/webSearchEnabled`。
- 不支持参数（如当前 `reasoning_effort`）会被后端忽略，不会透传给模型接口。
- `listenPrompt/comparePrompt` 可由前端覆盖，但后端始终追加安全边界（只输出 JSON、固定 answer 枚举、禁止敏感信息）。
- 若上游返回 `enable_thinking` 不支持/参数无效，后端只会移除该参数重试一次，不会无限重试。
- 快判 Web Search 仅在 compare 阶段启用；若上游返回 `enable_search/search_options` 不支持，后端会移除搜索参数重试一次并记录 fallback。
- `ASR_TRANSCRIPTION_STATS_DIR`：ASR 转写统计输出目录（默认 `platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`）。
- `ASR_TRANSCRIPTION_PERSIST_ROWS_JSON`：设为 `1` 时额外保存 `statistics-rows.json`。
- `ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS`：设为 `1` 时额外保存 `statistics-upload-events.jsonl`。
- `DATABAKER_AI_PIPELINE_MODE`：标贝易采识别模式默认值与历史兼容字段；当前主值是 `two_stage / omni_single`。历史 `qwen_omni_compare / fun_asr_compare / qwen_omni_two_stage / listen_only` 会迁移到新的识别模式。
- `DATABAKER_AI_FUN_ASR_MODEL`：标贝易采 Fun-ASR 录音文件识别模型，默认 `fun-asr`。
- `DATABAKER_AI_LISTEN_MODEL`：标贝易采听音模型默认值；当前 Omni legacy 快速路径默认使用 `qwen3.5-omni-flash`。
- `DATABAKER_AI_OMNI_MODEL`：标贝易采 Qwen Omni 模型默认值；`two_stage` 下用于 Omni 听音，`omni_single` 下用于单模型 AI，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：标贝易采 AI 对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：标贝易采 AI 请求超时，默认 `60000`。
- `DATABAKER_AI_OMNI_LEGACY_FAST_PATH`：默认 `1`；开启后 `qwen3.5-omni-flash / qwen3.5-omni-plus` 优先走参考提交 `9677e4cea98de222b70f89c9e0af1d89971dc471` 的 Omni legacy 快速路径。
- `DATABAKER_AI_FUN_ASR_LANGUAGE_HINTS`：标贝易采 Fun-ASR 语言提示，默认 `zh`。
- `DATABAKER_AI_FUN_ASR_PROVIDER`：标贝易采 Fun-ASR provider 模式，默认 `rest`。
- `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK`：默认空；仅显式设为 `python` 时，REST 失败后才允许退回 Python。
- `DATABAKER_AI_FUN_ASR_REST_BASE_URL`：可选，覆盖 Fun-ASR REST API base；留空时按 `DASHSCOPE_BASE_URL` 推导到 `/api/v1`。
- `DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS`：Fun-ASR REST 轮询间隔，默认 `1000` ms。
- `DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED`：历史兼容开关，默认 `0`；当前默认链路不再依赖异步 job。
- `ASC_AI_JOB_TIMEOUT_MS`：共享 AI job 超时，默认 `60000`。仅在历史兼容 job 接口被显式启用时生效。
- `ASC_AI_JOB_TTL_MS`：共享 AI job 记录保留 TTL，默认 `1800000`（30 分钟）。
- `ASC_AI_JOB_MAX_SIZE`：共享 AI job 内存上限，默认 `600`。达到上限时返回“后端 AI 任务队列已满，请稍后重试。”。
- `ASC_AI_JOB_POLL_INTERVAL_MS`：前端建议轮询间隔提示，默认 `1000` ms。
- `DATABAKER_AI_JOB_*`：仅保留历史兼容 fallback；未设置 `ASC_AI_JOB_*` 时才读取。
- `DATABAKER_FUNASR_PYTHON_BIN`：可选，指定 Python 解释器路径；未设置时优先使用统一虚拟环境 `platform-resources/backend/.venv/`。
- `DATABAKER_AI_QWEN_OMNI_RPM_LIMIT`：标贝易采 Qwen Omni 队列限流，默认 `45` RPM。
- `DATABAKER_AI_FUN_ASR_RPM_LIMIT`：标贝易采 Fun-ASR 队列限流，默认 `500` RPM。
- `DATABAKER_AI_TEXT_RPM_LIMIT`：标贝易采 compare 文本模型队列限流，默认 `500` RPM。
- `DATABAKER_AI_QWEN_OMNI_CONCURRENCY`：标贝易采 Qwen Omni 并发上限，默认 `3`。
- `DATABAKER_AI_FUN_ASR_CONCURRENCY`：标贝易采 Fun-ASR 并发上限，默认 `2`；如 `2 核 2G` 服务器压力高，可继续调低，若资源充足也可手动调高。
- `DATABAKER_AI_TEXT_CONCURRENCY`：标贝易采 compare 文本模型并发上限，默认 `5`。
- `DATABAKER_AI_PROVIDER_RETRY_MAX`：标贝易采上游 `429` 最大重试次数，默认 `3`。
- `DATABAKER_AI_QUEUE_MAX_SIZE`：标贝易采统一 provider 队列最大长度，默认 `600`。达到上限时返回“后端 AI 任务队列已满，请稍后重试。”，不会取消并发和 RPM 保护。
- `DATABAKER_AI_CACHE_TTL_MS`：标贝易采推荐结果内存缓存 TTL，默认 `43200000`。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留 标贝易采 有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留 标贝易采 裁剪前后补齐秒数，默认 `0.12`。
- `DATABAKER_ROUND_ONE_EXPORT_DIR`：标贝易采导出 CSV 保存目录（默认 `platform-resources/data-baker/round-one-quality/backend/export-data/`）。
- `DATABAKER_ROUND_ONE_EXPORT_HISTORY`：设为 `1` 时保存历史导出 CSV。
- `DATABAKER_ROUND_ONE_EXPORT_EVENTS`：设为 `1` 时写入导出上传事件日志 JSONL。
- `MAGIC_DATA_AI_LISTEN_MODEL`：Magic Data 听音模型，默认 `qwen3.5-omni-flash`。
- `MAGIC_DATA_AI_COMPARE_MODEL`：Magic Data 质检模型，默认 `qwen3.5-plus`。
- `MAGIC_DATA_AI_TIMEOUT_MS`：Magic Data AI 请求超时，默认 `60000`。
- `MAGIC_DATA_AI_MOCK`：设为 `1` 时启用 mock 调试模式。
- `MAGIC_DATA_AI_ENABLE_THINKING`：历史兼容变量；当前 Magic Data 客家话助手统一固定 `enable_thinking=false`。
- `MAGIC_DATA_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `1`，允许前端请求体覆盖模型名。
- `MAGIC_DATA_MINNAN_AI_PIPELINE_MODE`：闽南语助手识别模式默认值，`two_stage | omni_single`。
- `MAGIC_DATA_MINNAN_AI_LISTEN_MODEL`：闽南语助手 `two_stage` 听音模型默认值（支持 `fun-asr` 或 Qwen Omni）。
- `MAGIC_DATA_MINNAN_AI_OMNI_MODEL`：闽南语助手 `omni_single` 默认模型。
- `MAGIC_DATA_MINNAN_AI_COMPARE_MODEL`：闽南语助手 compare 模型默认值。
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_MODEL`：闽南语助手 Fun-ASR 模型，默认 `fun-asr`。
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_PROVIDER`：闽南语助手 Fun-ASR provider，默认 `rest`。
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_PROVIDER_FALLBACK`：默认空；显式设为 `python` 时，REST 失败后才退回 Python。
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_REST_BASE_URL`：可选，覆盖 Fun-ASR REST API base。
- `MAGIC_DATA_MINNAN_AI_FUN_ASR_POLL_INTERVAL_MS`：Fun-ASR REST 轮询间隔，默认 `1000` ms。
- `MAGIC_DATA_MINNAN_AI_TIMEOUT_MS`：闽南语助手 AI 请求超时，默认 `60000`。
- `MAGIC_DATA_MINNAN_AI_ENABLE_THINKING`：历史兼容变量；当前 Magic Data 闽南语助手统一固定 `enable_thinking=false`。
- `MAGIC_DATA_MINNAN_AI_MOCK`：设为 `1` 时启用闽南语助手 mock 调试模式。
- `MAGIC_DATA_MINNAN_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `1`，允许前端请求体覆盖模型名。
- `MAGIC_DATA_MINNAN_AI_LEXICON_REWRITE_MODE`：闽南语词表改写策略，默认 `off`。
- `MAGIC_DATA_MINNAN_AI_CACHE_TTL_MS`：闽南语助手结果缓存 TTL（毫秒）。
- `MAGIC_DATA_MINNAN_AI_CALL_LOG_DIR`：闽南语助手调用日志目录覆盖。
- `ABAKA_TASK21_AI_MOCK`：设为 `1` 时启用 Abaka Task21 AI mock 调试模式。
- `ABAKA_TASK21_AI_ANALYSIS_MODE`：默认分析方案，`two_stage | single_model`，默认 `two_stage`。
- `ABAKA_TASK21_AI_VISION_MODEL`：双模型阶段一视觉模型，默认 `qwen3.6-plus`。
- `ABAKA_TASK21_AI_OCR_ENABLED`：是否启用 OCR 辅助阶段，默认 `0`。
- `ABAKA_TASK21_AI_OCR_MODEL`：OCR 阶段模型，默认空（待文字提取官方文档进一步核对）。
- `ABAKA_TASK21_AI_REASONING_MODEL`：双模型阶段二推理模型，默认 `qwen3.6-plus`。
- `ABAKA_TASK21_AI_SINGLE_MODEL`：单模型方案模型，默认 `qwen3.6-plus`。
- `ABAKA_TASK21_AI_MODEL`：旧变量，作为 `ABAKA_TASK21_AI_SINGLE_MODEL` 的兼容回退。
- `ABAKA_TASK21_AI_ALLOWED_VISION_MODELS`：允许前端覆盖的视觉模型白名单（逗号分隔）。
- `ABAKA_TASK21_AI_ALLOWED_OCR_MODELS`：允许前端覆盖的 OCR 模型白名单（逗号分隔）。
- `ABAKA_TASK21_AI_ALLOWED_REASONING_MODELS`：允许前端覆盖的推理模型白名单（逗号分隔）。
- `ABAKA_TASK21_AI_ALLOWED_SINGLE_MODELS`：允许前端覆盖的单模型白名单（逗号分隔）。
- Abaka AI 模型名以官方文档与截图口径为准，旧名 `qwen-vl-max-latest`、`qwen-vl-ocr-latest`、`qvq-plus-latest` 不再作为默认或候选。
- `ABAKA_TASK21_AI_TIMEOUT_MS`：Abaka Task21 AI 请求超时，默认 `60000`。
- `ABAKA_TASK21_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `0`，是否允许请求覆盖模型名（仍受白名单限制）。
- `ABAKA_TASK21_AI_ENABLE_THINKING`：历史兼容变量；当前 Task21 链路统一固定 `enable_thinking=false`。
- `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK`：历史兼容变量；当前固定关闭 thinking 后，正常链路不会再依赖它开启思考。
- `ASR_TRANSCRIPTION_AI_MOCK`：设为 `1` 时启用转写 AI mock 调试模式。
- `ASR_TRANSCRIPTION_AI_LISTEN_MODEL`：转写 AI 听音模型，默认 `qwen3.5-omni-flash`。
- `ASR_TRANSCRIPTION_AI_COMPARE_MODEL`：转写 AI 文本比较模型，默认 `qwen3.5-plus`。
- `ASR_TRANSCRIPTION_AI_TIMEOUT_MS`：转写 AI 请求超时，默认 `60000`。

统一默认时间规则：

- TTS 自动清除默认时间统一为 `60000ms`。
- AI / 模型请求默认超时时间统一为 `60000ms`。
- 非 AI 模型类的上传、下载、统计与普通后端接口超时不受该规则影响。
- `ASR_TRANSCRIPTION_AI_ENABLE_THINKING`：历史兼容变量；当前转写链路统一固定 `enable_thinking=false`。
- `ASR_TRANSCRIPTION_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `1`，允许前端请求体覆盖模型名。
- `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`：项目数据下载密码的 SHA256（兼容旧 `ASC_DATA_DOWNLOAD_PASSWORD_SHA256`）。
- `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`：项目数据下载 token 签名密钥（兼容旧 `ASC_DATA_DOWNLOAD_JWT_SECRET`）；当前也复用为系统管理后台会话 token 的签名密钥。
- `POST /api/admin/session/unlock` 当前直接复用上述两项环境变量校验系统管理密码，不再新增第二套后台密码配置。
- `ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256`：AI 请求记录下载密码的 SHA256；未设置时回退 `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`。
- `ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET`：AI 请求记录下载 token 签名密钥；未设置时回退 `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`。

## ASR AI Defaults 接口

用于 options 的“ASR 语音 AI 设置”面板读取后端默认配置。接口只返回可公开配置，不返回 API Key、cookie、token、authorization、完整音频 URL。

- `GET /api/alibaba-labelx/asr-judgement/ai/defaults`
- `GET /api/alibaba-labelx/asr-transcription/ai/defaults`
- `GET /api/data-baker/round-one-quality/ai/recommend/defaults`
- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
- `GET /api/magic-data/hakka-helper/ai/defaults`
- `GET /api/magic-data/minnan-helper/ai/defaults`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/defaults`

统一返回字段包含：`success`、`scriptId`、`defaults`、`supportedParams`、`notes`。其中 `response_format` 对前端固定为不开放（`supportedParams.response_format=false`），结构化输出由后端控制。

## 统一 AI 调用日志

2026-05-28 起，仓库内所有已接入 AI 的脚本都默认记录调用日志，并提供按脚本独立的统计汇总接口。

共享核心目录：

- `platform-resources/backend/ai-call-log/`

共享公共列：

- `createdAt`
- `requestId`
- `platformId`
- `scriptId`
- `success`
- `errorCode`
- `errorMessage`
- `durationMs`
- `promptTokens`
- `completionTokens`
- `totalTokens`
- `aiUsageOperatorName`
- `platformUserName`
- `platformUserId`
- `rawResponseJson`
- `rawErrorJson`

统一规则：

- 前端必须携带 `aiUsageOperatorName`；未填写时前端与后端都会拦截。
- token 只按 `promptTokens / completionTokens` 作为主统计口径；只有两者都缺失时才回退 `totalTokens`。若业务结果是多阶段 usage（如 `listen / refine`），导出 CSV 会先按阶段汇总再写入 `输入Token / 输出Token / 总Token`。
- 默认保留脱敏后的原始成功 / 失败 JSON，不再把大块业务结果拆成公共列。
- options 当前统一改为“公开脚本中心 + 公开脚本下载中心 + 受保护系统管理”结构；AI 请求记录导出已迁入系统管理的“数据导出”页签。

当前统计接口：

- `GET /api/data-baker/round-one-quality/ai/recommend/logs/summary`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/logs/summary`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/logs/summary`
- `GET /api/magic-data/hakka-helper/ai/review-current/logs/summary`
- `GET /api/magic-data/annotator/ai/review-current/logs/summary`
- `GET /api/magic-data/minnan-helper/ai/review-current/logs/summary`
- `GET /api/alibaba-labelx/asr-judgement/ai/suggest/logs/summary`
- `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/logs/summary`
- `GET /api/abaka-ai/task21/ai/analyze/logs/summary`

返回结构统一包含：

- `success`
- `service`
- `scriptId`
- `callLogDir`
- `stats.fileCount`
- `stats.totals`
- `stats.byDate`
- `stats.byOperator`
- `stats.byErrorCode`

统一查看 / 导出接口：

- `GET /api/admin/ai-call-log/options`
- `POST /api/admin/ai-call-log/request`
- `GET /api/admin/ai-call-log/file?token=...`
- `HEAD /api/admin/ai-call-log/file?token=...`
- `GET /api/admin/ai-call-log/options` 默认不返回 beta 数据集；只有前端显式带 `includeBeta=1` 时才包含 beta 脚本的导出项
- 说明：`options` 当前返回脚本类型 `id/label`，并补充 `hasData/fileCount/dateFrom/dateTo`，供系统管理页直接显示空态和可导出范围。
- 日期范围：前端可选填写 `dateFrom/dateTo`；默认留空，留空时导出该脚本当前全部 AI 请求记录。
- 审计目录：`platform-resources/backend/audit-data/ai-call-log-download/`（运行数据，不提交 git）

## 项目数据下载密码配置教程

项目数据下载与系统管理会话都不保存明文密码。后端仅校验 SHA256，并使用 JWT Secret 生成短期下载 token / 管理员会话 token。

创建真实配置文件：

```powershell
copy config\env\backend.env.example config\env\backend.env
```

主推变量：
- `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`

兼容旧变量：
- `ASC_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_DATA_DOWNLOAD_JWT_SECRET`

生成 SHA256（PowerShell）：

```powershell
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "你的下载密码"
```

随机生成 JWT_SECRET：

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

填入 `config/env/backend.env`：

```text
ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256=上一步生成的密码hash
ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET=上一步生成的随机字符串
```

本地临时运行：

```powershell
$env:ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256="上一步生成的hash"
$env:ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET="一段足够长的随机字符串"
node platform-resources\backend\server.js
```

Windows 用户级持久化：

```powershell
[Environment]::SetEnvironmentVariable("ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256", "上一步生成的hash", "User")
[Environment]::SetEnvironmentVariable("ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET", "一段足够长的随机字符串", "User")
```

Linux / 服务器：

```bash
cd /var/www/annotation-script-center
cp config/env/backend.env.example config/env/backend.env
nano config/env/backend.env
pm2 restart annotation-script-center --update-env
```

如果需要按 README 口径重建服务名：

```bash
cd /var/www/annotation-script-center
pm2 delete annotation-script-center
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

如果接口返回 `project-data-download-auth-not-configured`，说明环境变量缺失或当前进程未读取到，需检查配置并重启后端。

安全要求：
- 禁止把真实密码、真实 hash、JWT secret 提交到仓库。
- 不要提交 `config/env/backend.env`、`config/env/backend.local.env`。
- 不要提交 `config/env/ai.env`、`config/env/ai.local.env`。
- `POST /api/admin/project-data-download/request` 与 `POST /api/admin/ai-call-log/request` 当前支持两种鉴权方式：
  - 直接在 body 里传 `password`
  - 通过 `Authorization: Bearer <admin-session-token>` 复用已登录系统管理会话
- 下载密码与管理员会话 token 都不允许放 query。
- 审计日志只记录必要追踪字段，不记录密码和完整 token。

## 文件职责

- `server.js`：统一启动入口。
- `env-loader.js`：原生 Node.js 环境配置文件加载器。
- `app.js`：创建 HTTP server，并挂载根路径和项目路由。
- `router.js`：轻量路由注册与分发。
- `registry.js`：显式注册启用哪些平台 / 项目 API。
- `response.js`：JSON 响应、空响应和 CORS header。
- `config.js`：统一后端 host / port 配置。
- `ai-framework/`：统一 AI 框架骨架，提供公共 request/response 契约、route 工厂、资产 loader、pipeline 执行器和 adapter 注册表。
- `ai/`：统一 AI 基座，放公共 provider、限流队列、缓存、脱敏与 Python 辅助脚本。
- `ai/model-catalog.js`：百炼核心模型统一注册表，集中维护文档链接、费用链接、family、tier、thinking 默认策略与运行时顺序。
- `ai/model-dispatcher.js`：按模型名统一派发 JS / Python 运行时；默认 `JS 优先，Python 备用`。
- `admin-auth.js`：系统管理会话与下载导出共用的管理员鉴权 helper，负责密码 hash 校验、Bearer token 读取和会话 token 签发/校验。
- `admin-session/`：系统管理登录接口。
- `admin-dashboard/`：系统管理仪表盘聚合接口，当前返回模型池占用、后端元信息、数据导出摘要、最近 `24` 小时日志统计和最近运行日志。
- `project-data-download/`：统一“项目数据下载”聚合模块（options/request/file、token、审计、CSV 筛选），并开始承载共享下载 core：
  - `labelx-download-core.js`
  - `labelx-existing-core.js`
  - `csv-file-download-core.js`（通用 CSV 文件下载 core，当前已被 DataBaker `export/download` 复用）
- `ai-call-log-download/`：统一“AI 请求记录”聚合模块（options/request/file、token、审计、按脚本 + 日期范围导出 CSV）。

## 当前已注册 API

- `alibaba-labelx/asr-judgement`：快判统计上传、定时配置、健康检查、供应商列表与总表 CSV 下载，以及 AI 建议 `health/suggest` 接口。当前下载 / suppliers / existing 已开始复用 `project-data-download/` 下的 LabelX 共享 core，外部 path 保持不变。
- `alibaba-labelx/asr-transcription`：转写统计上传、定时配置、健康检查、供应商列表与总表 CSV 下载（CSV 列与快判不同，按转写统计格式输出），以及当前题 AI 推荐 `suggest-current/health` 接口。当前下载 / suppliers / existing 已开始复用 `project-data-download/` 下的 LabelX 共享 core，外部 path 保持不变。
- `data-baker/round-one-quality`：一检质检 AI 推荐文本 `health/defaults/recommend`、历史兼容 jobs，以及导出 CSV `health/config/upload/download/list` 接口；当前前端先选“识别模式”，`two_stage` 显示“听音模型 + 比较模型”，`omni_single` 只显示“AI 模型”。后端再派发到 Fun-ASR REST 当前链路，或 `qwen3.5-omni-flash / qwen3.5-omni-plus` 的 Omni legacy 快速路径；导出原始记录脱敏后单独保存为 `latest-raw.json`，不再写入 CSV 列。`export/download` 当前已开始复用 `project-data-download/csv-file-download-core.js`，外部 path 保持不变；upload 字段归一、CSV helper、merge helper、latest/history/events 持久化 helper、history 读取 helper、字段映射、下载 helper 和脱敏样例继续往 `platform-resources/data-baker/round-one-quality/data/` 收口。
- `data-baker/round-one-quality` 的 `supportedPipelineModes` 仅保留给后端兼容与排查使用，不再作为前端主配置来源；前端主配置为 `listenModelOptions` 与 `compareModelOptions`。
- `data-baker-cvpc/liuzhou-helper`：DataBaker CVPC 柳州话脚本独立接口；当前开放 `segment/health`、`segment/preview`、`ai/recommend/health`、`ai/recommend/defaults`、`ai/recommend`、`clip-cache/health`、`clip-cache/upload`、`clip-cache/files/:clipId.wav`。当前段 AI 推荐主链路已改为“浏览器裁剪当前波形选中段 -> 直接拼成 Base64 `audioDataUrl` -> 调用 recommend”；`clip-cache/*` 仅保留历史兼容与调试接口。画段建议链路当前改成“前端只传 `audioUrl + 阈值` -> 后端 Python `miniaudio` 直接解码 mp3 并生成整音频预览 -> 前端点击 `应用当前建议` 时优先构造并直写平台 `save_increment`，增量补切直写失败时再回退页面内 DOM 画段”。固定边界仍是：不自动保存、不自动提交、不自动切下一条；只有用户主动点击 `应用当前建议` 时才会尝试平台保存链路。
- DataBaker `fun-asr` 链路默认通过 `platform-resources/backend/ai/providers/funasr-rest.js` 走 Node REST 异步任务提交 / 轮询；仅显式切到 `provider=python` 或 `fallback=python` 时才会调用 `platform-resources/backend/ai/python/funasr_client.py`。
- 如曾命中过旧乱码结果，修复后需要重启 `node platform-resources/backend/server.js`，清空旧内存缓存；默认 REST 链路不经过 Python 子进程，仅显式切 Python 时才受 Python stdout 编码影响。
- `magic-data/hakka-helper`：Magic Data 客家话助手 AI 复核接口（保留 `annotator` 兼容路径）。
- `magic-data/minnan-helper`：Magic Data 闽南语助手 AI 复核接口；支持 `two_stage + fun-asr`、`two_stage + Qwen Omni`、`omni_single + Qwen Omni` 三种链路。
- `aishell-tech/minnan-helper`：Aishell Tech 闽南语助手 AI 推荐接口；当前条推荐与批量串行真实保存共用同一 recommend 业务入口，默认由 `POST /jobs` + `GET /jobs/:jobId` 承接前端结果链路，并继续保留同步 recommend 路由作为兼容 / 调试入口。
- `aishell-tech/vietnamese-helper`：Aishell Tech 越南语助手 AI 推荐接口；固定为单阶段 Omni 转写，同样走 `POST /jobs` + `GET /jobs/:jobId`，并保留同步 recommend 路由作为兼容 / 调试入口。
- `abaka-ai/task21`：Abaka Task21 AI 分析接口，包含 `health/defaults/analyze`；列表页统计入口已在前端显示，但统计后端接口与独立统计 runtime 仍待补齐。
- `admin/session`：系统管理登录接口，负责签发短期管理员会话 token。
- `admin/dashboard`：系统管理仪表盘聚合接口，当前负责汇总模型池占用、后端状态、数据导出快捷信息、日志统计概况与最近运行日志。
- `admin/project-data-download`：项目数据下载聚合接口，支持密码校验或管理员 Bearer 会话、短期 token 下载链接、供应商筛选下载和审计日志。
- `admin/ai-call-log`：AI 请求记录聚合接口，支持密码校验或管理员 Bearer 会话、短期 token 下载链接、按脚本 + 日期范围导出 CSV 和审计日志。

Magic Data 接口：
- 客家话助手（新路径）：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
  - 返回结构对齐新版面板：`speakerCheck`、`dialectTextCheck`、`mandarinTextCheck`、`overall`、`recommendations`、`audioCheck`，并保留 legacy `listen/comparison/verdict`
  - 默认配置：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，`enable_thinking=false`
- 闽南语助手：
  - `GET /api/magic-data/minnan-helper/ai/review-current/health`
  - `GET /api/magic-data/minnan-helper/ai/defaults`
  - `POST /api/magic-data/minnan-helper/ai/review-current`
- 兼容旧路径（客家话助手）：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

Abaka Task21 AI 接口：
- `GET /api/abaka-ai/task21/ai/health`
- `GET /api/abaka-ai/task21/ai/defaults`
- `POST /api/abaka-ai/task21/ai/analyze`

Aishell Tech AI 接口：
- `GET /api/aishell-tech/minnan-helper/ai/recommend/health`
- `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/minnan-helper/ai/recommend`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/health`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/vietnamese-helper/ai/recommend`
- `POST /api/aishell-tech/vietnamese-helper/ai/recommend/jobs`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/jobs/:jobId`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/jobs/:jobId/debug`

DataBaker CVPC AI / 画段接口：
- `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - 当前返回默认静音规则：`silenceThresholdDbfs=-27`、`minSilenceMs=400`、`contextPaddingMs=100`、`segmentScope=existing-segments-incremental`
  - 当前返回 `contract.writeContractCaptured=page-dom-only`
- `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - 输入当前主链路：`audioUrl`、`rules.silenceThresholdDbfs/minSilenceMs/contextPaddingMs`
  - 兼容旧链路仍支持：`silentRanges[]`、`existingSegments[]`、`segmentScope`
  - 输出当前返回：`data.proposedSegments[]`、`data.changes[]`、`meta.rules`、`meta.analysisSource=backend-python-audio-url`、`meta.analysisMeta`、`meta.contractMode=dom-guarded-manual-save`
- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
- `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
- `GET /api/data-baker-cvpc/liuzhou-helper/clip-cache/health`
- `POST /api/data-baker-cvpc/liuzhou-helper/clip-cache/upload`
- `GET /api/data-baker-cvpc/liuzhou-helper/clip-cache/files/:clipId.wav`
- clip-cache 运行目录：`platform-resources/data-baker-cvpc/liuzhou-helper/data/runtime/clip-cache/`
- clip-cache 当前只存浏览器端已裁好的 `audio/wav`，TTL 默认 `1` 小时，上传/读取/服务启动时都会顺手清理过期文件

系统管理接口：
- `POST /api/admin/session/unlock`
- `GET /api/admin/dashboard/overview`
- `GET /api/admin/dashboard/overview`
  - 当前返回模型池占用所需的 queue 快照、共享 AI 任务池容量快照、后端状态、数据导出摘要和 `logsSummary`
  - `logsSummary` 包含最近 `24` 小时 `success / warn / error` 计数、`retentionDays=7` 和最近一条失败摘要
  - 前端 `options` 仪表盘默认每 `60` 秒自动刷新一次，并可手动刷新
  - 模型池快照当前按“总容量”语义返回：`capacity / usedCount / availableCount / isFull / utilizationPercent`
  - 任务池快照当前同样返回：`capacity / usedCount / availableCount / isFull / utilizationPercent`
- `GET /api/admin/dashboard/runtime-logs`
  - 返回最近运行日志，默认近 `20` 条、按时间倒序
  - 日志文件落在 `platform-resources/backend/admin-dashboard/runtime-data/runtime-YYYY-MM-DD.jsonl`
  - 文件默认保留 `7` 天；PM2 重启后仍可查看近 `7` 天应用日志，但不会直接读取 PM2 stdout/stderr
- `GET /api/admin/download-center/releases`
  - 面向 `options` 公开“脚本下载中心”页，返回结构化扩展版本列表
  - 先读取远端 `annotation-script-center-crx-latest.json` 获取最新版
  - 再解析远端 `/downloads/` 目录页中的历史 `annotation-script-center-v*.crx/.zip`
  - 可通过 `ASC_DOWNLOAD_BASE_URL` 覆盖默认下载根地址，适用于 IP 部署或非主域名部署
  - 合并后按版本倒序返回：`latestVersion`、`items[].version/crxUrl/zipUrl/createdAt/isLatest`
  - 若目录页抓取或解析失败，至少回退返回 latest json 对应的最新版一项，并在 `source.usedFallback` / `source.fallbackReason` 中标记
  - 当前为公开可读接口，不要求管理员会话

项目数据下载接口：
- `GET /api/admin/project-data-download/options`
- `POST /api/admin/project-data-download/request`
- `GET /api/admin/project-data-download/file?token=...`
- `HEAD /api/admin/project-data-download/file?token=...`
- `request` 当前支持 body `password` 或 `Authorization: Bearer <admin-session-token>`
- `request` 的 `supplier` 当前支持显式传 `__all__`：
  - 单供应商或多供应商都可用，语义都是“下载总表，不按供应商过滤”。
  - 只有真正留空且当前数据存在多个供应商时，才会返回 `project-data-download-supplier-required`。
- 审计目录：`platform-resources/backend/project-data-download/audit-data/`（运行数据，不提交 git）

AI 请求记录接口：
- `GET /api/admin/ai-call-log/options`
- `POST /api/admin/ai-call-log/request`
- `GET /api/admin/ai-call-log/file?token=...`
- `HEAD /api/admin/ai-call-log/file?token=...`
- `request` 当前支持 body `password` 或 `Authorization: Bearer <admin-session-token>`
- 审计目录：`platform-resources/backend/audit-data/ai-call-log-download/`（运行数据，不提交 git）

ASR 转写职责边界：
- 扩展前端客户端：`extension/sites/alibaba-labelx/asr-transcription/transcription-stats-client.js`，只负责采集、上传、按钮和调度。
- Node 后端服务：`platform-resources/alibaba-labelx/asr-transcription/backend/`，负责路由、合并、CSV 写入与上传；下载 / suppliers / existing 已开始复用 `platform-resources/backend/project-data-download/` 下的 LabelX 共享 core。
- 转写 AI 推荐接口：
  - `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`
  - 仅返回辅助推荐，不自动保存/提交。

后端地址配置规则：
- 扩展前端只有一个全局后端地址入口：options 首页顶部“后端接口地址”（`server` / `local`）。
- 各脚本详情页不再提供独立后端地址、上传接口地址或 AI 接口地址配置。
- 各脚本 AI 设置互相独立，不做全局 AI 参数复用；快判 AI 高级设置仅影响快判请求体。
- 统计上传能力默认强制启用；若脚本实现了定时上传能力，定时上传也按脚本规则强制启用，不在脚本详情页提供关闭开关。
- 运行时统一按“全局 baseUrl + 固定 API path”拼接：
  - ASR 转写统计：`/api/alibaba-labelx/asr-transcription/statistics/*`
  - ASR 快判统计：`/api/alibaba-labelx/asr-judgement/statistics/*`
  - ASR 快判 AI 建议：`/api/alibaba-labelx/asr-judgement/ai/suggest`
  - ASR 转写 AI 推荐：`/api/alibaba-labelx/asr-transcription/ai/suggest-current`
  - 标贝易采 AI 推荐：`/api/data-baker/round-one-quality/ai/recommend`
  - DataBaker CVPC 柳州话 AI 推荐：`/api/data-baker-cvpc/liuzhou-helper/ai/recommend`
  - DataBaker CVPC 柳州话 clip-cache 上传：`/api/data-baker-cvpc/liuzhou-helper/clip-cache/upload`
  - DataBaker CVPC 画段建议：`/api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - Aishell Tech AI 推荐：`/api/aishell-tech/minnan-helper/ai/recommend`
  - Aishell Tech 越南语 AI 推荐：`/api/aishell-tech/vietnamese-helper/ai/recommend`
  - 标贝易采导出上传：`/api/data-baker/round-one-quality/export/upload`
  - 标贝易采导出下载：`/api/data-baker/round-one-quality/export/download`

DataBaker AI 架构补充：
- 当前默认链路是：`qwen3.5-omni-flash / qwen3.5-omni-plus` 优先走 Omni legacy 快速路径；选择 `fun-asr` 时默认通过 Node RESTful API 调用 Fun-ASR，再走 compare 文本模型。
- 前端“AI连续填入合格项并发数量”当前按模型动态归一：Omni 默认 `5`、范围 `1~25`；Fun-ASR 默认 `5`、范围 `1~50`。前端值更大只会更快把请求送进统一后端队列，不会放大后端 provider 并发上限。
- 前端并发和后端并发是两层配置：前端 `aiQualifiedAutofillConcurrency` 控制浏览器同时维持多少个在途 AI 请求窗口；某条 AI 一旦返回，就会立即补发下一条，不等待页面保存完成。后端 `DATABAKER_AI_FUN_ASR_CONCURRENCY / DATABAKER_AI_TEXT_CONCURRENCY` 负责上游 provider 实际同时 in-flight 数量。
- DataBaker 批量“AI连续填入合格项”默认改为短请求创建 `POST /api/data-baker/round-one-quality/ai/recommend/jobs`，再轮询 `GET /jobs/:jobId`；同步 recommend 保留为兼容 / 调试入口。
- Omni legacy 快速路径不使用 async job、Fun-ASR REST、Python 或 SSE；它只用于先恢复 Qwen Omni 的基础速度和稳定性。
- job health 会返回 `jobs.maxSize / jobs.timeoutMs / jobs.activeCount / jobs.pendingCount / jobs.runningCount / jobs.succeededCount / jobs.failedCount` 以及 `queue.maxSize / queue.groups.*.pendingCount / activeCount / maxConcurrent`。
- job health 当前额外返回 `jobs.capacity / jobs.usedCount / jobs.availableCount / jobs.isFull / jobs.utilizationPercent`，用于区分“共享任务池已满”还是“具体模型池排队中”。
- 系统仪表盘与模型池卡片当前优先展示 `总占用 = activeCount + pendingCount`：`activeCount` 表示已经开始调用上游但尚未完成，`pendingCount` 表示已接收但仍在等待发起。
- 当共享任务池达到上限时，后端当前会优先回收最早的终态 job（`succeeded / failed / expired`），避免旧成功记录长期占满整个任务池；如果运行中和待启动任务本身已经把池打满，仍会返回 `ai-job-store-full`。
- `loadFailureDebugJson` 前端兜底函数已恢复定义；如果当前失败项没有 debug 数据，会提示“当前失败项没有可复制的原始 JSON。”，不再抛 `ReferenceError`。
- 如果模型输出 JSON 解析失败，可通过 `GET /api/data-baker/round-one-quality/ai/recommend/jobs/:jobId/debug` 复制脱敏后的原始模型输出排查 Prompt / schema。
- 如果“AI连续填入合格项”看起来像串行，先区分两层：前端悬浮窗是否已经灌满请求窗口（`已发起AI请求 / 前端活跃AI请求 / AI已返回`），以及后端 `health.queue.groups.fun_asr.activeCount/maxConcurrent` 与系统仪表盘 `总占用` 是否能持续拉高；若 `activeCount` 长期为 `1` 且总占用也上不去，优先检查 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 和 `DATABAKER_AI_FUN_ASR_RPM_LIMIT`。
- 如果 Fun-ASR 批量时前端出现 `Failed to fetch`，更常见的根因不是识别失败，而是同步 recommend 长连接等待过久，被浏览器、Nginx 或网关中断。当前主方案是“短请求创建 job + 轮询 job 状态”，避免单个 HTTP 连接长期挂起。
- `429` 的根因是上游模型或账号维度限流，不是统一后端机器规格问题；同一阿里云主账号下的多个 RAM 用户/API Key 可能共享限流额度。
- Fun-ASR 不走 OpenAI-compatible chat/completions；模型名必须是小写 `fun-asr`。
- Fun-ASR REST 是异步任务模式：先 `POST /services/audio/asr/transcription` 提交任务，再 `POST /tasks/{task_id}` 查询任务；本轮只实现单条 REST 调用，不启用 `file_urls` batch。
- Fun-ASR 不支持 thinking；当前 Qwen Omni 和 compare 阶段也已统一固定关闭 thinking。
- Fun-ASR 真实可用性仍取决于服务端是否能访问平台签名 `audioUrl`；若返回 `403`，需要优先排查权限/地域/API Key 和音频 URL 可访问性。

### 统一 AI 基座与 Python 虚拟环境

- 统一后端 Python 虚拟环境固定放在 `platform-resources/backend/.venv`。
- 当前首个使用场景是 DataBaker Fun-ASR，但后续新增 Python 辅助脚本也应优先复用该目录。
- 公共 AI 基座目录是 `platform-resources/backend/ai/`。
- Fun-ASR Python 文件与依赖文件已移动到：
  - `platform-resources/backend/ai/python/funasr_client.py`
  - `platform-resources/backend/ai/python/requirements.txt`
- `platform-resources/backend/ai/python/requirements.txt` 现包含 `opencc-python-reimplemented` 与 `miniaudio`；前者用于 Fun-ASR 源头繁转简，后者用于 DataBaker CVPC 后端整音频画段预览时直接解码 mp3。
- Fun-ASR 默认 provider 已改为 `platform-resources/backend/ai/providers/funasr-rest.js`。
- `platform-resources/backend/ai/providers/funasr.js` 负责统一选择 `rest/python` provider；默认 `rest`，仅在显式配置 `DATABAKER_AI_FUN_ASR_PROVIDER=python` 或 `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=python` 时使用 Python 路径。
- `platform-resources/backend/ai-framework/` 当前只保留公共层与兼容层；继续调整时以现有代码、对应平台 README 和实际路由注册为准。
- DataBaker 业务目录当前只保留 `ai-routes.js + ai-service.js` 作为业务层；闽南词表参考资料位于 `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`。
- `DATABAKER_FUNASR_PYTHON_BIN` 留空时，统一后端默认优先查找 `platform-resources/backend/.venv` 下的 Python。
- 默认 REST provider 不需要单独启动 Python；Python 只在显式切到 `provider=python` 或 fallback 时作为 Node 统一后端内部辅助进程运行。
- 标准启动入口始终是 `node platform-resources/backend/server.js`。
- 项目级服务器部署、Windows/Linux 创建命令、重启与 `health/defaults` 验证流程统一见根目录 `README.md`。
- 这里不重复完整部署命令，避免误解为需要单独部署 Python 服务。
- Fun-ASR 若返回繁体或繁简混合字形，后端会在 Python 输出阶段和 DataBaker 业务组装阶段各做一次繁转简；命中闽南词表建议用字时继续保留原建议字形。

## 统计总表规则
- LabelX 转写与快判统计主存储恢复为根级总表：`statistics-data/statistics-merged.csv`。
- CSV 导出供应商列采用动态策略：
  - 单供应商数据集：不输出“供应商”列。
  - 多供应商数据集：在最后一列追加“供应商”列。
- CSV 写出前统一清洗字段前后空白（含 BOM/全角空格/Tab/换行/零宽字符）；任务名、ID、人员、时间、完成状态、供应商均不保留前后空格。
- 内部 `payload/mergeKey` 继续保留 supplier 信息，用于避免跨供应商同分包 ID 覆盖。
- 当已有供应商字段为 `未识别供应商` / `unknown-supplier` / 空值时，必须回退任务名重新识别，不得固化错误供应商值。
- 转写统计抓取按 `recordCount` 全量分页：不再固定前 `5` 页/`50` 子任务/`300` 详情条目，详情默认并发 `5`、上限 `999`，详情优先 `pageSize=5000` 并在必要时继续分页补齐。
- 快判统计抓取同样按 `recordCount` 补齐，`finished=true/false` 都抓；快判详情保持 `pageSize=400`，并发规则同样是 `Math.floor(total/5)`、最小 `1`、最大 `999`。
- 页数上限与并发上限分离：页数上限用于防无限分页，并发上限固定 `999`。
- 有效时长口径为“是否有效”严格等于“有效”。
- CSV 下载接口默认下载总表，不强制 `supplier` 参数。
- 不再主动创建 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
- 转写与快判上传进度都使用共享组件 `extension/shared/progress-indicator.js`，展示阶段、完成/总数、百分比、并发、成功/失败；后续平台长耗时统计/导出任务默认复用该组件。
- 当前接口示例：
  - 转写供应商列表：`/api/alibaba-labelx/asr-transcription/statistics/suppliers`
  - 转写默认总表下载：`/api/alibaba-labelx/asr-transcription/statistics/download`
  - 快判供应商列表：`/api/alibaba-labelx/asr-judgement/statistics/suppliers`
  - 快判默认总表下载：`/api/alibaba-labelx/asr-judgement/statistics/download`

## 新增项目 API 规则

1. 在对应项目目录下创建 `backend/index.js`，导出 `registerRoutes(router, options)`。
2. 业务逻辑继续放项目自己的 `backend/` 下，不写进统一入口。
3. 在 `registry.js` 中显式注册该项目。
4. 更新对应项目 README、`platform-resources/README.md` 和根目录 `log.md`。

## 后端参数变更流程

1. 先核对 `docs/external-docs-aliyun-bailian.md` 对应官方文档。
2. 更新后端参数白名单与归一化逻辑。
3. 更新对应 `defaults` 接口返回字段。
4. 同步更新 options 的 `supportedParams` 展示逻辑。
5. 运行 `node --check` 与必要的 manifest/路径校验。
6. 在真实调用场景验证成功/失败回退与脱敏日志。



## 中文乱码修正（CSV 健康值合并）
- 统计 CSV 写入统一为 **UTF-8 with BOM**，提升 Excel 直接打开时的中文兼容性。
- CSV 写出前会清理关键字段（任务名称、标注员/审核员、供应商）的前后空白、BOM、零宽字符。
- 若旧 CSV 中存在 `�`（U+FFFD）损坏值，合并时优先采用新 payload 的健康值覆盖旧损坏值。
- 当 `供应商` 为 `未识别供应商`、`unknown-supplier`、空值或包含 `�` 时，必须回退到任务名称重新推断。
- LabelX 转写已知供应商仍按任务名优先识别：包含 `棋燊` -> `棋燊`，包含 `希尔贝壳` -> `希尔贝壳`。
- 主存储继续保持根级总表：`statistics-data/statistics-merged.csv`。
- 不主动生成 `statistics-data/suppliers/`，历史残留目录不作为主输出。
- 转写与快判后端都使用同一套“中文清洗 + 健康值优先”策略。
- 日志与错误信息继续脱敏，不记录 cookie、token、authorization、完整音频 URL。

## 导出完整性与断点跳过增强
- 统计以 `分包ID` 作为关键定位点：分包ID 为空的数据直接废弃，不写入 CSV、不上传。
- 后端新增 existing 检查接口（转写/快判）：
  - `POST /api/alibaba-labelx/asr-transcription/statistics/existing`
  - `POST /api/alibaba-labelx/asr-judgement/statistics/existing`
- 导出前先检查已有根级总表 `statistics-data/statistics-merged.csv`：
  - `complete=true` 的分包数据直接跳过详情拉取。
  - `complete=false` 或不存在的数据继续拉取详情并重试。
- existing 检查失败时回退全量拉取，不阻断导出流程。
- 失败数据定义调整为：分包ID为空（废弃/拒绝）、详情请求失败、JSON解析失败、上传请求失败等真正失败；字段空白默认记为 warning/incomplete，不计入 failed。
- 结束时若存在失败数据，提示：`有数据导出失败，请再次点击导出`。
- 再次点击导出时会优先跳过已完整数据，重点补失败/不完整数据。
- 动态并发规则统一为：`Math.floor(total / 5)`，最小 `1`，最大 `999`。
- 转写与快判进度条都展示：阶段、完成/总数、并发、成功、失败，并支持 skipped/discarded 摘要。
- 定时上传时间统一：每天 `10:00`、`16:00`。
- 定时上传到服务器前新增随机延迟：`0~300` 秒、`100ms` 步进；手动上传不延迟。
- CSV 主存储继续为根级总表：`statistics-data/statistics-merged.csv`；不主动生成 `statistics-data/suppliers/`。
- CSV 继续使用 UTF-8 with BOM，单供应商不输出“供应商”列，多供应商在最后一列输出“供应商”。
- 全流程继续脱敏：不记录 cookie、token、authorization、完整音频 URL。

## 失败判定规则
- LabelX 统计按标注/审核分角色逐步合并：另一角色字段为空属于正常情况，不再判失败。
- 只有 `分包ID` 为空时才直接废弃（discardedNoBatchId），不写 CSV、不上传。
- `任务名称/任务ID/人员/领取时间/提交时间/有效时长` 为空默认记为 warning/incomplete，不阻断上传。
- 批量上传改为“部分失败不影响成功数据保存”，后端返回 `acceptedCount/rejectedCount/rejectedItems`。
- 结束提示规则：仅当 `failed > 0` 才提示“有数据导出失败，请再次点击导出”；仅 warning 时提示“部分字段待后续角色补齐”。
- existing `complete` 按当前 role 最小条件判断：转写 `label=标注子任务ID`、`audit=审核子任务ID`；快判 `label=任一标注员子任务ID`、`audit=审核子任务ID`。
- 统计主存储继续为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 并发规则保持 `Math.floor(total / 5)`，最小 `1`，最大 `999`；定时上传保持 `10:00/16:00`，上传前随机延迟 `0~300s`（`100ms` 步进）。


## complete / 跳过规则
- `existing` 接口中 `exists=true` 不等于 `complete=true`；只有满足最低完整条件才可跳过。
- 转写 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID`。
- 快判 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID（label 为任一标注员槽位ID）`。
- 任务名称为空不算失败，但必须判为 `complete=false`，下次导出继续拉详情补齐。
- `exists=true && complete=false` 必须继续拉详情与上传，不计入 `skippedComplete`。
- 无待上传数据（`payloads.length=0`）时不调用 `/statistics/upload`，提示“已全部完整，无需上传”。
- 上传进度板块宽度已增大（`min-width:560px`、`max-width:780px`、允许换行），四位数成功/失败数量可见。
- 主存储仍为根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
## 待补任务名称与进度样式

- `existing` 返回 `exists=true` 时仍必须以 `complete` 判定是否跳过；`complete=false` 继续补齐，不算失败。
- 转写任务名称补齐支持 `detail/summary/taskMap` 多源回退；`detail` 空值不得覆盖健康任务名称。
- 转写后端合并优先复用同 `分包ID + role + subTaskId` 的已有行，避免“旧空任务名称行”和“新补齐行”并存。
- 无待上传 payload 时前端不调用 upload，仅提示“已全部完整，无需上传”。
- 共享进度组件改为水平居中，完成态与进行中保持同一紧凑卡片布局。
## LabelX force replace 上传说明

- 统一后端继续复用原有 LabelX 统计上传地址，不新增独立 force replace 路由。
- 当前仅 Alibaba LabelX ASR 快判与 ASR 转写支持手动 `forceReplaceByBatchId` 上传语义。
- force replace 请求体会带 `replaceMode="batch"` 和 `replaceBatchIds`；后端继续以 `分包ID` 归并行，但只局部覆盖当前角色 / 当前人员槽位，不再删整分包旧行。
- 定时上传 `reason=schedule` 不应传 `forceReplaceByBatchId`，统一保持默认 existing 跳过逻辑。

## 统计 CSV 字段命名补充

- LabelX 与 DataBaker 的 CSV 写出统一改为新口径字段，不再输出旧字段重复列。
- LabelX 旧字段 `有效时长` / `有效时长(秒)` 与旧人员列会在合并阶段迁移到 `_S` / `_P` 字段。
- DataBaker 旧字段 `质检人`、`有效时长`、`有效合格时长` 会在 `latest.csv` 合并阶段迁移到 `质检人_P` 与 `有效合格时长_S`。

## DataBaker 批量 recommend 去重

- DataBaker round-one-quality 的批量 AI 连续填入默认走异步 jobs；同步 recommend 只保留给兼容调用和人工调试。
- 前端每次批量启动会生成 `batchRunId`，并在单题请求中附带 `clientRequestId` / `batchProcessKey`。
- 后端会对同一 `batchRunId + batchProcessKey` 的进行中请求做 in-flight 合并，避免重复打上游模型。

## 统一 AI jobs 与模型池

- 已接入 AI 的脚本默认统一走“短请求创建 job + 轮询状态”链路：
  - Aishell Minnan `recommend`
  - Aishell Vietnamese `recommend`
  - DataBaker round-one-quality `recommend`
  - Magic Data hakka/minnan `review-current`
  - LabelX asr-judgement `suggest`
  - LabelX asr-transcription `suggest-current`
  - Abaka Task21 `analyze`
- 统一后端 provider queue 的 key 已从“脚本分组”扩展为“具体模型名”：
  - 同一模型跨平台、跨脚本共享同一上游发送池。
  - 默认模型池速率为 `20 req/s`（`50ms` 一次发出机会），并按 FIFO 顺序发起请求。
  - 系统仪表盘优先展示 `总占用 usedCount = activeCount + pendingCount`，并拆成 `正在调用上游 / 等待发起` 两部分。
  - 单个模型池默认总容量为 `999`（即 `usedCount` 上限）；达到 `999` 后返回“后端池已满，请稍后重试。”
  - 两阶段链路中的听音模型和比较 / 推理模型分别按各自真实模型名进入独立池。
