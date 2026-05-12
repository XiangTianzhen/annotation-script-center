# Magic Data ANNOTATOR 安全边界

## 说明

- 本文用于约束后续脚本接入时的自动化边界。
- 原则：默认只读、默认人工确认、默认不写操作。
- 2026-05 新增本地 AI 复核调试后端后，仍保持“只给建议，不触发平台写操作”。

## 分类总表

### A. 允许脚本观察的行为（可自动）

- 页面路由识别：`#/welcome`、`#/mark/list`、`#/mark/details`、`#/asrmark`、`#/checkTask`、`#/checkdata/taskDetail`、`#/asrmarkCheck`
- 页面加载请求观察（GET/POST 只读查询）
- 列表与详情查询请求脱敏记录
- 音频资源请求来源识别（仅 hostname/path 模式/签名参数 key）
- 文本区与播放器区域的存在性识别（不写入）

### B. 允许“用户主动触发、脚本辅助执行”的行为

- 用户主动点击后：定位当前条目、定位文本区、执行只读复制类操作
- 用户主动点击后：执行播放/暂停等非提交型前端动作（不变更业务状态）
- 用户主动点击后：导出脱敏调试信息（不含 token/cookie/完整音频URL）

### C. 必须每次询问用户后才能触发的行为

- 调用任何可能写入平台状态的接口前
- 涉及任务状态迁移动作：开始、领取、退回、通过、驳回
- 涉及批量动作：批量提交、批量流转、批量审核
- 涉及人员归属变更、分配变更、删除

### D. 第一版禁止实现的行为

- 自动领取任务
- 自动开始任务（会改变状态时）
- 自动保存标注
- 自动提交标注
- 自动审核通过
- 自动审核驳回 / 不合格
- 自动退回
- 自动批量提交 / 批量流转
- 自动删除
- 自动修改任务归属 / 人员分配
- 自动上传文件
- 自动下载客户原始数据文件

## 敏感接口识别（只读识别，未触发）

以下接口来自前端 bundle 关键字检索与已观测链路归纳，当前轮均未主动触发：

- 标注侧
  - `/management-service/annotateTask/save`
  - `/management-service/annotateTask/submit`
  - `/management-service/annotateTask/pending`
  - `/management-service/annotateTask/upOrDown`
  - `/management-service/annotateTask/goBack`
- 抽检/审核侧
  - `/management-service/sampling/save`
  - `/management-service/sampling/submit`
  - `/management-service/checkMark/save`
  - `/management-service/checkMark/wholeQua/...`
  - `/management-service/checkMark/wholeBack`
- 元素级写操作
  - `/management-service/taskElement/annoSubmit`
  - `/management-service/taskElement/checkSubmit`
  - `/management-service/taskElement/save`
  - `/management-service/taskElement/saveCheck`
  - `/management-service/taskElement/del`

## 数据与隐私边界

- 不保存 cookie、authorization、access token、refresh token、session id。
- 不保存完整签名音频 URL。
- 音频地址仅允许记录：hostname、pathname 模式、签名参数 key 是否存在。
- 不记录真实员工个人信息。
- 不记录客户全文数据。
- 不记录账号密码。

## AI 辅助约束

- 所有 AI 建议仅做辅助提示。
- 最终保存/提交/审核动作必须由用户主动确认。
- AI 不得绕过平台限制或权限控制。

## 调试后端补充约束

- 接口仅限：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `POST /api/magic-data/annotator/ai/review-current`
- 调试后端不得调用平台 save/submit/check 等写接口。
- 日志仅允许记录脱敏摘要字段（requestId、耗时、模型、判定、hostname、文本长度/哈希）。
- 日志禁止记录完整 `audioUrl`、`Signature`、`OSSAccessKeyId`、cookie、authorization、token、API Key、完整文本原文。

## 前端页面内质检区补充约束（asrmark）

- 页面内结果区按钮允许：
  - AI 质检当前条
  - 复制 AI 质检摘要
  - 手动填入第一行/第二行
  - 忽略结果
- 快捷键允许（默认未设置，配置入口在 options）：
  - AI 质检当前条、复制摘要、填入
  - 保存、提交
  - 性别/年龄选择
  - 以上动作仅允许“用户主动按下已配置快捷键”触发。
- 快捷键动作后会执行焦点恢复（blur + sentinel + body focus），确保连续按键可触发；该机制不触发自动保存/自动提交。
- 填入动作仅触发目标输入框 `input/change`，不得自动点击保存/提交/挂起/清除/下一条。
- 不在页面或控制台展示完整签名音频 URL；页面仅显示音频 hostname。
- 不把完整签名音频 URL 写入 `chrome.storage`、`localStorage` 或持久日志。
- 页面内质检区优先挂载到右侧 `.audio_list`（句子列表）区域，不自动扩展主业务区高度。
- 页面内质检区允许用户手动拖拽高度并持久化到扩展存储；仅影响 AI 卡片本身，不修改平台原生“句子列表”容器结构。
- `#/asrmarkCheck` 当前只允许提示“暂未接入填入”，不得自动操作审核页。
- AI 质检完成后不得自动触发保存/提交/审核/领取。
- `enableThinking` 仅作为模型调用参数，失败时后端可降级重试；不得因此引入平台写操作。
