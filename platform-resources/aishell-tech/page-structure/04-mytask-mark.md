# 04-数据标注 DOM 结构

- 路由：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`
- 主容器：`.mark-container`
- 框架：Vue 2 + Element UI + Wavesurfer.js (canvas)

## 整体布局

```
.mark-container
└── .el-card
    └── el-row (flex)
        ├── el-col (左 30%)             ← 文件列表
        └── el-col (右 70%)             ← 主工作区
            ├── .fileName-line           ← 文件名行
            ├── timeline + waveform      ← 音频播放器
            ├── .mark-area               ← 标注表单
            └── .check-area (display:none) ← 质检表单
```

## 左侧：文件列表

- 容器：`.list` → `.el-card`
- 头部：
  - 返回按钮：`i.el-icon-back` + `a.el-link`（"返回"）
  - 进度：`<span> N / 86 </span>`（已完成数 / 总数）
- 列表项状态类：
  - `list-item`：未选中普通状态
  - `list-item-selected`：当前选中
  - `list-item-finshed`：已完成标注（保存后自动标）
- 条目按钮：`button.el-button--text.el-button--small` → `<span>` 内文字格式 `序号: ...文件名截断.wav`
- 翻页按钮：
  - 上一条：`button` 含 `.i-icon-left` + "上一条"
  - 下一条：`button` 含 `.i-icon-right` + "下一条"

### 保存后行为

保存 `SaveShortMark` 成功后 → 条目自动加上 `list-item-finshed` 类 → 自动跳到下一个条目。

## 右侧上部：文件名行

- 容器：`.fileName-line`
- 序号 + 文件名 `<span>`
- 操作按钮（右侧）：
  - `button.el-button--text` "删除音频标点"
  - `button.el-button--text` "查看历史标注记录"（弹窗 `.el-dialog__title`="标注历史记录"）

## 右侧中部：音频播放器

- 容器：`.line.el-row`
- 时间轴：`#timeline` → `<canvas>`
- 波形图：`#waveform` → `<wave>` → `<canvas>`
- 播放按钮：`button.el-button--primary`（播放时为 `.i-icon-play` + "播放"，播放中为 `.i-icon-pause-one` + "暂停"）
- 控制栏 `.controls-bar`：
  - 引擎：`.backend-select`（自动/WebAudio/MediaElement）
  - 倍速：`.speed-select`（0.25x~8x）
  - 缩放：`.zoom-select`（1x~5x）
  - 音量：`.volume-slider`（el-slider 0~1）

## 右侧下部：标注表单

- 容器：`.mark-area`
- 有效音频按钮：`button.el-button--success` "有效音频"
- 表单 `form.el-form`：
  - 标注时长：`label`="标注时长"（`-` 或已有时长）
  - 原始文本：`label`="原始文本"（平台参考文本）
  - **文本输入**：`input.el-input__inner[type="text"]`（`is-required`）
  - **保存按钮**：`button.el-button--primary` 含文字"保存"

## 右侧下部（隐藏）：质检表单

- 容器：`.check-area[style*="display: none"]`（默认隐藏，仅质检员可见）
- 标题：`h3` "待质检"
- 质检意见：`textarea.el-textarea__inner`
- 保存按钮：`button.el-button--primary` "保存"

## 关键选择器速查

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

## 数据同步原则

填入文本时必须触发原生事件：
```javascript
el.value = text;
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```
