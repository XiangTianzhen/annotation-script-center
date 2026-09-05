# 扩展运行时

`extension/` 是当前正式 `1.2.0` Chrome / Edge Manifest V3 扩展成品目录。该目录可以直接作为 unpacked extension 加载，也是 ZIP 打包脚本的唯一输入。

## 目录结构

| 路径 | 职责 |
|---|---|
| `manifest.json` | 权限、注入站点、脚本顺序、popup、Options 与 service worker |
| `background/` | 设置 bootstrap 与 AIDP 登录状态清理 |
| `popup/` | 当前平台/脚本识别、启停和详情页跳转 |
| `options/` | Vue Options 构建产物与共享控件运行时 |
| `shared/` | 常量、storage、AI 元数据、费用展示与通用请求工具 |
| `sites/` | 四个平台六个脚本的页面运行时 |
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

### 数加加

- 站点：`https://www.shujiajia.com/*`
- 脚本：`sites/shujiajia/luzhou-helper/`
- MAIN world：仅在内存中观察音频响应字节与平台暂存成功信号；XHR 保持原生 `send`，只通过 `open` 记录私有请求元数据并监听生命周期
- ISOLATED world：零分段可信整段划分、单阶段 Omni 泸州方言识别、原生区域内嵌面板、五项助手快捷键和原生写入编排

manifest 中的脚本顺序就是依赖顺序。共享常量和 storage 必须先于脚本入口加载，MAIN world observer 必须在页面请求发生前注入。

## Options 与 popup

- Vue 源码：`frontend/options-app/`
- 样式入口：`frontend/options-app/src/styles/index.scss`
- 构建命令：`node scripts/build-options-app.js`
- 构建输出：`extension/options/`
- popup 识别四个当前平台，并可切换脚本启用状态或打开详情页。
- Options 只维护 `Server` 与 `Local` 两套后端根地址。
- 默认 Server：`https://annotation-script-center.xiangtianzhen.store`
- 默认 Local：`http://127.0.0.1:3333`
- 系统管理的“后端设置”仅在 Server 模式显示“吴 / 王”密钥选择器；点击名称只选择槽位，点击“保存当前密钥”才切换后端私有槽位，不会显示、保存或传输 DashScope 密钥。
- storage schema：`43`

脚本详情页统一采用“基础设置与快捷键在左、AI 设置在右”的布局，并通过六个 defaults 接口加载后端默认值。后端不可用时使用本地回退，不阻断编辑与保存。

## 设置与运行边界

