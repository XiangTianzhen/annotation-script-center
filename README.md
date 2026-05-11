# 标注脚本中心

本仓库维护“标注脚本中心”的浏览器扩展、平台资料和本地 / 服务器后端工具。当前扩展按 Chrome / Chromium MV3 形态维护，Chrome 和 Edge 共用同一份源码。

## 当前重点

- 当前通用扩展源码目录：`extension/`
- 当前重点平台：`Alibaba LabelX`、`标贝易采`
- 当前重点脚本：`extension/sites/alibaba-labelx/asr-judgement/`、`extension/sites/alibaba-labelx/asr-transcription/`、`extension/sites/data-baker/round-one-quality/`
- 当前后端入口：`platform-resources/backend/server.js`
- 当前扩展版本：`0.3.0`
- 当前处于“项目数据下载鉴权与供应商筛选下载”阶段，第二轮自动更新方案仅做文档设计。

## 0.3.0 第一轮能力（已实现）

- options 首页“后端接口地址”改为隐藏交互：
  - 默认只显示文案，不显示“服务器 / 本机”切换按钮。
  - 点击一次“后端接口地址”文案后才显示“服务器 / 本机”切换按钮。
  - 连续点击同一文案 10 次后，解锁“项目数据下载”隐藏面板。
- “项目数据下载”面板字段：
  - 获取人姓名（可保存到 `chrome.storage` 对应 settings）。
  - 数据类型下拉。
  - 多供应商时显示供应商下拉。
  - 导出按钮与状态提示。
- 下载流程：
  - 前端点击导出后弹窗输入密码（密码不保存）。
  - 前端 `POST /api/admin/project-data-download/request`（密码只在 body，不走 query）。
  - 后端校验密码后返回 120 秒短期 token 下载链接。
  - 前端打开 `GET /api/admin/project-data-download/file?token=...` 触发下载。
- 新增统一后端聚合下载模块（不归属单平台）：
  - 目录：`platform-resources/backend/project-data-download/`
  - 路由：
    - `GET /api/admin/project-data-download/options`
    - `POST /api/admin/project-data-download/request`
    - `GET /api/admin/project-data-download/file?token=...`
    - `HEAD /api/admin/project-data-download/file?token=...`
- 鉴权与 token：
  - 密码哈希环境变量：`ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`（兼容旧 `ASC_DATA_DOWNLOAD_PASSWORD_SHA256`）。
  - JWT 密钥环境变量：`ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`（兼容旧 `ASC_DATA_DOWNLOAD_JWT_SECRET`）。
  - token 使用 Node 内置 `crypto` HMAC 签名，默认有效期 120 秒。
- CSV 下载策略：
  - 数据源来自现有总表：快判 `statistics-merged.csv`、转写 `statistics-merged.csv`、标贝 `export-data/latest.csv`。
  - 若 CSV 有“供应商”列且供应商数量大于 1，必须先选供应商。
  - 服务端按供应商筛选并返回 UTF-8 with BOM CSV。
  - 不暴露真实文件路径；CSV 输出会做敏感字段清洗。
- 审计日志：
  - 目录：`platform-resources/backend/project-data-download/audit-data/`
  - 记录请求/下载成功失败、IP、获取人、数据类型、供应商、UA、时间等。
  - 不记录 password、token 全文、cookie、authorization。

## 第二轮方案（仅文档，不在本轮实现）

- 自动更新扩展路线明确使用 `XiangTianzhen/ops_monitor` 本地 Python 打包 exe。
- 规划在 `ops_monitor` 新增 `annotation-script-center` 更新模块，扩展本体不直接替换本地文件。
- 预期流程：
  1. 检测版本；
  2. 下载 CRX 与 `annotation-script-center-crx-latest.json`；
  3. 校验 sha256；
  4. 通过企业策略更新或本地策略触发浏览器安装更新；
  5. 提示或触发刷新扩展页面。
- Chrome/Edge 商店版仍走官方审核发布，不作为内部快速迭代主路径。

## 0.2.11 修正要点（LabelX 统计总表 + 动态供应商列）

- ASR 转写与 ASR 快判统计主存储统一为根级总表：
  - `statistics-data/statistics-merged.csv`
- 两条链路都按 `供应商 + 分包ID` 合并，避免同分包跨供应商覆盖。
- CSV 供应商列改为动态输出：
  - 单供应商数据：不输出 `供应商` 列。
  - 多供应商数据：在最后一列追加 `供应商`。
- CSV 写出前统一清洗字段：去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符）；任务名称、任务ID、子任务ID、分包ID、人员、时间、完成状态、供应商都不保留前后空格。
- 供应商识别优先级：
  1. `payload.supplier` / `payload.vendor`
  2. `csvPatch["供应商"]`
  3. `taskName/name` 推断（当前已知：`棋燊`、`希尔贝壳`）
  4. `未识别供应商`
