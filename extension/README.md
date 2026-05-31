# 标注脚本中心扩展源码目录

本目录是 Chrome / Chromium MV3 扩展源码根目录，`manifest.json` 位于本目录下。Chrome 和 Edge 本地加载、调试和打包都使用这个目录。

## 文档入口

- 协作与执行规则：`AGENTS.md`
- 平台与脚本文档索引：`docs/platforms/index.md`
- Codex Prompt 输出规范：`docs/workflow/codex-prompt-style.md`
- 阿里云百炼官方文档索引：`docs/external-docs/aliyun-bailian.md`
- docs 导航：`docs/README.md`

## 本地加载路径

- Edge：打开 `edge://extensions/`，开启“开发人员模式”，选择 `C:\Projects\annotation-script-center\extension`。
- Chrome：打开 `chrome://extensions/`，开启“开发者模式”，选择 `C:\Projects\annotation-script-center\extension`。

## 品牌资源

- 扩展图标资源目录：`extension/assets/icons/`（`icon-16.png`、`icon-32.png`、`icon-48.png`、`icon-128.png`）。
- popup/options 视觉资源目录：`extension/assets/brand/`（如 `asc-logo.svg`、`options-hero.svg`）。
- 临时导入目录 `_incoming_visual_assets/` 仅用于本地复制资源，复制完成后应删除，不作为仓库正式资源。
- 修改 `manifest.json` 中图标字段后，必须校验 JSON 可解析且引用路径存在。
- 当前 options 工作台视觉重构已按用户要求同步提升到 `manifest.version=0.4.0`；是否生成发布产物仍以 `ASC_RELEASE` 或用户明确要求为准。

## 维护约束

- 不要为 Chrome 和 Edge 复制两套 `sites/` 业务运行时代码。
- 浏览器差异优先放到 manifest、浏览器 API 兼容层、打包配置或发布说明里处理。
- TTS 自动清除默认时间统一为 `60000ms`；AI / 模型请求默认超时时间统一为 `60000ms`。
- 用户手动保存的非默认 AI 超时值继续保留；非 AI 上传、下载、统计接口超时不受该默认规则影响。
- 发布或用户明确要求打包时，才检查是否需要更新 `extension/manifest.json` 版本号。
- 当前版本已提升为 `0.4.0`，用于承接 options 工作台视觉重构与系统管理后台收口。
- 非发布类改动默认继续保持当前 `manifest.version=0.4.0`，不因同版本内的连续修复自动升到 `0.4.1`。
- `0.4.0` 当前开发口径：在保留现有脚本能力的前提下，重点重构 options 信息架构、视觉壳层与系统管理入口。
- 客家话助手已支持 `#/asrmark` 与 `#/asrmarkCheck`；审核页文本可编辑时支持行内填入，但始终不自动保存、不自动提交、不自动点击合格/不合格。
- 3.0 起正式发布产物为 CRX 三件套：`annotation-script-center-v<version>.crx`、`annotation-script-center-update.xml`、`annotation-script-center-crx-latest.json`。
- 修改 `manifest.json` 后需要确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。

## 0.4.0 当前开发摘要

- options 已切换为“公开脚本中心 + 系统管理”两层结构，并统一用 query 路由管理页面视图。
- 公开脚本中心当前改为工作台风格功能页：左侧固定导航与运行概况，右侧承载浅色运营后台主视觉、平台模块与紧凑脚本功能卡。
- 系统管理页统一承载后端设置、下载中心、运行统计与模型池占用仪表盘，并要求进入时输入密码。
- 现有平台脚本运行时代码和后端接口契约保持兼容，脚本详情页只重做视觉壳层，不重写原字段结构。
- 详细变更见 `log.md` 及对应平台 README。

## Options 工作台结构规则

- `options/options.html` 保持单入口，但当前路由固定为：
  - `?view=center`
  - `?view=script&script=<scriptId>`
  - `?view=admin&tab=overview|backend|downloads|stats`
- `公开脚本中心` 默认直接进入，只保留：
  - 平台概览
  - 脚本启停
  - 脚本详情入口
- `系统管理` 进入时要求输入密码；密码复用项目数据下载鉴权口径。
- “后端接口地址 / AI 调用使用人”统一迁到 `?view=admin&tab=backend`。
- “项目数据下载 / AI 请求记录导出 / 脚本下载中心外链”统一迁到 `?view=admin&tab=downloads`。
- 公开首页不再保留“连续点击 10 次显示隐藏下载面板”的旧交互。

## 当前站点脚本

