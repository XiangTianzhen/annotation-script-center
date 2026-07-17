# 杭州话脚本运行时（Magic Data）

本目录是 Magic Data `#/asrmark` 与 `#/asrmarkCheck` 页面下的杭州话前端运行时。

## 脚本身份

- 脚本 ID：`magicDataHangzhouAssistant`
- 配置路径：`platforms.magicData.scripts.hangzhouHelper`
- 活动脚本：`platforms.magicData.activeScriptId`
- 当前版本：`1.1.0`
- 后端命名空间：`/api/magic-data/hangzhou-helper/*`

## 文件职责

| 文件 | 职责 |
|---|---|
| `content.js` | 路由识别、设置读取、模块编排、挂载与清理 |
| `ai-review-client.js` | defaults、AI 质检请求、错误归一化和超时 |
| `assistant-panel.js` | 状态、建议、原始输出、填入和临时全自动 UI |
| `shortcuts-runtime.js` | 录制键位匹配与 22 项页面动作 |

平台识别和当前条采集复用 `../shared/`。

## 页面能力

- 当前条 AI 质检。
- 听音文本、比较结果和说话人属性建议。
- “音频是否是纯方言”判断与展示。
- 行内填入、全部填入 AI 推荐。
- AI 原始输出展开与复制。
- 当前页临时全自动控制。
- 22 项可录制快捷键。

## AI 设置

设置页从 `/api/magic-data/hangzhou-helper/ai/defaults` 读取后端默认值，失败时回退本地常量。

模型方案：

- `two_stage`：听音模型按真实读音写方言文本，普通话整理模型再按完整语义输出通顺普通话。
- `omni_single`：单模型一次调用，同时返回相互独立的方言文本和普通话文本。

默认配置：

- `listenModel=qwen3.5-omni-flash`
- `compareModel=qwen3.5-flash`
- `enableThinking=false`
- 请求超时 `60000ms`

单双模型选择会动态控制阶段卡片。听音、普通话整理、单模型分别保存模型、Prompt、生成参数、`对照字词表` 开关和字词表提示词；开关默认开启，清空 override 时回退后端阶段默认值。旧 `recognitionStrategy` 可接收但会被忽略。

## 后端接口

- `GET /api/magic-data/hangzhou-helper/ai/review-current/health`
- `GET /api/magic-data/hangzhou-helper/ai/defaults`
- `POST /api/magic-data/hangzhou-helper/ai/review-current`
- `GET /api/magic-data/hangzhou-helper/ai/review-current/logs/summary`

AI 请求失败时面板显示可读错误，不部分填入结果。defaults 失败不会阻止设置编辑和保存。

## 词表

后端读取 `platform-resources/magic-data/hangzhou-helper/backend/lexicon/hangzhou-lexicon.json`。词表缺失或结构不合法时返回 `lexicon.status=missing`，质检继续按无词表模式运行。

词表内容由用户维护；运行时代码只负责加载、校验、筛选最多 `30` 条相关词条、序列化和降级，不执行普通话转方言、最终用字归一化或自动替换。

## 写入与自动化边界

- 普通质检只提供建议，由用户主动点击填入。
- Options 保存不触发业务页写入。
- 不自动领取、自动审核或跨页流转。
- 当前页临时全自动必须由用户显式启动，只允许作用于 `#/asrmark`。
- 临时全自动通过页面真实按钮推进，并提供停止入口和失败统计。
- 页面禁用、快照变化或目标字段缺失时停止当前写入，不绕过平台限制。

## 快捷键

快捷键默认全部为空，只执行用户在 Options 明确保存的键位。运行时支持 AI 质检、填入、面板展开、保存/提交类页面动作以及年龄/性别等字段动作；提交类动作不加入顶部工具栏。

## 真实浏览器验收

1. 启动统一后端并重新加载 unpacked extension。
2. 在 `#/asrmark` 和 `#/asrmarkCheck` 分别确认只挂载一次。
3. 确认 defaults 成功与断开后端回退状态。
4. 分别验证双模型和单模型字段显隐。
5. 触发一次 AI 质检，检查建议、原始输出、Token 和人民币估算。
6. 人工点击填入，确认只修改当前条目标字段。
7. 验证快捷键、当前页临时全自动的启动与停止。
8. 确认没有未授权的自动保存、审核、领取或跨页流转。