- 若 `csvPatch["供应商"]` 为 `未识别供应商` / `unknown-supplier` / 空值，必须回退到任务名重新识别（例如任务名包含 `棋燊` 则输出 `棋燊`）。
- 下载接口默认下载总表（不要求 `supplier` 参数）：
  - `/api/alibaba-labelx/asr-transcription/statistics/download`
  - `/api/alibaba-labelx/asr-judgement/statistics/download`
- 供应商列表接口：
  - `/api/alibaba-labelx/asr-transcription/statistics/suppliers`
  - `/api/alibaba-labelx/asr-judgement/statistics/suppliers`
- 不再主动创建或写入 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
- 内部 payload / mergeKey 仍保留 supplier 信息，继续避免跨供应商同分包覆盖。
- 转写统计上传新增进度条（阶段、完成/总数、百分比、并发、成功/失败），共享实现位于 `extension/shared/progress-indicator.js`。
- 快判统计上传同步接入同一进度条组件；后续所有平台长耗时统计/导出任务默认复用该组件。
- 页数上限与并发上限分开管理：页数上限用于防无限分页；并发上限固定 `999`。

## 页面采集与验证工作流

- 采集 HTML 结构和 Network 时，默认优先使用 **Google Chrome DevTools / MCP**。
- Playwright Edge 仅用于真实操作验证（按钮/快捷键/行为）或 DevTools 不可用兜底。
- Codex 默认只负责打开浏览器；用户自行登录并进入页面，回复“处理好了”后再继续采集/测试。
- LabelX 公共资料沉淀到 `platform-resources/alibaba-labelx/`，转写专项资料沉淀到 `platform-resources/alibaba-labelx/asr-transcription/`。

## 目录结构

```text
annotation-script-center/
  extension/
    manifest.json
    background/
    options/
    popup/
    shared/
    sites/
      alibaba-labelx/
        asr-transcription/
        asr-judgement/
      data-baker/
        round-one-quality/
  platform-resources/
    backend/
    alibaba-labelx/
      asr-judgement/
        page-structure/
        network/
        backend/
        unfinished.md
      asr-transcription/
    data-baker/
      round-one-quality/
        backend/
        page-structure.md
        network.md
  docs/
  legacy-reference/
  AGENTS.md
  log.md
  PRIVACY_POLICY.md
```

## 本地加载扩展

Edge：

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择 `C:\Projects\annotation-script-center\extension`。
5. 确认扩展名称显示为“标注脚本中心”。

Chrome：

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `C:\Projects\annotation-script-center\extension`。
5. 确认扩展名称显示为“标注脚本中心”。

## 脚本中心控制面板

扩展 options 页面现在按平台管理脚本：

- `Alibaba LabelX`：语音转写、ASR 语音判别。
- `Lightwheel`：查看态面板占位管理。
- `标贝易采`：`标贝易采一检质检`，用于 `roundOneCollect` 页面单条 AI 推荐文本，以及 `group/detail` 页面任务组总表导出。
- 说明：代码目录、API 路径、常量 ID 和环境变量前缀仍保留 `data-baker` / `dataBaker` / `DATABAKER_` 作为历史技术标识。

`标贝易采一检质检` 可在 options 首页单独启停，并在专属设置页配置：

- 后端接口地址由 options 首页顶部“后端接口地址”统一控制（服务器 / 本机），不再在脚本详情页单独配置。
- 数据统计上传属于平台脚本默认能力：已实现统计上传的脚本默认强制启用；已实现定时上传的脚本，定时上传也按脚本规则强制启用，不在脚本详情页提供关闭开关。
- 请求超时时间在 options 中以秒展示，默认 `120` 秒；扩展内部仍按毫秒保存和请求。
- 是否启用 AI 推荐文本。
- 自动每页条数默认启用，进入 标贝易采一检详情页后会尝试设置为 `50条/页`，只改页面分页，不自动提交任务。
- 快捷键配置默认全部未设置，可手动绑定 AI 推荐、复制听音文本、复制推荐文本、填入、忽略、句子判定和任务判定动作；普通输入不拦截，按下已配置快捷键时会先退出输入焦点再执行。
- 标贝易采快捷键运行时会先判断按键是否命中已配置动作，未命中时不阻止输入、不做任何 blur/focus 干预。
- 为避免影响平台音频播放器与波形组件初始化，标贝易采 已移除旧的被动焦点恢复；仅通过“本句话文本变化检测”在平台自动切题后短暂进入输入框再退出，以恢复快捷键焦点。
- 标贝易采 `group/detail?taskId=...` 页面提供“导出数据总表”按钮。导出不再由扩展直接 `fetch queryByCondition`，而是触发页面原生分页查询并由 MAIN world 拦截响应后合并全量 CSV（含 BOM）；导出完成后会自动上传到统一后端保存，上传失败不影响本地下载。

