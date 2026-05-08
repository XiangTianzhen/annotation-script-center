# Magic Data ANNOTATOR 安全边界

## 说明

- 本文用于约束后续脚本接入时的自动化边界。
- 原则：默认只读、默认人工确认、默认不写操作。

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
