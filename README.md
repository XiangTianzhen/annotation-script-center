# 标注脚本中心

用于维护浏览器扩展、统一后端和多平台资料的仓库。

## 项目定位

- 仓库目录：`C:\Projects\annotation-script-center`
- 运行时代码：`extension/`
- 平台资料与脚本后端：`platform-resources/`
- 统一后端入口：`platform-resources/backend/server.js`
- 当前扩展版本以 `extension/manifest.json` 为准

## 快速开始

### 本地加载扩展

- Edge：`edge://extensions/` -> 开启开发人员模式 -> 加载 `C:\Projects\annotation-script-center\extension`
- Chrome：`chrome://extensions/` -> 开启开发者模式 -> 加载 `C:\Projects\annotation-script-center\extension`

### 本地启动后端

在仓库根目录运行：

```powershell
node platform-resources/backend/server.js
```

默认监听：

```text
http://127.0.0.1:3333
```

## 目录导航

- `AGENTS.md`
  - 项目级规则、Git 规范、验证要求、安全边界
- `extension/`
  - 扩展运行时代码
- `platform-resources/`
  - 平台资料、Network 资料、页面结构、脚本后端
- `docs/`
  - 平台索引、外部文档入口、未完成事项
- `log.md`
  - 历史改动记录

## 文档入口

- 项目规则：`AGENTS.md`
- 扩展源码说明：`extension/README.md`
- 平台资料总览：`platform-resources/README.md`
- 统一后端说明：`platform-resources/backend/README.md`
- docs 导航：`docs/README.md`
- 平台与脚本索引：`docs/platforms-index.md`
- 百炼官方文档入口：`docs/external-docs-aliyun-bailian.md`
- 未完成模块说明：`docs/unfinished-crx-enterprise-managed-install.md`
- 历史变更记录：`log.md`

## 说明

- 根 `README.md` 只保留导航和基础入口。
- 平台细节、后端细节、运行规则写到对应 README。
- 历史过程、热修记录、迁移记录统一写到 `log.md`。
