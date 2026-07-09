# ByteDance AIDP 金华话脚本后端

## 目录定位

- 目录：`platform-resources/bytedance-aidp/jinhua-helper/backend`
- 类型：脚本级统一后端路由
- 当前承载两组能力：
  - 分段建议预览
  - 金华话普通话翻译 AI 推荐

## 当前文件

| 文件 | 职责 |
| --- | --- |
| `index.js` | 注册金华话脚本后端路由 |
| `segment-routes.js` | 暴露分段建议健康检查与预览接口 |
| `ai-routes.js` | 暴露金华话 AI 推荐 `health / defaults / recommend` 接口 |
| `ai-service.js` | 两阶段听音与普通话翻译收口、usage/cost 汇总、响应结构收口 |
| `ai-call-log.js` | 金华话脚本 AI 调用日志写入器 |

## 当前接口

- 分段建议：
  - `GET /api/bytedance-aidp/jinhua-helper/segment/health`
  - `POST /api/bytedance-aidp/jinhua-helper/segment/preview`
- AI 推荐：
  - `GET /api/bytedance-aidp/jinhua-helper/ai/recommend/health`
  - `GET /api/bytedance-aidp/jinhua-helper/ai/recommend/defaults`
  - `POST /api/bytedance-aidp/jinhua-helper/ai/recommend`

## AI 返回结构

- 成功响应固定返回：
  - `listenText`
  - `finalMandarinText`
  - `isSinging`
  - `isNonJinhuaDialect`
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
  - `isNonJinhuaDialect`
  - `blockAutoFill`
- `needHumanReview` 继续保留，但不会单独阻断自动填入

## AI 规则

- 两阶段固定为：
  - `listen`：原始听音草稿、`唱歌` 判断、`非金华话` 判断
  - `refine`：普通话翻译收口、格式约束、`blockAutoFill` 决策
- 两阶段 JSON 契约固定为：
  - `listen`：`listenText, isSinging, isNonJinhuaDialect, needHumanReview, notes`
  - `refine`：`finalMandarinText, isSinging, isNonJinhuaDialect, blockAutoFill, needHumanReview, notes`
- 最终输出规则固定为：
  - 最终输出是“普通话翻译”，不是金华话原文稿
  - 普通话不要截取，听到多少写多少
  - 不是润色稿，不做语义扩写
  - 标点只允许使用 `，。？！`，句末只允许使用 `。？！`
  - 不知名人名、地名、公司名或其他无法精准锁定的事物，使用 `##名称##` 包起来
  - 抖音音效不截取；主说话人如果在唱歌，也不截取这部分内容
  - 语气词等按听到的普通话写法保留
  - 时间词和常见词优先按规则映射收口，例如 `前日 -> 前天`、`后日 -> 后天`、`今朝 -> 今天`
  - 明显口吃式连续重复最多保留 `3` 次
  - 正常有语义的重复内容不压缩
  - 不使用阿拉伯数字，统一改写为汉字数字
  - 纯静音或完全听不清时返回空字符串
  - 即使判断为 `唱歌` 或 `非金华话`，也仍然尽量返回可识别文本，只是默认 `blockAutoFill=true`

## 日志与导出

- 金华话脚本独立 AI 调用日志当前已接入后台 `AI 调用记录` 数据集选项
- 导出 CSV 时保留阶段级 token 与人民币列

## 当前边界

- 当前不接平台鉴权字段、签名地址持久化
- 当前不直接调用 AIDP 保存、提交或切题接口
- 当前只提供分析能力；真正写回平台仍由浏览器扩展使用页面内捕获的 `SubmitTempItemAnswer` 契约完成

