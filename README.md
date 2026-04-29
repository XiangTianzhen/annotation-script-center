# 标注脚本中心

本仓库维护“标注脚本中心”的浏览器扩展、平台资料和本地 / 服务器后端工具。当前扩展按 Chrome / Chromium MV3 形态维护，Chrome 和 Edge 共用同一份源码。

## 当前重点

- 当前通用扩展源码目录：`extension/`
- 当前重点平台：`Alibaba LabelX`、`DataBaker / DataFactory`
- 当前重点脚本：`extension/sites/alibaba-labelx/asr-judgement/`、`extension/sites/data-baker/round-one-quality/`
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

## 脚本中心控制面板

扩展 options 页面现在按平台管理脚本：

- `Alibaba LabelX`：语音转写、ASR 语音判别。
- `Lightwheel`：查看态面板占位管理。
- `DataBaker / DataFactory`：`DataBaker 一检质检`，用于 `roundOneCollect` 页面单条 AI 推荐文本。

`DataBaker 一检质检` 可在 options 首页单独启停，并在专属设置页配置：

- AI 推荐接口地址只能在服务器和本机之间选择，默认走服务器：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`
- 本机调试接口：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`，仅用于开发调试。
- 请求超时时间在 options 中以秒展示，默认 `120` 秒；扩展内部仍按毫秒保存和请求。
- 是否启用 AI 推荐文本。

扩展前端只保存接口地址、超时时间和开关，不保存 API Key、cookie、access token 或完整音频 URL。真实模型密钥仍由后端通过 `config/env/ai.env` 读取。

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
dist\annotation-script-center-v0.2.8.zip
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

当前快判 AI 建议接口：

- 健康检查：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/ai/health`
- 建议接口：`http://127.0.0.1:3333/api/alibaba-labelx/asr-judgement/ai/suggest`

当前 DataBaker 一检质检 AI 推荐文本接口：

- 健康检查：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend/health`
- 推荐接口：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`
- 扩展默认推荐接口：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`

## 统一 AI 环境配置文件

后端启动时会自动读取仓库内固定环境文件，默认不需要每次手动设置系统环境变量。

自动加载顺序：

1. `config/env/ai.env`
2. `config/env/ai.local.env`
3. `.env.local`
4. 可选 `ASC_ENV_FILE` 指向的外部文件

启动前已经存在的系统环境变量优先级最高，不会被文件覆盖。`ASC_ENV_FILE` 只用于后续多项目共享外部密钥文件，默认不需要配置。

本地使用方式：

```powershell
copy config\env\ai.env.example config\env\ai.env
```

然后编辑 `config/env/ai.env`，填入真实密钥。

启动统一后端：

```powershell
node platform-resources\backend\server.js
```

服务器使用方式是在项目目录创建：

```text
/var/www/annotation-script-center/config/env/ai.env
```

填入真实密钥后重启：

```bash
pm2 restart annotation-script-center --update-env
```

真实 `config/env/ai.env` 不要提交 GitHub；`config/env/ai.env`、`config/env/ai.local.env`、`.env` 和 `.env.*` 都已加入 `.gitignore`。模板文件 `config/env/ai.env.example` 可以提交。

快判 AI 建议说明：

- 当前扩展版本：`0.2.7`。
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
- `ASR_JUDGEMENT_AI_MOCK`：设为 `1` 才启用 mock；默认关闭，主流程是真实调用。

DataBaker AI 推荐文本说明：

- 当前目标页面：`https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`。
- 脚本已接入 options “标注脚本中心”，可在 DataBaker / DataFactory 平台区域启停，并在专属设置页选择 AI 推荐接口地址。
- 默认前端请求服务器接口 `https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`；本机 `http://127.0.0.1:3333/...` 仅用于开发调试，员工默认走服务器。
- options 中请求超时时间以秒展示，默认 `120` 秒；运行时仍使用毫秒值。
- 当前只做“单条 AI 推荐文本”，不自动保存、不自动提交、不自动点击合格 / 不合格、不做批量识别或自动流转。
- 前端通过页面同源请求和 MAIN world 内存缓存读取当前题数据，不硬编码或持久化 `access_token`、cookie、完整签名音频 URL。
- 扩展前端不保存 API Key，`DASHSCOPE_API_KEY` 仍由后端通过 `config/env/ai.env` 或系统环境变量读取。
- 听音模型请求使用 Qwen-Omni `input_audio` 格式，`data` 为完整音频 URL，`format` 从 URL pathname 后缀推断；听音请求不传 `response_format`，只在 prompt 中要求 JSON 输出。
- 如果真实调用返回 HTTP 400，先查看前端错误中的后端脱敏 `summary`，再确认音频 URL 可访问、`requestListen` 使用 `input_audio`、`config/env/ai.env` 中 `DASHSCOPE_API_KEY` 正确；可用 `DATABAKER_AI_MOCK=1` 排除前端和路由问题。
- 调用日志同时写入 JSONL 和 CSV；JSONL 保留英文 key 方便程序处理，CSV 新建时使用中文表头。
- 推荐结果只展示给用户；“填入推荐文本”必须由用户点击触发，且只能写入可安全定位的“本句话文本”输入框。
- 第一版默认模型：听音 `qwen3.5-omni-flash`，对比 `qwen3.5-plus`。

DataBaker AI 相关环境变量（后端）：

- `DASHSCOPE_API_KEY`：DashScope Key，未配置且未开启 mock 时 recommend 返回 `missing-api-key`。
- `DATABAKER_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时走 mock。
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

### 扩展压缩包下载目录

如果要让用户打开一个固定页面后自行选择下载哪个扩展压缩包，推荐把所有扩展 zip 放到服务器的 `dist/` 目录，并用 Nginx 的 `autoindex` 展示目录列表。

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
- `dist/` 目录里建议只放对外分发的扩展压缩包，例如 `annotation-script-center-v0.2.7.zip`。
- 如果访问 `https://script.xiangtianzhen.store/downloads` 没有尾部 `/` 出现异常，改用 `https://script.xiangtianzhen.store/downloads/`。
- 配置后执行 `sudo nginx -t` 和 `sudo systemctl reload nginx`。
- 验证目录列表：`curl -I https://script.xiangtianzhen.store/downloads/`。
- 验证单个文件：`curl -I https://script.xiangtianzhen.store/downloads/annotation-script-center-v0.2.7.zip`。

## 维护规则

- 所有 Markdown 文档使用中文。
- 有功能、目录结构、模块归属、选择器或验证步骤变化时，同步更新相关 README 和根目录 `log.md`。
- 修改 `manifest.json` 后必须确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 修改 JS 后运行 `node --check` 检查变更文件。
- 完成修改并验证后提交到 git；默认不主动 `git push`。
