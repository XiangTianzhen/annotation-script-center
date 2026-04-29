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
- 自动每页条数默认启用，进入 DataBaker 一检详情页后会尝试设置为 `50条/页`，只改页面分页，不自动提交任务。
- 快捷键配置默认全部未设置，可手动绑定 AI 推荐、复制听音文本、复制推荐文本、填入、忽略、句子判定和任务判定动作；普通输入不拦截，按下已配置快捷键时会先退出输入焦点再执行。
- DataBaker 快捷键运行时会先判断按键是否命中已配置动作，未命中时不阻止输入；点击左侧题目、平台动作按钮或平台自动切换 active 题目后会延迟恢复页面焦点，避免必须手动点击空白区域才能继续使用快捷键。
- DataBaker 焦点恢复分为被动恢复和强制恢复：被动恢复不会打断正在编辑的 `input/textarea/select/contenteditable`，且用户最近 1200ms 手动点入输入框时会跳过恢复；命中已配置快捷键时仍可强制失焦并执行动作。
- DataBaker `group/detail?taskId=...` 页面提供“导出数据总表”按钮。导出不再由扩展直接 `fetch queryByCondition`，而是触发页面原生分页查询并由 MAIN world 拦截响应后合并全量 CSV（含 BOM）；默认不依赖本地后端和账号密码配置。

扩展前端只保存接口地址、超时时间、开关、分页和快捷键设置，不保存 API Key、cookie、access token 或完整音频 URL。真实模型密钥仍由后端通过 `config/env/ai.env` 读取。

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

DataBaker 任务总表导出默认模式（扩展前端）：

- 平台对扩展直接请求 `queryByCondition` 可能返回 `code=51000`。现行方案改为：触发页面原生请求，再由 MAIN world 拦截响应导出。
- 点击导出后会先尝试切换 `100条/页`，再通过分页控件逐页触发平台原生请求并合并导出全量数据。
- 当前导出不需要账号密码配置，CSV 带 UTF-8 BOM，避免 Excel 中文乱码。
- 导出过程和 CSV 内容不写入 `access_token`、`refresh_token`、cookie、authorization；CSV 已移除“采集ID”列。

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
- DataBaker 设置页新增自动每页条数，默认 `50条/页`，运行时会有限重试点击页面原生分页下拉，不改接口参数、不死循环。
- DataBaker 设置页新增快捷键配置，默认全部未设置；支持 AI 推荐文本、复制 AI 听音文本、复制 AI 推荐文本、填入推荐文本、忽略 AI 推荐结果、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 普通输入不会被快捷键拦截；如果焦点仍在 `input`、`textarea`、`select` 或 `contenteditable` 中，只有按下已配置的 DataBaker 快捷键时才会自动失焦并执行动作。
- 点击左侧 `.sentence-list .sentence-item` 切换当前句子后，脚本会在不阻止页面点击的前提下延迟恢复快捷键焦点。
- 点击平台“确定”等动作按钮并由平台自动切换下一条后，脚本会监听 `.sentence-list .sentence-item.active` 变化并恢复快捷键焦点；该恢复只做 blur + 隐藏焦点哨兵，不模拟点击页面空白处。
- 用户手动点击“本句话文本”输入框后，1200ms 内被动焦点恢复会自动跳过，不再抢走输入光标。
- “填入推荐文本”写入“本句话文本”输入框后会立即和延迟退出输入框，方便继续使用快捷键；仍不会自动保存、自动提交或自动点击合格 / 不合格。
- AI 听音文本、AI 推荐文本、复制内容和“填入推荐文本”前会自动删除普通空格、全角空格、Tab 和换行；页面候选文本原文不被修改。
- 推荐卡展示和“填入推荐文本”前会自动补全中文句末标点；英文句末 `.?!;` 会转为 `。？！；`，无句末标点时默认补 `。`。
- 任务判定按钮处于 disabled 时不会绕过平台限制。
- 前端通过页面同源请求和 MAIN world 内存缓存读取当前题数据，不硬编码或持久化 `access_token`、cookie、完整签名音频 URL。
- 扩展前端不保存 API Key，`DASHSCOPE_API_KEY` 仍由后端通过 `config/env/ai.env` 或系统环境变量读取。
- 听音模型请求使用 Qwen-Omni `input_audio` 格式，`data` 为完整音频 URL，`format` 从 URL pathname 后缀推断；听音请求不传 `response_format`，只在 prompt 中要求 JSON 输出。
- 后端原生 `fetch` 请求默认在顶层传 `enable_thinking=false` 尝试关闭 thinking，不再使用 OpenAI SDK 风格的 `extra_body`；如供应商不支持该参数，会自动移除该字段重试一次。
- 如果真实调用返回 HTTP 400，先查看前端错误中的后端脱敏 `summary`，再确认音频 URL 可访问、`requestListen` 使用 `input_audio`、`config/env/ai.env` 中 `DASHSCOPE_API_KEY` 正确；可用 `DATABAKER_AI_MOCK=1` 排除前端和路由问题。
- 后端已接入闽南方言字词表 CSV：`platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv`，既作为 prompt 上下文，也会默认以 `aggressive` 模式对最终推荐文本做词表强替换；该能力只影响推荐文本展示，不会自动保存或提交。
- 词表括号内容全部视为拼音 / 批注，不参与建议用字或对应华语；CSV 单字映射默认跳过强替换，避免误伤 `家庭` 这类复合词，基础高频单字仍由后端 `BASE_ENTRIES` 显式控制。
- 后端支持 `DATABAKER_AI_PIPELINE_MODE=two_stage|listen_only`：`two_stage` 为听音 + 对比双模型模式；`listen_only` 为极速听音模式，只调用 `qwen3.5-omni-flash` 后做本地词表强替换，仅适合推荐文本展示，不适合自动提交。
- 调用日志同时写入 JSONL 和 CSV；JSONL 保留英文 key 方便程序处理，CSV 新建时使用中文表头，并记录词表改写明细、听音阶段耗时、对比阶段耗时和流水线模式。`mock=true` 的耗时只代表本地链路，不代表真实 Qwen 调用耗时。
- 当前页批量预生成暂不默认执行，后续方案是新增“预生成当前页 AI 推荐”按钮，前端读取当前页 10/50 条记录，后端批量接口限制并发，例如 2，并以内存缓存 `itemId -> result`，当前题优先读缓存，避免成本失控。
- 推荐结果只展示给用户；“填入推荐文本”必须由用户点击触发，且只能写入可安全定位的“本句话文本”输入框。
- 第一版默认模型：听音 `qwen3.5-omni-flash`，对比 `qwen3.5-plus`。

DataBaker AI 相关环境变量（后端）：

- `DASHSCOPE_API_KEY`：DashScope Key，未配置且未开启 mock 时 recommend 返回 `missing-api-key`。
- `DATABAKER_AI_LISTEN_MODEL`：听音模型，默认 `qwen3.5-omni-flash`。
- `DATABAKER_AI_COMPARE_MODEL`：对比模型，默认 `qwen3.5-plus`。
- `DATABAKER_AI_TIMEOUT_MS`：请求超时，默认 `120000`。
- `DATABAKER_AI_MOCK`：设为 `1` 时走 mock。
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