- AIDP 苏州话、金华话和台州话三套脚本同平台互斥。
- 快捷键默认全部为空，只保存用户明确录制的键位。
- 首次安装或重置设置时六个脚本全部关闭，不默认选择 ByteDance AIDP 的任一脚本；已有安装明确保存的启停状态不被覆盖。
- 数加加泸州话只在当前零段落时允许通过受限可信 `Shift + 拖拽` 将整音频划为一段，按两个波形像素验收且失败时保留段落、不自动 Delete；自动入口以新 `taskId:dataId` 为触发信号，并只在 iframe 的 `document.referrer` 是合法数加加标注页时按固定延迟单次执行。页面会话首个条目默认等待 2500ms，后续条目默认等待 500ms，两项均可在 500–5000ms 内配置；不再等待网络资源、结果框重挂或波形轮询。识别本身不再要求先画段，零段、单段和多段均可对同题音频执行一次 Omni 泸州方言识别。控制区与常驻结果区优先挂载 `.tabs-container`、`.transfer`，零段状态使用父级回退并在正式容器出现后自动迁回。默认自动填入仅在恰好一个可编辑段落时执行；人工“填入转写”严格写入唯一 `.el-table__row.current-row`。整段画段、识别、填入及两个 OVERLAP 原生符号操作共五项快捷键默认均为空；OVERLAP 动作可在转写输入框聚焦时触发，并只点击 `Category1（多选）` 的原生控件。扩展只标记待暂存，不自动设置有效性、暂存或提交。
- 非法或越界数字会阻止整次保存，不产生部分写入。
- Options 保存不会操作业务页数据。
- AI 建议默认人工确认；具体写回方式以各脚本 README 为准。
- ByteDance AIDP 苏州、金华、台州辅助面板统一使用“当前媒体信息”，从当前 Receive 条目展示音频和视频地址，不再展示模板；存在对应地址时可复制完整音频或视频 URL，缺少视频时只显示“无视频”。
- 金华话、台州话均使用单次 Qwen Omni：后端把字符串原始输出逐字符映射为响应 `listenText`。`listenText` 仅是扩展/API 兼容字段，而非模型 JSON 字段，不做 JSON 解析、文本清洗或解释提取。
- 台州话“基础设置”可填写录音平台可见任务编号；配置后，`mark-v3` 仍在“清空画段”左侧显示“添加数据”，两类只读检查包则在辅助面板的录音结果区显示该按钮。导入优先使用同题、未过期的 Search Item；检查包缺失时才回退同题、未过期的 GetWorkItem/Receive，并且只转发 `asr_text`、`audio`、`video` 对应的参考文字及公网 HTTPS URL。服务器继续按 `BYTEDANCE_AIDP + ItemID` 绑定；默认折叠的“当前录音平台结果”只读显示状态、完成文本和音频。扩展不下载参考媒体，机器 Key 只在服务器，AIDP Cookie、Authorization 和 Session 不会传给脚本中心。
- 台州话 `mark-v3` 与两类检查包的“全自动导入并押后”是受控 DOM 自动化例外：只有用户手动开始才运行，并锁定当前页面类型、任务与 package/node 范围；范围改变立即停止。状态为 `AVAILABLE`（待领取）或 `SUBMITTED`（待审核领取）后才点击文本精确为“押后”的可用真实控件；当前仅接受原生 `button` 或已确认类名含 `defer-button` 的 `div`，在标题精确为“押后原因”的唯一可见弹层中填写 `1` 并点击同一按钮组的“确定”。每次自动点击前必须等待页面 fetch/XHR 已全部结算且连续静默 1 秒；20 秒内未满足即停止并显示未结算数量。活动观察只跨世界传递计数与序号，不传 URL、参数、响应或凭据。任何歧义、失败或未验证进入下一题都会停止，不会点击“提交”、领取或直接调用 AIDP 写接口；检查包的文本写回、分段修改、暂存、保存、领取等入口仍保持关闭。停止会在确认前取消该弹层，确认后不再触发下一步；该内存态流程不写 storage、不改 Options、后端或 manifest。
- 台州话返修列表 `node/14/revise` 只批量导入当前 SearchModifyItem 页面的最多 10 条，严格串行并显示停止和结果统计；返修详情 `modify-v2/4/{itemId}` 按 ItemID 刷新 `COMPLETED` 结果，用户点击后才换行追加到唯一可写转写框。返修不启用自动押后，也不自动暂存、审核、切题或直接调用 AIDP 写接口。
- 两套脚本保存的自定义 Prompt 不迁移、不覆盖。非空本地自定义 Prompt 会原样作为完整 systemPrompt，完全决定模型语义和输出格式；后端仅附带音频片段、时间范围、字段/编辑上下文和规则资料已加载标识，不再追加翻译、原样听写、纯文本或其他输出规则。清空后回退各自后端默认 Prompt。thinking 默认关闭，仅严格布尔 `aiOmni.enableThinking: true` 可开启；模型请求超时仍为 `60000ms`。
- 重新加载扩展后应刷新已经打开的业务页，避免旧 content script 上下文继续运行。

## 构建与加载

在仓库根目录：

```powershell
node scripts/build-options-app.js
```

然后打开 `chrome://extensions/` 或 `edge://extensions/`，启用开发者模式并加载仓库中的 `extension/`。

使用 `dist/annotation-script-center-v1.2.0.zip` 时，需要先解压，再加载解压后的扩展根目录。

发布 ZIP 的包内路径统一使用标准 `/` 分隔符，打包时会确认 manifest 引用的 background 与 content scripts 完整存在；该兼容性用于目标 Edge 版本的拖拽导入验收，但不替代上述解压加载流程。

## 真实浏览器验收

1. 脚本中心显示柳州、苏州、金华、台州、杭州、泸州六项。
2. popup 能正确识别 CVPC、AIDP、Magic Data、数加加页面。
3. AIDP 切换苏州/金华/台州时保持三方互斥，刷新业务页后只挂载当前启用脚本。
4. 六个脚本详情页能加载 defaults，断开后端时显示本地回退。
5. 六个真实业务页面各完成一次核心辅助操作；数加加验收不得点击提交按钮。
6. 不发生未授权的自动保存、自动提交或自动切题。
7. 浏览器控制台没有新增持续错误。

## 开发验证

```powershell
npm test
node scripts/build-options-app.js
node scripts/package-extension-zip.js
```

测试统一位于根 `tests/`，定向命令见根 [README](../README.md) 与 [tests/README.md](../tests/README.md)。
