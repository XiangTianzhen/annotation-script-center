# 扩展运行时

`extension/` 是 `1.0.0` Chrome / Edge 扩展成品目录。

## 当前注入范围

- `sites/data-baker-cvpc/liuzhou-helper/`
- `sites/bytedance-aidp/suzhou-helper/`
- `sites/bytedance-aidp/jinhua-helper/`
- `sites/bytedance-aidp/shared/page-world/network-observer.js`
- `sites/magic-data/hangzhou-helper/`
- `sites/magic-data/shared/page-detector.js`
- `sites/magic-data/shared/data-collector.js`
- `sites/magic-data/shared/page-world/network-observer.js`

manifest 仅注入 DataBaker CVPC、ByteDance AIDP 和 Magic Data。AIDP 的苏州话与金华话脚本互斥；Magic Data 只有杭州话脚本。

## Options 与 popup

- Vue 源码：`frontend/options-app/`
- Vue 样式入口：`frontend/options-app/src/styles/index.scss`；公共样式按 foundation、components、layouts、pages 与 vendor 拆分，Sass 仅作为开发依赖。
- 构建输出：`extension/options/`
- popup：只识别三个保留平台，并可打开当前脚本详情或切换启用状态。
- 后端模式：只支持 `Server` 与 `Local`。
- 默认 Server：`https://annotation-script-center.xiangtianzhen.store`；schema 30 保留用户保存的 Server 与 Local 地址。
- 系统管理：保留管理员会话、下载中心和四脚本 AI 日志导出。
- 功能面板的平台地址按“域名 + 路径”拆行显示；侧栏、详情返回按钮和平台地址胶囊均不显示文字下划线。
- 四个脚本详情页统一为“左侧基础设置/快捷键、右侧 AI 设置”，字段按开关、下拉框、单行输入、Prompt/stop sequences 排列。
- 详情页会读取四个现有 defaults 接口；成功时显示“已读取后端默认配置”，失败时显示“使用本地回退”，且不会阻断编辑与保存。
- AIDP 请求超时和前后静音时长以秒显示、毫秒保存；CVPC 静音阈值可在 `dB / % / Val` 间切换并始终以 dBFS 保存。
- 非法或越界数字会阻止整次保存，不会部分写入；保存成功后页面会重新读取 storage 归一化结果，确保当前显示与刷新后一致。

## 加载与验收

1. 打开 `chrome://extensions/` 或 `edge://extensions/`。
2. 开启开发者模式，选择“加载已解压的扩展程序”。
3. 选择仓库中的 `extension/`。
4. 验证脚本中心只显示四个脚本，popup 状态与当前平台一致。
5. 分别在柳州、苏州、金华、杭州真实页面验证一次核心辅助功能。

Options 保存本身不触发业务页保存、提交或切题。AI 建议默认只供人工确认；Magic Data 仅在用户显式启动当前页全自动或已保存快捷键时，才按脚本契约操作页面真实按钮。

## 开发验证

所有测试统一位于仓库根目录 `tests/`，在仓库根目录执行：

```powershell
npm test
node scripts/build-options-app.js
```

扩展、后端或 Options 的定向测试使用根 `package.json` 中对应的 `test:*` 命令，不再从运行时代码目录收集测试文件。