扩展前端只保存接口地址、超时时间、开关、分页和快捷键设置，不保存 API Key、cookie、access token 或完整音频 URL。真实模型密钥仍由后端通过 `config/env/ai.env` 读取。

## ASR 转写当前口径

- `asr-transcription` 已在 2026-05-08 执行“删除旧目录 + 轻量重写”，当前只做基础功能，不做“全自动闭环”。
- 一条音频对应一个完整文本框。
- 当前不实现时间戳、说话人区分、AI 初稿、AI 校对、AI 格式化。
- 保存方式以 LabelX 平台自动保存为准。
- 不新增自定义后端保存接口。
- 不构建、不注入自定义保存 payload。
- 不自动提交、不自动领取、不自动流转。
- 转写脚本不提供旧版独立大表单与页面 overlay 设置面板；当前改为 options 轻量设置面板。
- 转写工具栏改为页面内注入，优先挂载 `.mark-toolbox`，不再默认固定悬浮在页面顶部中央。
- options 转写详情页提供轻量可配置项：自动播放、默认倍速/重置倍速、倍速步进、前进/后退步长、默认音量、当前功能快捷键。
- 转写统计上传与定时上传为脚本默认能力，运行时强制启用，不在转写详情页提供开关。
- popup 状态区分为：已注入等待详情页、运行成功、真正注入失败。
- 转写新增统计导出能力：支持顶部“上传转写统计”手动上传与定时上传（默认 `10:00`、`16:00`）；定时上传在 POST 前随机延迟 `0~300` 秒（`100ms` 步进），手动上传不延迟；后端按 `供应商 + 分包ID` 合并 CSV。
- 转写扩展侧统计文件为 `extension/sites/alibaba-labelx/asr-transcription/transcription-stats-client.js`，只做采集与上传客户端；CSV 落盘与下载服务仅在 `platform-resources/alibaba-labelx/asr-transcription/backend/`。
- 转写统计 CSV 基础列为：`任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`；仅在多供应商时最后追加 `供应商` 列。
- 转写统计后端目录为 `platform-resources/alibaba-labelx/asr-transcription/backend/`，供应商列表地址为 `/api/alibaba-labelx/asr-transcription/statistics/suppliers`，默认下载地址为 `/api/alibaba-labelx/asr-transcription/statistics/download`。
- 转写统计抓取按 `recordCount` 分页，不再固定只拉前 `5` 页、前 `50` 个子任务或前 `300` 条详情。
- 转写详情优先 `pageSize=5000`，并在 `recordCount > 5000` 时继续分页补齐；详情阶段并发按 `Math.floor(total/5)` 动态计算（最小 `1`，最大 `999`，例如 `1854 -> 370`、`8000 -> 999`）。
- 快判首页与详情抓取按 `recordCount` 分页补齐；快判详情保持 `pageSize=400` 口径，详情并发同样按 `Math.floor(total/5)` 动态计算（最小 `1`，最大 `999`）。
- 有效时长仅统计“是否有效”严格等于“有效”的题目时长，不使用 `includes("有效")`。
- 标注员/审核员解析新增 `dataResultHistory` 兜底（优先 `type===0`，否则取最后一条）。
- 供应商识别会先做任务名规范化（`decodeURIComponent` 容错 + 去除 `BOM` + 清理前后空白与全角空格 + 连续空白规整），并生成去空白匹配串，再优先按任务名包含关系识别 `希尔贝壳` / `棋燊`。
- 旧 legacy、保存、提交、批量、自动化、AI、导出、排行榜、整页执行链路已删除。
- 若未来要恢复旧能力，必须按新需求重新设计与验收，不能直接恢复旧脚本。

## CRX 企业发布

- 3.0 起正式发布与自动更新路径统一为 CRX 体系，不再使用 zip 发布清单。
- 正式发布产物固定为三件套：
  - `dist/annotation-script-center-v<version>.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- `dist/` 是构建产物目录，默认不提交 Git（除非任务明确要求提交发布产物）。

1. 先确认 `extension/manifest.json` 包含：

```json
"update_url": "https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml"
```

2. 准备私钥（首次运行会自动生成）：
   - 固定路径：`config/secrets/annotation-script-center.pem`
   - 不提交 Git，必须长期保存并离线备份
   - 丢失会导致 `extension_id` 变化，企业策略 `appid` 需重配

3. 在仓库根目录执行 CRX 发布脚本：

```powershell
node scripts/package-crx-release.js --notes "CRX enterprise release test"
```

脚本会自动：
- 读取 `manifest.version`；
- 使用浏览器 `--pack-extension` 生成 CRX；
- 生成 `update.xml` 与 `crx-latest.json`；
- 校验 `update.xml appid/version/codebase` 与 `extension_id/manifest.version/download_url` 一致；
- 输出要上传到 `downloads` 目录的三个文件路径和 `extension_id`。

浏览器路径选择规则：
- 优先读取 `ASC_CHROME_EXE`
- 未设置时自动尝试：
  - `C:\Program Files\Google\Chrome\Application\chrome.exe`
  - `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
  - `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
  - `C:\Program Files\Microsoft\Edge\Application\msedge.exe`

下载域名可用 `ASC_DOWNLOAD_BASE_URL` 覆盖，默认 `https://script.xiangtianzhen.store/downloads/`。

