# 平台资源库

## 目录定位

`platform-resources/` 是浏览器无关的平台资源库，用来沉淀 LabelX、DataBaker 等平台的页面结构、网络请求、接口字段、统计格式、已知限制和本地调试工具。

这些资源服务于 Chrome / Edge 共用的 `extension/` 扩展源码，避免同一份 DOM / 网络知识或本地后端调试工具在多个目录中重复维护。

## 维护边界

- 这里不放扩展运行时代码，不参与扩展 manifest 加载。
- 可以放浏览器无关的本地调试工具，例如统计上传接收服务。
- 这里记录跨浏览器通用的平台事实，例如 URL、DOM 片段、接口样例、字段含义和验证结论。
- Chrome / Edge 差异仍应收敛到扩展 manifest、浏览器 API 兼容层、打包配置或少量适配文件。
- 新增资料或工具时按“平台 / 脚本项目 / 资源类型”归档。

## 当前结构

```text
platform-resources/
  backend/
    server.js
    app.js
    router.js
    registry.js
    response.js
    config.js
  alibaba-labelx/
    README.md
    asr-judgement/
      README.md
      ai/
      page-structure/
      network/
      backend/
      unfinished.md
    asr-transcription/
      README.md
  data-baker/
    round-one-quality/
      README.md
      page-structure.md
      network.md
      backend/
  abaka-ai/
    README.md
    task-page/
      README.md
    network.md
    page-structure.md
    actions.md
    i18n.md
    network/
      README.md
      task-page/
    task21/
      README.md
      network.md
      network/
        README.md
      page-structure.md
    task17/
      README.md
      network.md
      page-structure.md
```

## 使用规则

- 涉及 LabelX 页面 DOM 或网络接口时，优先读本目录，再修改扩展运行时代码。
- 涉及 DataBaker 页面 DOM 或网络接口时，优先读 `data-baker/round-one-quality/`，不要把 DataBaker 逻辑写入 Alibaba LabelX 目录。
- 涉及 Abaka AI Task 页面结构采集时，先读 `abaka-ai/README.md`；公共页面结构、动作风险、多语言和 Network 维护在 `abaka-ai/` 根目录，Task21 same_font 专项读 `abaka-ai/task21/README.md`，Task17 对比与空池差异读 `abaka-ai/task17/README.md`。
- `page-structure/` 放页面结构、稳定选择器和代表性 HTML 片段。
- `network/` 放请求 URL、请求 / 响应结构、采集结论和待采集项。
- `ai/` 放快判 AI 规则、提示词模板和少量 few-shot 示例，不放完整雷题库。
- 根级 `backend/` 是统一 Node 后端入口，只负责启动、基础路由、响应工具和项目 API 注册。
- 项目级 `backend/` 放浏览器无关的本地调试服务，并维护统计 CSV、上传 payload、服务端合并契约等资料；不被扩展 manifest 加载。
- `unfinished.md` 放未完成方案、风险和后续验证条件。

## 统一后端 API 清单

### Base URL

- 本地：`http://127.0.0.1:3333`
- 服务器：`https://script.xiangtianzhen.store`

说明：Options 首页顶部“后端接口地址”切换 `server/local` 后，扩展统一按 `baseUrl + API path` 拼接请求。

### 当前注册模块

- Alibaba LabelX ASR 快判
- Alibaba LabelX ASR 转写
- DataBaker 一检质检
- Magic Data Annotator
- Abaka AI Task21
- Admin 项目数据下载

以上模块注册来源：`platform-resources/backend/registry.js`。

### Alibaba LabelX ASR 快判 API

- 统计上传与查询：
  - `GET /api/alibaba-labelx/asr-judgement/statistics/health`
  - `GET /api/alibaba-labelx/asr-judgement/statistics/config`
  - `POST /api/alibaba-labelx/asr-judgement/statistics/upload`
  - `POST /api/alibaba-labelx/asr-judgement/statistics/existing`
  - `GET /api/alibaba-labelx/asr-judgement/statistics/suppliers`
  - `GET /api/alibaba-labelx/asr-judgement/statistics/download`
  - `HEAD /api/alibaba-labelx/asr-judgement/statistics/download`
