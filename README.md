# 标注脚本中心

本仓库用于维护“标注脚本中心”浏览器扩展与配套平台资料。

## 项目定位

- 当前阶段：Chrome / Chromium MV3 单源码扩展 + 多平台脚本增强阶段。

* 当前扩展版本：以 `extension/manifest.json` 为准。
* 当前版本（待发布口径）：`v0.4.0`。
* 扩展源码目录：`extension/`（Chrome / Edge 共用同一套运行时代码）。
* 统一后端入口：`platform-resources/backend/server.js`。

## v0.4.0 当前状态

- 当前开发口径已提升到 `0.4.0`，用于承接 options 工作台视觉重构与系统管理后台收口。
- `v0.3.7` 仍是最近一次正式发布版本；在下一次 `ASC_RELEASE` 前，发布产物与 Git tag 仍保持 `v0.3.7`。
- Magic Data 双助手（客家话/闽南语）已完成同平台互斥、AI 面板统一（模型方案 + 识别策略）、审核页支持与 options 保存稳定性修复。
- 客家话助手默认配置已按评测结论落地：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，thinking 当前已全局固定关闭。
- 客家话助手当前改为优先依赖 AI prompt 约束：普通中文必须输出简体，命中客家话词表统一用字时再保留对应写法；不再依赖本地后端结果二次繁转简。
- Aishell Tech 已完成独立闽南语助手三板块第二轮优化：`/mytask/mark` 当前使用 `转换 / 听音 / 比较` 三个独立 AI 板块；转换改为“规则优先 + 歧义时 AI 兜底”，默认直接按 `minnan-lexicon.csv` 的 `对应华语 -> 建议用字` 做最长匹配替换。默认组合当前为 `转换 qwen3.5-plus + 听音 qwen3.5-omni-flash + Qwen 比较 qwen3.5-plus`；比较切到 Omni 时，仍保持独立的第三段 Omni 比较请求。结果区当前展示 `转换文本`、`听音文本`、`推荐文本`，不再沿用旧“模型方案 + 识别策略”口径。
- DataBaker CVPC 已接入 beta 专属 `柳州话脚本`：当前只在 `/app/editor/asr/` 生效，已通过页内观察桥 + 多级回退获取当前音频签名 URL、`GET /httpapi/user/meta` 最小用户快照，以及页面真实 `annotation/*` 请求里的最小鉴权头。助手区当前嵌入右侧 `全局标注` 卡片并收口为连续紧凑信息区，优先插入 `.label_title_border2` 内容流，右侧只保留状态与当前音频摘要。中间 `普通话顺滑` 下方当前改为 `柳州话 AI 识别助手`，固定按 `当前段识别 / 批量识别 / 分段建议 / AI信息` 4 个分区展示；字段区只保留 `修正后的柳州话文本 / 整理后的普通话文本` 两张最终结果卡。`AI信息` 当前默认折叠但始终保留，失败态也不会消失；内部固定顺序展示 `听音识别 / 文本修正 / 音频听出的柳州话文本 / 特殊标签 / 需人工复核 / 备注 / AI 返回原始内容`，两段 AI 信息只显示 `模型 / 输入 / 输出`，不再展示总 token 汇总。当前中间 AI 区已新增 v1 `批量识别并自动填入`，并补上页内开关 `生成后自动应用分段建议`，默认开启；只有用户手动点击 `生成分段建议` 后才会触发自动应用，失败时保留 preview 不自动刷新。批量入口当前默认显示 `全部 + 段号选择框`，默认全选当前音频全部段，支持点击单段与拖动连续选择；前端固定并发 `5`、错峰 `50ms`，允许 AI 结果乱序返回；整批结束后只把成功段一次性构造成文本版 `save_increment` 写回平台，成功后刷新当前页一次。当前段 AI 推荐严格按页面 `.xaudio_time` 的 `开始 / 结束` 裁剪当前选中段音频，浏览器端直接转成 Base64 `audioDataUrl` 后调用现有 staged AI recommend；分段建议当前改成“前端只传 `audioUrl + 阈值 + 前后补偿`，后端 Python 直接整音频分段预览”，默认按“静音 `>=0.4s`、阈值 `-27 dB`、支持切换 `% / Val`、前后补偿默认 `0.2s` 且可调 `0 ~ 1.5s`”生成建议，并通过 `miniaudio` 解码 mp3；点击 `应用分段建议` 时会优先按最新 `annotation/annos` 构造并直写平台 `save_increment`，新增 `crypto.getRandomValues + timestamp` 的 `unique_id` 生成与保存体去重预检；如果本地或平台侧仍出现 `unique_id重复`，当前会保留 preview 并停止 DOM 回退。当前 AI 调用已接入系统管理 `AI 请求记录` 导出，并额外记录 `AI 调用使用人`、平台用户 `data.name / data.user_id` 与作业基础信息。固定边界仍是：不自动提交、不自动切下一条；批量能力也只作用于当前音频 / 当前作业，只有用户主动点击批量入口或 `应用分段建议` 时才会尝试平台保存链路。
- DataBaker CVPC 柳州话批量 hotfix（2026-06-10）：批量开始按钮当前复用 `当前段 AI 推荐` 同款橙色样式；写回前只校验 live `selectedEntryName`，并在识别当前文件名时避开左侧 `音频列表` 中的 `.mp3` 文本，减少“当前页面分段状态已变化”误报。旧版 Network 里看到的多条相同 `GET /httpapi/annotation/annos` 属于状态读取，不是多次 `save_increment` 保存。
- DataBaker CVPC 柳州话批量热修补充（2026-06-10）：`批量识别状态` 当前直接显示固定并发 `5`；最终文本写回当前按成功段逐段对齐 latest rows，优先对齐 `uniqueId`，对不上时回退按锁定的 `selectionKey(start/end)` 近似匹配，不再要求 latest `annotation/annos` 全量 `unique_id` 列表与启动快照完全一致；目标段缺少文本 attr 时会复用同音频其他段或模板字段定义补齐后再写回；当当前音频所有段都为空白时，会回退使用脚本已知的文本字段 `unique_id` 兜底写回。
- DataBaker CVPC 柳州话脚本当前已补两个基础页面辅助开关，默认都开启，可分别屏蔽编辑页里固定文案“您正在编辑该作业,不能打开新的Tab页”和“系统进入暂停状态”的高层提示，仅精确命中这两类文案，不扩大到其他 `.tips` 提示。

