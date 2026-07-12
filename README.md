# 标注脚本中心

当前版本为 `1.0.0`，只保留三个平台的四个正式脚本：

- DataBaker CVPC：柳州话脚本
- ByteDance AIDP：苏州话脚本、金华话脚本（同平台互斥）
- Magic Data：杭州话脚本

## 目录

- `extension/`：Chrome / Edge 扩展运行时、popup 与 Options。
- `frontend/options-app/`：Vue Options 源码。
- `platform-resources/`：三个平台的稳定资料与四脚本后端。
- `platform-resources/backend/server.js`：统一后端入口。
- `docs/platforms-index.md`：平台与脚本索引。
- `log.md`：历史改动总账。

## 开发与验证

在仓库根目录执行：

```powershell
npm test
```

测试统一放在根目录 `tests/`，也可以按范围单独执行：

```powershell
npm run test:frontend
npm run test:runtime
npm run test:extension
npm run test:backend
npm run test:release
```

Options 构建仍使用：

```powershell
node scripts/build-options-app.js
```

统一后端默认监听 `127.0.0.1:3333`：

```powershell
node platform-resources/backend/server.js
```

Options 只维护 `Server` 与 `Local` 两套后端根地址。
公开 Server 与 ZIP 下载入口统一为 `https://annotation-script-center.xiangtianzhen.store`。

## 发布

```powershell
node scripts/package-extension-zip.js
```

该命令会先重建 Vue Options、清空旧 `dist`，然后只生成：

- `dist/annotation-script-center-v1.0.0.zip`

项目不再生成签名安装包、自动更新描述文件或最新版元数据，也不再需要发布私钥。下载 ZIP 后需先解压，再在 Chrome / Edge 扩展管理页开启开发者模式并选择“加载已解压的扩展程序”。

`config/env/backend.env` 是忽略的服务器运行时鉴权配置，仅保留管理员密码哈希与随机 JWT 密钥，不得提交真实值。
