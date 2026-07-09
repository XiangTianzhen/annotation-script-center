# 标注脚本中心

用于维护浏览器扩展、统一后端和多平台资料的仓库。

## 项目定位

- GitHub 仓库：[XiangTianzhen/annotation-script-center](https://github.com/XiangTianzhen/annotation-script-center)
- 运行时代码：`extension/`
- 平台资料与脚本后端：`platform-resources/`
- 统一后端入口：`platform-resources/backend/server.js`
- 当前扩展版本以 `extension/manifest.json` 为准

## 快速开始

### 本地加载扩展

- Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `annotation-script-center/extension`
- Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `annotation-script-center/extension`
- 如果要使用新的 Vue options 工作区，先在仓库根目录执行一次：

```powershell
cd frontend/options-app
npm install
npm run build
cd ../..
```

- 详细运行时说明：[`extension/README.md`](extension/README.md)
- 如果需要本地 beta 入口元信息，同步一次：

```powershell
node scripts/sync-local-build-meta.js
```

### 本地启动后端

在仓库根目录运行：

```powershell
node platform-resources/backend/server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

- 环境变量、PM2、统一后端边界：[`platform-resources/backend/README.md`](platform-resources/backend/README.md)

## 安装与前置

- 当前仓库没有根级 `package.json`；不是 `npm install / npm run` 型项目。
- 本地最少需要：
  - Node.js
  - Chrome 或 Edge
  - 可运行扩展开发模式的桌面环境
- 如果要做服务器部署，建议额外准备：
  - PM2
  - `config/env/backend.env`
  - `config/env/ai.env`
- 如果要做正式 CRX 打包，额外需要：
  - `config/secrets/annotation-script-center.pem`
  - `config/package-crx-release.json`
  - 如生成 beta 包，还需要 `config/secrets/package-crx-release.local.json` 中的本地私有覆盖

## 打包与发布

### 本地同步 beta build meta

```powershell
node scripts/sync-local-build-meta.js
```

### 生成发布包

在仓库根目录运行：

```powershell
node scripts/package-crx-release.js
```

- 如果存在 `frontend/options-app/`，打包脚本会先自动执行一次 Vue options 构建，再继续现有 CRX / ZIP 打包流程。

- 默认同时生成 `public + beta`
- 只生成 public：

```powershell
node scripts/package-crx-release.js --channel public
```

- 只生成 beta：

```powershell
node scripts/package-crx-release.js --channel beta
```

默认产物位置：

- `dist/annotation-script-center-v<version>.crx`
- `dist/annotation-script-center-v<version>.zip`
- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`
- `dist/annotation-script-center-beta.zip`

生成后需要把 `dist/` 下本次产物上传到 `downloadBaseUrl` 对应目录。如果本次只是替换这些静态下载文件，而后端 Node 服务代码没变，通常不需要重启后端。

更多配置说明见：[`config/README.md`](config/README.md)

## 部署入口

### 后端部署

- Windows / Linux 环境变量示例、PM2 启动、统一后端边界：
  - [`platform-resources/backend/README.md`](platform-resources/backend/README.md)
- 发布配置、运行环境文件和下载密码配置：
  - [`config/README.md`](config/README.md)

最小部署命令示例：

```powershell
Copy-Item config\env\backend.env.example config\env\backend.env
node platform-resources\backend\server.js
```

Linux / PM2 示例：

```bash
cp config/env/backend.env.example config/env/backend.env
pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center
```

### 服务器日常更新

当前仓库没有根级 `package.json`，所以服务器更新通常不是 `npm install`，而是：

1. 进入服务器项目目录。
2. 拉取最新代码。
3. 检查是否需要手动合并 `config/env/*.env` 或 `config/secrets/*` 的本地私有配置。
4. 重启 PM2 进程。

Linux / PM2 示例：

```bash
cd /var/www/annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
```

Windows / PM2 示例：

```powershell
Set-Location <你的项目目录>\annotation-script-center
git pull --ff-only origin main
pm2 restart annotation-script-center --update-env
```

更新时注意：

- 不要直接覆盖服务器上的 `config/env/backend.env`、`config/env/ai.env`、`config/secrets/*` 私有内容。
- 如果这次只改后端代码，通常不需要重新打包 CRX。
- 如果这次只更新扩展下载包，通常不需要重启后端进程。

### 企业托管安装

- 当前状态与阻塞：[`docs/unfinished-crx-enterprise-managed-install.md`](docs/unfinished-crx-enterprise-managed-install.md)

## 目录导航

- [`AGENTS.md`](AGENTS.md)
  - 项目级规则、Git 规范、验证要求、安全边界
- [`extension/`](extension/)
  - 扩展运行时代码
- [`platform-resources/`](platform-resources/)
  - 平台资料、Network 资料、页面结构、脚本后端
- [`docs/`](docs/)
  - 平台索引、外部文档入口、未完成事项
- [`log.md`](log.md)
  - 历史改动记录

## 文档入口

- 项目规则：[`AGENTS.md`](AGENTS.md)
- 扩展源码说明：[`extension/README.md`](extension/README.md)
- 平台资料总览：[`platform-resources/README.md`](platform-resources/README.md)
- 统一后端说明：[`platform-resources/backend/README.md`](platform-resources/backend/README.md)
- 配置说明：[`config/README.md`](config/README.md)
- docs 导航：[`docs/README.md`](docs/README.md)
- 平台与脚本索引：[`docs/platforms-index.md`](docs/platforms-index.md)
- 百炼官方文档入口：[`docs/external-docs-aliyun-bailian.md`](docs/external-docs-aliyun-bailian.md)
- 未完成模块说明：[`docs/unfinished-crx-enterprise-managed-install.md`](docs/unfinished-crx-enterprise-managed-install.md)
- 历史变更记录：[`log.md`](log.md)

## 说明

- 根 `README.md` 只保留导航和基础入口。
- 平台细节、后端细节、运行规则写到对应 README。
- 历史过程、热修记录、迁移记录统一写到 `log.md`。