## v0.4.0 开发中（Options 工作台视觉重做）

- `extension/options/options.html` 仍保持单入口，但当前前端路由已切到 query 驱动：
  - `?view=center`
  - `?view=downloads`
  - `?view=script&script=<scriptId>`
  - `?view=admin&tab=overview|backend|exports`
- options 当前拆成两层结构：
  - `功能面板`：默认直接进入，只展示平台、脚本状态、启停入口和脚本详情入口。
  - `脚本下载中心`：公开可进入的扩展版本下载页，默认突出最新版，历史版本通过下拉框切换。
  - `系统管理`：进入时需要输入密码；统一承载后端设置、数据导出和已合并运行统计的系统仪表盘。
- 功能面板本轮已改成更明确的功能页样式：
  - 左侧固定工作台导航与运行概况
  - 右侧浅色运营后台主视觉 + 平台功能模块
  - 主内容区按窗口剩余宽度自适应展开，不再固定缩在页面中间
  - 左上角品牌位改为复用 `extension/assets/brand/asc-logo.svg`，侧栏移除“页面边界”说明卡
  - 平台左侧摘要不再显示“生效 x / y”，改为显示当前或默认启用脚本
  - 平台域名标签改为可点击入口，优先按平台显式 `entryUrl` 在新标签页打开，缺失时才回退到 `matches` 推导根地址
- 功能面板顶部新增 `编辑顺序 / 完成编辑` 工具条；进入编辑模式后可直接按住整个平台区块上下拖动，并把顺序保存到 `settings.meta.publicCenterPlatformOrder`
- 编辑模式下的平台块当前改为自定义跟手拖拽：真实平台卡片会跟随鼠标移动，在目标平台区域停留约 `0.2s` 后，周围平台块会自动让位并带纵向滑移动画
  - 平台卡改成三层纵向工作台：
    - 顶层保留平台名、副标题、平台入口和默认启用脚本
    - 中层保留该平台下脚本标题、状态和启停 / 详情按钮
    - 底层整行展示单块浅蓝中性“项目备注”
  - 平台右侧脚本区当前改成真正的流式脚本卡：
    - 宽屏每行最多 `3` 个脚本卡
    - 中屏自动回落到 `2` 列
    - 窄屏回落到 `1` 列
  - 平台摘要卡删除“统一收口到功能面板”这类说明性正文；脚本卡底部不再显示“匹配入口 / 入口”元信息
- 平台入口显示与跳转当前优先走显式字段：
  - `标贝易采`：`datafactory.data-baker.com/v2`
  - `Abaka AI`：`abao.fortidyndns.com:30473`
- “后端根地址 / AI 调用使用人 / 项目数据下载 / AI 请求记录导出”已从公开首页迁入系统管理页；公开首页不再保留隐藏高级区。
- 系统管理中的“后端设置”当前统一维护三套可切换根地址：
  - `server`
  - `local`
  - `beta`（仅 beta 解锁后显示）
  - 当前模式切换后，所有运行时 API 与 `/downloads/` 入口都会严格跟随当前根地址，不再自动回退到其他环境。
