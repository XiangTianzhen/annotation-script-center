# ByteDance AIDP 台州话脚本后端

## 目录定位

- 目录：`platform-resources/bytedance-aidp/taizhou-helper/backend`
- 类型：脚本级统一后端路由
- 当前承载两组能力：
  - 分段建议预览
  - 台州话普通话翻译 AI 推荐

## 当前文件

| 文件 | 职责 |
| --- | --- |
| `index.js` | 注册台州话脚本后端路由 |
| `segment-routes.js` | 暴露分段建议健康检查与预览接口 |
| `ai-routes.js` | 暴露台州话 AI 推荐 `health / defaults / recommend` 接口 |
| `ai-service.js` | 单次 Qwen Omni 听音、普通话转换、风险判断、强制清洗与 usage/cost 汇总 |
| `ai-call-log.js` | 台州话脚本 AI 调用日志写入器 |

## 当前接口

- 分段建议：
  - `GET /api/bytedance-aidp/taizhou-helper/segment/health`
  - `POST /api/bytedance-aidp/taizhou-helper/segment/preview`
- AI 推荐：
  - `GET /api/bytedance-aidp/taizhou-helper/ai/recommend/health`
  - `GET /api/bytedance-aidp/taizhou-helper/ai/recommend/defaults`
  - `POST /api/bytedance-aidp/taizhou-helper/ai/recommend`

## AI 返回结构

- 成功响应固定返回：
  - `listenText`
  - `finalMandarinText`
  - `isSinging`
  - `isNonTaizhouDialect`
  - `blockAutoFill`
  - `needHumanReview`
  - `notes`
  - `usage`
  - `cost`
  - `timing`
  - `models`
  - `raw`
  - `debug`
- 最终可写回字段固定只有：
  - `finalMandarinText`
- 默认阻止自动填入只看：
  - `isSinging`
  - `isNonTaizhouDialect`
  - `blockAutoFill`
- `needHumanReview` 继续保留，但不会单独阻断自动填入

## AI 规则

- 每段音频仅调用一次输入音频的 Qwen Omni；只允许 `qwen3.5-omni-plus` 与 `qwen3.5-omni-flash`，默认 Plus，thinking 固定关闭，超时上限 `60000ms`。
- 请求体使用单个 `aiOmni: { model, prompt, params }`；成功结果统一使用 `models.omniModel`、`usage.omni`、`cost.omni`、`raw.omni` 和 `debug.omni`。
- 全模态模型必须返回 JSON：`listenText`、`finalMandarinText`、`isSinging`、`isNonTaizhouDialect`、`blockAutoFill`、`needHumanReview`、`notes`。JSON 无法解析时保留原始输出并将 `blockAutoFill` 与 `needHumanReview` 设为 `true`。
- 最终输出规则固定为：
  - `listenText` 保留原始听音供人工复核，不做数字、标点或重复清洗
  - 最终输出是“普通话翻译”，不是台州话原文稿
  - 普通话不要截取，听到多少写多少
  - 不是润色稿，不做语义扩写
  - 标点只允许使用 `，。？！`，句末只允许使用 `。？！`
  - 不知名人名、地名、公司名或其他无法精准锁定的事物，使用 `##名称##` 包起来
  - 抖音音效不截取；主说话人如果在唱歌，仍尽量保留可识别文本，但默认 `blockAutoFill=true`
  - 语气词等按听到的普通话写法保留
  - 台州专属词表尚未提供时，不猜测时间词或常见词映射；仅根据可确认音频和上下文翻译
  - 明显口吃式连续单字或短词重复最多保留 `3` 次
  - 正常有语义的重复内容不压缩
  - 不使用阿拉伯数字，统一改写为汉字数字
  - 纯静音或完全听不清时返回空字符串
  - 即使判断为 `唱歌` 或 `非台州话`，也仍然尽量返回可识别文本，只是默认 `blockAutoFill=true`

## 日志与导出

- 台州话脚本独立 AI 调用日志当前已接入后台 `AI 调用记录` 数据集选项
- 导出 CSV 时只保留全模态模型、全模态 token 与全模态人民币列

## 当前边界

- 当前不接平台鉴权字段、签名地址持久化
- 当前不直接调用 AIDP 保存、提交或切题接口
- 单段识别与行内识别由浏览器扩展直接填入目标 textarea，不经过 `SubmitTempItemAnswer`
- 批量识别、分段建议应用、清空画段、填充语言种类由浏览器扩展使用页面内捕获的 `SubmitTempItemAnswer` 暂存契约写入当前题 `regions`
- 上述 DOM 直填和暂存写回均不触发保存、提交或切题；后端只提供分析与建议能力
