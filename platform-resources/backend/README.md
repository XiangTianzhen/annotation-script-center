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

可用环境变量：

- `PLATFORM_RESOURCES_SERVER_HOST`：统一后端监听地址，默认 `127.0.0.1`。
- `PLATFORM_RESOURCES_SERVER_PORT`：统一后端监听端口，默认 `3333`。
- `ASR_JUDGEMENT_SERVER_HOST` / `ASR_JUDGEMENT_SERVER_PORT`：兼容旧快判本地服务启动配置。

## 文件职责

- `server.js`：统一启动入口。
- `app.js`：创建 HTTP server，并挂载根路径和项目路由。
- `router.js`：轻量路由注册与分发。
- `registry.js`：显式注册启用哪些平台 / 项目 API。
- `response.js`：JSON 响应、空响应和 CORS header。
- `config.js`：统一后端 host / port 配置。

## 当前已注册 API

- `alibaba-labelx/asr-judgement`：快判统计上传、定时配置、健康检查、CSV 下载，以及 AI 建议 `health/suggest` 接口。

## 新增项目 API 规则

1. 在对应项目目录下创建 `backend/index.js`，导出 `registerRoutes(router, options)`。
2. 业务逻辑继续放项目自己的 `backend/` 下，不写进统一入口。
3. 在 `registry.js` 中显式注册该项目。
4. 更新对应项目 README、`platform-resources/README.md` 和根目录 `log.md`。
