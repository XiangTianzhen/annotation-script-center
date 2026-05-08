# 07 审核单条页（asrmarkCheck）

## URL / 路由

- URL 示例：`https://work.magicdatatech.com/#/asrmarkCheck?formType=1&id=...`
- 路由：`#/asrmarkCheck`（已确认）

## query 参数（已确认）

- `formType`
- `id`（采样记录 ID）

## 主容器与组件

- `#app`（已确认）
- `topic_content` / `topic_top` / `topic_select` / `topic_top-title`（已确认：bundle片段）
- `wavesurfer`（已确认：bundle关键词）
- `textarea`（已确认：bundle关键词）

## 主要区域

- 顶部审核信息区（来自 `sampling/projectInfo`）
- 样本预览区（来自 `sampling/asrPreview`）
- 单条审核数据区（来自 `sampling/taskInfo`）
- 音频播放区（OSS 音频加载）
- 审核动作区（通过/驳回/提交等，selector 待补采）

## 关键按钮

- 文案存在：`保存`、`提交`、`通过`、`驳回`、`上一条`、`下一条`（已确认）
- 精确 selector（待补采）

## 页面状态变化

- 初始化阶段会加载：
  - `sampling/asrPreview/{id}`
  - `sampling/getLabelConf?sampRecordId=...`
  - `sampling/taskInfo/{id}`
  - `sampling/projectInfo/{id}`
  - `mtBatchUserCfg/{batchId}`
  - `annotateTask/historySubmitter/{taskItemId}`

## 风险提示

- 审核提交/通过/驳回属于高敏动作，默认禁止自动触发。
