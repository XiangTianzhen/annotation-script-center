# 04 标注单条页（asrmark）

## URL / 路由

- URL 示例：`https://work.magicdatatech.com/#/asrmark?taskItemId=...&formType=1&userId=...`
- 路由：`#/asrmark`（已确认）

## query 参数（已确认）

- `taskItemId`
- `formType`
- `userId`

## 主容器与组件

- `#app`（已确认）
- `wavesurfer`（已确认：bundle 关键词）
- `textarea`（已确认：bundle 关键词）
- `mark_info`（已确认：bundle 关键词）

## 主要区域

- 头部信息区（任务/批次/包状态，来自 `annotateHeaderInfo`）
- 音频区域（波形与播放控制，待补采精确 selector）
- 文本标注区（`textarea` + `mark_info`）
- 动作区（保存/提交/上一条/下一条，文案已确认）

## 关键按钮

- 文案存在：`保存`、`提交`、`上一条`、`下一条`（已确认）
- 精确 selector（待补采）

## 数据加载特征

- `annotateTask/getLabelConf`
- `annotateTask/annotateDetailInfo/{taskItemId}`
- `annotateTask/annotateHeaderInfo/{taskItemId}`
- OSS 音频 media 请求（带签名参数）

## 风险提示

- 保存/提交属于敏感动作，本轮未触发。
