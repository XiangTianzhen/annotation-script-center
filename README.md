# 标注脚本中心

用于维护 Chrome / Edge 标注辅助扩展、统一 Node.js 后端，以及三个平台的稳定页面与 Network 参考资料。

当前扩展版本为 `1.0.0`；本仓库维护三个平台的五个脚本。AI 结果默认用于人工辅助，不会自动领取、自动审核或自动流转任务。

## 项目定位

| 项目 | 当前入口 |
|---|---|
| 扩展运行时 | `extension/` |
| Vue Options 源码 | `frontend/options-app/` |
| 平台资料与脚本后端 | `platform-resources/` |
| 统一后端入口 | `platform-resources/backend/server.js` |
| 自动化测试 | `tests/` |
| ZIP 打包脚本 | `scripts/package-extension-zip.js` |
| 当前版本来源 | `extension/manifest.json` |

## 当前脚本

| 平台 | 脚本 | 脚本 ID | 主要能力 |
|---|---|---|---|
| DataBaker CVPC | 柳州话脚本 | `dataBakerCvpcLiuzhouAssistant` | 音频获取、两阶段 AI、分段建议、批量识别、字段辅助写入 |
| ByteDance AIDP | 苏州话脚本 | `bytedanceAidpSuzhouHelper` | 分段建议、两阶段 AI、行内/批量识别、暂存写回 |
| ByteDance AIDP | 金华话脚本 | `bytedanceAidpJinhuaHelper` | 单次 Omni 原始听音直填、分段建议、行内/批量识别 |
| ByteDance AIDP | 台州话脚本 | `bytedanceAidpTaizhouHelper` | 原始听音直填诊断、分段建议、行内/批量识别 |
| Magic Data | 杭州话脚本 | `magicDataHangzhouAssistant` | AI 质检、单双模型方案、词表参考、结果填入与快捷键 |

ByteDance AIDP 的苏州话、金华话与台州话三套脚本互斥启用；关闭当前脚本时不会自动启用另一个脚本。

## 前置环境

本地开发至少需要：

- Node.js 与 npm
- Python 3（CVPC 画段、可选的 Python AI provider）
- Chrome 或 Edge
- Windows PowerShell；Linux/macOS 打包时需要系统 `zip` / `unzip`

服务器运行建议准备：

- Node.js
- Python 3、`venv` 与 `pip`
- PM2
- Nginx
- HTTPS 证书
- 忽略提交的 `config/env/backend.env` 与 `config/env/ai.env`

安装 Options 开发依赖：

```powershell
npm --prefix frontend/options-app install
```

根目录 `package.json` 只提供统一测试命令，不需要执行根级依赖安装。

## 快速开始

### 1. 构建 Options

在仓库根目录执行：

```powershell
node scripts/build-options-app.js
```

构建结果写入 `extension/options/`。修改 `frontend/options-app/` 后，需要重新执行该命令再加载扩展。

### 2. 加载本地扩展

Chrome：

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `C:\Projects\annotation-script-center\extension`。

Edge：

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择 `C:\Projects\annotation-script-center\extension`。

扩展重新加载后，已经打开的业务页可能出现 `Extension context invalidated`。这是旧扩展上下文失效，需要刷新业务页面后再验证。

### 3. 配置本地后端

复制公开模板：

```powershell
Copy-Item config/env/backend.env.example config/env/backend.env
Copy-Item config/env/ai.env.example config/env/ai.env
```

然后在本机填写：

- `config/env/backend.env`：管理员密码哈希、管理员 JWT 密钥，以及可选的 AI 日志下载独立凭据。
- `config/env/ai.env`：DashScope Key 和确实需要覆盖的 AI 参数。

这两个真实文件均被 Git 忽略。不要把真实值复制到 README、日志、测试或提交中。

### 4. 创建本地 Python 环境

CVPC 画段会调用后端 Python 音频分析脚本；Fun-ASR 或 Qwen 选择 Python provider 时也复用同一个虚拟环境。该环境固定放在 `platform-resources/backend/.venv`，并已被 Git 忽略。

Windows PowerShell：

```powershell
Set-Location platform-resources/backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r ai\python\requirements.txt
.venv\Scripts\python.exe -c "import dashscope, opencc, miniaudio; print('Python dependencies OK')"
Set-Location ../..
```

如果系统没有 `py` 命令，可以把第一条创建命令改为 `python -m venv .venv`。不要提交 `.venv/`。

### 5. 启动统一后端

```powershell
node platform-resources/backend/server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

扩展 Options 支持两套后端根地址：

- `Server`：默认 `https://annotation-script-center.xiangtianzhen.store`
- `Local`：默认 `http://127.0.0.1:3333`

## 开发与验证

在仓库根目录运行全部测试：

```powershell
npm test
```

按分区执行：

```powershell
npm run test:frontend
npm run test:runtime
npm run test:extension
npm run test:backend
npm run test:release
```

常用完整检查：

```powershell
npm test
node scripts/build-options-app.js
node --check scripts/package-extension-zip.js
git diff --check
```

长期测试统一位于 `tests/`。生产目录不放置 `*.test.*` 或 `*.spec.*`。

## ZIP 打包与安装

