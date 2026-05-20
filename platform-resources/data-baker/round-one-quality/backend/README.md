# 标贝易采一检质检后端（AI 推荐 + 导出上传）

本目录是 标贝易采一检质检本地 Node 后端实现，通过统一入口 `platform-resources/backend/server.js` 注册。
当前同时提供两类能力：

- AI 推荐文本接口。
- 导出 CSV 上传与下载接口（扩展前端导出后自动上传，后端保存 `latest.csv` 并提供下载；原始记录脱敏后单独保存 `latest-raw.json`）。
- 前端“AI连续填入合格项”辅助能力复用现有 AI 推荐接口，不新增后端路由；当前策略为“并发分析 + 顺序填入”，只处理 `statusName=质检合格`。
- 前端并发数默认 `5`（可配置 `1-10`）。更高并发不会绕过上游模型限流，只会更快堆积到统一后端队列。
- 前端调度为“并发请求 + 队列消费填入”：AI 结果返回后即进入队列，由前端串行填入，不等待全部请求结束；该变更不涉及后端接口新增。

## 接口

- `GET /api/data-baker/round-one-quality/ai/recommend/health`
- `GET /api/data-baker/round-one-quality/ai/recommend/defaults`
- `POST /api/data-baker/round-one-quality/ai/recommend`
- `GET /api/data-baker/round-one-quality/export/health`
- `GET /api/data-baker/round-one-quality/export/config`
- `POST /api/data-baker/round-one-quality/export/upload`
- `GET /api/data-baker/round-one-quality/export/download`
- `HEAD /api/data-baker/round-one-quality/export/download`

## 文件职责

- `index.js`：项目路由注册入口。
- `ai-routes.js`：只负责 HTTP health / defaults / recommend 路由注册、请求体读取和响应返回。
- `ai-service.js`：DataBaker AI 业务层，集中管理请求归一化、链路推导、prompt、schema 解析、词表、文本归一化、成本估算、调用日志、缓存、队列和推荐响应组装。
- `export-routes.js`：导出 health / config / upload / download 路由。
- `export-store.js`：导出文件落盘、latest/history/events 存储能力。
- `platform-resources/backend/ai/python/funasr_client.py`：按阿里云官方 Python SDK 提交 Fun-ASR 录音文件识别任务、轮询状态并拉取转写结果。
- `platform-resources/backend/ai/`：统一 AI 基座，提供 Qwen provider、Fun-ASR Python wrapper、provider 队列、结果缓存和公共脱敏/错误处理。

## 模型

当前前端只配置两个模型字段：

- 听音模型：`fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`
- 比较模型：`qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`

环境变量可覆盖：

- `DATABAKER_AI_FUN_ASR_MODEL`
- `DATABAKER_AI_OMNI_MODEL`
- `DATABAKER_AI_COMPARE_MODEL`

## 环境变量

