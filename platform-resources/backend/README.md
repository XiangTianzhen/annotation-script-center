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
- 内部 `payload/mergeKey` 继续保留 supplier 信息，用于避免跨供应商同分包 ID 覆盖。
- 转写统计抓取按 `recordCount` 全量分页：不再固定前 `5` 页/`50` 子任务/`300` 详情条目，详情默认并发 `5`、上限 `500`，详情优先 `pageSize=5000` 并在必要时继续分页补齐。
- 有效时长口径为“是否有效”严格等于“有效”。
- CSV 下载接口默认下载总表，不强制 `supplier` 参数。
- 不再主动创建 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
- 转写上传进度显示新增共享组件 `extension/shared/progress-indicator.js`，展示阶段、完成/总数、百分比、并发、成功/失败。
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


