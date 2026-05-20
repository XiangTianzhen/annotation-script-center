# 统一 AI 基座

`platform-resources/backend/ai/` 用于放统一后端的公共 AI 能力。

当前目录结构：

- `config.js`：统一读取 DashScope、Fun-ASR、限流、Python 运行环境，以及 DataBaker 听音模型 / 比较模型白名单配置。
- `sanitizer.js`：统一脱敏工具，避免日志输出完整音频 URL、签名 URL、token、cookie。
- `errors.js`：统一 provider / Python 运行时错误包装。
- `provider-queue.js`：统一 provider 限流队列，当前支持 `qwen_omni`、`fun_asr`、`text_compare`。
- `result-cache.js`：统一 TTL 内存缓存与缓存 key 生成。
- `usage.js`：通用 usage 归一化。
- `providers/qwen-openai-compatible.js`：DashScope OpenAI-compatible `/chat/completions` 调用封装，支持文本比较和 Omni `input_audio`。
- `providers/funasr-python.js`：Node 通过 `child_process` 调用 Python Fun-ASR SDK 的统一 wrapper，并显式设置 `PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1`。
- `python/funasr_client.py`：Fun-ASR Python SDK 辅助脚本。
- `python/requirements.txt`：Fun-ASR Python 依赖。

边界规则：

- 这里不放具体平台 Prompt。
- 这里不放具体平台字段归一化。
- 这里不放具体平台推荐结果组装。
- 平台目录只保留自己的业务编排、Prompt、schema、词表、结果组装。

当前接入平台：

- DataBaker 标贝易采一检质检

统一启动口径：

- 仍然只启动 Node 后端：`node platform-resources/backend/server.js`
- Python 不作为独立服务启动，只作为统一 Node 后端内部调用的辅助进程。
- `funasr_client.py` 的 stdout JSON 必须稳定按 UTF-8 输出；`funasr-python.js` 必须按 UTF-8 解码 stdout/stderr，避免 Windows 下出现 `�` / 黑菱形乱码。
