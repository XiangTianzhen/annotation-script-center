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
- 当前 `0.2.10` 属于待修复与待验证版本，修复完成并通过真实浏览器验证前不升到 `0.2.11`。
- 当前测试打包文件应为 `dist/annotation-script-center-v0.2.10.zip`。
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
- `data-baker/round-one-quality/`：标贝易采一检质检 AI 推荐文本，只在 `datafactory.data-baker.com` 的 `roundOneCollect` 详情页注入。

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