关键一致性要求：
- `update.xml` 的 `appid` 必须等于 `extension_id`
- `update.xml` 的 `version` 必须等于 `manifest.version`
- `update.xml` 的 `codebase` 必须指向对应版本 CRX 下载地址
- 新版本 CRX 必须持续使用同一 `annotation-script-center.pem`

## 本地后端

在仓库根目录运行：

```powershell
node platform-resources\backend\server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

## 项目数据下载密码配置

项目数据下载不会在代码中保存明文密码。后端只读取密码 SHA256 和 JWT 签名密钥。

创建真实配置文件：

```powershell
copy config\env\backend.env.example config\env\backend.env
```

主推环境变量：
- `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`

兼容旧变量（不推荐新配置继续使用）：
- `ASC_DATA_DOWNLOAD_PASSWORD_SHA256`
- `ASC_DATA_DOWNLOAD_JWT_SECRET`

生成密码 SHA256（PowerShell）：

```powershell
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "你的下载密码"
```

随机生成 JWT_SECRET：

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

填入 `config/env/backend.env`：

```text
ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256=上一步生成的密码hash
ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET=上一步生成的随机字符串
```

本地临时运行（当前终端会话）：

```powershell
$env:ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256="上一步生成的hash"
$env:ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET="一段足够长的随机字符串"
node platform-resources\backend\server.js
```

Windows 用户级持久化：

```powershell
[Environment]::SetEnvironmentVariable("ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256", "上一步生成的hash", "User")
[Environment]::SetEnvironmentVariable("ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET", "一段足够长的随机字符串", "User")
```

设置后请关闭并重新打开 PowerShell，再启动后端。

Linux / 服务器：

```bash
cd /var/www/annotation-script-center
cp config/env/backend.env.example config/env/backend.env
nano config/env/backend.env
pm2 restart annotation-script-center --update-env
```

若接口返回 `project-data-download-auth-not-configured`，表示环境变量未配置，或已配置但当前后端进程尚未读取（通常是未重启进程）。

安全注意：
- 不要把真实密码、真实 hash、真实 JWT secret 写入 README 或提交到 GitHub。
- 下载密码只通过 `POST` body 传给后端校验，不允许放到 URL query。
- 审计日志只记录获取人姓名、IP、数据类型、供应商、时间和 UA，不记录密码和完整 token。
- 不要提交 `config/env/backend.env`、`config/env/backend.local.env`。
- `config/env/backend.env` 与 `config/env/ai.env` 都可用于服务器私有配置，且已被 `.gitignore` 忽略。

当前快判统计接口：

- 上传：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/upload`
- 健康检查：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/health`
- 供应商列表：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/suppliers`
- CSV 下载（总表默认）：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/download`

当前转写统计接口：

- 上传：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/upload`
- 健康检查：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/health`
- 供应商列表：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/suppliers`
- CSV 下载（总表默认）：`http://127.0.0.1:3333/api/alibaba-labelx/asr-transcription/statistics/download`

当前快判 AI 建议接口：

- 健康检查：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/ai/health`
- 建议接口：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/ai/suggest`

当前 标贝易采一检质检 AI 推荐文本接口：

- 健康检查：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend/health`
- 推荐接口：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`
- 扩展默认推荐接口：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`
- 导出健康检查：`http://127.0.0.1:3333/api/data-baker/round-one-quality/export/health`
- 导出上传接口：`http://127.0.0.1:3333/api/data-baker/round-one-quality/export/upload`
- 导出下载接口：`http://127.0.0.1:3333/api/data-baker/round-one-quality/export/download`
- 服务器导出上传接口：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/export/upload`
- 服务器导出下载接口：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/export/download`

标贝易采任务总表导出默认模式（扩展前端）：

- 平台对扩展直接请求 `queryByCondition` 可能返回 `code=51000`。现行方案改为：触发页面原生请求，再由 MAIN world 拦截响应导出。
- 点击导出后会先点击 Element UI 分页大小选择器（优先 `.el-input.el-input--mini.el-input--suffix`）并选择 `100条/页`，再通过分页控件逐页触发平台原生请求并合并导出全量数据。
- 当前导出不需要账号密码配置，CSV 带 UTF-8 BOM，避免 Excel 中文乱码；导出后会自动上传到当前全局后端地址并写入后端 `latest.csv`。
- 导出过程和 CSV 内容不写入 `access_token`、`refresh_token`、cookie、authorization；CSV 已移除“采集ID”列。
- 如果页面下拉未能自动展开或未找到 `100条/页`，可手动切换到 `100条/页` 后重试导出。

