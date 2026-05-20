# 统一 AI 基座

`platform-resources/backend/ai/` 用于放统一后端的公共 AI 能力。

当前目录结构：

- `config.js`：统一读取 DashScope、Fun-ASR provider 模式、REST API base、限流、Python 运行环境，以及 DataBaker 识别模式、听音模型、单模型、比较模型白名单配置。
- `sanitizer.js`：统一脱敏工具，避免日志输出完整音频 URL、签名 URL、token、cookie。
- `errors.js`：统一 provider / Python 运行时错误包装。
- `provider-queue.js`：统一 provider 限流队列，当前支持 `qwen_omni`、`fun_asr`、`text_compare`，同时支持每个 group 独立 `maxConcurrent`。
- `result-cache.js`：统一 TTL 内存缓存与缓存 key 生成。
- `usage.js`：通用 usage 归一化。
- `smoke-test-provider-queue.js`：本地并发自测脚本，用于验证 `fun_asr` 组在不同 `maxConcurrent` 下是否真正并发。
- `providers/qwen-openai-compatible.js`：DashScope OpenAI-compatible `/chat/completions` 调用封装，支持文本比较和 Omni `input_audio`。
- `providers/funasr-rest.js`：Node 直接调用 Fun-ASR RESTful API，负责提交异步任务、轮询任务状态、下载 `transcription_url` 并提取单条 `heardText`。
- `providers/funasr-python.js`：Node 通过 `child_process` 调用 Python Fun-ASR SDK 的统一 wrapper，并显式设置 `PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1`。
- `providers/funasr.js`：统一 Fun-ASR 入口，负责 `rest/python` provider 选择与显式 fallback。
- `python/funasr_client.py`：Fun-ASR Python SDK 辅助脚本。
- `python/requirements.txt`：Fun-ASR Python 依赖，当前包含 `dashscope` 与 `opencc-python-reimplemented`。

边界规则：

- 这里不放具体平台 Prompt。
- 这里不放具体平台字段归一化。
- 这里不放具体平台推荐结果组装。
- 平台目录只保留自己的业务编排、Prompt、schema、词表、结果组装。

当前接入平台：

- DataBaker 标贝易采一检质检

当前 DataBaker 业务层结构：

- `platform-resources/data-baker/round-one-quality/backend/ai-routes.js`：HTTP 路由
- `platform-resources/data-baker/round-one-quality/backend/ai-service.js`：DataBaker 专属业务编排
- `platform-resources/data-baker/round-one-quality/reference/minnan-lexicon.csv`：DataBaker 词表参考资料

统一启动口径：

- 仍然只启动 Node 后端：`node platform-resources/backend/server.js`
- 统一 AI / 模型请求默认超时时间为 `60000ms`；非 AI 接口超时另按业务设置。
- Fun-ASR 默认 provider 是 Node REST，不启动 Python 子进程。
- Python 不作为独立服务启动；只在显式切到 `DATABAKER_AI_FUN_ASR_PROVIDER=python` 或 `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=python` 时作为统一 Node 后端内部辅助进程。
- Fun-ASR REST 是异步任务模式：`POST /services/audio/asr/transcription` 提交任务，`POST /tasks/{task_id}` 查询任务；本轮只实现单条 REST 调用，不启用 `file_urls` batch。
- `funasr_client.py` 的 stdout JSON 必须稳定按 UTF-8 输出；`funasr-python.js` 必须按 UTF-8 解码 stdout/stderr，避免 Windows 下出现 `�` / 黑菱形乱码。
- `funasr_client.py` 会先用 OpenCC `t2s`（不可用时退回内置映射）把 Fun-ASR `heardText` 统一转为简体；DataBaker 业务层还会再按词表保护规则做一次兜底转换。
- `阮 / 汝 / 伊 / 诶` 等闽南词表建议用字不属于统一 AI 基座内置词表，但 DataBaker 业务层会在二次兜底时保护这些建议字形。
- Fun-ASR 没有 thinking 参数；thinking 只影响 Qwen Omni / compare 阶段。
- Fun-ASR 并发由 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 控制，默认 `2`；如 `2 核 2G` 服务器压力高可继续调低，若资源充足也可手动调高。
- `provider-queue.js` 现在会返回并记录 `pendingCount / activeCount / maxConcurrent / queueWaitMs / durationMs`，用于判断瓶颈是在前端发起、Fun-ASR 队列还是 compare 阶段。
- `providers/funasr-rest.js` 会记录 `[FunASR][REST] submit start/finish` 与 `[FunASR][REST] poll start/finish`；不会输出完整 `audioUrl`、token 或 API Key。
- `providers/funasr-python.js` 会记录 `[FunASR] spawn start/finish`；不会输出完整 `audioUrl`、token 或 API Key。
- DataBaker 前端“AI连续填入合格项并发数量”只是浏览器同时发往统一后端的请求数，当前范围 `1~50`、默认 `20`；真正的上游模型并发仍由这里的 provider queue 和 RPM 限流控制。
- DataBaker `two_stage + fun-asr` 的批量连续填入默认会先创建后端异步 job，再轮询 job 状态；这样可以避免单个 HTTP recommend 请求挂太久后被浏览器或代理中断。
- DataBaker 异步 job 默认上限 `600`，provider queue 默认上限也同步为 `600`；达到上限时统一返回“后端 AI 任务队列已满，请稍后重试。”。
- 单个异步 job 默认超时 `60000ms`，超时后会通过 `AbortController` 取消或逻辑丢弃迟到结果，并固定提示“当前任务超过60s，请重新请求。”。
- DataBaker 模型输出 JSON 解析失败时，会保留脱敏后的 `debugRawJson`，供前端“复制原始JSON”按钮通过 `/ai/recommend/jobs/:jobId/debug` 拉取。
