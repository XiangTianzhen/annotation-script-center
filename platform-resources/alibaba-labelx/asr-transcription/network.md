# Alibaba LabelX ASR 转写网络请求（脱敏）

## 采集范围

- 采集日期：2026-05-08
- 采集方式：Chrome DevTools / MCP（已登录会话，只读）
- 首页：`/corpora/labeling/labelingTask?projectId=1023`
- 详情页：`/corpora/labeling/sdk?...&missionType=label&projectId=1023&subTaskId=17863539...`

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

## 对转写统计取数的约束结论

- 详情数据分页应按 `pageSize=10` 处理，不再套用快判 `400` 逻辑。
- `subTaskId` 必须先 `decode` 再清洗空白字符：
  - 普通空格、Tab、换行、回车、全角空格。
- 首页先过滤“转写任务”，再请求详情分页：
  - 排除：`labelModel=vote` 或任务名命中“ASR更优结果判断”等关键词。
  - 采集：`labelModel=single` 或任务名命中“中文普通话asr任务”等关键词，`size=50` 可作候选辅助。
- 有效时长应从详情分页 `dataList` 聚合 `duration` 秒值。

## 待补采（下一轮可选）

- `checkTask` 审核首页同项目 `type=check/subTaskType=check` 的完整请求样例。
- 不同 `missionType`（`check/audit/review`）在详情页的数据字段差异。
- 详情页第 2 页及后续页的真实请求样例和返回稳定性。
