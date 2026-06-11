# DataBaker CVPC 平台资料

## 平台定位

- 平台标识：`data-baker-cvpc`
- 平台入口：`https://cvpc.data-baker.com/app/web/`
- 核心工作页：`https://cvpc.data-baker.com/app/editor/asr/`
- 当前状态：`beta` 首版已接入脚本中心、扩展运行时与独立后端；真实画段写入契约仍待补采
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

1. `network/README.md`
2. `page-structure/README.md`
3. `network/01-login-and-boot.md`
4. `page-structure/01-login-and-shell.md`
5. `network/02-post-login-shell-home.md`
6. `page-structure/02-post-login-home.md`
7. `network/03-home-to-editor-route.md`
8. `page-structure/03-home-to-editor-route.md`
9. `network/04-editor-asr-init.md`
10. `page-structure/04-editor-asr.md`

## 当前覆盖状态

- `network/`：当前由索引 README + 4 份稳定参考页组成，覆盖登录启动、登录后壳层、首页到编辑器导航、编辑器初始化
- `page-structure/`：当前由索引 README + 4 份稳定参考页组成，覆盖登录路由重定向、首页壳层、列表导航链、编辑器壳层
- 过程型补采记录已移出主参考目录；后续只把当前有效结论回写到稳定参考页或 `log.md`
- `liuzhou-helper/`：已补脚本级规则资产、独立后端接口和扩展运行时 README；当前右侧只保留嵌入 `全局标注` 卡片的紧凑状态区，并优先插入 `.label_title_border2` 内容流；中间 `普通话顺滑` 下方统一承载画段建议和三结果 AI 推荐卡；当前段 AI 推荐改为“浏览器裁剪当前段 -> Base64 `audioDataUrl` -> staged AI recommend”

## 首轮边界

- 当前脚本仍以“建议生成 + 人工确认”为边界
- 不自动保存、不自动提交、不自动切下一条、不跨当前音频自动遍历
- 当前段 AI 推荐必须依赖页面可信的当前段 `开始 / 结束`；缺失时 fail closed，不退回整段音频
- `segment create/update`、保存链路与字段稳定写入契约仍未补采完成
- 不提交 HAR、原始请求包、未脱敏 JSON、完整签名资源 URL
- 正文只保留结构摘要、参数键、字段层级、选择器建议和风险说明

## 安全边界

- `#/login` 在有效会话下会直接回到 `#/home`；本轮没有重新输入账号密码
- 登录、上传配置、编辑器数据里都存在敏感字段；文档只记录字段名和用途，不保留原值
- 编辑器按钮区大量动作会改写任务状态；后续脚本编写前必须按 `riskLevel` 再分层
