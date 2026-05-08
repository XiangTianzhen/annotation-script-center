# 标注脚本中心扩展源码目录

本目录是 Chrome / Chromium MV3 扩展源码根目录，`manifest.json` 位于本目录下。Chrome 和 Edge 本地加载、调试和打包都使用这个目录。

## 本地加载路径

- Edge：打开 `edge://extensions/`，开启“开发人员模式”，选择 `C:\Projects\annotation-script-center\extension`。
- Chrome：打开 `chrome://extensions/`，开启“开发者模式”，选择 `C:\Projects\annotation-script-center\extension`。

## 维护约束

- 不要为 Chrome 和 Edge 复制两套 `sites/` 业务运行时代码。
- 浏览器差异优先放到 manifest、浏览器 API 兼容层、打包配置或发布说明里处理。
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
- `alibaba-labelx/asr-transcription/`：Alibaba LabelX ASR 转写。
- `data-baker/round-one-quality/`：标贝易采 一检质检 AI 推荐文本，只在 `datafactory.data-baker.com` 的 `roundOneCollect` 详情页注入。

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

