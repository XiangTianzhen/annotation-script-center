# Alibaba LabelX 通用网络请求（脱敏）

## 目录定位

本文件记录 Alibaba LabelX 在 ASR 转写和 ASR 快判中已确认共用的网络接口结构。项目专属字段、任务识别规则和统计取数策略仍维护在各脚本目录：

- `asr-transcription/network.md`
- `asr-judgement/network/`

## 采集范围

- 采集日期：2026-05-09
- 采集方式：Chrome DevTools MCP，已登录会话，人工授权后执行可逆操作。
- 采集页面：
  - 审核首页：`/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
  - 审核详情页：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 本轮样例为 `labelModel=single` 的 ASR 转写任务；快判已存在独立采集资料，公共接口形态一致时在本文件合并记录。

## 脱敏规则

- 不记录 cookie、SSO token、access token、authorization、完整 session。
- 不记录完整签名音频 URL。音频 URL 只记录字段路径、hostname、pathname 后缀和 query 参数名。
- 不记录完整用户隐私字段。
- 请求和响应示例只保留字段名、状态码、列表数量和业务含义。

## 详情页初始化请求

刷新详情页后，ASR 转写和快判详情页都会出现以下核心请求链。

### 1. 子任务数据

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- Query：
  - `page`
  - `pageSize`
  - `filterPassedVote`
  - `filter`
  - `_`
- 转写审核详情页实测：
  - `page=1`
  - `pageSize=10`
  - `filterPassedVote=false`
  - `filter={"questions":[],"dataStatus":"ALL","questionsQueryConditions":"AND"}`
- Response：
  - `code`
  - `success`
  - `data.id`
  - `data.type`
  - `data.taskId`
  - `data.batchId`
  - `data.status`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.taskName`
  - `data.size`
  - `data.template`
  - `data.templateConfig`
  - `data.dataList[]`
  - `data.dataResultHistory`
  - `data.rejectReason`
  - `data.labelModel`
  - `data.supportModify`
  - `data.taskType`
- `data.dataList[]` 常见字段：
  - `dataId`
  - `batchId`
  - `data`
  - `componentsResult`
  - `result`
  - `labelDate`
  - `operator`
  - `userId`
  - `status`
  - `batchKey`
  - `mistakeReason`
  - `hasMistake`
  - `voteResultList`
  - `passVote`
  - `type`
  - `isAllRequiredLabeled`
  - `mistakeId`
  - `pendingConfirm`
  - `checkUserId`
  - `reviewUserId`
  - `aoneWebIdeUrl`

### 2. 子任务摘要

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/summary`
- Query：
  - `_`
- Response：
  - `data.id`
  - `data.total`
  - `data.mistakeCount`

### 3. 子任务看板

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/board`
- Query：
  - `filterPassedVote`
  - `filter`
  - `_`
- Response：
  - `data.subTaskId`
  - `data.gmtCreate`
  - `data.gmtCommit`
  - `data.size`
  - `data.dataList[]`
- `data.dataList[]`：
  - `dataId`
  - `hasResult`
  - `hasMistake`

### 4. 任务基础信息

- Method：`GET`
- Path：`/api/v1/label/tasks/getLabelTaskInfo`
- Query：
  - `taskId`
  - `_`
- Response：
  - `data.id`
  - `data.name`
  - `data.type`
  - `data.bizType`
  - `data.status`
  - `data.createTime`
  - `data.dataset`
  - `data.template`
  - `data.processConfigVO`
- `data.processConfigVO` 常见字段：
  - `needLabelProcess`
  - `needCheckProcess`
  - `needReviewProcess`
  - `checkRate`
  - `labelAssignments`
  - `checkAssignments`
  - `reviewAssignments`
  - `adminAssignments`
  - `assignBatchType`
  - `assignBatchSize`
  - `assignBatchField`
  - `description`
  - `labelModel`
  - `voteNum`
  - `taskClaimNum`

## 首页列表请求

标注首页和审核首页共用 `tasks`、`subTasks`、`tasks/process` 三类接口，区别主要在 `type` / `subTaskType` 参数。

### 1. 任务列表

- Method：`GET`
- Path：`/api/v1/label/center/tasks`
- Query：
  - `subTaskType`：`label` 或 `check`
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

### 2. 子任务列表

- Method：`GET`
- Path：`/api/v1/label/center/subTasks`
- Query：
  - `type`：`label` 或 `check`
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

### 3. 任务进度

- Method：`GET`
- Path：`/api/v1/label/center/tasks/process`
- Query：
  - `subTaskType`
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

## 保存和审核订正请求

### 1. 保存当前题数据

- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- 触发：
  - 切换单选。
  - 编辑转写文本后失焦。
  - 审核详情页订正答案后自动保存。
