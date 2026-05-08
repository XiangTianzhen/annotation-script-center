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

## 文件职责

- `server.js`：统一启动入口。
- `env-loader.js`：原生 Node.js 环境配置文件加载器。
- `app.js`：创建 HTTP server，并挂载根路径和项目路由。
- `router.js`：轻量路由注册与分发。
- `registry.js`：显式注册启用哪些平台 / 项目 API。
- `response.js`：JSON 响应、空响应和 CORS header。
- `config.js`：统一后端 host / port 配置。

## 当前已注册 API

- `alibaba-labelx/asr-judgement`：快判统计上传、定时配置、健康检查、CSV 下载，以及 AI 建议 `health/suggest` 接口。
- `alibaba-labelx/asr-transcription`：转写统计上传、定时配置、健康检查、CSV 下载（CSV 列与快判不同，按转写统计格式输出）。
- `data-baker/round-one-quality`：一检质检 AI 推荐文本 `health/recommend` 接口。

## 新增项目 API 规则

1. 在对应项目目录下创建 `backend/index.js`，导出 `registerRoutes(router, options)`。
2. 业务逻辑继续放项目自己的 `backend/` 下，不写进统一入口。
3. 在 `registry.js` 中显式注册该项目。
4. 更新对应项目 README、`platform-resources/README.md` 和根目录 `log.md`。


