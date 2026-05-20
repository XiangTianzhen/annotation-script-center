# 统一 AI 基座

`platform-resources/backend/ai/` 用于放统一后端的公共 AI 能力。

当前目录结构：

- `config.js`：统一读取 DashScope、Fun-ASR、限流、Python 运行环境，以及 DataBaker 识别模式、听音模型、单模型、比较模型白名单配置。
- `sanitizer.js`：统一脱敏工具，避免日志输出完整音频 URL、签名 URL、token、cookie。
- `errors.js`：统一 provider / Python 运行时错误包装。
- `provider-queue.js`：统一 provider 限流队列，当前支持 `qwen_omni`、`fun_asr`、`text_compare`，同时支持每个 group 独立 `maxConcurrent`。
- `result-cache.js`：统一 TTL 内存缓存与缓存 key 生成。
- `usage.js`：通用 usage 归一化。
- `smoke-test-provider-queue.js`：本地并发自测脚本，用于验证 `fun_asr` 组在不同 `maxConcurrent` 下是否真正并发。
- `providers/qwen-openai-compatible.js`：DashScope OpenAI-compatible `/chat/completions` 调用封装，支持文本比较和 Omni `input_audio`。
- `providers/funasr-python.js`：Node 通过 `child_process` 调用 Python Fun-ASR SDK 的统一 wrapper，并显式设置 `PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1`。
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
- Python 不作为独立服务启动，只作为统一 Node 后端内部调用的辅助进程。
- `funasr_client.py` 的 stdout JSON 必须稳定按 UTF-8 输出；`funasr-python.js` 必须按 UTF-8 解码 stdout/stderr，避免 Windows 下出现 `�` / 黑菱形乱码。
- `funasr_client.py` 会先用 OpenCC `t2s`（不可用时退回内置映射）把 Fun-ASR `heardText` 统一转为简体；DataBaker 业务层还会再按词表保护规则做一次兜底转换。
- `阮 / 汝 / 伊 / 诶` 等闽南词表建议用字不属于统一 AI 基座内置词表，但 DataBaker 业务层会在二次兜底时保护这些建议字形。
- Fun-ASR 没有 thinking 参数；thinking 只影响 Qwen Omni / compare 阶段。
- Fun-ASR 并发由 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 控制，默认 `5`；如 `2 核 2G` 服务器压力高可调低到 `3`。
- `provider-queue.js` 现在会返回并记录 `pendingCount / activeCount / maxConcurrent / queueWaitMs / durationMs`，用于判断瓶颈是在前端发起、Fun-ASR 队列还是 compare 阶段。
- `providers/funasr-python.js` 会记录 `[FunASR] spawn start/finish`；不会输出完整 `audioUrl`、token 或 API Key。
- DataBaker 前端“AI连续填入合格项并发数量”只是浏览器同时发往统一后端的请求数，当前范围 `1~50`、默认 `20`；真正的上游模型并发仍由这里的 provider queue 和 RPM 限流控制。
