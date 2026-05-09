# Alibaba LabelX ASR 转写统计后端

## 目录用途

本目录提供 ASR 转写统计上传、合并与 CSV 下载能力，路由由 `platform-resources/backend/server.js` 统一启动注册。

说明：浏览器扩展前端只保留 `extension/sites/alibaba-labelx/asr-transcription/transcription-stats-client.js` 作为统计上传客户端，不在前端实现 Node 服务或 CSV 落盘。
当前 `0.2.10` 修复中，前端详情取数优先 `pageSize=100`（带上限）并清洗 `subTaskId` 空白；本后端 CSV 字段与合并规则保持不变。

## 默认数据目录

- `platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`
- 默认 CSV：`statistics-merged.csv`

## 环境变量

- `ASR_TRANSCRIPTION_STATS_DIR`：统计输出目录。
- `ASR_TRANSCRIPTION_PERSIST_ROWS_JSON=1`：额外写入 `statistics-rows.json`。
- `ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS=1`：额外写入 `statistics-upload-events.jsonl`。

## 接口

- `GET /api/alibaba-labelx/asr-transcription/statistics/health`
- `GET /api/alibaba-labelx/asr-transcription/statistics/config`
- `GET /api/alibaba-labelx/asr-transcription/statistics/upload?purpose=schedule`
- `POST /api/alibaba-labelx/asr-transcription/statistics/upload`
- `GET /api/alibaba-labelx/asr-transcription/statistics/download`
- `HEAD /api/alibaba-labelx/asr-transcription/statistics/download`

兼容短路径：

- `GET /api/asr-transcription/statistics/health`
- `GET /api/asr-transcription/statistics/config`
- `GET /api/asr-transcription/statistics/upload?purpose=schedule`
- `POST /api/asr-transcription/statistics/upload`

## 默认定时配置

- `times`: `["10:00","16:00"]`
- `jitterMinutes`: `10`

## CSV 列顺序

```
任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成
```

## 合并规则

1. 以 `分包ID`（`mergeKey.batchId`）合并。
2. `csvPatch` 只用于基础字段：`任务名称/任务ID/分包ID/题数/有效时长(秒)`。
3. 后端 `applyBasePatch` 会忽略 `csvPatch` 里所有角色字段（标注/审核字段），避免前端误传污染 CSV。
4. `role=label` 仅写标注字段；`role=audit` 仅写审核字段，双方互不覆盖。
5. `roleRecord.role` 必须为 `label` 或 `audit`，缺失/非法会直接拒绝写入并返回错误。
6. 有提交时间优先判定“已完成”；否则按状态值；无法判断写“未完成”。
7. `有效时长(秒)` 使用自然小数格式（最多 4 位，去尾零）。

## 安全要求

- 不写入 token、cookie、完整音频 URL、完整签名 URL。
- 上传日志只输出：`requestId`、`projectId`、`batchId`、`payloadCount`、`rowCount`、`csvPath`。