## 统一后端环境配置文件

后端启动时会自动读取仓库内固定环境文件，默认不需要每次手动设置系统环境变量。

自动加载顺序：

1. `config/env/backend.env`
2. `config/env/backend.local.env`
3. `config/env/ai.env`
4. `config/env/ai.local.env`
5. `.env.local`
6. 可选 `ASC_ENV_FILE` 指向的外部文件

启动前已经存在的系统环境变量优先级最高，不会被文件覆盖。`ASC_ENV_FILE` 只用于后续多项目共享外部密钥文件，默认不需要配置。

本地使用方式（AI 配置）：

```powershell
copy config\env\ai.env.example config\env\ai.env
```

然后编辑 `config/env/ai.env`，填入真实密钥。

启动统一后端：

```powershell
node platform-resources\backend\server.js
```

服务器使用方式（AI 配置）是在项目目录创建：

```text
/var/www/annotation-script-center/config/env/ai.env
```

填入真实密钥后重启：

```bash
pm2 restart annotation-script-center --update-env
```

真实 `config/env/backend.env`、`config/env/backend.local.env`、`config/env/ai.env`、`config/env/ai.local.env` 不要提交 GitHub；`.env` 和 `.env.*` 也都已加入 `.gitignore`。模板文件 `config/env/backend.env.example`、`config/env/ai.env.example` 可以提交。
当前模板仅保留四类 Provider：阿里百炼（DashScope）、DeepSeek、MiniMax、OpenRouter；不再引导配置 mock 或其他 Provider。

快判 AI 建议说明：

- 当前扩展版本请以 `extension/manifest.json` 的 `version` 字段为准。
- 第一版默认模型：`qwen3-omni-flash`。
- 已预留模型：`qwen3.5-omni-plus`（不默认使用）。
- 已取消 MiniMax 接入，本仓库不包含 MiniMax client。
- 扩展不直连 Qwen，API Key 只放后端环境变量 `DASHSCOPE_API_KEY`。
- 后端发给模型的文本 prompt 只包含 `asrText1/asrText2`，不包含 `projectId/subTaskId/itemId/itemIndex/audioUrl`。
- `audioUrl` 只作为模型音频输入字段，不进入文本 prompt。
- AI 建议默认关闭，只支持“按钮/快捷键分析当前题”，不会自动分析全页。
- AI 建议不自动保存、不自动提交、不自动领取、不自动流转。
- 不记录完整 `audioUrl` 到扩展存储、DOM 属性或日志。
- 请求体传非法 `model` 时，`suggest` 返回 `HTTP 400` 和 `code=invalid-model`。
- 真实 Qwen 联调需要 `DASHSCOPE_API_KEY` 与可公开访问音频 URL；未满足时不能声称真实 suggest 已跑通。

快判 AI 相关环境变量（后端）：

