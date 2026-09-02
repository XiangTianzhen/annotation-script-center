# 数加加泸州话整段识别助手

## 当前能力

- 脚本 ID：`shujiajiaLuzhouHelper`，首次安装和重置设置均默认关闭。
- 运行时：`extension/sites/shujiajia/luzhou-helper/`。
- 仅当当前段落数为 `0` 时，通过受限可信 `Shift + 拖拽` 把 Peaks.js 整音频划为一个段落；已有段落时立即拒绝。
- 通过 `qwen3.5-omni-flash` 原始听写和 `qwen3.5-plus` 泸州话整理两阶段返回人工建议，不加载柳州话词表。
- 用户确认后才触发原生 `input/change/blur` 写入唯一转写框。

## 页面交互

- 左栏内嵌控制区：追加到 `.tabs-container` 的有效性区域下方，提供整音频划一段、识别整段、查看识别结果和运行状态。
- 转写区下方的可折叠结果区：追加到 `.transfer`，展示原始听写、泸州话整理、分阶段 Token、总 Token、人民币预估和“填入转写”；识别完成后自动展开，切题后收起。
- 平台局部重渲染时重新寻找两个目标容器并恢复助手节点，不移动、覆盖或复制原生节点。
- 两项可配置快捷键：识别整段、填入识别结果。平台已有的播放、画段、有效性、保存和提交快捷操作不重复提供输入项。
- 两项快捷键默认均为空，编辑框内不响应；共享 Options 组件拒绝冲突键位。
- 面板不展示提交按钮。

## 写操作边界

- 画段完成后通过段落表格和当前“区域”文字确认只有一个段落，并按两个波形像素容差核对首尾边界；超出容差时保留段落、标记待暂存并提示人工检查，不自动触发 Delete。
- 填入和画段会在外层页与 iframe 间同步“待暂存”状态；保存、有效性和提交均交由用户使用平台原生入口完成。
- 助手不拦截用户直接点击平台原生保存或提交按钮。
- 不直接修改 annotation JSON，不直接调用平台暂存或提交接口。

## 后端接口

- `GET /api/shujiajia/luzhou-helper/ai/recommend/health`
- `GET /api/shujiajia/luzhou-helper/ai/recommend/defaults`
- `POST /api/shujiajia/luzhou-helper/ai/recommend`

POST 只接受临时 `audioDataUrl`、requestId、AI 使用人和安全的两阶段模型配置。模型请求超时上限固定为 `60000ms`。响应返回 `listenText`、`refinedText`、分阶段 `usage`、总费用估算和脱敏错误摘要。

## 音频边界

音频地址来自当前 execute 响应的 `data.detail.fileFolder`，只接受 `https://storage.shujiajia.com/` 的完整 HTTPS 地址。页面初始化响应可在脚本设置加载期间暂存为 MAIN world 最小快照，确认启用后立即消费；禁用或切题时清除，不主动重放 execute 请求。页面世界以不携带 Cookie、无 Referer 的方式读取音频，兼容已有的被动音频响应捕获；字节仅保存在页面内存和单次 AI 请求体中，并绑定当前 `taskId + dataId`。原始地址不跨世界、不持久化、不进入日志或资料文件。

## 资料入口

- [分段标注页结构](../page-structure/01-piece-mark.md)
- [Network 索引](../network/README.md)
