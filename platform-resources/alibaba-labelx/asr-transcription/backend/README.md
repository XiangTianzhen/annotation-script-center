# Alibaba LabelX ASR 转写统计后端

## 目录用途

本目录提供 ASR 转写统计上传、合并与 CSV 下载能力，路由由 `platform-resources/backend/server.js` 统一启动注册。

说明：浏览器扩展前端只保留 `extension/sites/alibaba-labelx/asr-transcription/transcription-stats-client.js` 作为统计上传客户端，不在前端实现 Node 服务或 CSV 落盘。
当前 `0.2.11` 稳定口径：转写统计内部按“供应商 + 分包ID”合并，主写入根级总表；历史供应商目录仅兼容读取，不作为主输出。
当前 `0.3.2` 新增“当前题 AI 推荐”接口：只返回辅助推荐，不做自动保存/提交。

## 默认数据目录

- `platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`
- 主 CSV：`statistics-data/statistics-merged.csv`
- 历史 `statistics-data/suppliers/<供应商>/statistics-merged.csv` 若本地存在，仅作为兼容读取迁移，不主动创建、不继续写入。

## 环境变量

- `ASR_TRANSCRIPTION_STATS_DIR`：统计输出目录。
- `ASR_TRANSCRIPTION_PERSIST_ROWS_JSON=1`：额外写入 `statistics-rows.json`。
- `ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS=1`：额外写入 `statistics-upload-events.jsonl`。
- `ASR_TRANSCRIPTION_AI_MOCK=1`：启用转写 AI mock 调试模式。
- `ASR_TRANSCRIPTION_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `ASR_TRANSCRIPTION_AI_COMPARE_MODEL`：文本比较模型，默认 `qwen3.5-plus`。
- `ASR_TRANSCRIPTION_AI_TIMEOUT_MS`：AI 请求超时，默认 `120000`。
- `ASR_TRANSCRIPTION_AI_ENABLE_THINKING`：默认 `0`，开启时尝试传 `enable_thinking=true`。
- `ASR_TRANSCRIPTION_AI_ALLOW_CLIENT_MODEL_OVERRIDE`：默认 `1`，允许请求体覆盖模型名。

## 接口

- `GET /api/alibaba-labelx/asr-transcription/statistics/health`
- `GET /api/alibaba-labelx/asr-transcription/statistics/config`
- `GET /api/alibaba-labelx/asr-transcription/statistics/upload?purpose=schedule`
- `POST /api/alibaba-labelx/asr-transcription/statistics/upload`
- `GET /api/alibaba-labelx/asr-transcription/statistics/suppliers`
- `GET /api/alibaba-labelx/asr-transcription/statistics/download`
- `HEAD /api/alibaba-labelx/asr-transcription/statistics/download`
- `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
- `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`

下载接口默认返回根级总表，不要求 `supplier` 参数；`suppliers` 接口仅作为辅助信息接口。下载文件名统一带 `YYYYMMDD-HHmm`（Asia/Shanghai）。
- 总表：`asr-transcription-statistics-merged-YYYYMMDD-HHmm.csv`
- 供应商：`asr-transcription-<供应商safeName>-statistics-YYYYMMDD-HHmm.csv`
- `supplier` 有值但无匹配时返回 `404`，不回退总表。

兼容短路径：

- `GET /api/asr-transcription/statistics/health`
- `GET /api/asr-transcription/statistics/config`
- `GET /api/asr-transcription/statistics/upload?purpose=schedule`
- `POST /api/asr-transcription/statistics/upload`

## 默认定时配置

- `times`: `["10:00","16:00"]`
- 定时上传在真正 POST 前增加随机延迟：`0~300` 秒、`100ms` 步进（手动上传不延迟）。

## CSV 列顺序

CSV 写出时按当前供应商集合动态决定是否输出“供应商”列：

- 单供应商数据集：不输出“供应商”列。
- 多供应商数据集：在最后一列追加“供应商”列。

单供应商数据集默认列顺序：

```
任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长,标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成
```

## 合并规则

1. 以“供应商 + 分包ID”（`mergeKey.supplierKey + "::" + mergeKey.batchId`）合并。
2. 供应商识别优先级：`payload.supplier.name`、`payload.vendor.name`、`payload.supplier`、`payload.vendor`、`csvPatch["供应商"]`、`taskName/name` 规则推断、`未识别供应商`。
   - 命中 `海天` 归一为 `海天`；命中 `贝壳` / `希尔贝壳` 归一为 `希尔贝壳`；命中 `棋燊` 归一为 `棋燊`；`supplier=H` + 海天任务名归一为 `海天`。
3. `csvPatch` 只用于基础字段：`任务名称/任务ID/分包ID/题数/有效时长`，可带 `供应商` 作为识别兜底。
4. 后端 `applyBasePatch` 会忽略 `csvPatch` 里所有角色字段（标注/审核字段），避免前端误传污染 CSV。
5. `role=label` 仅写标注字段；`role=audit` 仅写审核字段，双方互不覆盖。
6. `roleRecord.role` 必须为 `label` 或 `audit`，缺失/非法会直接拒绝写入并返回错误。
7. 有提交时间优先判定“已完成”；否则按状态值；无法判断写“未完成”。
8. `有效时长` 使用自然小数格式（最多 4 位，去尾零）。
9. 项目类型识别优先级：`payload.project`、`payload.rawKeys.labelModel`（高优先）；其次 `taskName` 关键词；再次 CSV schema；最后题数兜底（`400` 仅历史兜底）。
10. 防串表：检测到高置信判断数据（如 `project=...asr-judgement` 或 `labelModel=vote`）会拒绝写入转写统计表，并通过 `rejectedItems` 返回原因。

## 安全要求

- 不写入 token、cookie、完整音频 URL、完整签名 URL。
- 上传日志只输出：`requestId`、`projectId`、`batchId`、`payloadCount`、`rowCount`、`csvPath`。

历史兼容说明：

- 旧 CSV 表头 `有效时长(秒)` 在读取时会自动归一为 `有效时长`。
- 统计运行数据目录（`statistics-data/`）属于本地产物，不提交 Git。
- 历史修复工具：`node platform-resources/alibaba-labelx/backend/legacy-csv-repair.js --dry-run`（预览）与 `--write --backup`（写入并备份）；运行 CSV 修复仅本地执行，不提交 Git。
