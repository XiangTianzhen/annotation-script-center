# Aishell Tech 越南语助手后端

## 接口

- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/health`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/defaults`
- `POST /api/aishell-tech/vietnamese-helper/ai/recommend`
- `POST /api/aishell-tech/vietnamese-helper/ai/recommend/jobs`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/jobs/:jobId`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/jobs/:jobId/debug`
- `GET /api/aishell-tech/vietnamese-helper/ai/recommend/logs/summary`

## 当前实现

- 只保留单阶段 `recognize`。
- 默认模型：`qwen3.5-omni-flash`。
- 默认 Prompt 只约束：
  - 输出最终越南语转写文本
  - 保留重音字符与词间空格
  - 使用越南语标点与空格
  - 不翻译成中文
  - 不补词表写法
- 不再存在：
  - 词表读取
  - `convert / listen / compare` 三阶段
  - `convertedText / heardText / audioFirstReference`

## 请求与响应

- 请求归一后只接受：
  - `singleModel`
  - `singlePrompt`
  - 共享高级参数
  - `aiStages.recognize`
- 成功响应固定：
  - `success`
  - `data.recommendedText`
  - `data.referenceText`
  - `meta`
- 失败响应固定：
  - `success=false`
  - `error.code / error.message / error.stage / error.retryable`
  - `meta`

## 队列与日志

- 当前独立队列组只使用 `aishell_qwen_omni`。
- 默认继续走 `POST /jobs` + 轮询 `GET /jobs/:jobId`。
- 日志只记录单阶段 `recognize` 的 token、耗时、模型与人民币估算。

## 安全边界

- 只返回 AI 辅助文本，不保存平台标注结果。
- 不记录 token、cookie、authorization、完整音频 URL。
- 超时、中断、失败只保留必要诊断信息。
