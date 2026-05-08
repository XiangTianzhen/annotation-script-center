# Magic Data ANNOTATOR 资料

## 目录用途

本目录是 Magic Data ANNOTATOR 的平台资源入口，记录页面结构、网络请求脱敏摘要、安全边界和后续开发计划。这里是 Chrome / Edge 共用资料，不放扩展运行时代码。

对应运行时代码后续应统一接入：

```text
extension/sites/magic-data/annotator/
```

## 当前阶段

- 阶段：前置采集（只读）
- 采集日期：2026-05-08
- 采集方式：`chrome_devtools` 真实页面导航 + Network 脱敏记录 + 前端 bundle 关键词校验
- 本轮未执行：领取、保存、提交、审核通过、审核驳回、退回、批量流转

## 子目录

- `page-structure/`：页面结构记录（首页、标注任务、标注详情、标注单条、审核任务、审核详情、审核单条）。
- `network/`：按页面拆分的网络请求脱敏摘要与敏感接口清单。

## 根目录文档

- `page-structure.md`：页面结构索引（指向 `page-structure/`）。
- `network.md`：网络采集索引（指向 `network/`）。
- `safety-boundary.md`：自动化安全边界和禁止动作。
- `development-plan.md`：后续接入策略与任务拆分。

## 当前已采集页面

- `#/welcome`
- `#/mark/list`
- `#/mark/details?...`
- `#/asrmark?taskItemId=...&formType=1&userId=...`
- `#/checkTask`
- `#/checkdata/taskDetail?...`
- `#/asrmarkCheck?formType=1&id=...`

## 已确认关键事实

- 平台为 SPA，主根节点是 `#app`。
- 列表和详情核心链路已覆盖：
  - 标注：`userTask/getUserTaskList`、`userTaskDetail/getUserTaskDetailList`、`annotateTask/annotateDetailInfo`、`annotateTask/annotateHeaderInfo`
  - 审核：`sampling/samplingRecordPage`、`sampling/asrPreview`、`sampling/taskInfo`、`sampling/projectInfo`
- 音频为 OSS 带签名 URL，文档仅记录 `hostname/path 模式/签名参数 key`。

## 维护规则

- 新增 DOM/接口信息优先更新本目录。
- 只允许写入脱敏摘要，不允许写入 token/cookie/完整签名 URL/真实敏感文本。
- 若后续新增脚本行为影响边界，必须同步更新 `safety-boundary.md` 与根目录 `log.md`。
