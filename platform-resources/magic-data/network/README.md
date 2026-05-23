# Magic Data 网络采集索引

## 目录定位

本目录是 Magic Data ANNOTATOR 网络请求资料的主维护位置。后续新增或修正网络采集资料时，应优先更新本目录。

## 当前阶段覆盖

- 首页初始化请求
- 标注任务列表请求
- 标注任务详情请求
- 标注单条页配置/详情/头部请求
- 审核任务列表请求
- 审核任务详情与抽检记录分页请求
- 审核单条页预览/详情/配置请求
- 音频 media 请求（仅脱敏模式）
- 敏感写操作接口清单（来源：bundle 只读识别，未触发）

## 文件列表

- `01-welcome.md`
- `02-mark-list.md`
- `03-mark-details.md`
- `04-asrmark.md`
- `05-check-task.md`
- `06-check-task-detail.md`
- `07-asrmark-check.md`
- `08-sensitive-operations.md`
- `09-safety-boundary-rules.md`
- `pending-capture.md`

## 脱敏规则

- 不记录 token/cookie/authorization/session。
- 不记录完整签名音频 URL。
- 不记录真实员工个人信息与客户敏感全文。
- 请求/响应示例只保留字段结构和脱敏样例。

## annotateDetailInfo 结构补充（2026-05-23）

- `POST /api/management-service/annotateTask/annotateDetailInfo/{taskItemId}` 返回结构需按嵌套读取：
  - `payload.data.taskItemId`
  - `payload.data.data.path`
  - `payload.data.data.data[0].mark_info`
  - `payload.data.data.base_speak`
  - `payload.data.data.length_time`
  - `payload.data.data.sentence_valid_time`
- 说话人映射规则：优先用 `mark_info[].speak_people -> base_speak[].speak_id` 解析性别和年龄。
