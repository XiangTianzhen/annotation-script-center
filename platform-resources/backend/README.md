# 统一后端

入口：`platform-resources/backend/server.js`。

## 当前注册

- DataBaker CVPC 柳州话：`/api/data-baker-cvpc/liuzhou-helper/*`
- ByteDance AIDP 苏州话：`/api/bytedance-aidp/suzhou-helper/*`
- ByteDance AIDP 金华话：`/api/bytedance-aidp/jinhua-helper/*`
- Magic Data 杭州话：`/api/magic-data/hangzhou-helper/*`
- 管理员会话：`/api/admin/session/*`
- 系统仪表盘：`/api/admin/dashboard/*`
- 公开下载中心：`/api/admin/download-center/*`
- 四脚本 AI 日志：`/api/admin/ai-call-log/*`

`GET /api/admin/ai-call-log/options` 固定返回柳州、苏州、金华、杭州四项，不接受可见性过滤。

## 公共模块

- `ai/model-response-utils.js`：中文句末标点、usage 归一化、模型 JSON 解析。
- `security/signed-token.js`：管理员会话与下载签名 token。
- `security/audit-store.js`：中性下载审计存储。
- `ai-call-log-download/`：四脚本 AI 日志选项、签名下载与 CSV 合并。

## 启动

```powershell
node platform-resources/backend/server.js
```

默认地址为 `http://127.0.0.1:3333`。管理员鉴权读取 `ASC_ADMIN_PASSWORD_SHA256` 与 `ASC_ADMIN_JWT_SECRET`；AI 日志可配置独立凭据。

公网部署由 Nginx 终止 HTTPS 并代理 `/api/`，当前公开域名为 `https://annotation-script-center.xiangtianzhen.store`。PM2、Nginx、Certbot 和回滚命令见 [`docs/server-deployment.md`](../../docs/server-deployment.md)。