- AI：
  - `GET /api/alibaba-labelx/asr-judgement/ai/health`
  - `GET /api/alibaba-labelx/asr-judgement/ai/defaults`
  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest`
- 下载 URL：
  - 本地：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/download`
  - 服务器：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/download`
  - 本地（supplier）：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/download?supplier=<供应商>`
  - 服务器（supplier）：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/download?supplier=<供应商>`
- 是否下载接口：是（CSV）
- 下载文件说明：默认 `statistics-merged.csv`
- token/password：不需要
- 运行数据目录：`platform-resources/alibaba-labelx/asr-judgement/backend/statistics-data/`
- 安全说明：CSV 字段统一使用 `有效时长`；目录为运行数据，不提交 Git。
- 分类防串表：后端会优先按 `payload.project` / `payload.rawKeys.labelModel` 判定项目类型，高置信判断数据不会写入转写表，高置信转写数据不会写入快判表。

### Alibaba LabelX ASR 转写 API

- 统计上传与查询：
  - `GET /api/alibaba-labelx/asr-transcription/statistics/health`
  - `GET /api/alibaba-labelx/asr-transcription/statistics/config`
  - `POST /api/alibaba-labelx/asr-transcription/statistics/upload`
  - `POST /api/alibaba-labelx/asr-transcription/statistics/existing`
  - `GET /api/alibaba-labelx/asr-transcription/statistics/suppliers`
  - `GET /api/alibaba-labelx/asr-transcription/statistics/download`
  - `HEAD /api/alibaba-labelx/asr-transcription/statistics/download`
- AI：
  - `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
  - `GET /api/alibaba-labelx/asr-transcription/ai/defaults`
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`
- 下载 URL：
  - 本地：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download`
  - 服务器：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/download`
  - 本地（supplier）：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download?supplier=<供应商>`
  - 服务器（supplier）：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-transcription/statistics/download?supplier=<供应商>`
- 是否下载接口：是（CSV）
- 下载文件说明：默认 `statistics-merged.csv`
- token/password：不需要
- 运行数据目录：`platform-resources/alibaba-labelx/asr-transcription/backend/statistics-data/`
- 安全说明：CSV 字段统一使用 `有效时长`；目录为运行数据，不提交 Git。
- 历史迁移：可执行 `node platform-resources/alibaba-labelx/backend/legacy-csv-repair.js --dry-run` 预览修复；需要落盘时使用 `--write --backup`。

### DataBaker 一检质检 API

- AI：
  - `GET /api/data-baker/round-one-quality/ai/recommend/health`
  - `GET /api/data-baker/round-one-quality/ai/recommend/defaults`
  - `POST /api/data-baker/round-one-quality/ai/recommend`
- 导出：
  - `GET /api/data-baker/round-one-quality/export/health`
  - `GET /api/data-baker/round-one-quality/export/config`
  - `POST /api/data-baker/round-one-quality/export/upload`
  - `GET /api/data-baker/round-one-quality/export/download`
  - `HEAD /api/data-baker/round-one-quality/export/download`
  - `GET /api/data-baker/round-one-quality/export/list`
- 下载 URL：
  - 本地：`http://127.0.0.1:3333/api/data-baker/round-one-quality/export/download`
  - 服务器：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/export/download`
- 是否下载接口：是（CSV）
- 下载文件说明：默认 `latest.csv`
- token/password：不需要
- 运行数据目录：`platform-resources/data-baker/round-one-quality/backend/export-data/`
- 安全说明：新导出 CSV 统一字段 `有效时长`（来源仍为 `effectivePassTotalTime`）；目录为运行数据，不提交 Git。

### Magic Data Annotator API

- `GET /api/magic-data/annotator/ai/review-current/health`
- `GET /api/magic-data/annotator/ai/defaults`
- `POST /api/magic-data/annotator/ai/review-current`
- 是否下载接口：暂无下载接口
- token/password：不需要
- 数据目录：按模块日志目录为主，无统一 CSV 下载目录
- 安全说明：仅 AI 质检调试接口，不自动提交业务动作。

### Abaka AI Task21 API

- `GET /api/abaka-ai/task21/ai/health`
- `GET /api/abaka-ai/task21/ai/defaults`
- `POST /api/abaka-ai/task21/ai/analyze`
- 是否下载接口：暂无下载接口
- token/password：不需要
- 数据目录：当前为 AI 调试接口，无统一 CSV 下载目录
- 安全说明：AI 仅返回建议，不自动写入、不保存、不提交。

### Admin 项目数据下载 API

- `GET /api/admin/project-data-download/options`
- `POST /api/admin/project-data-download/request`
- `GET /api/admin/project-data-download/file?token=<downloadToken>`
- `HEAD /api/admin/project-data-download/file?token=<downloadToken>`
- 下载 URL：
  - 本地模板：`http://127.0.0.1:3333/api/admin/project-data-download/file?token=<downloadToken>`
  - 服务器模板：`https://script.xiangtianzhen.store/api/admin/project-data-download/file?token=<downloadToken>`
- 是否下载接口：是（CSV 聚合下载）
- 下载文件说明：按 `dataset + supplier` 输出过滤后的 CSV 文件名
- token/password：需要（先 `request` 传密码换短期 token）
- 审计目录：`platform-resources/backend/project-data-download/audit-data/`
- 安全说明：token 仅短期有效；文档和日志中只允许占位符，不写真实 token/password。

### 运行数据与安全边界

- `statistics-data/`、`export-data/`、`audit-data/` 都属于运行数据目录，不提交 Git。
- 不提交 cookie/token/authorization/API Key/JWT secret/CRX 私钥。
- 下载 URL 示例中的 token 必须使用占位符（如 `<downloadToken>`），不要写真实值。

