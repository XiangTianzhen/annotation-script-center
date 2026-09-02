# 标注存储与暂存

## 请求标识 / 目的

平台原生保存链路依次涉及：

1. `GET /web-platform-api/storage/auth`：申请对象存储临时权限。
2. `GET /web-platform-api/storage/getAccessSigned`：取得当前对象访问所需的短时授权信息。
3. 对象存储上传：写入 annotation JSON。
4. `/web-task-alone-api/task/piece/execute/tempsave`：登记本次临时保存结果。

本契约只描述调用职责，不记录存储主机、对象键、临时凭证或签名参数。

## 页面入口 / 触发动作

- 页面：`/workbench/piece/mark.html?taskId={taskId}&executeClass=TAG_PIECE`
- 触发：平台编辑器内容变化后的原生自动暂存，或页面自身保存流程。

## 请求摘要

- 权限和短时授权请求由平台原生代码发起。
- annotation JSON 由内层编辑器生成并上传。
- 上传成功后，平台调用暂存接口关联当前 `taskId`、`dataId` 与标注结果。
- 后续扩展不截取、转发或持久化临时存储凭证。

## 请求体摘要

annotation JSON 的核心分段结构为 `markResult.paragraphs[]`：

| 字段 | 职责 |
|---|---|
| `paragraphID` | 段落稳定标识，用于 DOM 行与结果对齐 |
| `hdTimeStart` | 分段开始时间 |
| `hdTimeEnd` | 分段结束时间 |
| `content` | 当前段转写文本 |
| `formResult.isEffective` | 当前段有效性，由用户显式设置 |
| `generateMode` | 段落生成来源或模式，写回时保留平台语义 |

暂存请求还需携带当前任务和数据上下文；完整字段集合尚未以可安全固化的样例确认，因此不作推断。

## 响应摘要

各阶段成功后，平台继续维护当前编辑状态。对象存储响应和暂存响应只用于确认平台原生流程是否完成，不保存完整响应内容。

## 关键字段

- `markResult.paragraphs[]` 是后续分段识别、批量识别与整音频分段建议的主要数据契约。
- `paragraphID`、时间边界和当前路由共同构成写回前的对题条件。
- `content` 只有在用户预览并确认后才允许通过页面事件写入。
- `formResult.isEffective` 不由识别结果自动决定或改写。

## 前端接入建议

- 通过 DOM 和平台事件修改分段或文本，让平台原生逻辑生成并自动暂存 annotation JSON。
- 写入前重新核对路由、`dataId`、`paragraphID` 和时间边界；任一不一致即停止。
- 不直接调用对象存储或暂存接口，不读取或缓存平台临时权限。

## 风险 / 未确认项

- 暂存触发节流、失败重试和最终一致性行为尚未确认。
- annotation JSON 的非核心字段可能随模板变化，后续不得整对象覆盖。
- 完整暂存请求体和响应结构需通过脱敏 HAR 补充。
- 音频真实请求与本链路是否共享存储授权尚未确认。
