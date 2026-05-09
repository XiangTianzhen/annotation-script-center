# Alibaba LabelX ASR 转写网络请求（脱敏）

## 采集范围

- 采集日期：2026-05-08
- 采集方式：Chrome DevTools / MCP（已登录会话，只读）
- 首页：`/corpora/labeling/labelingTask?projectId=1023`
- 详情页：`/corpora/labeling/sdk?...&missionType=label&projectId=1023&subTaskId=17863539...`
- 追加采集日期：2026-05-09
- 追加页面：
  - 审核首页：`/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
  - 审核详情页：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 通用接口结构已同步沉淀到 `../network.md`。

## 脱敏规则

- 不记录 cookie、SSO token、access token。
- 不记录完整签名音频 URL。
- 不记录完整 request headers。
- 仅记录接口路径、query 参数名、响应字段结构和业务关键字段。

## 首页请求（labelingTask）

### 1) 任务列表

- Method：`GET`
- Path：`/api/v1/label/center/tasks`
- Query：
  - `subTaskType`
  - `keyword`
  - `appId`
  - `page`
  - `pageSize`
  - `_`
- Response（核心结构）：
  - `code`
  - `success`
  - `data.recordCount`
  - `data.data[]`：
    - `taskId`
    - `name`
    - `gmtCreate`
    - `labelModel`

### 2) 子任务列表

- Method：`GET`
- Path：`/api/v1/label/center/subTasks`
- Query：
  - `type`（例：`label`）
  - `keyword`
  - `appId`
  - `finished`（`true/false`）
  - `page`
  - `pageSize`
  - `_`
- Response（核心结构）：
  - `code`
  - `success`
  - `data.recordCount`
  - `data.data[]`：
    - `id`
    - `type`
    - `taskId`
    - `batchId`
    - `status`
    - `gmtCreate`
    - `gmtCommit`
    - `taskName`
    - `size`
    - `labelModel`
    - `taskType`

### 3) 任务进度补充接口

- Method：`GET`
- Path：`/api/v1/label/center/tasks/process`
- Query：
  - `subTaskType`
  - `taskIds`
  - `_`
- 备注：用于补充任务进度信息，不用于详情数据分页。

## 首页任务识别样例（来自真实响应）

- 快判样例（应排除）：
  - `taskName=ASR更优结果判断_...`
  - `size=400`
  - `labelModel=vote`
- 转写样例（应采集）：
  - `taskName=希尔贝壳-中文普通话asr任务-线上回流3rd-16`
  - `size=50`
  - `labelModel=single`
  - 子任务示例：`id=17863539`

## 审核首页请求（checkTask）

### 1) 审核任务列表

- Method：`GET`
- Path：`/api/v1/label/center/tasks`
- Query：
  - `subTaskType=check`
  - `keyword`
  - `appId`
  - `page`
  - `pageSize`
  - `_`
- Response：
  - `data.recordCount`
  - `data.data[]`
- `data.data[]` 字段：
  - `taskId`
  - `subTaskType`
  - `name`
  - `gmtCreate`
  - `total`
  - `left`
  - `labelModel`
- 本轮样例：
  - `labelModel=single`
  - 任务名称可从 `name` 读取。
  - 无 `supplier/vendor/company/provider` 字段。

### 2) 审核子任务列表

- Method：`GET`
- Path：`/api/v1/label/center/subTasks`
- Query：
  - `type=check`
  - `keyword`
  - `appId`
  - `finished`
  - `page`
  - `pageSize`
  - `_`
- Response：
  - `data.recordCount`
  - `data.data[]`
- `data.data[]` 字段：
  - `id`
  - `type`
  - `taskId`
  - `batchId`
  - `status`
  - `gmtCreate`
  - `gmtCommit`
  - `taskName`
  - `size`
  - `template`
  - `templateConfig`
  - `dataList`
  - `dataResultHistory`
  - `rejectReason`
  - `labelModel`
  - `supportModify`
  - `taskType`
- 本轮样例：
  - 未完成 `recordCount=43`。
  - 已完成 `recordCount=2035`。
  - 转写子任务 `size=50`、`labelModel=single`。
  - 无独立供应商字段。

### 3) 审核任务进度

- Method：`GET`
- Path：`/api/v1/label/center/tasks/process`
- Query：
  - `subTaskType=check`
  - `taskIds`
  - `_`
- Response：
  - `data[]`
- `data[]` 字段：
  - `taskId`
  - `subTaskType`
  - `name`
  - `gmtCreate`
  - `total`
  - `left`
  - `labelModel`
- 无独立供应商字段。

## 详情页请求（sdk）

## URL 参数观察

- 详情页 URL 中 `subTaskId` 实际可能带 `%0A`（换行）和 `%20`（空格）。
- 真实请求中也会出现带空白的 path 片段：
  - `/subTask/17863539%20%20.../data`
- 结论：构造接口前必须先清洗 `subTaskId`。

### 1) 子任务数据分页接口（核心）

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- Query：
  - `page`
  - `pageSize`（实测为 `10`）
  - `filterPassedVote`（实测 `false`）
  - `filter`（实测 `{"questions":[],"dataStatus":"ALL","questionsQueryConditions":"AND"}`）
  - `_`
- Response（核心结构）：
  - `code`
  - `success`
  - `data.id`
  - `data.taskId`
  - `data.batchId`
  - `data.status`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.taskName`
  - `data.size`
  - `data.dataList[]`
    - `dataId`
    - `batchId`
    - `data.duration`（秒）
    - `data.online_rec`
    - `result`