- `DASHSCOPE_API_KEY`：DashScope API Key，真实调用必需；统一后端启动时默认从仓库根目录 `config/env/ai.env` 自动读取。
- `DATABAKER_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时走 mock，可直接写入 `config/env/ai.env`。
- `DATABAKER_AI_ENABLE_THINKING`：默认 `0`，原生 `fetch` 请求体顶层传 `enable_thinking=false` 尝试关闭 thinking；设为 `1` 时不传该字段。
- `DATABAKER_AI_PIPELINE_MODE`：仅作历史兼容保留；旧值 `omni_single / two_stage / qwen_omni_two_stage / listen_only` 会迁移为 Qwen Omni 听音 + compare，`fun_asr_compare` 会迁移为 Fun-ASR 听音 + compare。
- `DATABAKER_AI_FUN_ASR_MODEL`：Fun-ASR 录音文件识别模型，默认 `fun-asr`。
- `DATABAKER_AI_OMNI_MODEL`：Qwen Omni 听音模型默认值，默认 `qwen3.5-omni-flash`。
- `DATABAKER_FUNASR_PYTHON_BIN`：可选，显式指定 Python 解释器路径；未设置时优先使用统一虚拟环境 `platform-resources/backend/.venv`。
- `DATABAKER_AI_FUN_ASR_LANGUAGE_HINTS`：Fun-ASR 语言提示，默认 `zh`。
- `DATABAKER_AI_QWEN_OMNI_RPM_LIMIT`：Qwen Omni 队列限流，默认 `45` RPM。
- `DATABAKER_AI_FUN_ASR_RPM_LIMIT`：Fun-ASR 队列限流，默认 `500` RPM。
- `DATABAKER_AI_TEXT_RPM_LIMIT`：Compare 文本模型队列限流，默认 `500` RPM。
- `DATABAKER_AI_QWEN_OMNI_CONCURRENCY`：Qwen Omni 并发上限，默认 `3`。
- `DATABAKER_AI_FUN_ASR_CONCURRENCY`：Fun-ASR 并发上限，默认 `5`；如 `2 核 2G` 服务器压力高，可调低到 `3`。
- `DATABAKER_AI_TEXT_CONCURRENCY`：Compare 文本模型并发上限，默认 `5`。
- `DATABAKER_AI_PROVIDER_RETRY_MAX`：上游 `429` 指数退避最大重试次数，默认 `3`。
- `DATABAKER_AI_QUEUE_MAX_SIZE`：统一 provider 队列最大长度，默认 `200`。
- `DATABAKER_AI_CACHE_TTL_MS`：推荐结果内存缓存 TTL，默认 `43200000`（12 小时）。
- `DATABAKER_AI_LEXICON_REWRITE_MODE`：词表最终推荐文本改写模式，默认 `aggressive`；设为 `off` 时只保留 prompt 上下文，不做强替换。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。
- `DATABAKER_ROUND_ONE_EXPORT_DIR`：导出文件保存目录，默认 `platform-resources/data-baker/round-one-quality/backend/export-data/`。
- `DATABAKER_ROUND_ONE_EXPORT_HISTORY`：设为 `1` 时保存历史 CSV 到 `history/`。
- `DATABAKER_ROUND_ONE_EXPORT_EVENTS`：设为 `1` 时追加 `upload-events.jsonl`。

后端入口 `platform-resources/backend/server.js` 会自动加载：

1. `config/env/ai.env`
2. `config/env/ai.local.env`
3. `.env.local`
4. 可选 `ASC_ENV_FILE` 指向的外部文件

因此本地不需要每次手动 `set DASHSCOPE_API_KEY`。如果 `config/env/ai.env` 和系统环境变量都没有配置 `DASHSCOPE_API_KEY`，且未开启 `DATABAKER_AI_MOCK=1`，health 会返回 `status=missing-api-key`。

未配置 `DASHSCOPE_API_KEY` 且未开启 mock 时：

- health 返回 `status=missing-api-key`。
- recommend 返回 `success=false` 和 `code=missing-api-key`。

## 导出上传与下载

- 扩展前端在 `group/detail` 导出 CSV 后，会调用：
  - `POST /api/data-baker/round-one-quality/export/upload`
- 后端默认写入：
  - `platform-resources/data-baker/round-one-quality/backend/export-data/latest.csv`
  - `platform-resources/data-baker/round-one-quality/backend/export-data/latest-raw.json`
  - `platform-resources/data-baker/round-one-quality/backend/export-data/latest.json`
- 说明：`latest.csv` 不包含“原始JSON”列；`latest-raw.json` 保存脱敏后的原始记录数组；`latest.json` 保存累计元信息。
- 上传不再覆盖 `latest.csv`，而是按“文本编号”累计合并：
  - 唯一键默认且优先使用 `文本编号`（全局唯一）。
  - 仅当 `文本编号` 为空时才按兜底键（`文件名+段编号`、`文件名`、`采集人+手机号+段编号`、稳定 JSON）合并。
  - 相同文本编号再次上传会更新旧行，不会因任务ID不同而重复新增。
  - 不同任务数据可共存，前提是文本编号不同。
- `taskId/taskIds` 只用于元信息、日志和排查，不参与唯一键判断。
- CSV 表头会归一化 `有效时长(秒)` / `有效合格时长` 到 `有效时长`，避免重复列。
- 下载接口 `GET/HEAD /api/data-baker/round-one-quality/export/download` 仍返回 `latest.csv`，现在返回的是累计合并总表。
- 下载最新 CSV：
  - `GET /api/data-baker/round-one-quality/export/download`
  - `HEAD /api/data-baker/round-one-quality/export/download`
- 仅当开启 `DATABAKER_ROUND_ONE_EXPORT_HISTORY=1` 时才写入 `history/*.csv` 和对应 `history/*.raw.json`；history 保存的是“本次原始上传文件”，不是累计快照。
- 仅当开启 `DATABAKER_ROUND_ONE_EXPORT_EVENTS=1` 时才写入 `upload-events.jsonl`。
- 上传接口只接受 JSON 且 `csvText` 非空，CSV 超过 `20MB` 会拒绝。
- 上传接口返回合并统计：`incomingRowCount/existingRowCount/addedRowCount/updatedRowCount/unchangedRowCount/rowCount/taskIds`。
- 后端日志只输出 `requestId`、`incomingRowCount`、`existingRowCount`、`addedRowCount`、`updatedRowCount`、`rowCount`、`fileName`、`csvPath`、`uploadedAt`、`taskIds`，不打印完整 CSV 内容。

CSV 字段统一口径：

- 新导出的 `latest.csv` 统一使用字段名 `有效时长`（数据来源仍是 `effectivePassTotalTime`）。
- 历史导出中 `有效合格时长` 属于旧字段名，供兼容识别；新导出不再使用该字段名。
- `export-data/` 属于运行数据目录，不提交 Git。

## 推荐流程

1. 校验请求体中的 `collectId`、`itemId`、`audioUrl`、`pageText`。
2. 生成词表上下文与缓存 key；缓存 key 使用 sha256，不保存完整 `audioUrl`。
3. 命中缓存时直接返回历史推荐；未命中则进入 provider 队列。
4. 听音模型为 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash`：
   - 进入 `qwen_omni` 队列。
   - 先调用 Qwen Omni `input_audio` 产出 `heardText`。
   - 再进入 `text_compare` 队列调用 compare 模型生成 `recommendedText`。
5. 听音模型为 `fun-asr`：
   - 先进入 `fun_asr` 队列，由统一基座 `platform-resources/backend/ai/providers/funasr-python.js` 调起 `platform-resources/backend/ai/python/funasr_client.py`。
   - Python 端按官方 SDK 调用 `fun-asr`，提交录音文件识别任务并轮询结果。
   - Fun-ASR 返回 `heardText` 后，再进入 `text_compare` 队列调用 compare 模型生成 `recommendedText`。
6. 所有 provider 调用遇到 `429` 都走统一指数退避 + jitter 重试；超出队列长度直接返回清晰错误，不让请求无限堆积。
7. provider 队列现在同时控制 RPM 和 group 并发：
   - `qwen_omni` 默认并发 `3`
   - `fun_asr` 默认并发 `5`
   - `text_compare` 默认并发 `5`
   这样 Fun-ASR 不再是“上一条完全结束后才启动下一条”的严格串行。
8. 对 `heardText` / `recommendedText` 做现有清洗、简繁归一、词表替换与中文句末标点补全。
9. 成功结果写入 TTL 缓存，并组装统一响应，返回模式、模型、队列、缓存、阶段耗时、`requestId` 和调试摘要。

后端原生 `fetch` 请求默认在请求体顶层传 `enable_thinking=false`，不再使用 OpenAI SDK 风格的 `extra_body.enable_thinking`。如果供应商返回不支持 `enable_thinking` 的 400 错误，后端会移除该字段自动重试一次；如需开启 thinking，可设置 `DATABAKER_AI_ENABLE_THINKING=1`。Fun-ASR 本身没有 thinking 参数，也不会向 Python SDK 传 `enable_thinking`。

Qwen Omni 听音 + compare 是当前默认链路；`fun-asr` 作为可切换听音模型保留。本仓库不会因为任一链路自动保存、自动提交、批量识别或流转。

听音模型请求中的音频片段格式：

```json
{
  "type": "input_audio",
  "input_audio": {
    "data": "完整音频 URL",
    "format": "wav"
  }
}
```

`format` 会从 URL pathname 后缀推断，支持 `wav`、`mp3`、`aac`、`m4a`、`amr`、`3gp`、`3gpp`，无法识别时默认 `wav`。`data` 必须保留完整音频 URL，包括签名 query 参数，但日志和文档中不得记录完整 URL。Fun-ASR 模式同样只接受 `http/https` 音频 URL；若服务端无法访问平台音频地址，会返回明确错误而不是静默降级。

统一 Python 虚拟环境默认路径：

```powershell
platform-resources\backend\.venv\Scripts\python.exe
platform-resources\backend\.venv\bin\python
```

`.venv` 与 `__pycache__` 都属于本地运行产物，不提交 Git。

## 统一 Python 虚拟环境（.venv）

- 统一后端 Python 虚拟环境固定放在 `platform-resources/backend/.venv`。
- 当前用于 DataBaker Fun-ASR Python SDK，后续新增 Python 辅助脚本也优先复用该目录。
- Fun-ASR Python SDK 由 Node 统一后端通过 `child_process` 调用，不提供独立 Python 服务。
- 用户不需要单独运行 `python xxx.py`；统一启动入口始终是 `node platform-resources/backend/server.js`。
- Fun-ASR Python 运行环境统一位于 `platform-resources/backend`，其中依赖文件为 `platform-resources/backend/ai/python/requirements.txt`。
- DataBaker 业务目录不再维护独立 Python 文件、requirements 文件、通用 provider 队列或通用缓存；这些公共能力统一收敛到 `platform-resources/backend/ai/`。
- 详细的 Windows/Linux 创建命令、环境变量、后端重启与验证流程统一见根目录 `README.md`，这里不重复部署主流程。

## 闽南方言字词表

词表 CSV 路径：

```text
platform-resources/data-baker/round-one-quality/reference/minnan-lexicon.csv
```

CSV 表头至少包含 `编号`、`建议用字`、`对应华语`。后端使用原生 Node.js 解析 CSV，支持 UTF-8 BOM、双引号包裹和双引号转义。

词表有两层用途：

1. prompt 上下文：听音 prompt 会先注入基础易混规则，再按 `pageText` 筛选最多 40 条上下文；对比 prompt 会结合 `pageText` 与 `heardText` 筛选最多 60 条上下文。
2. 最终推荐文本强替换：默认 `aggressive`，按“对应华语 -> 建议用字”做长词优先替换，例如 `他 -> 伊`、`喜欢 -> 欢喜`、`的 -> 诶`。

Prompt 简繁规则（2026-05-17 热修）：

- 听音输出 `heardText` 与推荐输出 `recommendedText` 的普通中文字符要求统一为简体中文。
- 若 `pageText`、`heardText` 出现普通繁体字，推荐文本应转换为普通简体字形。
- `minnan-lexicon.csv` 位于 `reference/` 目录，因为它是 DataBaker 业务参考资料，不属于统一 AI 基座。
- `minnan-lexicon.csv` 命中的“建议用字”不参与普通简繁转换，命中后必须保留。
- 词表建议用字优先于普通简繁转换，不可把方言建议字形改回普通话同义词。

后端结果归一化补充（2026-05-18 热修）：

- 除了 prompt 约束，后端会在模型返回后对 `heardText` 和 `recommendedText` 再做一次普通繁体转简体归一化。
- 归一化前会先保护词表建议用字（来自 `BASE_ENTRIES + minnan-lexicon.csv`），归一化后再恢复，避免方言建议用字被覆盖。
- `pageText` 保持页面原始文本，不做改写，仅作为比较输入来源。

强替换只修改返回给前端展示的 `recommendedText`，不会修改原始 `pageText`，也不会触发自动保存、自动提交、批量识别或流转。后端会对 `heardText` 和最终 `recommendedText` 删除空格、Tab、换行和全角空格，日志记录的也是清理后的文本，不额外保存清理前文本。可通过 `DATABAKER_AI_LEXICON_REWRITE_MODE=off` 关闭强替换，只保留 prompt 上下文。词表缺失时后端仍可运行，但会跳过 CSV 上下文，推荐效果可能下降。后续更新词表时只需要替换 CSV 文件，不要把词表内容硬编码进 JS。

词表清洗规则：

- 中文括号和英文括号中的内容全部视为拼音或批注，例如 `家（gei、dao）、厝（cuo）` 会清洗为 `家`、`厝`，`床（眠床）(min ceng)` 会清洗为 `床`。
- 拉丁字母、拼音音调字母、数字注音和残留连接符不会参与 prompt 上下文匹配或强替换。
- CSV 来源的单字“对应华语”默认不进入强替换规则，避免把 `家庭` 误改成 `厝庭` 之类的异常文本。
- 基础高频单字仍由 `BASE_ENTRIES` 显式控制，例如 `我 -> 阮`、`你 -> 汝`、`他 -> 伊`、`的 -> 诶`、`很 -> 真`、`吃 -> 食`。
- 如果出现异常替换，优先检查 `minnan-lexicon.csv` 中是否存在括号批注、拼音残留或 CSV 单字映射。

PowerShell 下可用以下命令做最小清洗回归：

```powershell
@'
const { __testOnly } = require('./platform-resources/data-baker/round-one-quality/backend/ai-service');
console.log(__testOnly.splitTerms('家（gei、dao）、厝（cuo）'));
console.log(__testOnly.splitTerms('透早(tao za )'));
'@ | node -
```

## 真实调用排查

如果前端显示 `Qwen 接口请求失败（HTTP 400）` 或 `Fun-ASR 音频不可访问`：

1. 先查看后端返回给前端的 `summary`，该字段已脱敏，不应包含完整音频 URL、token、cookie、`OSSAccessKeyId` 或 `Signature`。
2. 确认 `qwen3.5-omni-plus` / `qwen3.5-omni-flash` 听音链路使用的是 Qwen Omni `input_audio`，不是旧的 `audio_url`。
3. 确认 Fun-ASR 走的是 Python SDK 录音文件识别提交/查询链路，而不是 OpenAI-compatible chat 模型。
4. 确认当前音频 URL 在服务端可访问，且签名参数没有过期。
5. 确认 `config/env/ai.env` 中 `DASHSCOPE_API_KEY` 正确。
6. 检查 health/defaults 中的队列、重试、deprecated mode 提示与缓存统计，确认前后端模式口径一致。
7. 将 `DATABAKER_AI_MOCK=1` 写入 `config/env/ai.env` 后重启后端，可排除前端、路由和日志链路问题。

Fun-ASR `403` 的常见原因：

- DashScope 权限未开通或地域不匹配
- API Key 对 `fun-asr` 无权限
- 平台签名 `audioUrl` 对 Fun-ASR 服务不可访问
- 调用参数错误

若需要先恢复可用性，优先切回 `qwen3.5-omni-flash` 或 `qwen3.5-omni-plus` 作为听音模型。

## 日志安全

每次 recommend 调用都会尝试写入：

- `platform-resources/data-baker/round-one-quality/backend/logs/recommend-calls.jsonl`
- `platform-resources/data-baker/round-one-quality/backend/logs/recommend-calls.csv`

可通过 `DATABAKER_AI_CALL_LOG_DIR` 覆盖日志目录。JSONL 保留英文 key，便于后续程序处理；CSV 新建时写入中文表头，字段包含标注员、token、费用、有效时间、音频总时长、mock 状态、流水线模式、词表改写明细、听音阶段耗时、对比阶段耗时和错误信息。已有旧 CSV 文件第一版不自动迁移，删除旧文件后会按中文表头重新创建。

`mock=true` 的耗时只代表本地 mock 链路，不代表真实 Qwen 听音 / 对比耗时；真实调用应以 `mock=false` 记录中的 `listenDurationMs`、`compareDurationMs` 和总 `durationMs` 为准。

后端日志只允许输出：

- `requestId`
- 音频 `hostname`
- `sentenceNumber`
- `pipelineMode`
- `listenModel`
- `compareModel`
- 是否 mock

不得输出：

- 完整 `audioUrl`
- access token
- cookie
- `OSSAccessKeyId`
- `Signature`
- API Key

## 费用估算

费用字段仅用于调试展示，不参与业务判断。

- 收入估算：`effectiveTime / 3600 * 350`
- AI 成本：按 usage token 估算。
- 价格表当前已合并到 `ai-service.js` 中维护，并标注“按当前测试估算，可后续调整”。
- 如果模型 usage 未返回或未解析，`cost.note` 会提示成本可能低估。

## 有效音频裁剪

第一版默认不启用裁剪。已保留环境变量：

- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`
- `DATABAKER_AI_CROP_PADDING_SECONDS`

后续如启用裁剪，需要下载完整音频、按有效起止时间裁剪、转 16k 单声道 wav、base64 传给 Qwen；裁剪失败必须 fallback 到完整 `audioUrl`，且全过程不得记录完整音频 URL。



