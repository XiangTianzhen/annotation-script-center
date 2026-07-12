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
公开 Server 与下载更新入口统一为 `https://annotation-script-center.xiangtianzhen.store`。

## 发布

```powershell
node scripts/package-crx-release.js
```

发布脚本只生成以下四项：

- `dist/annotation-script-center-v1.0.0.crx`
- `dist/annotation-script-center-v1.0.0.zip`
- `dist/annotation-script-center-update.xml`
- `dist/annotation-script-center-crx-latest.json`

私钥和本地私有覆盖位于忽略的 `config/secrets/`，不得读取、输出或提交其内容。
