# 数加加泸州话整段识别助手

## 当前能力

- 脚本 ID：`shujiajiaLuzhouHelper`，首次安装和重置设置均默认关闭。
- 运行时：`extension/sites/shujiajia/luzhou-helper/`。
- 仅当当前段落数为 `0` 时，通过页面真实画段工具把整音频划为一个段落；已有段落时立即拒绝。
- 通过 `qwen3.5-omni-flash` 原始听写和 `qwen3.5-plus` 泸州话整理两阶段返回人工建议，不加载柳州话词表。
- 用户确认后才触发原生 `input/change/blur` 写入唯一转写框。

## 页面交互

- 左栏按钮：整音频划一段、识别整段、展开识别结果。
- 横向抽屉：原始听写、泸州话整理、分阶段 Token、总 Token、人民币预估和“填入转写”。
- 八项可配置快捷键：播放/暂停、整音频划一段、识别整段、填入识别结果、当前段有效、当前段无效、暂存、提交进入下一条。
- 快捷键默认全部为空，编辑框内不响应；共享 Options 组件拒绝冲突键位。
- 面板不展示提交按钮。

## 写操作边界

- 画段完成后必须确认只有一个段落，并按波形像素宽度核对首尾边界；验证失败时尝试删除本次新建段落，无法恢复则停止并提示人工处理。
- 有效或无效只由用户显式触发，且只在 iframe 当前段落区域查找，不能命中外层整条“无效”。
- 填入、画段和有效性修改会在外层页与 iframe 间同步同一份“待暂存”版本。暂存快捷键只点击页面唯一可用的原生暂存按钮；仅当响应业务成功且 `taskId + dataId`、待暂存版本均匹配时清除状态。
- 扩展产生的修改尚未成功暂存时，提交快捷键拒绝执行；用户直接点击平台原生提交按钮不被拦截。
- 不直接修改 annotation JSON，不直接调用平台暂存或提交接口。

## 后端接口

- `GET /api/shujiajia/luzhou-helper/ai/recommend/health`
- `GET /api/shujiajia/luzhou-helper/ai/recommend/defaults`
- `POST /api/shujiajia/luzhou-helper/ai/recommend`

POST 只接受临时 `audioDataUrl`、requestId、AI 使用人和安全的两阶段模型配置。模型请求超时上限固定为 `60000ms`。响应返回 `listenText`、`refinedText`、分阶段 `usage`、总费用估算和脱敏错误摘要。

## 音频边界

音频字节仅保存在页面内存和单次 AI 请求体中，并绑定当前 `taskId + dataId`；切题立即清空，不写入 storage、日志或资料文件。页面观察器只在脚本启用后采集。当前未固化真实音频请求 pathname；捕获失败时必须刷新并播放后重试，仍失败再补充脱敏 HAR 或安全测试音频。

## 资料入口

- [分段标注页结构](../page-structure/01-piece-mark.md)
- [Network 索引](../network/README.md)