### 2) 子任务摘要

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/summary`
- Query：`_`
- Response（核心结构）：
  - `data.id`
  - `data.total`
  - `data.mistakeCount`

### 3) 子任务看板

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/board`
- Query：
  - `filterPassedVote`
  - `filter`
  - `_`
- Response（核心结构）：
  - `data.subTaskId`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.size`
  - `data.dataList[]`（`dataId`、`hasResult`、`hasMistake`）

### 4) 任务基础信息补充

- Method：`GET`
- Path：`/api/v1/label/tasks/getLabelTaskInfo`
- Query：
  - `taskId`
  - `_`
- Response（核心结构）：
  - `data.id`
  - `data.name`
  - `data.type`
  - `data.processConfigVO.labelModel`

## 审核详情页补采（missionType=check）

本轮审核详情页为转写任务，`labelModel=single`，`size=50`。

### 1) data 接口补充字段

- `data.type`：审核态样例为 `CHECK`。
- `data.rejectReason`：审核被驳回原因摘要。
- `data.labelModel=single`。
- `data.taskType=custom`。
- `data.dataList[].data` 字段：
  - `seed_text`
  - `end_time`
  - `segment_duration`
  - `language`
  - `data_from`
  - `data_source`
  - `gaode_asr2_text`
  - `req_id`
  - `wav_id`
  - `duration`
  - `start_time`
  - `gaode_asr2_wer`
  - `raw_audio_path`
  - `audio_path`
  - `gaode_asr1_text`
  - `from`
  - `online_rec`
  - `segment_id`
  - `gaode_asr1_wer`
- `data.dataList[].result` 字段：
  - `markResult`

### 2) 音频 URL 字段

- 字段路径：
  - `data.dataList[].data.raw_audio_path`
  - `data.dataList[].data.audio_path`
  - `data.dataList[].data.wav_id`
  - `audio.currentSrc`
- `raw_audio_path` 和页面 `audio.currentSrc` 是完整签名 URL。
- 只允许记录：
  - hostname：`labelx.alibaba-inc.com`
  - pathname 后缀：`audio/<REDACTED_FILE>.wav`
  - query 参数名：`Expires`、`OSSAccessKeyId`、`Signature`

## 审核详情页自动保存

### 1) 有效性切换

- 操作：在审核详情页将当前题 `有效` 切为 `无效`，再切回 `有效`。
- 自动保存请求：
  - `POST /api/v1/label/center/mistake`
  - `POST /api/v1/label/center/subTask/{subTaskId}/data`
- `mistake` 请求体字段：
  - `type`
  - `taskId`
  - `subTaskId`
  - `batchId`
  - `dataId`
  - `reason`
  - `confirmRangeType`
  - `fixStatus`
- `data` 保存体字段：
  - `dataList`
  - `timestamp`
- 结论：
  - 有效性切换会改变真实任务数据。
  - 平台保存当前题单条 `dataList`。
  - 保存后会刷新 `summary` 和 `board`。

### 2) 转写文本编辑

- 操作：临时追加测试文本，再恢复原文。
- 自动保存请求：
  - `POST /api/v1/label/center/subTask/{subTaskId}/data`
- 结论：
  - textarea 触发 input/change/blur 后会自动保存。
  - 刷新页面后确认恢复值来自平台接口。

## 审核详情页提交

- 操作：用户授权后点击 `提交任务`。
- 提交请求：
  - Method：`POST`
  - Path：`/api/v1/label/center/subTask/{subTaskId}/commit`
  - Request body：`subTaskId`
- 自动领取请求：
  - Method：`POST`
  - Path：`/api/v1/label/center/{taskId}/check/fetch`
  - Request body：
    - `taskId`
    - `type=check`
    - `autoFetch=true`
- 本轮页面行为：
  - 自动领取开关开启。
  - 提交后未进入新详情页，返回审核首页。
  - 审核首页随后请求 `subTasks?type=check`、`tasks?subTaskType=check`、`tasks/process?subTaskType=check`。

## 对转写统计取数的约束结论

- 平台页面实测详情请求常见 `pageSize=10`；扩展统计上传策略为降低请求数量，优先使用 `pageSize=100` 抓取。
- 扩展侧详情抓取硬上限：`maxPages=3`、`maxItems=300`；遇空页、重复页签名、`recordCount` 缺失会提前停止。
- 首页列表抓取硬上限：`maxPages=5`；详情并发 `2`；单次上传最多处理 `50` 个转写子任务。
- 上传运行态带全局锁：`upload-in-progress` 时跳过重复触发，避免手动连点和定时任务并发。
- `subTaskId` 必须先 `decode` 再清洗空白字符：
  - 普通空格、Tab、换行、回车、全角空格。
- 首页先过滤“转写任务”，再请求详情分页：
  - 排除：`labelModel=vote` 或任务名命中“ASR更优结果判断”等关键词。
  - 采集：`labelModel=single` 或任务名命中“中文普通话asr任务”等关键词，`size=50` 可作候选辅助。
- 有效时长应从详情分页 `dataList` 聚合 `duration` 秒值。
- 供应商字段当前不能从接口直接读取；统计实现需要从 `taskName` / `name` 前缀推断。

## 供应商字段结论

本轮在以下响应中均未发现 `supplier/vendor/company/provider/供应商` 字段：

- 转写标注首页历史采集：无。
- 转写审核首页本轮采集：无。
- 转写审核详情页本轮采集：无。
- `getLabelTaskInfo`：无。
- `summary` / `board`：无。

当前样例：

- `棋燊`：可从 `棋燊-...` 任务名前缀推断。
- `希尔贝壳`：历史采集样例中可从 `希尔贝壳-...` 任务名前缀推断。

推荐后续供应商识别优先级：

1. `payload.supplier` / `payload.vendor`
2. `csvPatch["供应商"]`
3. `taskName` / `name` 前缀规则推断
4. `未识别供应商`

## 待补采（下一轮可选）

- 转写标注详情页 `missionType=label` 的保存、提交和自动领取链路。
- 详情页提交下拉中的 `提交并结束` 行为。
- 不同 `missionType`（`label/audit/review`）在详情页的数据字段差异。
- 详情页第 2 页及后续页的真实请求样例和返回稳定性。
- 详情页 `pageSize` 下拉切换后的真实请求。
- 筛选面板展开后 `filter.questions` 结构。
- 扩展加载后的转写工具栏 DOM、按钮与快捷键行为。
