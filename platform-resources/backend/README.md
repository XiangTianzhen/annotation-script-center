# 平台资源统一后端

## 目录用途

本目录是 `platform-resources/` 下所有浏览器无关后端工具的统一启动入口。新增平台或脚本项目 API 时，应优先在对应项目目录实现业务逻辑，再通过 `registry.js` 注册到这里。

## 启动方式

在仓库根目录运行：

```powershell
node platform-resources\backend\server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

服务器若使用 PM2，推荐进程名统一为 `annotation-script-center`。首次启动示例：

```bash
cd /var/www/annotation-script-center
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

## 环境变量加载顺序

启动时会自动读取统一后端环境配置文件，顺序为：

1. `config/env/backend.env`
2. `config/env/backend.local.env`
3. `config/env/ai.env`
4. `config/env/ai.local.env`
5. `.env.local`
6. 可选 `ASC_ENV_FILE` 指向的外部文件

系统环境变量优先级最高，不会被配置文件覆盖。文件不存在时跳过；读取失败时只输出脱敏 `warn`，不输出文件内容。

## 服务器部署与更新

### 首次部署

Linux / PM2 示例：

```bash
cd /var/www
git clone https://github.com/XiangTianzhen/annotation-script-center.git annotation-script-center
cd /var/www/annotation-script-center
cp config/env/backend.env.example config/env/backend.env
cp config/env/ai.env.example config/env/ai.env
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

Windows 示例：

```powershell
Set-Location D:\deploy
git clone https://github.com/XiangTianzhen/annotation-script-center.git annotation-script-center
Set-Location D:\deploy\annotation-script-center
Copy-Item config\env\backend.env.example config\env\backend.env
Copy-Item config\env\ai.env.example config\env\ai.env
node platform-resources\backend\server.js
```

首次部署后至少检查：

- `pm2 status` 或当前终端输出中确认进程已监听
- `GET /` 根接口可访问
- 至少一个脚本的 `health` 或 `defaults` 接口可访问

### 日常更新

当前仓库没有根级 `package.json`；服务器更新通常不是 `npm install`，而是“拉代码 + 复核 env + 重启进程”。

Linux / PM2 推荐流程：

```bash
cd /var/www/annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
```

Windows / PM2 推荐流程：

```powershell
Set-Location D:\deploy\annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
```

更新时必须注意：

- 不要直接覆盖服务器本地的 `config/env/backend.env`、`config/env/ai.env`、`config/secrets/*`
- 如果仓库里的 `.example` 或 README 更新了环境变量说明，只手动把新增项合并到服务器私有配置
- 如果这次只改后端代码，通常不需要重新生成或替换 `dist/` 静态包
- 如果这次只替换扩展下载包，通常不需要重启 Node 后端

### 更新后检查清单

1. `pm2 status` 中 `annotation-script-center` 为 `online`
2. `GET /` 根接口返回 `success=true`
3. 至少抽查一个脚本 `health` 或 `defaults` 接口
4. 若本轮涉及下载中心或 CRX 分发，再额外检查静态文件 URL 是否可访问

## 平台专属说明入口

统一后端 README 不再承载平台专属业务说明、平台特有环境变量长清单或平台历史热修记录。以下内容统一下钻到对应平台：

- Alibaba LabelX
  - 总览：[`../alibaba-labelx/README.md`](../alibaba-labelx/README.md)
  - 快判：[`../alibaba-labelx/asr-judgement/README.md`](../alibaba-labelx/asr-judgement/README.md)
  - 转写：[`../alibaba-labelx/asr-transcription/README.md`](../alibaba-labelx/asr-transcription/README.md)
- DataBaker
  - 总览：[`../data-baker/README.md`](../data-baker/README.md)
  - 脚本：[`../data-baker/round-one-quality/README.md`](../data-baker/round-one-quality/README.md)
- DataBaker CVPC
  - 总览：[`../data-baker-cvpc/README.md`](../data-baker-cvpc/README.md)
  - 脚本：[`../data-baker-cvpc/liuzhou-helper/README.md`](../data-baker-cvpc/liuzhou-helper/README.md)
- Magic Data
  - 总览：[`../magic-data/README.md`](../magic-data/README.md)
  - 客家话助手：[`../magic-data/hakka-helper/README.md`](../magic-data/hakka-helper/README.md)
  - 闽南语助手：[`../magic-data/minnan-helper/README.md`](../magic-data/minnan-helper/README.md)
- Aishell Tech
  - 总览：[`../aishell-tech/README.md`](../aishell-tech/README.md)
  - 闽南语助手：[`../aishell-tech/minnan-helper/README.md`](../aishell-tech/minnan-helper/README.md)
  - 越南语助手：[`../aishell-tech/vietnamese-helper/README.md`](../aishell-tech/vietnamese-helper/README.md)
- Abaka AI
  - 总览：[`../abaka-ai/README.md`](../abaka-ai/README.md)
  - Task21：[`../abaka-ai/task21/README.md`](../abaka-ai/task21/README.md)

Alibaba LabelX 的统计导出、CSV 编码、CSV 健康值合并、断点跳过增强等专属说明统一查看：

- [`../alibaba-labelx/README.md`](../alibaba-labelx/README.md)
- [`../alibaba-labelx/asr-judgement/README.md`](../alibaba-labelx/asr-judgement/README.md)
- [`../alibaba-labelx/asr-transcription/README.md`](../alibaba-labelx/asr-transcription/README.md)

## 官方文档核对入口

- 阿里云百炼官方文档索引：[`../../docs/external-docs-aliyun-bailian.md`](../../docs/external-docs-aliyun-bailian.md)
- 涉及模型名、`enable_thinking`、结构化输出、Qwen-Omni、Web Search、限流、调用地区时，必须先核对对应官方文档
- 如果官方文档在本地无法访问，必须明确说明“未能联网核对官方文档”，不得伪造结论

## 统一 AI 默认口径

- 所有已接入 AI 服务默认返回统一 `cost` 对象，价格统一读取 `config/aliyun-bailian-model-pricing.json`
- AI 请求记录 CSV 公共列与脚本扩展列统一使用中文表头
- 单阶段 AI 调用默认记录总 token，并可补当前调用阶段人民币估算；多阶段 AI 调用默认拆分阶段 token 与阶段预估人民币
- 缺少价格配置的模型仍允许继续调用；页面可显示 `没有数据源`，CSV 金额列保持空白，不写状态文本
- 仓库内所有 `*_ENABLE_THINKING` 变量只保留历史兼容读取；实际请求统一固定 `enable_thinking=false`
- TTS 自动清除默认时间统一为 `60000ms`
- AI / 模型请求默认超时时间统一为 `60000ms`

统一后端公共环境变量：

- `PLATFORM_RESOURCES_SERVER_HOST`
- `PLATFORM_RESOURCES_SERVER_PORT`
- `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`
- `ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256`
- `ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET`

平台专属模型、队列、Prompt、词表和导出环境变量请查看对应平台 README。

## 统一 AI 调用日志与管理接口

共享核心目录：

- `platform-resources/backend/ai-call-log/`

统一规则：

- 前端必须携带 `aiUsageOperatorName`；未填写时前端与后端都会拦截
- token 以 `promptTokens / completionTokens` 为主统计口径；多阶段 usage 会先按阶段汇总再写入 `输入Token / 输出Token / 总Token`
- 默认保留脱敏后的原始成功 / 失败 JSON，不再把大块业务结果拆成公共列
- AI 请求记录导出已迁入系统管理的“数据导出”页签

统一统计与管理接口：

- `GET /api/admin/ai-call-log/options`
- `POST /api/admin/ai-call-log/request`
- `GET /api/admin/ai-call-log/file?token=...`
- `HEAD /api/admin/ai-call-log/file?token=...`
- `POST /api/admin/session/unlock`

审计目录：

- `platform-resources/backend/audit-data/ai-call-log-download/`

项目数据下载密码、管理员会话密码和 JWT Secret 的生成步骤统一见：

- [`../../config/README.md`](../../config/README.md)

## 新增项目接入规则

1. 在对应项目目录下创建自己的 `backend/` 实现，不把业务逻辑直接写进统一入口
2. 在 `platform-resources/backend/registry.js` 中显式注册
3. 同步更新对应平台 README、`platform-resources/README.md` 和 `log.md`
