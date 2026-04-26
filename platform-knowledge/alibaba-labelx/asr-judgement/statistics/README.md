# ASR 快判统计资料

## 目录用途

本目录记录 ASR 快判统计数据格式、上传 payload 和本地调试服务契约。运行时代码仍在 `edge-extension/extension/sites/alibaba-labelx/asr-judgement/`。

## CSV 宽表字段

当前统计 CSV 列顺序：

```text
任务名称,任务ID,标注员1子任务ID,标注员2子任务ID,标注员3子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员1,标注员2,标注员3,审核员,标注员1领取时间,标注员1提交时间,标注员2领取时间,标注员2提交时间,标注员3领取时间,标注员3提交时间,审核领取时间,审核提交时间,标注员1是否完成,标注员2是否完成,标注员3是否完成,审核是否完成
```

## 上传规则

- 扩展侧统计上传模块：`edge-extension/extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.js`。
- 本地调试服务：`edge-extension/extension/sites/alibaba-labelx/asr-judgement/backend/server.js`。
- 首页、详情页和定时上传统一按 `projectId` 采集该账号在当前项目下的标注 / 审核分包。
- 不再保留“详情页当前 `subTaskId` 单条上传”回退。
- 统计只保留 ASR 更优判断数据：优先按 `labelModel=vote` 判断；接口缺失时用 `taskName` 包含 `ASR更优结果判断` / `ASR更优` 且 `size=400` 兜底。
- `labelModel=single`、`taskName=中文普通话asr任务` 或 `size=50` 视为历史转写数据并跳过。
- 有效时长以秒为单位，保留 4 位小数。

## 服务端合并契约

- 单条 payload 的基础字段放在 `csvPatch`。
- 当前子任务身份放在 `roleRecord`。
- 服务端按 `mergeKey.batchId` / `分包ID` 做幂等合并。
- 多个标注员和审核员的记录会合并成同一行 CSV 宽表。
- 本地服务默认只落盘 `statistics-merged.csv`，不再写 `statistics-rows.json` 和 `statistics-upload-events.jsonl`。

## 后续建议

生产服务端更推荐使用“快速校验和入队 / upsert”的模式：上传接口只返回轻量成功响应，后端队列异步合并 CSV 和写数据库，避免多个客户端在固定时间点同时上传时阻塞请求。