- 左侧固定侧栏当前新增 `AI 调用使用人` 编辑卡：输入姓名后点击按钮才保存到本地缓存；运行概况中仍保留只读摘要，未填写时显示“未设置”。
- `?view=admin&tab=overview` 当前会同时请求总览接口和运行日志接口，仪表盘默认每 `60` 秒自动刷新一次，也支持顶部“刷新数据”手动刷新。
- 仪表盘当前固定展示三块：
  - 模型池占用
  - 最近 `24` 小时日志统计概况
  - 最近运行日志（默认近 `20` 条）
- 运行日志由后端写入 `platform-resources/backend/admin-dashboard/runtime-data/runtime-YYYY-MM-DD.jsonl`，默认保留 `7` 天；PM2 重启后仍可读取近 `7` 天内的历史日志，但不会直接读取 PM2 stdout/stderr。
- 模型池当前按“总容量”解释，不再展示旧的技术缩写：
  - `正在处理`：已经发往后端执行中的请求数
  - `等待处理`：正在池内排队、尚未发出的请求数
  - `池容量`：单个模型池最多同时容纳的总请求数，当前默认 `999`
  - `剩余可接收`：当前还能继续进入该模型池的请求数
- 脚本详情页当前统一收口为真正的工作台布局：
  - 启停操作单独置顶为整宽卡片
  - 启停区下方固定按 `基础设置 -> AI 设置 -> 快捷键` 顺序进入层叠工作台
  - 当前采用“两条独立纵轨”的自由高度布局：
    - `基础设置` 位于左侧主轨顶部
    - `AI 设置` 位于右侧辅助轨顶部，并按自身内容自然增高
    - `快捷键` 位于左侧主轨下方
  - 左右两轨不再共享等高行轨；右侧 `AI 设置` 不会再被左侧基础设置拉成长白板
  - 缺失某个板块时其余板块按顺序前移；只剩 1 个板块时保持左半宽，不撑满整行
  - `快捷键` 板块当前统一复用 options 共享组件；所有脚本都走同一套可录制模板
- 当前所有脚本的默认快捷键统一为空；只有用户在 options 中显式保存后，运行时才会响应对应键位
- DataBaker 与 Aishell 两个闽南语助手当前已共用固定顺序的右侧 `AI 设置` 模块；`AI 连续填入并发数量` 统一放在该区域，默认值统一为 `5`。
- ASR / AI 相关设置当前默认直接展示，不再保留“连续点击标题 10 次才显示”的旧解锁交互。
- 系统管理密码当前复用项目数据下载密码环境变量：
  - `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256`
  - `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET`
- 系统管理中的“数据导出”当前支持两类导出：
  - 项目数据下载
  - AI 请求记录导出（按脚本，可选日期范围）
- “脚本下载中心”当前已经独立为公开下载页：
  - 默认突出最新版 CRX
  - 历史版本放入下拉框选择
  - 选中版本后按存在性展示 `CRX` 主下载按钮和可选 `ZIP` 次下载按钮
  - 保留“查看外部目录”作为兜底入口
  - 后端通过 `GET /api/admin/download-center/releases` 聚合 `crx-latest.json` 和远端 `/downloads/` 目录索引；目录索引失败时至少回退展示最新版
  - 该接口当前为公开可读，不要求先进入系统管理
- 本轮 beta 构建口径已收口为“测试通道默认隐藏”：
  - 本地直接加载 `extension/` 时，默认按 beta 通道构建运行，但 beta 平台和 beta 脚本默认隐藏
  - beta 包不进入“脚本下载中心”，只通过“查看外部目录”获取
  - beta 通道需连续点击左上角品牌图片 `7` 次并输入正确口令后，才增量显示 beta 平台、beta 脚本与 `Beta 服务器`
  - 正式包继续只展示公开平台与公开脚本；`Lightwheel` 在正式包前端保持不可见，也不参与对应板块渲染

## v0.3.7 发布说明

- 当前正式发布版本：`v0.3.7`
- 发布产物：
  - `dist/annotation-script-center-v0.3.7.crx`
  - `dist/annotation-script-center-v0.3.7.zip`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- Git 发布标记：
  - `v0.3.7`
- 后续每次版本完成时，统一追加 Git tag，用于提供稳定下载地址与版本定位。

## 协作摘要