- `DASHSCOPE_API_KEY`：DashScope Key，未配置时服务仍可启动，`health` 返回 `missing-api-key`，`suggest` 返回清晰错误。
- `DASHSCOPE_BASE_URL`：可选，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`。
- `ASR_JUDGEMENT_AI_MODEL`：默认模型，默认 `qwen3-omni-flash`。
- `ASR_JUDGEMENT_AI_TIMEOUT_MS`：请求超时，默认 `120000`。

标贝易采 AI 推荐文本说明：

- 当前目标页面：`https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`。
- 脚本已接入 options “标注脚本中心”，可在 标贝易采 平台区域启停；后端地址统一由 options 首页顶部“后端接口地址”控制。
- 全局模式为服务器时，请求 `https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`；全局模式为本机时，请求 `http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`。
- options 中请求超时时间以秒展示，默认 `120` 秒；运行时仍使用毫秒值。
- 当前只做“单条 AI 推荐文本”，不自动保存、不自动提交、不自动点击合格 / 不合格、不做批量识别或自动流转。
- 标贝易采设置页新增自动每页条数，默认 `50条/页`，运行时会有限重试点击页面原生分页下拉，不改接口参数、不死循环。
- 标贝易采设置页新增快捷键配置，默认全部未设置；支持 AI 推荐文本、复制 AI 听音文本、复制 AI 推荐文本、填入推荐文本、忽略 AI 推荐结果、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 普通输入不会被快捷键拦截；如果焦点仍在 `input`、`textarea`、`select` 或 `contenteditable` 中，只有按下已配置的 标贝易采快捷键时才会自动失焦并执行动作。
- 点击左侧句子、点击平台“确定/合格/不合格/上一条/下一条”或平台自动切换下一条时，脚本不再执行被动 blur/focus，避免干扰音频区域初始化。
- 检测到“本句话文本”发生变化且用户不在手动编辑时，脚本会短暂 focus 该 textarea 再 blur 退出，用于恢复快捷键焦点；普通输入保持原生行为。
- “填入推荐文本”写入“本句话文本”输入框后会立即和延迟退出输入框，方便继续使用快捷键；仍不会自动保存、自动提交或自动点击合格 / 不合格。
- AI 听音文本、AI 推荐文本、复制内容和“填入推荐文本”前会自动删除普通空格、全角空格、Tab 和换行；页面候选文本原文不被修改。
- 推荐卡展示和“填入推荐文本”前会自动补全中文句末标点；英文句末 `.?!;` 会转为 `。？！；`，无句末标点时默认补 `。`。
- 任务判定按钮处于 disabled 时不会绕过平台限制。
- 前端通过页面同源请求和 MAIN world 内存缓存读取当前题数据，不硬编码或持久化 `access_token`、cookie、完整签名音频 URL。
- 扩展前端不保存 API Key，`DASHSCOPE_API_KEY` 仍由后端通过 `config/env/ai.env` 或系统环境变量读取。
- 听音模型请求使用 Qwen-Omni `input_audio` 格式，`data` 为完整音频 URL，`format` 从 URL pathname 后缀推断；听音请求不传 `response_format`，只在 prompt 中要求 JSON 输出。
- 后端原生 `fetch` 请求默认在顶层传 `enable_thinking=false` 尝试关闭 thinking，不再使用 OpenAI SDK 风格的 `extra_body`；如供应商不支持该参数，会自动移除该字段重试一次。
- 如果真实调用返回 HTTP 400，先查看前端错误中的后端脱敏 `summary`，再确认音频 URL 可访问、`requestListen` 使用 `input_audio`、`config/env/ai.env` 中 `DASHSCOPE_API_KEY` 正确。
- 后端已接入闽南方言字词表 CSV：`platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv`，既作为 prompt 上下文，也会默认以 `aggressive` 模式对最终推荐文本做词表强替换；该能力只影响推荐文本展示，不会自动保存或提交。
- 词表括号内容全部视为拼音 / 批注，不参与建议用字或对应华语；CSV 单字映射默认跳过强替换，避免误伤 `家庭` 这类复合词，基础高频单字仍由后端 `BASE_ENTRIES` 显式控制。
- 后端支持 `DATABAKER_AI_PIPELINE_MODE=two_stage|listen_only`：`two_stage` 为听音 + 对比双模型模式；`listen_only` 为极速听音模式，只调用 `qwen3.5-omni-flash` 后做本地词表强替换，仅适合推荐文本展示，不适合自动提交。
- 调用日志同时写入 JSONL 和 CSV；JSONL 保留英文 key 方便程序处理，CSV 新建时使用中文表头，并记录词表改写明细、听音阶段耗时、对比阶段耗时和流水线模式。
- 当前页批量预生成暂不默认执行，后续方案是新增“预生成当前页 AI 推荐”按钮，前端读取当前页 10/50 条记录，后端批量接口限制并发，例如 2，并以内存缓存 `itemId -> result`，当前题优先读缓存，避免成本失控。
- 推荐结果只展示给用户；“填入推荐文本”必须由用户点击触发，且只能写入可安全定位的“本句话文本”输入框。
- 第一版默认模型：听音 `qwen3.5-omni-flash`，对比 `qwen3.5-plus`。

标贝易采 AI 相关环境变量（后端，技术前缀 `DATABAKER_`）：

- `DASHSCOPE_API_KEY`：DashScope Key，未配置时 recommend 返回 `missing-api-key`。
- `DATABAKER_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：请求超时，默认 `120000`。
- `DATABAKER_AI_ENABLE_THINKING`：默认 `0`，后端会在原生 `fetch` 请求体顶层传 `enable_thinking=false`；设为 `1` 时不传该字段。
- `DATABAKER_AI_PIPELINE_MODE`：默认 `two_stage`；设为 `listen_only` 时跳过 `qwen3.5-plus`，只用听音结果和词表改写生成推荐文本。
- `DATABAKER_AI_LEXICON_REWRITE_MODE`：词表最终推荐文本改写模式，默认 `aggressive`；设为 `off` 时只保留 prompt 上下文，不做强替换。
- `DATABAKER_AI_CROP_EFFECTIVE_AUDIO`：预留有效音频裁剪开关，默认 `0`。
- `DATABAKER_AI_CROP_PADDING_SECONDS`：预留裁剪前后补齐秒数，默认 `0.12`。

## 服务器部署

当前服务器信息：

- 服务器 IP：`47.108.254.138`
- 域名：`script.xiangtianzhen.store`
- 项目目录：`/var/www/annotation-script-center/`
- 对外 HTTPS API：`https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/upload`

