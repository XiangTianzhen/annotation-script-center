# 统一测试目录

本目录集中维护标注脚本中心的长期回归测试，生产代码目录不再放置 `*.test.*` 或 `*.spec.*`。

## 目录职责

- `frontend/options/`：Vue Options 的 Vitest / jsdom 测试。
- `frontend/runtime/`：Options 共享运行时的 Node 测试。
- `extension/`：manifest、background、popup、shared 与四脚本前端运行时测试。
- `backend/`：统一后端和四脚本后端测试。
- `release/`：发布脚本与统一 runner 契约测试。
- `helpers/repo-paths.cjs`：提供 `repoRoot` 与 `resolveRepo()`，统一定位生产代码。
- `run-tests.cjs`：跨平台测试入口与分区调度器。

当前目录包含从生产目录迁入的 60 个测试文件，以及 1 个统一 runner 契约测试。

## 运行命令

在仓库根目录执行全部测试：

```powershell
npm test
```

按范围执行：

```powershell
npm run test:frontend
npm run test:runtime
npm run test:extension
npm run test:backend
npm run test:release
```

`npm test` 固定按 frontend、runtime、extension、backend、release 顺序运行，任一阶段失败即返回非零退出码。

## 编写规则

- Node 测试通过根 `package.json` 的 `#repo-paths` 映射加载 `resolveRepo()`，不得根据测试文件的 `__dirname` 推导生产文件位置。
- Vue 测试继续使用 `@` 指向 `frontend/options-app/src/`；Vitest 缓存写入已忽略的 Options `node_modules/.vite/`。
- 测试产生的临时文件必须写入 `os.tmpdir()`，并通过 `t.after()` 等钩子清理。
- 新增测试放入对应分区；不得重新写回 `extension/`、`platform-resources/`、`scripts/` 或 Options `src/`。
