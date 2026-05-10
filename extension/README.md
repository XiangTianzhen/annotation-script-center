# 标注脚本中心扩展源码目录

本目录是 Chrome / Chromium MV3 扩展源码根目录，`manifest.json` 位于本目录下。Chrome 和 Edge 本地加载、调试和打包都使用这个目录。

## 本地加载路径

- Edge：打开 `edge://extensions/`，开启“开发人员模式”，选择 `C:\Projects\annotation-script-center\extension`。
- Chrome：打开 `chrome://extensions/`，开启“开发者模式”，选择 `C:\Projects\annotation-script-center\extension`。

## 维护约束

- 不要为 Chrome 和 Edge 复制两套 `sites/` 业务运行时代码。
- 浏览器差异优先放到 manifest、浏览器 API 兼容层、打包配置或发布说明里处理。
- 发布或用户明确要求打包时，需先检查并更新 `extension/manifest.json` 版本号；默认有代码或用户可见行为变化时提升 patch 版本。
- 修复当前待验证版本 BUG 时，可保持 `manifest.version` 不变，不因同一版本的连续修复重复升 patch。
- 当前处于 `0.2.11` 修正增强阶段：保持 `manifest.version = 0.2.11`，修正 LabelX 统计导出策略与抓取完整性。
- 当前测试打包文件应为 `dist/annotation-script-center-v0.2.11.zip`。
- 打包发布时，压缩包根目录必须直接包含 `manifest.json`、`background/`、`options/`、`popup/`、`shared/` 和 `sites/`。
- 修改 `manifest.json` 后需要确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。

## 当前站点脚本

```text
sites/
  alibaba-labelx/
    asr-transcription/
    asr-judgement/
  data-baker/
    round-one-quality/
```

- `alibaba-labelx/asr-judgement/`：Alibaba LabelX ASR 快判。
- `alibaba-labelx/asr-transcription/`：Alibaba LabelX ASR 转写（轻量工具栏版；保留 options 轻量设置面板与当前功能快捷键配置；无旧版独立大表单和 overlay 设置；工具栏优先注入 `.mark-toolbox`，支持转写统计上传/下载）。
  - 统计上传前端为 `sites/alibaba-labelx/asr-transcription/transcription-stats-client.js`，仅做采集与上传，不做本地 CSV 写文件。
  - 扩展在 `chrome://extensions` 重新加载后，旧页面中的历史 content script 可能出现 `Extension context invalidated`；当前已在 `shared/storage.js` 统一识别并在转写运行时做停机降噪处理，刷新业务页面即可恢复。
- `alibaba-labelx/asr-judgement/` 与 `alibaba-labelx/asr-transcription/` 统计上传从 `0.2.11` 修正后都写入根级总表 `statistics-data/statistics-merged.csv`，下载默认走 `/statistics/download`（不要求 `supplier`）。
  - CSV 供应商列策略：单供应商不输出；多供应商时在最后一列追加 `供应商`。
  - CSV 写出前统一清洗字段前后空白；当供应商为 `未识别供应商/unknown-supplier` 时会回退任务名重新识别（`棋燊`、`希尔贝壳`）。
  - 转写详情抓取动态并发：`Math.floor(total/5)`，最小 `1`，最大 `500`（例如 `1854 -> 370`，`8000 -> 500`）。
  - 快判详情抓取动态并发：`Math.floor(total/5)`，最小 `1`，最大 `500`；快判详情保持 `pageSize=400`。
  - 转写与快判都接入 `shared/progress-indicator.js`，展示阶段、完成/总数、百分比、并发、成功/失败；后续平台长耗时统计/导出任务默认复用此组件。
  - 不再主动创建 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
  - suppliers 列表：`/api/alibaba-labelx/asr-judgement/statistics/suppliers`、`/api/alibaba-labelx/asr-transcription/statistics/suppliers`
  - 下载示例：`/api/alibaba-labelx/asr-judgement/statistics/download`
- 统计上传能力默认强制启用；若脚本实现了定时上传能力，则定时上传也按脚本规则强制启用，不在脚本详情页提供关闭开关。
- `data-baker/round-one-quality/`：标贝易采一检质检 AI 推荐文本（`roundOneCollect`）+ 任务组总表导出（`group/detail`）；导出会本地下载并自动上传到统一后端，后端可下载最新 CSV。
- 后端地址配置统一入口：options 首页顶部“后端接口地址”（`server` / `local`）。各脚本详情页不再提供独立后端地址、上传地址或 AI 接口地址配置。

## 页面采集工作流

- 结构和 Network 采集默认使用 Google Chrome DevTools / MCP。
- Playwright Edge 只用于真实按钮/快捷键行为验证，或 DevTools 不可用时兜底。
- Codex 只负责打开浏览器；用户自行登录并进入页面，回复“处理好了”后再继续。

## 生成压缩包

在仓库根目录运行：

```powershell
$manifest = Get-Content -Raw extension\manifest.json | ConvertFrom-Json
$zipPath = "dist\annotation-script-center-v$($manifest.version).zip"
New-Item -ItemType Directory -Force dist | Out-Null
if (Test-Path $zipPath) {
  Remove-Item $zipPath
}
Compress-Archive -Path extension\* -DestinationPath $zipPath -Force
```

上传商城或分发给同事时使用生成的 `dist\annotation-script-center-v版本号.zip`。压缩包内部第一层必须直接包含 `manifest.json`，不要多套一层 `extension/` 目录。
默认不提交 `dist/` 构建产物；如需提交发布产物，以任务要求为准。



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
- 失败数据定义覆盖关键字段缺失、详情请求失败、分包ID缺失等场景；失败计数会进入进度与最终摘要。
- 结束时若存在失败数据，提示：`有数据导出失败，请再次点击导出`。
- 再次点击导出时会优先跳过已完整数据，重点补失败/不完整数据。
- 动态并发规则统一为：`Math.floor(total / 5)`，最小 `1`，最大 `999`。
- 转写与快判进度条都展示：阶段、完成/总数、并发、成功、失败，并支持 skipped/discarded 摘要。
- 定时上传时间统一：每天 `10:00`、`16:00`。
- 定时上传到服务器前新增随机延迟：`0~300` 秒、`100ms` 步进；手动上传不延迟。
- CSV 主存储继续为根级总表：`statistics-data/statistics-merged.csv`；不主动生成 `statistics-data/suppliers/`。
- CSV 继续使用 UTF-8 with BOM，单供应商不输出“供应商”列，多供应商在最后一列输出“供应商”。
- 全流程继续脱敏：不记录 cookie、token、authorization、完整音频 URL。
