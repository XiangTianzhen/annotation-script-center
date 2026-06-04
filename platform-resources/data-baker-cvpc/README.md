# DataBaker CVPC 平台资料

## 平台定位

- 平台标识：`data-baker-cvpc`
- 平台入口：`https://cvpc.data-baker.com/app/web/`
- 核心工作页：`https://cvpc.data-baker.com/app/editor/asr/`
- 当前状态：仅完成首轮资料初始化；未创建 `extension/sites/data-baker-cvpc/`；未接入专属后端
- 技术观察：
  - `app/web` 壳层从 DOM 特征看是 `Ant Design + utility class` 组合
  - `app/editor/asr` 是独立编辑器壳，按钮/表单样式来自 `Element UI`，波形区通过 `iframe` 承载

## 首轮范围

1. `#/login` 路由行为与启动请求链
2. `#/home` 登录后壳层/首页
3. `#/my-job` 我的作业列表
4. `#/my-job/:projectId/callout` 项目内任务列表
5. `#/my-job/:projectId/callout/:taskProcessId/:taskId/job?...` 作业列表
6. `/app/editor/asr/?...` 核心语音标注页

## 文档约定

- `routeKey`：页面稳定标识
- `riskLevel`：`readonly`、`safe-ui`、`write-action`
- `selectorConfidence`：`high`、`medium`、`avoid`
- `requestClass`：`boot`、`data-read`、`asset`、`write`

## 推荐阅读顺序

1. `network/01-login-and-boot.md`
2. `page-structure/01-login-and-shell.md`
3. `network/02-post-login-shell-home.md`
4. `page-structure/02-post-login-home.md`
5. `network/03-home-to-editor-route.md`
6. `page-structure/03-home-to-editor-route.md`
7. `network/04-editor-asr-init.md`
8. `page-structure/04-editor-asr.md`
9. `network/pending-capture.md`
10. `page-structure/pending-capture.md`

## 当前覆盖状态

- `network/`：已记录 4 段核心链路，覆盖登录启动、登录后壳层、首页到编辑器导航、编辑器初始化
- `page-structure/`：已记录 4 段页面结构，覆盖登录路由重定向、首页壳层、列表导航链、编辑器壳层
- `pending-capture`：明确列出未触发或未补采的写操作、角色视图和弹窗差异

## 首轮边界

- 首轮只做浏览器联动只读采集和安全 UI 跳转观察
- 不触发 `领取`、`保存`、`挂起`、`提交`、批量流转等写操作
- 不提交 HAR、原始请求包、未脱敏 JSON、完整签名资源 URL
- 正文只保留结构摘要、参数键、字段层级、选择器建议和风险说明

## 安全边界

- `#/login` 在有效会话下会直接回到 `#/home`；本轮没有重新输入账号密码
- 登录、上传配置、编辑器数据里都存在敏感字段；文档只记录字段名和用途，不保留原值
- 编辑器按钮区大量动作会改写任务状态；后续脚本编写前必须按 `riskLevel` 再分层
