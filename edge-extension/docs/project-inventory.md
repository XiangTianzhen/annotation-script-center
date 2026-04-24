# 项目盘点

## 盘点基准

本文件仅基于 2026-04-15 对当前项目根目录的实际扫描结果编写。

当前项目根目录就是：
- 当前独立 Edge 扩展项目的唯一根目录。
- 后续文档、实现、协作判断的唯一基准。

本文件不再假定任何旧工程根目录仍然存在于当前项目外层。

## 当前顶层结构

```text
.
  README.md
  docs/
  extension/
  legacy-reference/
```

结论：
- 当前项目结构已经收敛，边界清楚。
- 当前项目已经具备独立维护条件。
- 当前项目是“扩展迁移项目”，不是“旧全量系统的完整复制”。

## 各目录的实际用途

### `docs/`

用途：
- 保存项目盘点、架构说明、迁移计划、协作规则、骨架说明。

性质：
- 非运行目录。
- 属于正式项目资产。
- 后续 AI 连续接力时必须优先依赖这里，而不是依赖旧聊天上下文。

### `extension/`

用途：
- 当前正式扩展代码目录。
- Edge 本地加载时应直接选择这个目录。

性质：
- 运行目录。
- 当前项目中唯一的正式扩展实现目录。

### `legacy-reference/`

用途：
- 保存旧实现参考文件，供迁移时查阅。

性质：
- 非运行目录。
- 非正式扩展代码目录。
- 只用于对照旧逻辑和旧接口，不允许直接覆盖 `extension/` 现有结构。

## `extension/` 内部结构

```text
extension/
  manifest.json
  background/
    service-worker.js
  icons/
    .gitkeep
  options/
    options.html
    options.js
  popup/
    popup.html
    popup.js
  shared/
    constants.js
    storage.js
  sites/
    alibaba-labelx/
      content.js
```

实际判断：
- `background/`、`options/`、`popup/`、`shared/`、`sites/` 都是 `extension/` 的内部子目录。
- 它们不是当前项目根目录下与 `docs/` 并列的一级目录。
- 因此文档中后续所有目录关系描述，都应写成 `extension/background/`、`extension/shared/`、`extension/sites/` 等形式。

## 当前可运行部分

当前真正用于运行的目录和文件：
- `extension/manifest.json`
- `extension/background/service-worker.js`
- `extension/options/`
- `extension/popup/`
- `extension/shared/`
- `extension/sites/alibaba-labelx/content.js`

当前运行形态：
- 一个最小可加载的 MV3 扩展骨架。
- 只覆盖 `labelx.alibaba-inc.com`。
- 只具备配置初始化、最小状态读取和只读存在感注入。

## 当前参考资料部分

当前仅作为参考资料的目录和文件：
- `docs/`
- `legacy-reference/asr-script.user.js`
- `legacy-reference/server.js`

补充判断：
- `docs/` 是正式项目资产，但不是运行时代码。
- `legacy-reference/` 是旧代码参考区，不是扩展正式代码区。
- 当前项目内没有完整后端工程结构，因此 `legacy-reference/server.js` 只能视为服务端参考源码，不应被误判为当前项目可直接运行的后端模块。

## 当前独立项目化是否成立

结论：成立。

原因：
- 当前项目已经有单独的 `README.md`、`docs/` 和 `extension/`。
- 当前运行代码与参考代码已经物理分区。
- 当前扩展骨架已经能独立加载，不依赖旧工程中的其他目录。

需要补充的现实约束：
- 当前只是“可独立维护的扩展迁移项目”，不是“功能已迁移完成的正式扩展产品”。
- 旧能力仍大量停留在 `legacy-reference/` 中。

## 当前目录边界总结

正式代码：
- `extension/`

正式文档：
- `README.md`
- `docs/`

旧代码参考：
- `legacy-reference/asr-script.user.js`
- `legacy-reference/server.js`

当前不应误判为正式代码的内容：
- `legacy-reference/` 下任何文件
- 文档里对旧工程路径的历史描述

## 当前阶段适合的迁移方式

当前最适合继续采用：
- 文档先行
- 骨架稳定
- 低副作用能力优先
- 旧代码只参考不直搬

当前不适合直接进入：
- 自动保存拦截
- 手动保存重放
- 自动提交
- 自动抢单
- 跨大量旧逻辑的一次性迁移
