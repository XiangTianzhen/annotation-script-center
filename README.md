# 标注脚本中心

本仓库维护“标注脚本中心”的浏览器扩展、平台资料和本地 / 服务器后端工具。当前扩展按 Chrome / Chromium MV3 形态维护，Chrome 和 Edge 共用同一份源码。

## 当前重点

- 当前通用扩展源码目录：`extension/`
- 当前重点平台：`Alibaba LabelX`
- 当前重点脚本：`extension/sites/alibaba-labelx/asr-judgement/`
- 当前后端入口：`platform-resources/backend/server.js`

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
  platform-resources/
    backend/
    alibaba-labelx/
      asr-judgement/
        page-structure/
        network/
        backend/
        unfinished.md
      asr-transcription/
  docs/
    extension/
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

## 打包发布

- 打包 Chrome Web Store 或 Edge Add-ons 时，压缩包根目录必须直接包含 `manifest.json`，也就是压缩 `extension/` 目录内的内容，而不是压缩仓库根目录。
- 浏览器差异优先收敛到 manifest、浏览器 API 兼容层、打包配置或发布说明，不复制 `sites/` 下的业务运行时代码。
- 发布产物建议输出到 `dist/` 或 `extension/dist/`，这些目录已被 `.gitignore` 忽略。

### 生成扩展压缩包

在仓库根目录用 PowerShell 运行：

```powershell
$manifest = Get-Content -Raw extension\manifest.json | ConvertFrom-Json
$zipPath = "dist\annotation-script-center-v$($manifest.version).zip"
New-Item -ItemType Directory -Force dist | Out-Null
if (Test-Path $zipPath) {
  Remove-Item $zipPath
}
Compress-Archive -Path extension\* -DestinationPath $zipPath -Force
Write-Host "已生成：$zipPath"
```

生成后的压缩包路径示例：

```text
dist\annotation-script-center-v0.2.5.zip
```

压缩包内部第一层必须能直接看到这些内容：

```text
manifest.json
background/
options/
popup/
shared/
sites/
```

不要把整个 `extension/` 文件夹作为压缩包内的第一层目录；否则 Chrome Web Store、Edge Add-ons 或本地安装都会找不到根级 `manifest.json`。

## 本地后端

在仓库根目录运行：

```powershell
node platform-resources\backend\server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

当前快判统计接口：

- 上传：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/upload`
- 健康检查：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/health`
- CSV 下载：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/statistics/download`

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

2. 确认 Node.js 和 PM2 可用：

```bash
node --version
pm2 --version
```

3. 启动或重启统一后端：

```bash
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
pm2 save
```

如果进程已经存在：

```bash
pm2 restart annotation-script-center --update-env
```

4. Nginx 反向代理到本机 `3333` 端口，站点配置文件示例：

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

5. 检查 Nginx 并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

6. 验证接口：

```bash
curl https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/health
```

CSV 下载地址：

```text
https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/download
```

## 维护规则

- 所有 Markdown 文档使用中文。
- 有功能、目录结构、模块归属、选择器或验证步骤变化时，同步更新相关 README 和根目录 `log.md`。
- 修改 `manifest.json` 后必须确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 修改 JS 后运行 `node --check` 检查变更文件。
- 完成修改并验证后提交到 git；默认不主动 `git push`。