```text
sites/
  alibaba-labelx/
    asr-transcription/
    asr-judgement/
  data-baker/
    round-one-quality/
  magic-data/
    shared/
    hakka-helper/
    minnan-helper/
  abaka-ai/
    task-page/
```

- `alibaba-labelx/asr-judgement/`：Alibaba LabelX ASR 快判。
- `alibaba-labelx/asr-transcription/`：Alibaba LabelX ASR 转写（轻量工具栏版；保留 options 轻量设置面板与当前功能快捷键配置；无旧版独立大表单和 overlay 设置；工具栏优先注入 `.mark-toolbox`，支持转写统计上传/下载）。
  - 统计上传前端为 `sites/alibaba-labelx/asr-transcription/transcription-stats-client.js`，仅做采集与上传，不做本地 CSV 写文件。
  - 扩展在 `chrome://extensions` 重新加载后，旧页面中的历史 content script 可能出现 `Extension context invalidated`；当前已在 `shared/storage.js` 统一识别并在转写运行时做停机降噪处理，刷新业务页面即可恢复。
- `alibaba-labelx/asr-judgement/` 与 `alibaba-labelx/asr-transcription/` 统计上传从 `0.2.11` 修正后都写入根级总表 `statistics-data/statistics-merged.csv`，下载默认走 `/statistics/download`（不要求 `supplier`）。
  - CSV 供应商列策略：单供应商不输出；多供应商时在最后一列追加 `供应商`。
  - CSV 写出前统一清洗字段前后空白；当供应商为 `未识别供应商/unknown-supplier` 时会回退任务名重新识别（`棋燊`、`希尔贝壳`）。
  - 转写详情抓取动态并发：`Math.floor(total/5)`，最小 `1`，最大 `999`（例如 `1854 -> 370`，`8000 -> 999`）。
  - 快判详情抓取动态并发：`Math.floor(total/5)`，最小 `1`，最大 `999`；快判详情保持 `pageSize=400`。
  - 转写与快判都接入 `shared/progress-indicator.js`，展示阶段、完成/总数、百分比、并发、成功/失败；后续平台长耗时统计/导出任务默认复用此组件。
  - 不再主动创建 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
  - suppliers 列表：`/api/alibaba-labelx/asr-judgement/statistics/suppliers`、`/api/alibaba-labelx/asr-transcription/statistics/suppliers`
  - 下载示例：`/api/alibaba-labelx/asr-judgement/statistics/download`
- 统计上传能力默认强制启用；若脚本实现了定时上传能力，则定时上传也按脚本规则强制启用，不在脚本详情页提供关闭开关。
- `data-baker/round-one-quality/`：闽南语助手 AI 推荐文本（`roundOneCollect`）+ 任务组总表导出（`group/detail`）；导出会本地下载并自动上传到统一后端，后端可下载最新 CSV。
- `magic-data/hakka-helper/`：Magic Data `#/asrmark` 客家话助手；结果区固定挂载在“句子列表”下方，支持模型/快捷键配置，thinking 已全局固定关闭，保持人工确认与手动保存提交。
- `magic-data/minnan-helper/`：Magic Data `#/asrmark` 闽南语助手；与客家话助手互斥启停（同平台同一时刻仅一个助手生效），并保持独立面板与独立快捷键配置，AI 配置拆分为“模型方案（`two_stage/omni_single`）+ 识别策略（`direct_dialect/mandarin_to_dialect`）”，支持 `fun-asr` 与 Qwen Omni。
- `abaka-ai/task-page/`：Abaka AI Task21助手；快捷键仅点击页面真实 DOM 选项/按钮（默认 `1~7`），`same_font=true` 与 `same underlying font+artistic effect` 默认联动两个 `specify`；AI 默认不自动写入，只有用户点击“填写 AI 答案”后才写入字段，不自动保存、不自动提交、不自动送审。
- 后端地址配置统一入口：options 首页顶部“后端接口地址”（`server` / `local`）。各脚本详情页不再提供独立后端地址、上传地址或 AI 接口地址配置。
- ASR 类脚本（快判、转写、标贝易采、Magic Data）统一复用隐藏的“ASR 语音 AI 设置”部件：默认隐藏，需在对应脚本详情页标题连续点击 10 次显示。
- “ASR 语音 AI 设置”仅影响当前脚本，配置独立保存；不支持参数前端不显示、后端不发送。
- “ASR 语音 AI 设置”在解锁后会按当前脚本调用后端 `defaults` 接口，展示默认模型、Prompt 与默认参数；如果读取失败则回退本地默认值。
- 前端仅保存脚本级 override：字段清空或恢复为默认时不再固化默认值；运行时仅透传 override，后端负责“默认值 + 白名单参数”合并。
- `response_format` 不对前端开放；结构化输出格式由后端固定控制。
- thinking 当前在全仓库统一固定关闭：前端不再开放有效开关，后端统一显式传 `enable_thinking=false`。
- 阿里 LabelX 快判与转写的音频基础能力统一复用 `extension/sites/alibaba-labelx/shared/audio-controller-core.js`：默认倍速、默认音量、倍速步进、前进/后退步长、切题停旧播新与自动播放逻辑共用；脚本配置独立保存（快判默认 `2x`，转写默认 `1.5x`）。
- 阿里 LabelX 快判与转写的提交类快捷键动作统一复用 `extension/sites/alibaba-labelx/shared/submit-actions.js`。
- 快判与转写都支持“提交任务 / 提交任务并结束”快捷键；顶部工具栏不显示提交按钮。
- 提交快捷键只点击页面真实系统按钮，不直接请求 API，不自动确认二次弹窗。
- 快判 `400` 条 pageSize 请求重写仍是快判专属能力，不属于 shared audio core。

