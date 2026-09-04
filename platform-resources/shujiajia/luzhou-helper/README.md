# 数加加泸州话识别助手

## 当前能力

- 脚本 ID：`shujiajiaLuzhouHelper`，首次安装和重置设置均默认关闭。
- 运行时：`extension/sites/shujiajia/luzhou-helper/`。
- 仅当当前段落数为 `0` 时，通过受限可信 `Shift + 拖拽` 把 Peaks.js 整音频划为一个段落；已有段落时立即拒绝。
- 通过一次 `qwen3.5-omni-flash` 音频调用直接返回泸州方言文本，不加载柳州话词表，也不再调用整理模型。
- 识别只校验当前条目身份与同题音频，零段、单段和多段均可直接执行。
- 默认自动填入仅写入唯一可编辑段落；人工填入仅写入唯一 `.el-table__row.current-row` 内的唯一可编辑 `.transfer-input`。
- 两个默认关闭的开关可控制“进入新条目后自动划整段”和“助手画段成功后自动识别”；首次载入条目不自动处理。

## 页面交互

- 左栏控制区优先追加到 `.tabs-container`，提供整音频划一段、识别整段和运行状态；零段状态没有该节点时回退到 `.form-tabs` 分隔线后方。
- 识别结果区优先追加到 `.transfer`；零段状态没有该节点时，在 `.operate-container` 内、`.paragraph` 前使用扩展专属左侧占位区。结果区始终显示，初始为“尚未识别”，不提供展开或关闭按钮。
- 平台生成正式容器或发生局部重渲染时，助手自动迁移或恢复自有节点并清理空占位区，不移动、覆盖或复制原生节点。
- 五项可配置快捷键：整音频划一段、识别整段、填入识别结果、重叠说话前 `[OVERLAP/]`、重叠说话后 `[/OVERLAP]`。播放、有效性、保存和提交继续使用平台原生操作。
- 五项快捷键默认均为空；转写输入框内只放行两个 OVERLAP 动作，共享 Options 组件拒绝冲突键位。
- OVERLAP 动作精确点击 `Category1（多选）` 分组内唯一对应的原生 `.symbol-item`；歧义、隐藏、禁用或缺失时拒绝，不直接拼接文本。
- “填入识别结果”快捷键继续调用与面板按钮相同的人工写入动作，不自动暂存或提交。
- 面板不展示提交按钮。

## 写操作边界

- 画段完成后通过段落表格和当前“区域”文字确认只有一个段落，并按两个波形像素容差核对首尾边界；超出容差时保留段落、标记待暂存并提示人工检查，不自动触发 Delete。
- 切题自动划段以 `taskId:dataId` 为上下文，只在 iframe 波形就绪后执行；同一条目在当前页面会话最多尝试一次，已有段落或验收失败时停止。
- 助手按钮或切题自动画段成功后可登记同题自动识别；音频晚到时等待，切题、音频失败或关闭开关时取消。
- 所有识别入口成功后仅在当前恰好一个可编辑段落时默认填入；零段或多段提示“当前段数不是 1，未自动填入”。关闭自动填入时只更新常驻结果区。填入失败保留识别结果，不自动暂存或提交。
- 同一条目只允许一个识别请求运行；重复触发不新增 AI 调用，自动填入前再次核对最新开关。
- 填入和画段会在外层页与 iframe 间同步“待暂存”状态；保存、有效性和提交均交由用户使用平台原生入口完成。
- 助手不拦截用户直接点击平台原生保存或提交按钮。
- 不直接修改 annotation JSON，不直接调用平台暂存或提交接口。

## 后端接口

- `GET /api/shujiajia/luzhou-helper/ai/recommend/health`
- `GET /api/shujiajia/luzhou-helper/ai/recommend/defaults`
- `POST /api/shujiajia/luzhou-helper/ai/recommend`

POST 只接受临时 `audioDataUrl`、requestId、AI 使用人和 `aiStages.listen` 安全模型配置。模型请求超时上限固定为 `60000ms`。响应以 `dialectText` 为规范结果字段，同时返回内容相同的 `refinedText` 兼容别名；`usage`、`cost` 和 `timing` 只统计单阶段调用。旧整理模型与 Prompt 仍保留在本地存储中，但 Options 不显示、请求不发送、后端不使用。

## 音频边界

`taskId` 来自 execute 请求查询参数，`dataId` 与音频地址分别来自响应的 `data.detail.dataId`、`data.detail.fileFolder`。只接受 `https://storage.shujiajia.com/` 的完整 HTTPS 地址。页面初始化响应可在脚本设置加载期间暂存为 MAIN world 最小快照，确认启用后立即消费；禁用或切题时清除，不主动重放 execute 请求。页面世界以不携带 Cookie、无 Referer 的方式读取音频，兼容已有的被动音频响应捕获；字节仅保存在页面内存和单次 AI 请求体中，并绑定当前 `taskId + dataId`。原始地址不跨世界、不持久化、不进入日志或资料文件，失败状态只传递上下文与脱敏错误码。

## 资料入口

- [分段标注页结构](../page-structure/01-piece-mark.md)
- [Network 索引](../network/README.md)
