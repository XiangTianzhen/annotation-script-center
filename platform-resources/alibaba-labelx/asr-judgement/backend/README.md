# 快判统计本地服务

该目录是 ASR 快判统计上传的 Node 本地调试服务代码，按“平台 / 项目”放在 `platform-resources/` 中。

它不会被扩展 manifest 注入到 LabelX 页面，也不属于浏览器扩展运行时代码。Chrome / Edge 共用的 `extension/` 扩展源码都可以使用这个本地调试服务。

## 启动方式

在仓库根目录运行：

```powershell
node platform-resources\backend\server.js
```

默认监听：

```text
http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/upload
```

定时配置检查地址：

```text
http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/config
```

扩展实际会优先对“上传接口地址”发起 `GET` 请求并追加 `purpose=schedule`，例如：

```text
http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/upload?purpose=schedule
```

CSV 下载地址：

```text
http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/download
```

旧启动入口仍可用：

```powershell
node platform-resources\alibaba-labelx\asr-judgement\backend\server.js
```

旧接口路径也继续兼容：

```text
http://127.0.0.1:3333/api/asr-judgement/statistics/upload
```

CSV 下载旧路径 `/api/asr-judgement/statistics/download` 已移除，不再兼容。

可用环境变量：

- `ASR_JUDGEMENT_SERVER_HOST`：监听地址，默认 `127.0.0.1`。
- `ASR_JUDGEMENT_SERVER_PORT`：监听端口，默认 `3333`。
- `ASR_JUDGEMENT_STATS_DIR`：统计输出目录，默认 `platform-resources/alibaba-labelx/asr-judgement/backend/statistics-data/`。
- `ASR_JUDGEMENT_PERSIST_ROWS_JSON`：设为 `1` 时额外写入 `statistics-rows.json`，默认不写。
- `ASR_JUDGEMENT_PERSIST_UPLOAD_EVENTS`：设为 `1` 时额外写入 `statistics-upload-events.jsonl`，默认不写。

## 文件职责

- `index.js`：供统一后端入口注册本项目 API。
- `routes.js`：HTTP 路由、健康检查、上传接口、定时配置接口、CSV 下载接口和请求体读取。
- `server.js`：兼容旧用法的本项目独立启动入口。
- `http-server.js`：兼容旧用法的本项目 HTTP server 包装层。
- `payload-merge.js`：按 `分包ID` 合并上传补丁记录，填充标注员 / 审核员宽表列。
- `file-store.js`：默认以 `statistics-merged.csv` 作为唯一落盘数据源，必要时可兼容读取旧 `statistics-rows.json`。
- `csv-columns.js`：CSV 列顺序定义。
- `csv-writer.js`：CSV 转义和写入。

## 接口约定

- `POST /api/alibaba-labelx/asr-judgement/statistics/upload`：接收单个分包补丁 payload，也接收首页批量上传的 `{ payloads: [...] }` 信封。服务端会逐条按 `mergeKey.batchId` / `分包ID` 合并。
- `GET /api/alibaba-labelx/asr-judgement/statistics/upload?purpose=schedule`：返回定时上传配置，供扩展从同一个上传接口地址读取时间。
- `GET /api/alibaba-labelx/asr-judgement/statistics/config`：返回同样的定时上传配置，便于本地直接调试。
- `GET /api/alibaba-labelx/asr-judgement/statistics/health`：健康检查和当前 CSV 路径。
- `GET /api/alibaba-labelx/asr-judgement/statistics/download`：下载当前 `statistics-merged.csv`。

为了兼容旧版扩展默认地址，上传、定时配置和健康检查仍保留 `/api/asr-judgement/statistics/...` 旧路径；CSV 下载旧路径不保留。

## 统计规则

- 扩展侧统计上传模块：`extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.js`。
- 首页、详情页和定时上传统一按 `projectId` 采集该账号在当前项目下的标注 / 审核分包。
- 不再保留“详情页当前 `subTaskId` 单条上传”回退。
- 统计只保留 ASR 更优判断数据：优先按 `labelModel=vote` 判断；接口缺失时用 `taskName` 包含 `ASR更优结果判断` / `ASR更优` 且 `size=400` 兜底。
- `labelModel=single`、`taskName=中文普通话asr任务` 或 `size=50` 视为历史转写数据并跳过。
- 有效时长以秒为单位，保留 4 位小数。
- 单条 payload 的基础字段放在 `csvPatch`。
- 当前子任务身份放在 `roleRecord`。
- 服务端按 `mergeKey.batchId` / `分包ID` 做幂等合并。
- 多个标注员和审核员的记录会合并成同一行 CSV 宽表。

## CSV 宽表字段

当前统计 CSV 列顺序：

```text
任务名称,任务ID,标注员1子任务ID,标注员2子任务ID,标注员3子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员1,标注员2,标注员3,审核员,标注员1领取时间,标注员1提交时间,标注员2领取时间,标注员2提交时间,标注员3领取时间,标注员3提交时间,审核领取时间,审核提交时间,标注员1是否完成,标注员2是否完成,标注员3是否完成,审核是否完成
```

## 输出文件

默认输出在当前服务目录下的 `statistics-data/`：

- `statistics-merged.csv`：最终合并 CSV。

默认不再写入 `statistics-upload-events.jsonl` 和 `statistics-rows.json`，避免 10 万级分包数据重复占用磁盘。需要临时排查时，可以把 `ASR_JUDGEMENT_PERSIST_ROWS_JSON=1` 或 `ASR_JUDGEMENT_PERSIST_UPLOAD_EVENTS=1` 加到启动环境变量中。

`statistics-data/` 是本地调试产物，已在本目录 `.gitignore` 中忽略。
