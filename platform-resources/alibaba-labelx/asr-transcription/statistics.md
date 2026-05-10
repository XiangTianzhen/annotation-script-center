# Alibaba LabelX ASR 转写统计上传策略（0.2.11 修正）

## 版本说明

- 当前扩展版本保持 `0.2.11`。
- 本轮是 `0.2.11` 修正增强，不升级到 `0.2.12`。

## 目标

- 修正 0.2.11 初版的固定供应商列策略，改为动态供应商列。
- 修正转写统计抓取完整性，避免固定页数/条数导致漏数。
- 保持统计上传与定时上传为脚本默认能力（强制启用）。

## CSV 供应商列策略

- 内部合并键继续使用 `供应商 + 分包ID`，避免跨供应商同分包 ID 覆盖。
- CSV 写出时按当前数据集动态决定是否输出 `供应商`：
  - 单供应商数据集：不输出 `供应商` 列。
  - 多供应商数据集：在最后一列追加 `供应商` 列。
- 不再把 `供应商` 固定在中间列。

## 供应商识别优先级

1. `payload.supplier.name`
2. `payload.vendor.name`
3. `payload.supplier`
4. `payload.vendor`
5. `csvPatch["供应商"]`
6. `taskName/name` 推断（当前已知：`棋燊`、`希尔贝壳`）
7. `未识别供应商`

## 转写抓取完整性口径

- 首页列表与详情列表都按 `recordCount` 计算总页数，不再固定 5 页/50 条/300 条。
- 首页会同时抓取：
  - `subTasks?finished=false`
  - `subTasks?finished=true`
- 详情接口：`/api/v1/label/center/subTask/{subTaskId}/data`
  - 优先 `pageSize=5000` 请求第一页。
  - 若 `recordCount > 5000`，继续分页补齐。
- 并发策略：
  - 默认并发 `5`。
  - 根据任务数动态收敛。
  - 并发硬上限 `999`。
- 分页上限：
  - 首页最大 `999` 页。
  - 详情最大 `999` 页。
  - 超限时明确告警并截断，不静默漏数。

## 上传进度显示

- 上传过程新增进度条（共享组件：`extension/shared/progress-indicator.js`）。
- 进度项包含：
  - 当前阶段
  - 已完成 / 总数
  - 百分比
  - 当前并发
  - 成功 / 失败数量
- 默认并发显示为 `5`，并发上限 `999`。

## 有效时长与人员解析

- 有效时长只累计“是否有效”严格等于“有效”的题目 `duration`。
- 不使用 `includes("有效")`，避免“无效”误判。
- 标注员/审核员解析新增 `dataResultHistory` 兜底：
  - 优先 `type === 0`。
  - 找不到则取最后一条。

## 落盘与下载

- 统计主写入：`statistics-data/statistics-merged.csv`。
- 历史 `statistics-data/suppliers/<供应商>/statistics-merged.csv` 仅兼容读取迁移，不删除旧文件。
- 默认下载接口（总表）：`/api/alibaba-labelx/asr-transcription/statistics/download`
- 供应商列表接口：
  - `/api/alibaba-labelx/asr-transcription/statistics/suppliers`

## 参考边界

- `legacy-reference/asr-script.user.js` 仅用于逻辑参考（分页、并发、有效时长、`dataResultHistory`）。
- 不恢复 Tampermonkey 架构，不引入 `GM_xmlhttpRequest`，不恢复旧密码弹窗或危险自动提交流程。
