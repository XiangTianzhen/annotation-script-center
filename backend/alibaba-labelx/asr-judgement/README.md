# 快判统计本地服务

该目录是 ASR 快判统计上传的 Node 本地调试服务代码，按“平台 / 项目”从 Edge 扩展目录迁移到仓库根目录。

它不会被 Edge 扩展 manifest 注入到 LabelX 页面，也不属于浏览器扩展运行时代码。Edge 扩展和未来 Chrome 扩展都可以共用这个本地调试服务。

## 启动方式

在仓库根目录运行：

```powershell
node backend\alibaba-labelx\asr-judgement\server.js
```

默认监听：

```text
http://127.0.0.1:3333/api/asr-judgement/statistics/upload
```

定时配置检查地址：

```text
http://127.0.0.1:3333/api/asr-judgement/statistics/config
```

扩展实际会优先对“上传接口地址”发起 `GET` 请求并追加 `purpose=schedule`，例如：

```text
http://127.0.0.1:3333/api/asr-judgement/statistics/upload?purpose=schedule
```

可用环境变量：

- `ASR_JUDGEMENT_SERVER_HOST`：监听地址，默认 `127.0.0.1`。
- `ASR_JUDGEMENT_SERVER_PORT`：监听端口，默认 `3333`。
- `ASR_JUDGEMENT_STATS_DIR`：统计输出目录，默认 `backend/alibaba-labelx/asr-judgement/statistics-data/`。
- `ASR_JUDGEMENT_PERSIST_ROWS_JSON`：设为 `1` 时额外写入 `statistics-rows.json`，默认不写。
- `ASR_JUDGEMENT_PERSIST_UPLOAD_EVENTS`：设为 `1` 时额外写入 `statistics-upload-events.jsonl`，默认不写。

## 文件职责

- `server.js`：本地服务启动入口。
- `http-server.js`：HTTP 路由、健康检查、上传接口、定时配置接口和请求体读取。
- `payload-merge.js`：按 `分包ID` 合并上传补丁记录，填充标注员 / 审核员宽表列。
- `file-store.js`：默认以 `statistics-merged.csv` 作为唯一落盘数据源，必要时可兼容读取旧 `statistics-rows.json`。
- `csv-columns.js`：CSV 列顺序定义。
- `csv-writer.js`：CSV 转义和写入。

## 接口约定

- `POST /api/asr-judgement/statistics/upload`：接收单个分包补丁 payload，也接收首页批量上传的 `{ payloads: [...] }` 信封。服务端会逐条按 `mergeKey.batchId` / `分包ID` 合并。
- `GET /api/asr-judgement/statistics/upload?purpose=schedule`：返回定时上传配置，供扩展从同一个上传接口地址读取时间。
- `GET /api/asr-judgement/statistics/config`：返回同样的定时上传配置，便于本地直接调试。
- `GET /api/asr-judgement/statistics/health`：健康检查和当前 CSV 路径。

## 输出文件

默认输出在当前服务目录下的 `statistics-data/`：

- `statistics-merged.csv`：最终合并 CSV。

默认不再写入 `statistics-upload-events.jsonl` 和 `statistics-rows.json`，避免 10 万级分包数据重复占用磁盘。需要临时排查时，可以把 `ASR_JUDGEMENT_PERSIST_ROWS_JSON=1` 或 `ASR_JUDGEMENT_PERSIST_UPLOAD_EVENTS=1` 加到启动环境变量中。

`statistics-data/` 是本地调试产物，已在本目录 `.gitignore` 中忽略。