- 网页端默认以 `.md` 文件下载方式输出 Codex Prompt，不再默认在聊天消息中直接贴完整 Prompt。
- 任务依赖截图、文件、日志、Network、Console、原始 JSON、音频样例等资料时，网页端应先提醒用户上传，并提示脱敏要求。
- 业务词表当前统一进入 `JSON 主词表 + CSV/XLSX 参考源 + 用户自行维护词条内容` 模式；处理词表时默认先输出“单份词表逐个交给网页端 AI”的处理 Prompt，再由用户回传整理后的 JSON。
- Git commit message 使用中文；允许保留英文范围标识，但描述必须是中文。
- 默认不自动提升 patch 版本；只有用户明确要求“完成当前版本 / 打包 / 发布 / 升版本”时，才调整 `manifest.version`。正式发布仍使用 `ASC_RELEASE`。
- 同一模块中重复代码超过 2 次时应优先抽取复用；新增样式优先变量化，有 SCSS 构建链时优先 SCSS。
- options 详情页的快捷键区必须复用 `extension/options/options-shared-shortcut-panel.js`，不得再从头拼快捷键列表模板。
- 快捷键默认值统一为空，不再为单个平台保留固定只读键位或“恢复默认键位”口径。
- 详细项目级规则见 `AGENTS.md` 与 `docs/rules/project-collaboration-rules.md`。

## 当前重点平台与脚本

- 平台：Alibaba LabelX、标贝易采、DataBaker CVPC（柳州话脚本 beta 已接入，当前音频签名 URL、`user/meta` 最小用户快照和 `annotation/*` 最小鉴权头都通过页内观察桥 + 多级回退获取；右侧已收口为 `全局标注` 内 `.label_title_border2` 的紧凑信息区，中间 `普通话顺滑` 下方当前改为 `柳州话 AI 识别助手`，固定展示 `当前段识别 / 批量识别 / 分段建议 / AI信息` 四块内容；`AI信息` 默认折叠但失败态也保留，阶段信息只显示 `模型 / 输入 / 输出`；当前段 AI 推荐走 Base64 `audioDataUrl` staged 链路，并已接入系统管理 `AI 请求记录` 导出；分段建议当前改成“前端只传 `audioUrl + 阈值`，后端 Python 直接生成整音频建议段”，点击 `应用分段建议` 时优先直写平台 `save_increment`，仅增量补切直写失败时回退页面内 DOM 分段）、Magic Data ANNOTATOR、Abaka AI（Task21助手：快捷键、AI 辅助填写、Prompt 规则、列表页统计入口）、Aishell Tech（闽南语助手已接入，当前业务能力仅在 `/mytask/mark` 生效）。
- 当前 CSV 对接字段口径：
  - LabelX 快判/转写：`有效时长(秒)_S` 与人员 `_P` 字段。
  - DataBaker 一检：`有效合格时长_S` 与 `质检人_P` 字段。
- LabelX 历史 CSV 修复脚本：`node platform-resources/alibaba-labelx/backend/legacy-csv-repair.js --dry-run`（运行数据目录修复，不提交 Git）。
- 脚本：
  - `extension/sites/alibaba-labelx/asr-judgement/`
  - `extension/sites/alibaba-labelx/asr-transcription/`
  - `extension/sites/data-baker/round-one-quality/`
  - `extension/sites/magic-data/`（`hakka-helper` + `minnan-helper`）
  - `extension/sites/abaka-ai/task-page/`（Task21助手 + 页面结构/Network 脱敏采集）
- Aishell Tech 当前目录：
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/network/README.md`
  - `platform-resources/aishell-tech/page-structure/README.md`
- DataBaker CVPC 当前目录：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/README.md`
  - `platform-resources/data-baker-cvpc/network/README.md`
  - `platform-resources/data-baker-cvpc/page-structure/README.md`

## 本地加载扩展

Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `C:\Projects\annotation-script-center\extension`

Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `C:\Projects\annotation-script-center\extension`

本地直加载 beta 口令同步：

```powershell
node scripts/sync-local-build-meta.js
```

- 该命令会把本地 `config` 中的 beta 口令 hash 与 beta 后端地址写入 `extension/shared/build-meta.local.js`
- 开发者模式直加载前建议先执行一次；否则点击隐藏入口时会提示“当前 beta 包未配置口令，无法解锁”

## 本地启动后端

在仓库根目录运行：

```
node platform-resources\backend\server.js
```

默认监听：

```
http://127.0.0.1:3333
```

## 服务器部署与重启

默认服务器目录示例：

```
/var/www/annotation-script-center
```

实际目录以服务器部署目录为准。\
PM2 进程名示例：`annotation-script-center`。

首次启动后端服务：

```
cd /var/www/annotation-script-center
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

更新代码并重启：

```
cd /var/www/annotation-script-center
git pull origin main
pm2 restart annotation-script-center --update-env
```

只修改环境变量时重启：

```
cd /var/www/annotation-script-center
pm2 restart annotation-script-center --update-env
```

查看状态和日志：

```
pm2 status
pm2 logs annotation-script-center --lines 100
```

如需删除并重建 PM2 服务：

```
cd /var/www/annotation-script-center
pm2 delete annotation-script-center
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

