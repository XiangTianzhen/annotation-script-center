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

启动时会自动读取统一 AI 环境配置文件，顺序为：

1. `config/env/ai.env`
2. `config/env/ai.local.env`
3. `.env.local`
4. 可选 `ASC_ENV_FILE` 指向的外部文件

系统环境变量优先级最高，不会被配置文件覆盖。文件不存在时跳过；读取失败时只输出脱敏 `warn`，不输出文件内容。

可用环境变量：

- `PLATFORM_RESOURCES_SERVER_HOST`：统一后端监听地址，默认 `127.0.0.1`。
- `PLATFORM_RESOURCES_SERVER_PORT`：统一后端监听端口，默认 `3333`。
- `ASR_JUDGEMENT_SERVER_HOST` / `ASR_JUDGEMENT_SERVER_PORT`：兼容旧快判本地服务启动配置。
- `ASR_TRANSCRIPTION_STATS_DIR`：ASR 转写统计输出目录（默认 `platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`）。
- `ASR_TRANSCRIPTION_PERSIST_ROWS_JSON`：设为 `1` 时额外保存 `statistics-rows.json`。
- `ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS`：设为 `1` 时额外保存 `statistics-upload-events.jsonl`。
- `DATABAKER_AI_LISTEN_MODEL`：标贝易采 AI 听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：标贝易采 AI 对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：标贝易采 AI 请求超时，默认 `120000`。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留 标贝易采 有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留 标贝易采 裁剪前后补齐秒数，默认 `0.12`。
- `DATABAKER_ROUND_ONE_EXPORT_DIR`：标贝易采导出 CSV 保存目录（默认 `platform-resources/data-baker/round-one-quality/backend/export-data/`）。
- `DATABAKER_ROUND_ONE_EXPORT_HISTORY`：设为 `1` 时保存历史导出 CSV。
- `DATABAKER_ROUND_ONE_EXPORT_EVENTS`：设为 `1` 时写入导出上传事件日志 JSONL。

## 文件职责

- `server.js`：统一启动入口。
- `env-loader.js`：原生 Node.js 环境配置文件加载器。
- `app.js`：创建 HTTP server，并挂载根路径和项目路由。
- `router.js`：轻量路由注册与分发。
- `registry.js`：显式注册启用哪些平台 / 项目 API。
- `response.js`：JSON 响应、空响应和 CORS header。
- `config.js`：统一后端 host / port 配置。

## 当前已注册 API

- `alibaba-labelx/asr-judgement`：快判统计上传、定时配置、健康检查、供应商列表与总表 CSV 下载，以及 AI 建议 `health/suggest` 接口。
- `alibaba-labelx/asr-transcription`：转写统计上传、定时配置、健康检查、供应商列表与总表 CSV 下载（CSV 列与快判不同，按转写统计格式输出）。
- `data-baker/round-one-quality`：一检质检 AI 推荐文本 `health/recommend`，以及导出 CSV `health/config/upload/download` 接口。

ASR 转写职责边界：
- 扩展前端客户端：`extension/sites/alibaba-labelx/asr-transcription/transcription-stats-client.js`，只负责采集、上传、按钮和调度。
- Node 后端服务：`platform-resources/alibaba-labelx/asr-transcription/backend/`，负责路由、合并、CSV 写入与下载。

后端地址配置规则：
- 扩展前端只有一个全局后端地址入口：options 首页顶部“后端接口地址”（`server` / `local`）。
- 各脚本详情页不再提供独立后端地址、上传接口地址或 AI 接口地址配置。
- 统计上传能力默认强制启用；若脚本实现了定时上传能力，定时上传也按脚本规则强制启用，不在脚本详情页提供关闭开关。
- 运行时统一按“全局 baseUrl + 固定 API path”拼接：
  - ASR 转写统计：`/api/alibaba-labelx/asr-transcription/statistics/*`
  - ASR 快判统计：`/api/alibaba-labelx/asr-judgement/statistics/*`
  - ASR 快判 AI 建议：`/api/alibaba-labelx/asr-judgement/ai/suggest`
  - 标贝易采 AI 推荐：`/api/data-baker/round-one-quality/ai/recommend`
  - 标贝易采导出上传：`/api/data-baker/round-one-quality/export/upload`
  - 标贝易采导出下载：`/api/data-baker/round-one-quality/export/download`