- Request body：
  - `dataList`
  - `timestamp`
- 观察结论：
  - 当前平台保存体是单条 `dataList`，不是整包 50 条。
  - 保存成功后会刷新 `summary` 和 `board`。

### 2. 审核错误 / 订正状态

- Method：`POST`
- Path：`/api/v1/label/center/mistake`
- 触发：
  - 审核详情页切换有效性或订正状态。
- Request body：
  - `type`
  - `taskId`
  - `subTaskId`
  - `batchId`
  - `dataId`
  - `reason`
  - `confirmRangeType`
  - `fixStatus`
- 观察结论：
  - 转写审核详情页切换 `有效/无效/特殊` 会触发该接口，并随后触发 `subTask/{id}/data` 保存。

## 提交和自动领取

### 1. 提交当前子任务

- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/commit`
- 触发：详情页点击 `提交任务`。
- Request body：
  - `subTaskId`
- 本轮观察：
  - 返回 `200`。
  - 点击后返回审核首页。

#### 标注详情页补采

- 页面：`/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 触发：标注详情页点击 `提交任务`。
- Request body：
  - `subTaskId`
- Response 字段树：
  - `code`
  - `message`
  - `log`
  - `data`
  - `traceId`
  - `traceSql`
  - `extraInfo`
  - `cost`
  - `success`
- 本轮观察：
  - HTTP status `200`。
  - 业务 `code=0`、`success=true`。
  - 顶部按钮进入 `loading 提交任务` 状态。
  - 自动领取开启时，提交成功后继续触发标注自动领取请求。

### 2. 自动领取下一包

- Method：`POST`
- Path：
  - 标注：`/api/v1/label/center/{taskId}/label/fetch`
  - 审核：`/api/v1/label/center/{taskId}/check/fetch`
- 触发：详情页开启 `自动领取` 时，提交后由平台触发。
- 审核 Request body：
  - `taskId`
  - `type=check`
  - `autoFetch=true`
- 本轮观察：
  - 请求返回 `200`。
  - 未跳转到新详情页，最终回到审核首页。

#### 标注自动领取补采

- Method：`POST`
- Path：`/api/v1/label/center/{taskId}/label/fetch`
- 触发：标注详情页开启 `自动领取` 后，普通 `提交任务` 成功时由平台触发。
- Request body：
  - `taskId`
  - `type`
  - `autoFetch`
- 本轮标注实测字段类型：
  - `taskId`：number
  - `type`：string，值语义为 `label`
  - `autoFetch`：boolean
- Response 字段树：
  - `code`
  - `message`
  - `log`
  - `data`
  - `traceId`
  - `traceSql`
  - `extraInfo`
  - `cost`
  - `success`
- 本轮观察：
  - HTTP status `200`。
  - 自动领取返回业务失败：`code=500`、`success=false`。
  - 页面未进入新标注详情页，最终返回标注首页 `/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`。
  - 返回首页后可见 `我的任务` 和 `可领取的任务` 列表。

### 3. 提交并结束

- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/commit`
- 触发：详情页点击 `提交任务` 旁下拉菜单中的 `提交并结束`。
- Request body：
  - `subTaskId`
- 本轮观察：
  - 返回 `200`。
  - 随后跳转审核首页 `/corpora/labeling/checkTask`。
  - 首页重拉 `subTasks?type=check`、`tasks?subTaskType=check`、`tasks/process?subTaskType=check`。
  - 未触发 `/api/v1/label/center/{taskId}/check/fetch`，即不会自动领取下一包。

### 4. 审核驳回至上个环节

- 页面：`/corpora/labeling/sdk?missionType=check&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 入口：详情页顶部 `驳 回` 按钮。
- 弹窗标题：`驳回至上个环节`。
- 弹窗字段：
  - `驳回理由`，必填 textarea，计数上限 `500`。
- 弹窗按钮：
  - `取 消`
  - `确 定`
- Method：`POST`
- Path：`/api/v1/label/center/subTask/{subTaskId}/reject`
- Request body：
  - `subTaskId`
  - `rejectReason`
  - `type`
  - `userIdList`
- 本轮字段类型：
  - `subTaskId`：string
  - `rejectReason`：string
  - `type`：string
  - `userIdList`：array
- Response 字段树：
  - `code`
  - `message`
  - `log`
  - `data`
  - `traceId`
  - `traceSql`
  - `extraInfo`
  - `cost`
  - `success`
- 本轮观察：
  - HTTP status `200`。
  - 业务 `code=0`、`success=true`、`data=true`。
  - 页面提示 `驳回成功！跳转回标注中心`。
  - 随后返回审核首页 `/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`。
  - 返回首页后重拉 `surveyResults`、`tasks?subTaskType=check`、`subTasks?type=check`、`tasks/process?subTaskType=check`。