后端直接启动命令：

```
node platform-resources/backend/server.js
```

统一后端会读取以下环境配置文件（系统环境变量优先级最高）：

- `config/env/backend.env`
- `config/env/backend.local.env`
- `config/env/ai.env`
- `config/env/ai.local.env`
- `.env.local`
- `ASC_ENV_FILE` 指向的外部文件

安全说明：

- 不要提交真实 `backend.env`、`ai.env`、`local.env`。
- `config/env/ai.env`、`config/env/ai.local.env` 只保留真实密钥和少量非默认覆盖项；代码默认值才是主来源。
- 不要提交 API Key、cookie、token、authorization、JWT secret、CRX 私钥。
- 修改环境变量后必须执行 `pm2 restart annotation-script-center --update-env`，否则新变量可能不生效。

## 默认时间规则

- TTS 自动清除默认时间统一为 `60000ms`。
- AI / 模型请求默认超时时间统一为 `60000ms`。
- 该默认规则已写入仓库根目录 `AGENTS.md`。
- 用户在脚本高级设置中手动保存的非默认超时值应继续保留。
- 非 AI 模型类的上传、下载、统计与普通后端接口超时不受该规则影响。

### Fun-ASR 默认 REST provider 与 Python fallback

核心说明：

- 统一后端启动命令始终是：`node platform-resources/backend/server.js`
- PM2 / systemd 也只是管理这个 Node 后端进程，不管理独立 Python 服务。
- Fun-ASR 默认 provider 已改为 Node RESTful API：由 Node 后端直接提交异步任务并轮询任务状态。
- Python 不单独启动；Python SDK 只保留为 fallback / 调试方案，不再作为默认主链路。
- DataBaker 当前有两种识别模式：
  - `two_stage`：显示“听音模型 + 比较模型”
  - `omni_single`：只显示“AI 模型”
- `two_stage` 且听音模型选择 `fun-asr` 时，默认走 Node REST 单条调用，不依赖 Python 虚拟环境。
- `omni_single` 以及 `two_stage + Qwen Omni` 都不依赖 Python 虚拟环境；当前 DataBaker Omni 可选模型包含 `qwen3.5-omni-plus`、`qwen3.5-omni-flash`、`qwen3.5-omni-flash-2026-03-15`、`qwen3-omni-flash`、`qwen3-omni-flash-2025-12-01`、`qwen3-omni-flash-2025-09-15`。
- Fun-ASR REST 是异步任务模式：
  - 提交任务：`POST /api/v1/services/audio/asr/transcription`
  - 查询任务：`POST /api/v1/tasks/{task_id}`
- 本轮只启用单条 REST 调用，不启用 `file_urls` batch。
- DataBaker 单条“AI 推荐文本”默认改为短请求创建 `POST /api/data-baker/round-one-quality/ai/recommend/jobs`，再轮询 `GET /jobs/:jobId`。
- DataBaker “AI并发分析并连续填入合格项”默认也走同一 jobs 链路。
- 当前页有 N 条合格项，就会为 N 条任务发送对应请求。
- 前端默认按 `50ms` 错峰发起，确保 1 秒内发出的建任务请求不超过 `20` 次；DataBaker 与 Aishell 的“AI 连续填入并发数量”当前都统一放在右侧 `AI 设置` 区域，并按当前模型动态归一：
  - Omni：默认 `5`，范围 `1~25`
  - Fun-ASR：默认 `5`，范围 `1~50`