推荐部署步骤：

1. 上传或拉取仓库到服务器目录：

```bash
cd /var/www/annotation-script-center
git pull
```

1. 确认 Node.js 和 PM2 可用：

```bash
node --version
pm2 --version
```

1. 启动或重启统一后端：

```bash
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
pm2 save
```

如果进程已经存在：

```bash
pm2 restart annotation-script-center --update-env
```

1. Nginx 反向代理到本机 `3333` 端口，站点配置文件示例：

```nginx
server {
    listen 80;
    server_name script.xiangtianzhen.store;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name script.xiangtianzhen.store;

    ssl_certificate /etc/letsencrypt/live/script.xiangtianzhen.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/script.xiangtianzhen.store/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

1. 检查 Nginx 并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

1. 验证接口：

```bash
curl https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/health
```

CSV 下载相关地址：

```text
https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/suppliers
https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/download
```

### 扩展企业更新文件目录

企业发布建议把 CRX 三件套放到服务器 `dist/` 目录，并通过 `/downloads/` 提供下载与更新元数据访问。

服务器文件目录：

```text
/var/www/annotation-script-center/dist/
```

用户访问地址：

```text
https://script.xiangtianzhen.store/downloads/
```

Nginx 配置中需要把 `/downloads/` 放在 `location /` 反向代理之前：

```nginx
location /downloads/ {
    alias /var/www/annotation-script-center/dist/;
    autoindex on;
    autoindex_exact_size off;
    autoindex_localtime on;
    default_type application/octet-stream;
    add_header Cache-Control "no-store";
}