在仓库根目录执行：

```powershell
node scripts/package-extension-zip.js
```

该命令会：

1. 重新构建 Vue Options。
2. 清空 `dist/` 中的旧产物。
3. 打包完整 `extension/`。
4. 校验 ZIP 非空且根目录包含 `manifest.json`。
5. 只生成 `dist/annotation-script-center-v1.0.0.zip`。

安装 ZIP：

1. 解压 ZIP 到独立目录。
2. 打开 Chrome / Edge 扩展管理页。
3. 开启开发者模式。
4. 选择“加载已解压的扩展程序”。
5. 选择解压后的扩展根目录，而不是 ZIP 文件本身。

## 服务器部署

以下示例假设仓库位于 `/var/www/annotation-script-center`，后端仍只监听 `127.0.0.1:3333`。

### Python 环境

首次部署时，在启动 PM2 前创建统一虚拟环境并安装依赖：

```bash
cd /var/www/annotation-script-center/platform-resources/backend
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r ai/python/requirements.txt
.venv/bin/python -c "import dashscope, opencc, miniaudio; print('Python dependencies OK')"
cd /var/www/annotation-script-center
```

如果 `python3 -m venv .venv` 提示缺少 `venv`，先按服务器发行版安装 Python 3 的 `venv` 与 `pip` 软件包，再重新执行。后端会自动识别 `.venv/bin/python`；无需激活虚拟环境，也不需要修改 PM2 的 Node.js 启动命令。

### PM2 启动

```bash
cd /var/www/annotation-script-center
pm2 start platform-resources/backend/server.js \
  --name annotation-script-center \
  --cwd /var/www/annotation-script-center \
  --time
pm2 save
pm2 status annotation-script-center
```

需要开机自启时执行 `pm2 startup`，再执行该命令输出的系统级命令，最后重新执行 `pm2 save`。

### Nginx 示例

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name annotation-script-center.xiangtianzhen.store;

    client_max_body_size 100m;

    location = / {
        default_type text/plain;
        return 200 "annotation-script-center\n";
    }

    location /downloads/ {
        alias /var/www/annotation-script-center/dist/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        add_header Access-Control-Allow-Origin * always;
        add_header Cache-Control "public, max-age=300" always;
        types { application/zip zip; }
        default_type application/octet-stream;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

配置完成后先检查再重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS 由服务器证书工具与 Nginx 配置维护；证书和私钥不得进入仓库。

### 服务器更新

```bash
cd /var/www/annotation-script-center
git status --short
git pull --ff-only origin main
platform-resources/backend/.venv/bin/python -m pip install -r platform-resources/backend/ai/python/requirements.txt
pm2 restart annotation-script-center --update-env
pm2 status annotation-script-center
```

如果 `git status --short` 显示未知修改，先停止更新，不要覆盖服务器私密配置。重复安装 requirements 是幂等的；依赖没有变化时，pip 会直接复用已安装版本。

### 基础检查

```bash
curl -fsS http://127.0.0.1:3333/api/data-baker-cvpc/liuzhou-helper/ai/recommend/health
curl -fsS https://annotation-script-center.xiangtianzhen.store/api/magic-data/hangzhou-helper/ai/defaults
curl -I https://annotation-script-center.xiangtianzhen.store/downloads/
platform-resources/backend/.venv/bin/python -c "import dashscope, opencc, miniaudio; print('Python dependencies OK')"
pm2 logs annotation-script-center --lines 100
```

## 目录导航

| 目录 | 职责 |
|---|---|
| `extension/` | Manifest V3 扩展成品、popup、Options 与五脚本运行时 |
| `frontend/options-app/` | Vue Options 源码与 SCSS |
| `platform-resources/` | 平台资料、页面结构、Network 参考与脚本后端 |
| `platform-resources/backend/` | 统一后端、管理员能力、公共 AI 与路由注册 |
| `config/` | 环境模板、模型价格和本地私密配置说明 |
| `scripts/` | Options 构建、ZIP 打包和本地工具 |
| `tests/` | frontend、runtime、extension、backend、release 测试 |
| `docs/` | 平台索引和外部官方文档入口 |
| `dist/` | 当前版本 ZIP 产物 |

## 文档入口

- [项目规则](AGENTS.md)
- [扩展运行时](extension/README.md)
- [平台资料总览](platform-resources/README.md)
- [统一后端](platform-resources/backend/README.md)
- [配置说明](config/README.md)
- [测试说明](tests/README.md)
- [docs 导航](docs/README.md)
- [平台与脚本索引](docs/platforms-index.md)
- [百炼官方文档入口](docs/external-docs-aliyun-bailian.md)
- [修改总账](log.md)

## 安全与行为边界

- 不提交 API Key、管理员密码、JWT、cookie、authorization、签名 URL、完整音频 URL 或真实业务数据。
- AI 建议默认只供人工确认，不自动领取、自动审核或自动流转。
- Options 保存不会触发业务页保存、提交或切题。
- 批量能力只作用于当前页、当前任务或当前音频，并保留停止与失败统计。
- 页面写入遵守各脚本 README 的契约，不绕过平台原生 `disabled` / `readonly` 限制。