- 前端和后端都会对超范围并发值做归一；前端显示和后端诊断都以归一后的值为准。
- 谁先返回，谁先进入待填队列；填入仍然顺序消费。
- 后端 provider queue / RPM 限流继续保护上游；同步 recommend 如保留，仅作为历史兼容 / 调试入口。
- DataBaker `qwen3.5-omni-flash` / `qwen3.5-omni-plus` 及新增 Omni 版本当前默认优先走 Omni legacy 快速路径，参考提交 `9677e4cea98de222b70f89c9e0af1d89971dc471`；默认按前端并发直接请求 Qwen，上游不再做后端平滑排队，除非显式设置 `DATABAKER_AI_QWEN_SMOOTH_ENABLED=1`。
- `fun-asr` 仍走当前 Node REST provider，不走 Omni legacy 快速路径。
- 统一 Python 虚拟环境固定放在 `platform-resources/backend/.venv`。
- Fun-ASR Python 脚本固定放在 `platform-resources/backend/ai/python/funasr_client.py`。
- Fun-ASR Python 依赖固定放在 `platform-resources/backend/ai/python/requirements.txt`。
- `platform-resources/backend/ai/python/requirements.txt` 现包含 `opencc-python-reimplemented`，用于 Fun-ASR 源头繁转简。
- DataBaker 闽南词表参考资料固定放在 `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`。
- DataBaker 后端业务层当前收敛为 `ai-routes.js + ai-service.js`；公共 provider、队列、缓存和 Python 辅助脚本统一在 `platform-resources/backend/ai/`。
- `DATABAKER_AI_FUN_ASR_PROVIDER=rest` 时，Node 不会启动 Python 子进程。
- `DATABAKER_AI_FUN_ASR_PROVIDER=python` 时，Node 后端调用 Fun-ASR Python 子进程会显式设置 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`。
- `platform-resources/backend/ai/python/funasr_client.py` 仍会按 UTF-8 输出 stdout JSON，避免 Windows 默认控制台编码导致“AI 听音文本”出现 `�` / 黑菱形乱码。
- Fun-ASR 若返回繁体或繁简混合字形，默认 REST 链路会在 DataBaker 结果组装阶段统一繁转简；若显式切到 Python provider，则还会先在 Python 阶段做一次繁转简。
- `platform-resources/backend/ai/model-catalog.js` 现在作为百炼核心模型的统一注册表，集中维护：
  - 文本：`qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`
  - 多模态：`qwen3.5-omni-plus`、`qwen3.5-omni-flash`
  - 语音识别：`fun-asr`
- `platform-resources/backend/ai/model-dispatcher.js` 统一按模型名派发运行时；默认 `JS 优先，Python 备用`。
- `platform-resources/backend/ai/python/qwen_openai_client.py` 已加入统一 Python 辅助脚本目录，用于 Qwen OpenAI-compatible 文本/Omni 的 Python 备用链路。
- `阮 / 汝 / 伊 / 诶` 等命中闽南词表的建议用字会被保护，不会被普通繁简转换覆盖。
- 不再使用 `platform-resources/backend/.venv-funasr`。
- 不再使用 `platform-resources/data-baker/round-one-quality/backend/.venv-funasr`。
- `platform-resources/backend` 是统一后端聚合目录，所以 Python 辅助环境也放这里统一管理。

默认 REST provider 相关环境变量：

```
DATABAKER_AI_FUN_ASR_PROVIDER=rest
DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=
DATABAKER_AI_FUN_ASR_REST_BASE_URL=
DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS=1000
```

Python fallback / 调试环境只在以下情况需要准备：

- `DATABAKER_AI_FUN_ASR_PROVIDER=python`
- 或显式设置 `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK=python`

Windows 本地准备（仅 Python fallback / 调试时需要）：

```
cd C:\Projects\annotation-script-center\platform-resources\backend
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -U pip
.venv\Scripts\python.exe -m pip install -r ai\python\requirements.txt
node server.js
```

Linux 服务器准备（仅 Python fallback / 调试时需要）：

```
cd /var/www/annotation-script-center/platform-resources/backend
python3 -m venv .venv
.venv/bin/python -m pip install -U pip
.venv/bin/python -m pip install -r ai/python/requirements.txt
node server.js
```

如果使用 PM2，仍然只重启 Node 后端：

```
pm2 restart annotation-script-center --update-env
```

可选环境变量：

- `DATABAKER_AI_FUN_ASR_PROVIDER` 默认 `rest`。
- `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK` 默认空；仅显式设为 `python` 时，REST 失败后才允许退回 Python。
- `DATABAKER_AI_FUN_ASR_REST_BASE_URL` 可选；留空时按 `DASHSCOPE_BASE_URL` 推导到 `/api/v1`。
- `DATABAKER_AI_FUN_ASR_POLL_INTERVAL_MS` 默认 `1000`。
- `DATABAKER_FUNASR_PYTHON_BIN` 一般不需要配置，仅 `provider=python` 时使用。
- `provider=python` 且 `DATABAKER_FUNASR_PYTHON_BIN` 留空时，后端自动使用 `platform-resources/backend/.venv`。
- `requirements.txt` 位于 `platform-resources/backend/ai/python/requirements.txt`。
- 上面的 `pip install -r ai/python/requirements.txt` 命令是在 `platform-resources/backend` 目录内执行。
- 如服务器 Python 路径特殊，且显式切到 `provider=python`，可设置：
  `DATABAKER_FUNASR_PYTHON_BIN=/var/www/annotation-script-center/platform-resources/backend/.venv/bin/python`
- Windows 本地同理：
  `DATABAKER_FUNASR_PYTHON_BIN=C:\Projects\annotation-script-center\platform-resources\backend\.venv\Scripts\python.exe`

迁移提醒：

- 新部署推荐直接创建 `platform-resources/backend/.venv` 并重新安装依赖。
- 旧服务器如果还在使用 `.venv-funasr`，可以临时把 `DATABAKER_FUNASR_PYTHON_BIN` 指向旧路径过渡，但默认口径已统一为 `.venv`。

可选验证，不是启动步骤：

Windows：

```
cd C:\Projects\annotation-script-center\platform-resources\backend
.venv\Scripts\python.exe -m py_compile ai\python\funasr_client.py
```

Linux：

```
cd /var/www/annotation-script-center/platform-resources/backend
.venv/bin/python -m py_compile ai/python/funasr_client.py
```

验证接口：

```
GET /api/data-baker/round-one-quality/ai/recommend/health
GET /api/data-baker/round-one-quality/ai/recommend/defaults
```

期望：

- `defaults` 返回 `listenModelOptions` 和 `compareModelOptions`。
- `listenModelOptions` 包含 `fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`、`qwen3.5-omni-flash-2026-03-15`、`qwen3-omni-flash`、`qwen3-omni-flash-2025-12-01`、`qwen3-omni-flash-2025-09-15`。
- `compareModelOptions` 包含 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`。
- `funAsrModel` 为 `fun-asr`。
- `funAsrProvider` 默认 `rest`。
- `funAsrRestConfigured` 与 `funAsrPythonConfigured` 都应可见。
- `omniModel` 默认为 `qwen3.5-omni-flash`，并允许切换到上述 DataBaker Omni 模型列表。
- `compareModel` 为 `qwen3.5-plus`。
- queue groups 应继续返回 `qwen_omni / fun_asr / text_compare`，并带 `maxConcurrent` 或等价并发信息。
- 默认 REST provider 下，即使未配置 Python 虚拟环境，`fun-asr` 也可调用。
- 只有显式切到 `provider=python` 或 `fallback=python` 时，才依赖 Python 环境。

