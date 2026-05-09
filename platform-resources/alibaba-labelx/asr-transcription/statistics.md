# Alibaba LabelX ASR 转写统计上传策略（0.2.11）

## 目标

- 降低首页手动“上传转写统计”时的详情请求数量，避免 `subTask/{id}/data` 请求风暴。
- 升级为供应商分表：CSV 新增 `供应商`，后端按 `供应商 + 分包ID` 合并。
- 统计上传与定时上传作为脚本默认能力，运行时强制启用，不在转写详情页提供关闭开关。

## 取数与限流策略

- 详情抓取优先使用：`pageSize=100`（扩展上传策略，非页面渲染策略）。
- 详情抓取硬上限：
  - `TRANSCRIPTION_DETAIL_MAX_PAGES=3`
  - `TRANSCRIPTION_DETAIL_MAX_ITEMS=300`
- 提前停止条件：
  - 空页
  - 重复页签名（同一页 `dataId/id` 集合重复）
  - `recordCount` 缺失（只抓第一页）
  - `recordCount <= pageSize`
  - 已达到 `recordCount` 或 `maxItems`

## 首页采集边界

- 首页列表分页最多抓取 `5` 页。
- 首页详情并发上限 `2`。
- 单次上传最多处理 `50` 个转写子任务。
- 同一轮上传中，按清洗后的 `subTaskId` 去重；同一 ID 仅请求一次详情。

## 上传锁

- 运行时 `state.uploading=true` 时，新的手动/定时上传直接返回：
  - `skipped=true`
  - `reason=upload-in-progress`
- 不排队，不并发第二轮上传。

## 任务过滤

- 快判排除优先：
  - `labelModel=vote`
  - 任务名命中 `ASR更优结果判断 / ASR更优 / 更优结果判断 / 更优判断`
  - `size=400` 且命中更优语义
- 转写采集：
  - `labelModel=single`
  - 或任务名命中 `中文普通话asr任务 / 中文普通话asr / 普通话asr`
  - 或 `size=50`（且未命中快判排除）

## 说明

- 页面 Network 实测 `pageSize=10` 仅说明平台页面默认取数方式。
- 扩展统计上传使用 `pageSize=100 + 硬上限` 是为减少请求数量与异常循环风险。
- 前端 `csvPatch` 只发送基础字段：`任务名称/供应商/任务ID/分包ID/题数/有效时长(秒)`。
- 标注/审核字段只由 `roleRecord` 按 `role` 写入：
  - `label` 仅写标注字段；
  - `audit` 仅写审核字段。
- 后端会忽略 `csvPatch` 里误传的角色字段；`roleRecord.role` 非 `label|audit` 会拒绝写入。
- 供应商识别优先级：
  1. `payload.supplier.name`
  2. `payload.vendor.name`
  3. `payload.supplier`
  4. `payload.vendor`
  5. `csvPatch["供应商"]`
  6. `taskName/name` 推断（当前已知：`棋燊`、`希尔贝壳`）
  7. `未识别供应商`
- 后端不再维护根级 `statistics-data/statistics-merged.csv`，统一写入 `statistics-data/suppliers/<供应商>/statistics-merged.csv`。
- 下载必须显式带 `supplier` 参数：`/api/alibaba-labelx/asr-transcription/statistics/download?supplier=棋燊`。
- 供应商列表接口：`/api/alibaba-labelx/asr-transcription/statistics/suppliers`。
- 当前版本策略为 `manifest.version = 0.2.11`。