## 详情页分页、每页条数和筛选

以下行为在转写审核详情页实测，接口路径和 query 结构属于 LabelX 详情页通用形态。

### 1. 翻页

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- 触发：点击详情页题卡分页页码。
- Query：
  - `page`
  - `pageSize`
  - `filterPassedVote`
  - `filter`
  - `_`
- 本轮观察：
  - 点击第 2 页：`page=2&pageSize=10`。
  - 点击第 3 页：`page=3&pageSize=10`。
  - 每次翻页都会同步刷新 `summary` 和 `board`。
  - `board` 使用相同 `filterPassedVote` 与 `filter`，不带 `page/pageSize`。

### 2. 每页条数

- Method：`GET`
- Path：`/api/v1/label/center/subTask/{subTaskId}/data`
- 触发：详情页分页器 `10 条/页` 下拉切换。
- 可见选项：
  - `1 条/页`
  - `2 条/页`
  - `3 条/页`
  - `4 条/页`
  - `5 条/页`
  - `10 条/页`
  - `20 条/页`
  - `30 条/页`
  - `40 条/页`
  - `50 条/页`
- 本轮观察：
  - 在第 3 页切换到 `20 条/页` 后，请求为 `page=3&pageSize=20`。
  - 平台没有自动重置到第 1 页，而是保留当前页码。
  - 页面题号随 `page/pageSize` 变化，例如第 3 页、20 条/页从第 41 题开始。
  - 切换后同步刷新 `summary` 和 `board`。
  - 标注详情页从 `10 条/页` 切到 `50 条/页` 后，请求为 `page=1&pageSize=50`，页面一次渲染 50 个音频题卡。

### 3. 筛选条件

- 入口：详情页顶部 `筛选`。
- 筛选请求仍使用：
  - `GET /api/v1/label/center/subTask/{subTaskId}/data`
  - `GET /api/v1/label/center/subTask/{subTaskId}/board`
- Query：
  - `filterPassedVote`
  - `filter`
  - `_`
- 默认 `filter` 字段结构：

```json
{
  "questions": [],
  "dataStatus": "ALL",
  "questionsQueryConditions": "AND"
}
```

- 回答区选择题筛选实测结构：

```json
{
  "questions": [
    {
      "title": "是否有效",
      "value": "有效"
    }
  ],
  "dataStatus": "ALL",
  "questionsQueryConditions": "AND"
}
```

- 本轮观察：
  - 筛选面板 `按回答区数据(仅支持选择题)` 中可新增条件。
  - `条件关系` 可见 `且(AND)` 与 `或(OR)`。
  - 点击 `确定` 后 `data` 和 `board` 带同一份筛选条件。
  - `或(OR)` 会写入 `questionsQueryConditions=OR`。
  - 内容区关键词会写入 `filter.content`。
  - 任务状态 `未完成` 会写入 `dataStatus=UNFINISHED`。
  - 任务状态下拉可见 `全部`、`已完成`、`未完成`。

- 内容区关键词 + 未完成 + OR 实测结构：

```json
{
  "questions": [],
  "dataStatus": "UNFINISHED",
  "questionsQueryConditions": "OR",
  "content": "<KEYWORD>"
}
```

## 音频请求

- Method：`GET`
- Path：`/oss-proxy-labelx/.../*.wav`
- Response status：常见 `206`
- 签名 query 参数名：
  - `Expires`
  - `OSSAccessKeyId`
  - `Signature`
- 安全要求：
  - 不记录完整 URL。
  - 不记录完整 query。
  - 可记录 hostname、pathname 后缀和是否签名。

## 供应商字段结论

本轮在以下响应中均未发现 `supplier`、`vendor`、`company`、`provider`、`供应商`、`厂商`、`公司` 字段：

- `tasks`
- `subTasks`
- `tasks/process`
- `subTask/{subTaskId}/data`
- `summary`
- `board`
- `getLabelTaskInfo`

补采 `missionType=label` 标注详情页的初始化、保存、提交和自动领取链路时，仍未发现上述供应商字段。

当前可用供应商来源只能从任务名推断，例如：

- `棋燊-...`
- `希尔贝壳-...`

后续实现建议的供应商优先级：

1. `payload.supplier` / `payload.vendor`
2. `csvPatch["供应商"]`
3. `taskName` / `name` 前缀规则推断
4. `未识别供应商`

## 待补采

- 转写详情页提交失败、必填校验阻断和保存失败响应。
- 扩展加载并启用后的转写工具栏 DOM 与按钮事件。
- 快判页面在当前项目中的最新实时样例，用于对比历史快判资料是否仍完全适用。
