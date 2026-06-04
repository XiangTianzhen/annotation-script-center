# DataBaker CVPC 网络采集索引

## 目录定位

本目录保存 `cvpc.data-baker.com` 首轮网络链路的脱敏结构摘要，目标是让后续脚本编写者不用重新开 DevTools 也能还原主要请求关系。

## 通用约定

- 通用鉴权头：`authorization: Bearer <redacted>`
- 通用终端头：`baker-terminal: <terminal-kind>@<group-id>`
- 通用响应包裹：大多数接口遵循 `{ code, data }`
- 首轮正文默认只收口 `readonly` 与 `safe-ui`；`write-action` 只标存在与风险
- 静态音频、图片、波形资源可能带签名或业务内容，不在正文保留完整 URL

## 文件列表

| 编号 | 文件 | 内容 |
|------|------|------|
| 01 | `01-login-and-boot.md` | `#/login` 路由、登录提交链、登录后 boot |
| 02 | `02-post-login-shell-home.md` | `#/home` 壳层初始化请求 |
| 03 | `03-home-to-editor-route.md` | `#/my-job` 到 `/app/editor/asr/` 的导航请求链 |
| 04 | `04-editor-asr-init.md` | 编辑器首屏初始化与校验请求 |
| - | `pending-capture.md` | 未补采项清单 |
| - | `next-session-handoff.md` | 下次会话接力说明 |

## 阅读建议

1. 先读 `01`，确认登录、终端头和组织上下文来源
2. 再读 `02`，理解壳层和首页只依赖哪些 boot 数据
3. 再读 `03`，顺着项目/任务/作业三级 ID 进入编辑器
4. 最后读 `04`，确认编辑器真正依赖的 `task_id / process_id / data_id / job_id`

## 本轮脱敏规则

- 不记录 token、cookie、authorization 原文
- 不记录完整签名 URL、临时凭证、OSS/STS 密钥
- 不记录真实员工姓名、手机号、邮箱、项目文本内容、转写全文
- 示例 ID 一律写成占位形式，如 `<projectId>`、`<jobId>`
