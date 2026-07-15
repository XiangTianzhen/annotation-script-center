# 扩展运行时

`extension/` 是当前 `1.0.0` Chrome / Edge Manifest V3 扩展成品目录。该目录可以直接作为 unpacked extension 加载，也是 ZIP 打包脚本的唯一输入。

## 目录结构

| 路径 | 职责 |
|---|---|
| `manifest.json` | 权限、注入站点、脚本顺序、popup、Options 与 service worker |
| `background/` | 设置 bootstrap 与 AIDP 登录状态清理 |
| `popup/` | 当前平台/脚本识别、启停和详情页跳转 |
| `options/` | Vue Options 构建产物与共享控件运行时 |
| `shared/` | 常量、storage、AI 元数据、费用展示与通用请求工具 |
| `sites/` | 三个平台五个脚本的页面运行时 |
| `assets/` | 扩展图标与 Options 品牌资源 |

## 当前注入范围

### DataBaker CVPC

- 站点：`https://cvpc.data-baker.com/*`
- 脚本：`sites/data-baker-cvpc/liuzhou-helper/`
- MAIN world：音频与平台请求观察
- ISOLATED world：设置、数据 API、AI、分段、面板、快捷键和入口编排

### ByteDance AIDP

- 站点：`https://aidp.bytedance.com/*`
- 脚本：`sites/bytedance-aidp/suzhou-helper/`、`sites/bytedance-aidp/jinhua-helper/`、`sites/bytedance-aidp/taizhou-helper/`
- MAIN world：共享 Network observer
- ISOLATED world：三个脚本运行时；由 storage 中的 `activeScriptId` 决定实际启用项

### Magic Data

- 站点：`https://work.magicdatatech.com/*`
- 脚本：`sites/magic-data/hangzhou-helper/`
- MAIN world：只读 Network observer
- ISOLATED world：页面识别、数据采集、AI 客户端、面板、快捷键和入口编排

manifest 中的脚本顺序就是依赖顺序。共享常量和 storage 必须先于脚本入口加载，MAIN world observer 必须在页面请求发生前注入。

## Options 与 popup

- Vue 源码：`frontend/options-app/`
- 样式入口：`frontend/options-app/src/styles/index.scss`
- 构建命令：`node scripts/build-options-app.js`
- 构建输出：`extension/options/`
- popup 只识别三个当前平台，并可切换脚本启用状态或打开详情页。
- Options 只维护 `Server` 与 `Local` 两套后端根地址。
- 默认 Server：`https://annotation-script-center.xiangtianzhen.store`
- 默认 Local：`http://127.0.0.1:3333`
- storage schema：`33`

脚本详情页统一采用“基础设置与快捷键在左、AI 设置在右”的布局，并通过五个 defaults 接口加载后端默认值。后端不可用时使用本地回退，不阻断编辑与保存。

## 设置与运行边界

- AIDP 苏州话、金华话和台州话三套脚本同平台互斥。
- 快捷键默认全部为空，只保存用户明确录制的键位。
- 非法或越界数字会阻止整次保存，不产生部分写入。
- Options 保存不会操作业务页数据。
- AI 建议默认人工确认；具体写回方式以各脚本 README 为准。
- 金华话使用单次 Qwen Omni 可编辑转写 Prompt：默认 Prompt 由后端下发，用户保存的本地覆盖值直接用于模型；响应仍只处理 JSON `listenText`，不做风险或强制填入判断。
- 重新加载扩展后应刷新已经打开的业务页，避免旧 content script 上下文继续运行。

## 构建与加载

在仓库根目录：

```powershell
node scripts/build-options-app.js
```

然后打开 `chrome://extensions/` 或 `edge://extensions/`，启用开发者模式并加载仓库中的 `extension/`。

使用 `dist/annotation-script-center-v1.0.0.zip` 时，需要先解压，再加载解压后的扩展根目录。

发布 ZIP 的包内路径统一使用标准 `/` 分隔符，打包时会确认 manifest 引用的 background 与 content scripts 完整存在；该兼容性用于目标 Edge 版本的拖拽导入验收，但不替代上述解压加载流程。

## 真实浏览器验收

1. 脚本中心只显示柳州、苏州、金华、台州、杭州五项。
2. popup 能正确识别 CVPC、AIDP、Magic Data 页面。
3. AIDP 切换苏州/金华/台州时保持三方互斥，刷新业务页后只挂载当前启用脚本。
4. 五个脚本详情页能加载 defaults，断开后端时显示本地回退。
5. 五个真实业务页面各完成一次核心辅助操作。
6. 不发生未授权的自动保存、自动提交或自动切题。
7. 浏览器控制台没有新增持续错误。

## 开发验证

```powershell
npm test
node scripts/build-options-app.js
node scripts/package-extension-zip.js
```

测试统一位于根 `tests/`，定向命令见根 [README](../README.md) 与 [tests/README.md](../tests/README.md)。