## 页面采集工作流

- 结构和 Network 采集默认使用 Google Chrome DevTools / MCP。
- Playwright Edge 只用于真实按钮/快捷键行为验证，或 DevTools 不可用时兜底。
- Codex 只负责打开浏览器；用户自行登录并进入页面，回复“处理好了”后再继续。

## CRX 企业发布

在仓库根目录运行：

```powershell
node scripts/package-crx-release.js --notes "CRX enterprise release"
```

- 每个版本会同时生成：
  - `dist/annotation-script-center-v<manifest.version>.crx`
  - `dist/annotation-script-center-v<manifest.version>.zip`
- ZIP 内容来自 `extension/` 目录，用于手工分发和开发者模式加载。
- ZIP 不包含仓库级目录与敏感内容（如 `config/secrets`、`platform-resources`、`docs`、`dist`、`.env*`、运行数据目录等）。

- 正式发布路径只保留 CRX 三件套：
  - `dist/annotation-script-center-v<manifest.version>.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 3.0 起 `dist/` 允许追踪 CRX 三件套（用于上传 `https://script.xiangtianzhen.store/downloads/`）：
  - `dist/annotation-script-center-v<manifest.version>.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 除三件套外，其他临时构建产物默认不提交 Git。

### CRX 企业发布（策略自动更新）

3.0 正式发布与自动更新统一使用 CRX + `update.xml` + `crx-latest.json`。

执行命令（仓库根目录）：

```powershell
node scripts/package-crx-release.js --notes "CRX enterprise release test"
```

输出文件：
- `dist/annotation-script-center-v<manifest.version>.crx`
- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

前置要求：
- `manifest.json` 必须包含：
  - `update_url = https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml`
- 私钥固定路径：
  - `config/secrets/annotation-script-center.pem`
- 私钥不能提交 Git，且必须长期备份；丢失后 `extension_id` 会变化并导致企业策略 `appid` 失效。

浏览器路径优先级：
- `ASC_CHROME_EXE`
- 自动探测 Chrome/Edge 常见安装路径

发布校验要点：
- `update.xml appid` 等于脚本输出的 `extension_id`
- `update.xml version` 等于 `manifest.version`
- `update.xml codebase` 指向对应版本 CRX 下载 URL
- 所有后续版本 CRX 均使用同一个 `.pem` 打包



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

- 版本继续保持 `0.2.11`，不升级到 `0.2.12`。
- 转写待补任务名称链路更新为健康文本优先：`detail.taskName/name -> summary.taskName/name -> taskMap.taskName/name`。
- `detail` 返回空任务名称时，不得覆盖 `summary/taskMap` 中已存在的健康任务名称。
- `exists=true && complete=false` 仍需继续拉取并上传补齐，不可误跳过。
- 无待上传 payload 时不调用 upload，前端显示“已全部完整，无需上传”。
- 共享进度组件改为水平居中显示，完成态与进行中态复用同一紧凑卡片布局，避免完成后样式撑满或关键数字不可见。

## 2026-05-10 0.2.11 进度悬浮窗样式小修

- 保持 `0.2.11`，本轮只修前端显示，不改统计导出业务逻辑。
- `shared/progress-indicator.js` 改为顶部居中悬浮窗（fixed），不再挤占 LabelX 顶部导航区域。
- 进行中/成功/失败/警告统一使用同一紧凑卡片布局，完成态不再拉伸成横向绿色长条。
- 上传按钮状态不再设置长 `title` 文案，鼠标悬停不再出现黑色长 tooltip。
- 转写与快判继续共用同一进度组件与样式。
