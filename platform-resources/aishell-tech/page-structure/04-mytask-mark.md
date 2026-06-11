# 04-数据标注 DOM 结构

## 页面标识 / 路由 / 前置条件

- 路由：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`
- 主容器：`.mark-container`
- 框架：Vue 2 + Element UI + Wavesurfer.js (canvas)

## 页面总览

- 当前页主要记录稳定区域、可见文案和角色边界。

## DOM 树 / 区域结构

- 当前文件未补充完整 DOM 树；后续仅记录稳定区域结构。

## 稳定选择器表

| 目标 | 选择器 |
|------|--------|
| 文件列表容器 | `.list` |
| 当前选中条目 | `.list-item-selected button.el-button--text` |
| 已完成条目 | `.list-item-finshed` |
| 条目文件名 | `button > span > span`（如 "1: ...59666546789.wav"） |
| 进度 | `.el-card__header span` 含 ` / 86` |
| 上一条 | `button` 含 "上一条" |
| 下一条 | `button` 含 "下一条" |
| 返回 | `a.el-link` 含 "返回" |
| 播放/暂停 | `button.el-button--primary` |
| 标注输入框 | `.mark-area input.el-input__inner[type="text"]` |
| 原始文本 | `.mark-area label`="原始文本" 相邻值 |
| 保存按钮 | `.mark-area button` 含 "保存" |
| 质检意见 | `.check-area textarea.el-textarea__inner` |
| 文件名 | `.fileName-line span`（第一个） |

## 动态区域 / 重渲染风险

- 当前页存在状态切换和局部重绘风险；避免依赖瞬时 class 和顺序定位。

## 可挂载点建议

- 如需挂载扩展 UI，优先选择宿主页面外层安全区域，不覆盖原生写操作控件。

## 页面区域与接口映射

- 当前文件未补充更细的接口映射；新增时只记录稳定区域与请求族对应关系。

## 写操作边界 / 未确认项

- 写操作默认维持人工确认边界；未确认链路不得按文案直接推断。
