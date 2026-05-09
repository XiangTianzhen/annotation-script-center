# Alibaba LabelX ASR 转写统计上传策略（0.2.10）

## 目标

- 降低首页手动“上传转写统计”时的详情请求数量，避免 `subTask/{id}/data` 请求风暴。
- 保持 CSV 字段与后端合并规则不变。

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
- 当前版本策略保持 `manifest.version = 0.2.10`。