Fun-ASR 返回 `403` 时，常见原因优先排查：

- DashScope API Key 无权限。
- 百炼服务地域或模型未开通。
- Fun-ASR 不支持当前账号或地域。
- 平台 `audioUrl` 对阿里云模型服务不可访问。
- 音频 URL 已过期或签名权限不足。

临时恢复生产使用时，优先切换到 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash`。

如果 `fun-asr` 曾出现听音文本乱码，修复部署后需要重启 `node platform-resources/backend/server.js`，清空旧内存缓存。当前默认 REST provider 不会启动 Python 子进程；仅显式切到 `provider=python` 时才受 Python stdout 编码影响。
如果 `fun-asr` 曾出现听音文本或推荐文本繁体残留，默认 REST provider 下先重启 `node platform-resources/backend/server.js` 清空旧内存缓存；只有显式切到 `provider=python` 或 `fallback=python` 时，才需要重新执行 `pip install -r ai/python/requirements.txt` 后再重启后端。

批量并发诊断要点：

- 前端“AI连续填入合格项”是“并发发起 AI 请求 + 顺序填入页面”的两段流程。
- 前端并发由 `aiQualifiedAutofillConcurrency` 控制：
  - Omni：默认 `15`，范围 `1~25`
  - Fun-ASR：默认 `25`，范围 `1~50`
- 后端 Fun-ASR 并发由 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 控制，默认 `2`；Compare 并发由 `DATABAKER_AI_TEXT_CONCURRENCY` 控制，默认 `5`。
- DataBaker 批量连续填入默认改为短请求创建 job，再轮询 job 状态；同步 recommend 只保留兼容 / 调试用途。
- `DATABAKER_AI_ASYNC_JOBS_ENABLED=0`
- `DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED=0`（历史兼容）
- 共享 job 配置优先写 `ASC_AI_JOB_TIMEOUT_MS / ASC_AI_JOB_TTL_MS / ASC_AI_JOB_MAX_SIZE / ASC_AI_JOB_POLL_INTERVAL_MS`；未写时回退代码默认值。
- `DATABAKER_AI_JOB_*` 仅保留历史兼容 fallback，不再作为推荐生产配置写法。
- `DATABAKER_AI_QUEUE_MAX_SIZE=600`
- `DATABAKER_AI_REQUEST_STAGGER_MS=50`（前端错峰发起间隔说明；默认不低于 `50ms`）
- 超过 1 分钟仍未返回的 AI 请求，默认认为不适合当前项目，应优化模型、Prompt、任务拆分或后端策略，而不是继续拉长超时。
- DataBaker 平台当前实际的自动清除时间字段位于前端顶部统计悬浮窗 `autoHideMs`，默认仍为 `60000ms`。
- Fun-ASR 不支持 thinking；不要给 Fun-ASR Python 传 `enable_thinking`。
- 当前仓库所有 AI 链路都已强制 `enable_thinking=false`；若仍出现慢请求，应优先排查模型链路、队列等待或 provider 行为，而不是 thinking 开关。
- 如果批量执行看起来像串行，先看前端悬浮窗里的 `前端并发 / 已发起AI请求 / 前端活跃AI请求 / AI已返回 / 待填队列`，再看 `health` 中 `queue.groups.fun_asr.activeCount/maxConcurrent` 是否能超过 `1`。
- Fun-ASR 失败时，前端现在会优先区分：
  - 鉴权/权限错误
  - 平台音频 URL 不可访问
  - 模型名错误
  - 上游限流
  - 任务失败
  - 转写结果下载失败
- 失败列表继续保留“查看原始AI返回”，弹出的 debug JSON 会脱敏，不包含完整 `audioUrl`、签名 URL、cookie、token 或 API Key。

详细后端配置见 `platform-resources/backend/README.md`。
详细 API 清单见 `platform-resources/README.md` 的“统一后端 API 清单”。

## 发布产物说明

企业部署未完成前，每个版本默认同时生成：

- `dist/annotation-script-center-v<manifest.version>.crx`
- `dist/annotation-script-center-v<manifest.version>.zip`

其中 `CRX + ZIP` 作为当前手工分发文件。\
企业自动更新预留文件继续生成：

- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

发布命令：

```
node scripts/package-crx-release.js --notes "CRX enterprise release"
```

单行同时生成正式包与 beta 包：

```
node scripts/package-crx-release.js --notes "CRX enterprise release"
```

可选：

- 只打正式包：`node scripts/package-crx-release.js --channel public --notes "CRX enterprise release"`
- 只打 beta 包：`node scripts/package-crx-release.js --channel beta --notes "Beta build"`

当前默认配置来源：

- `config/release/package-crx-release.json`
  - 默认 `channel=all`
  - 默认 `betaBackendBaseUrl=http://47.109.197.170:3333`
