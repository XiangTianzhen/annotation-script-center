# 公共 AI 模块

`platform-resources/backend/ai/` 为柳州、苏州、金华、台州、杭州五脚本后端提供模型目录、请求调度、provider、队列、usage、价格估算、缓存和响应处理能力。

脚本专属 Prompt、请求校验、响应 schema、路由和业务日志仍放在各脚本 `backend/` 中，公共层不理解具体方言字段。

## 模块职责

| 文件/目录 | 职责 |
|---|---|
| `config.js` | 公共 AI 配置与环境变量归一化 |
| `model-catalog.js` | 当前可用模型及 provider 元数据 |
| `model-dispatcher.js` | 根据模型选择 provider 并统一调用入口 |
| `provider-queue.js` | 按具体模型隔离并发、容量与等待队列 |
| `model-pricing.js` | 读取模型价格并计算人民币估算 |
| `model-response-utils.js` | usage 归一化、模型 JSON 文本解析、中文句末标点 |
| `usage.js` | Token 字段归一化与聚合 |
| `sanitizer.js` | 日志和 debug 的敏感字段清理 |
| `result-cache.js` | 可复用模型结果缓存 |
| `errors.js` | 公共 AI 错误类型和可读摘要 |
| `providers/` | Qwen compatible、Qwen Python、Fun-ASR REST/Python provider |
| `python/` | Python provider 客户端与 requirements |

## 调用流程

```text
脚本 AI service
  -> model-dispatcher
  -> model-catalog 解析模型/provider
  -> provider-queue 获取具体模型容量
  -> providers/* 调用模型
  -> usage / pricing / sanitizer
  -> 脚本响应 schema 与日志
```

队列按具体模型名隔离，避免一个模型的拥塞阻塞其他模型。调用完成后必须释放容量；异常也需要经过公共错误归一化再交给脚本层。

## Provider

当前 provider 包括：

- Qwen OpenAI-compatible：适合文本与兼容接口调用。
- Qwen Python：用于需要 Python 客户端能力的模型链路。
- Fun-ASR REST / Python：供需要语音识别 provider 的脚本使用。

provider 只负责传输、超时和基础响应解析，不写入脚本字段，也不决定自动填入策略。

## usage 与价格

- usage 统一为输入、输出和总 Token。
- 多阶段脚本由脚本层分别保留阶段 usage，再汇总总量。
- 价格读取 `config/aliyun-bailian-model-pricing.json`。
- 缺少价格时不伪造金额，前端显示“没有数据源”，CSV 金额保持空白。
- 新 provider 或模型必须先补模型目录和价格配置，再接入脚本。

## 超时与错误

默认模型请求超时为 `60000ms`。错误输出只保留 requestId、provider、model、status、duration 和摘要，不透出 Key、authorization 或完整 payload。

模型返回结构化 JSON 失败时，由脚本层决定是否使用保守兜底；公共解析工具不会替脚本猜测业务字段。

## 消费者

- `platform-resources/data-baker-cvpc/liuzhou-helper/backend/`
- `platform-resources/bytedance-aidp/suzhou-helper/backend/`
- `platform-resources/bytedance-aidp/jinhua-helper/backend/`
- `platform-resources/bytedance-aidp/taizhou-helper/backend/`
- `platform-resources/magic-data/hangzhou-helper/backend/`

## 测试

长期测试统一位于根 `tests/backend/`。修改模型调度、队列、usage、价格或 sanitizer 后执行：

```powershell
npm run test:backend
```