## 0.2.11 统计总表修正规则

- 当前保持 `0.2.11` 修正增强，不升级 `0.2.12`。
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



## 0.2.11 中文乱码修正（CSV 健康值合并）

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
- 统计 CSV 写入统一为 **UTF-8 with BOM**，提升 Excel 直接打开时的中文兼容性。
- CSV 写出前会清理关键字段（任务名称、标注员/审核员、供应商）的前后空白、BOM、零宽字符。
- 若旧 CSV 中存在 `�`（U+FFFD）损坏值，合并时优先采用新 payload 的健康值覆盖旧损坏值。
- 当 `供应商` 为 `未识别供应商`、`unknown-supplier`、空值或包含 `�` 时，必须回退到任务名称重新推断。
- LabelX 转写已知供应商仍按任务名优先识别：包含 `棋燊` -> `棋燊`，包含 `希尔贝壳` -> `希尔贝壳`。
- 主存储继续保持根级总表：`statistics-data/statistics-merged.csv`。
- 不主动生成 `statistics-data/suppliers/`，历史残留目录不作为主输出。
- 转写与快判后端都使用同一套“中文清洗 + 健康值优先”策略。
- 日志与错误信息继续脱敏，不记录 cookie、token、authorization、完整音频 URL。

## 0.2.11 导出完整性与断点跳过增强

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
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

## 2026-05-10 0.2.11 失败判定修正
- LabelX 统计按标注/审核分角色逐步合并：另一角色字段为空属于正常情况，不再判失败。
- 只有 `分包ID` 为空时才直接废弃（discardedNoBatchId），不写 CSV、不上传。
- `任务名称/任务ID/人员/领取时间/提交时间/有效时长` 为空默认记为 warning/incomplete，不阻断上传。
- 批量上传改为“部分失败不影响成功数据保存”，后端返回 `acceptedCount/rejectedCount/rejectedItems`。
- 结束提示规则：仅当 `failed > 0` 才提示“有数据导出失败，请再次点击导出”；仅 warning 时提示“部分字段待后续角色补齐”。
- existing `complete` 按当前 role 最小条件判断：转写 `label=标注子任务ID`、`audit=审核子任务ID`；快判 `label=任一标注员子任务ID`、`audit=审核子任务ID`。
- 统计主存储继续为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 并发规则保持 `Math.floor(total / 5)`，最小 `1`，最大 `999`；定时上传保持 `10:00/16:00`，上传前随机延迟 `0~300s`（`100ms` 步进）。


## 2026-05-10 0.2.11 complete/跳过修正
- `existing` 接口中 `exists=true` 不等于 `complete=true`；只有满足最低完整条件才可跳过。
- 转写 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID`。
- 快判 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID（label 为任一标注员槽位ID）`。
- 任务名称为空不算失败，但必须判为 `complete=false`，下次导出继续拉详情补齐。
- `exists=true && complete=false` 必须继续拉详情与上传，不计入 `skippedComplete`。
- 无待上传数据（`payloads.length=0`）时不调用 `/statistics/upload`，提示“已全部完整，无需上传”。
- 上传进度板块宽度已增大（`min-width:560px`、`max-width:780px`、允许换行），四位数成功/失败数量可见。
- 主存储仍为根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 版本保持 `0.2.11`。

## 2026-05-10 0.2.11 待补任务名称与进度样式补充

- `existing` 返回 `exists=true` 时仍必须以 `complete` 判定是否跳过；`complete=false` 继续补齐，不算失败。
- 转写任务名称补齐支持 `detail/summary/taskMap` 多源回退；`detail` 空值不得覆盖健康任务名称。
- 转写后端合并优先复用同 `分包ID + role + subTaskId` 的已有行，避免“旧空任务名称行”和“新补齐行”并存。
- 无待上传 payload 时前端不调用 upload，仅提示“已全部完整，无需上传”。
- 共享进度组件改为水平居中，完成态与进行中保持同一紧凑卡片布局。