- `config/secrets/package-crx-release.local.json`
  - 存放本地私有 `betaUnlockPasswordSha256`
- `config/README.md`
  - 统一说明 `config/env`、`config/release`、`config/secrets` 的用途与本地同步命令
- 环境变量与命令行参数仍可覆盖上述默认值

当前构建可见性规则：

- 仓库内 `extension/` 源码目录默认写入 beta 通道 build meta，但 beta 内容默认隐藏。
- `--channel beta` 或默认双产物中的 beta ZIP 会自动写入 `releaseChannel=beta`，但 `betaFeaturesVisibleByDefault=false`。
- `--channel public` 继续写入 `releaseChannel=public`，正式包前端不会显示 `Lightwheel` 等 beta 板块。

本地直加载如果需要测试 beta 口令入口，先执行：

```powershell
node scripts/sync-local-build-meta.js
```

然后再加载 `extension/` 目录。正式打包命令保持不变：

```powershell
node scripts/package-crx-release.js --notes "CRX enterprise release"
```

说明：ZIP 是当前过渡分发产物，不替代未来企业自动更新；企业托管自动安装仍属于未完成模块，详见 `docs/unfinished/crx-enterprise-managed-install.md`。

后端下载中心与系统管理总览当前支持通过环境变量 `ASC_DOWNLOAD_BASE_URL` 覆盖默认下载根地址；未设置时仍默认使用 `https://script.xiangtianzhen.store/downloads/`。当服务器直接通过 IP 对外提供下载目录时，可将其设置为例如 `http://47.109.197.170/downloads/`。

## 文档入口

- `AGENTS.md`：长期协作规则
- `extension/README.md`：扩展源码说明
- `platform-resources/backend/README.md`：统一后端说明
- `docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`：`platform-resources` AI 框架设计
- `docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`：`platform-resources` AI 框架迁移计划
- `platform-resources/abaka-ai/README.md`：Abaka AI 平台资料入口
- `platform-resources/aishell-tech/README.md`：Aishell Tech 平台资料入口
- `platform-resources/data-baker-cvpc/README.md`：DataBaker CVPC 平台资料入口
- `docs/README.md`：docs 文档导航
- `docs/platforms/index.md`：平台与脚本文档索引
- `docs/workflow/codex-prompt-style.md`：Codex Prompt 格式规范
- `docs/external-docs/aliyun-bailian.md`：阿里云百炼官方文档索引
- `log.md`：长期修改日志与历史细节

历史版本演进、旧方案与详细变更记录统一沉淀在 `log.md` 与 `docs/archive/`，根 README 不再堆叠历史长文。

## DataBaker 批量请求诊断

- 闽南语助手“AI连续填入合格项”默认先创建 job，再轮询 job 状态，不再让大量长时间挂起的同步 recommend 占住浏览器连接。
- 每次批量运行会生成 `batchRunId`；前端会跳过同批次重复 `processKey`，并在悬浮窗展示唯一任务数、重复跳过数、已发起请求和 AI 已返回数。
- 若怀疑重复请求，先看前端悬浮窗统计，再看后端 health 中的 `dedupe.joinedCount`。