location / {
    proxy_pass http://127.0.0.1:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

注意：

- `alias` 路径和 `location /downloads/` 都要以 `/` 结尾。
- `dist/` 目录里建议只放对外分发的 CRX 三件套：
  - `annotation-script-center-v<manifest.version>.crx`
  - `annotation-script-center-update.xml`
  - `annotation-script-center-crx-latest.json`
- 如果访问 `https://script.xiangtianzhen.store/downloads` 没有尾部 `/` 出现异常，改用 `https://script.xiangtianzhen.store/downloads/`。
- 配置后执行 `sudo nginx -t` 和 `sudo systemctl reload nginx`。
- 验证目录列表：`curl -I https://script.xiangtianzhen.store/downloads/`。
- 验证 CRX：`curl -I https://script.xiangtianzhen.store/downloads/annotation-script-center-v<manifest.version>.crx`。
- 验证 update.xml：`curl -I https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml`。

## 维护规则

- 当前项目为单人维护项目。
- 执行类任务验证通过后默认 `git add` / `git commit` / `git push` 到 `main`。
- 只读审计、验证失败、用户明确禁止提交时不提交。
- 默认不创建分支、不创建 PR。
- Codex push 后默认由网页端指挥 AI 直接通过 GitHub 验收。
- 复杂任务优先使用 subagent / parallel agents。
- 所有 Markdown 文档使用中文。
- 有功能、目录结构、模块归属、选择器或验证步骤变化时，同步更新相关 README 和根目录 `log.md`。
- 修改 `manifest.json` 后必须确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 修改 JS 后运行 `node --check` 检查变更文件。

## 0.2.11 中文乱码修正（CSV 健康值合并）

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
- 统计 CSV 写入统一为 **UTF-8 with BOM**，提升 Excel 直接打开时的中文兼容性。
- CSV 写出前会清理关键字段（任务名称、标注员/审核员、供应商）的前后空白、BOM、零宽字符。
- 若旧 CSV 中存在 `�`（U+FFFD）损坏值，合并时优先采用新 payload 的健康值覆盖旧损坏值。
- 当 `供应商` 为 `未识别供应商`、`unknown-supplier`、空值或包含 `�` 时，必须回退到任务名称重新推断。
- LabelX 转写已知供应商仍按任务名优先识别：包含 `棋燊` -> `棋燊`，包含 `希尔贝壳` -> `希尔贝壳`。
- 主存储继续保持根级总表：`statistics-data/statistics-merged.csv`。
- 不主动生成 `statistics-data/suppliers/`，历史残留目录不作为主输出。
- 转写与快判后端都使用同一套“中文清洗 + 健康值优先”策略。
- 日志与错误信息继续脱敏，不记录 cookie、token、authorization、完整音频 URL。


## 0.2.11 导出完整性与断点跳过增强

- 当前版本保持 `0.2.11`，本轮不升级 `0.2.12`。
- 统计以 `分包ID` 作为关键定位点：分包ID 为空的数据直接废弃，不写入 CSV、不上传。
- 后端新增 existing 检查接口（转写/快判）：
  - `POST /api/alibaba-labelx/asr-transcription/statistics/existing`
  - `POST /api/alibaba-labelx/asr-judgement/statistics/existing`
- 导出前先检查已有根级总表 `statistics-data/statistics-merged.csv`：
  - `complete=true` 的分包数据直接跳过详情拉取。
  - `complete=false` 或不存在的数据继续拉取详情并重试。
- existing 检查失败时回退全量拉取，不阻断导出流程。
- 失败数据定义调整为：分包ID为空（废弃/拒绝）、详情请求失败、JSON解析失败、上传请求失败等真正失败；字段空白默认记为 warning/incomplete，不计入 failed。
- 结束时若存在失败数据，提示：`有数据导出失败，请再次点击导出`。
- 再次点击导出时会优先跳过已完整数据，重点补失败/不完整数据。
- 动态并发规则统一为：`Math.floor(total / 5)`，最小 `1`，最大 `999`。
- 转写与快判进度条都展示：阶段、完成/总数、并发、成功、失败，并支持 skipped/discarded 摘要。
- 定时上传时间统一：每天 `10:00`、`16:00`。
- 定时上传到服务器前新增随机延迟：`0~300` 秒、`100ms` 步进；手动上传不延迟。
- CSV 主存储继续为根级总表：`statistics-data/statistics-merged.csv`；不主动生成 `statistics-data/suppliers/`。
- CSV 继续使用 UTF-8 with BOM，单供应商不输出“供应商”列，多供应商在最后一列输出“供应商”。
- 全流程继续脱敏：不记录 cookie、token、authorization、完整音频 URL。

## 2026-05-10 0.2.11 失败判定修正
- LabelX 统计按标注/审核分角色逐步合并：另一角色字段为空属于正常情况，不再判失败。
- 只有 `分包ID` 为空时才直接废弃（discardedNoBatchId），不写 CSV、不上传。
- `任务名称/任务ID/人员/领取时间/提交时间/有效时长` 为空默认记为 warning/incomplete，不阻断上传。
- 批量上传改为“部分失败不影响成功数据保存”，后端返回 `acceptedCount/rejectedCount/rejectedItems`。
- 结束提示规则：仅当 `failed > 0` 才提示“有数据导出失败，请再次点击导出”；仅 warning 时提示“部分字段待后续角色补齐”。
- existing `complete` 按当前 role 最小条件判断：转写 `label=标注子任务ID`、`audit=审核子任务ID`；快判 `label=任一标注员子任务ID`、`audit=审核子任务ID`。
- 统计主存储继续为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 并发规则保持 `Math.floor(total / 5)`，最小 `1`，最大 `999`；定时上传保持 `10:00/16:00`，上传前随机延迟 `0~300s`（`100ms` 步进）。


## 2026-05-10 0.2.11 complete/跳过修正
- `existing` 接口中 `exists=true` 不等于 `complete=true`；只有满足最低完整条件才可跳过。
- 转写 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID`。
- 快判 `complete` 最低要求：`分包ID + 任务名称 + 任务ID + 题数 + 当前 role 对应子任务ID（label 为任一标注员槽位ID）`。
- 任务名称为空不算失败，但必须判为 `complete=false`，下次导出继续拉详情补齐。
- `exists=true && complete=false` 必须继续拉详情与上传，不计入 `skippedComplete`。
- 无待上传数据（`payloads.length=0`）时不调用 `/statistics/upload`，提示“已全部完整，无需上传”。
- 上传进度板块宽度已增大（`min-width:560px`、`max-width:780px`、允许换行），四位数成功/失败数量可见。
- 主存储仍为根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 版本保持 `0.2.11`。

## 2026-05-10 0.2.11 待补任务名称与进度样式修正

- 版本继续保持 `0.2.11`。
- `existing` 语义继续明确：`exists=true` 不等于 `complete=true`。任务名称为空不算失败，但必须判为 `complete=false`，下次继续补齐。
- 转写任务名称补齐链路改为健康值优先：`detail -> summary -> taskMap`，且 `detail` 空值不得覆盖 `summary/taskMap` 的健康值。
- 转写后端合并改为优先复用同 `分包ID + role + subTaskId` 的旧行，确保新任务名称能覆盖旧空值，不再残留“始终空任务名称”行。
- 进度条改为水平居中，完成态与进行中保持同一紧凑卡片布局；4 位数成功/失败统计可见。
- 无待上传数据时不调用 upload，显示“已全部完整，无需上传”。
- 主存储继续为根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。

## 2026-05-10 0.2.11 进度悬浮窗样式小修

- 版本保持 `0.2.11`，本轮仅优化前端进度显示样式，不调整统计业务逻辑。
- `shared/progress-indicator.js` 改为页面顶部居中悬浮窗（fixed）显示，不再挤占 LabelX 顶部导航区域。
- 进行中/完成/失败统一使用同一紧凑卡片布局，完成态不再出现横向绿色长条。
- 转写与快判上传按钮不再写入长 `title` 文案，悬停不再出现黑色长 tooltip。
