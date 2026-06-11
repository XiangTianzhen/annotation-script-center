# 标注脚本中心扩展源码目录

本目录是 Chrome / Chromium MV3 扩展源码根目录，`manifest.json` 位于本目录下。

## 文档入口

- 项目规则：[`../AGENTS.md`](../AGENTS.md)
- 项目导航：[`../README.md`](../README.md)
- 平台与脚本索引：[`../docs/platforms-index.md`](../docs/platforms-index.md)
- 百炼官方文档入口：[`../docs/external-docs-aliyun-bailian.md`](../docs/external-docs-aliyun-bailian.md)
- docs 导航：[`../docs/README.md`](../docs/README.md)
- 配置说明：[`../config/README.md`](../config/README.md)

## 本地加载

- Edge：打开 `edge://extensions/`，开启开发人员模式，选择 `C:\Projects\annotation-script-center\extension`
- Chrome：打开 `chrome://extensions/`，开启开发者模式，选择 `C:\Projects\annotation-script-center\extension`
- 若本地直加载需要同步 build meta，在仓库根目录运行：

```powershell
node scripts/sync-local-build-meta.js
```

## 当前目录边界

- `manifest.json`
  - 扩展入口与权限声明
- `options/`
  - options 工作台、系统管理入口、脚本详情页
- `popup/`
  - 弹窗入口
- `sites/`
  - 各平台运行时代码
- `shared/`
  - 跨平台共享模块
- `assets/`
  - 图标与品牌资源

## 当前运行契约

- 不为 Chrome 和 Edge 复制两套 `sites/` 业务代码。
- 浏览器差异优先放到 manifest、浏览器 API 兼容层、打包配置或发布说明。
- 后端地址统一从 options 首页 / 系统管理入口配置；脚本详情页不新增独立后端地址。
- 同平台多个脚本默认互斥启用；需要并行启用必须由当前任务明确授权。
- `AI 设置`、`基础设置`、`快捷键` 保持脚本级独立保存。
- 快捷键面板统一复用 `extension/options/options-shared-shortcut-panel.js`。
- 默认快捷键统一为空；只有用户显式保存后才生效。
- TTS 自动清除默认时间统一为 `60000ms`；AI / 模型请求默认超时时间统一为 `60000ms`。
- 用户手动保存的非默认 AI 超时值继续保留；非 AI 上传、下载、统计接口超时不受该默认规则影响。

## Options 当前结构

- 路由固定为：
  - `?view=center`
  - `?view=downloads`
  - `?view=script&script=<scriptId>`
  - `?view=admin&tab=overview|backend|exports`
- `功能面板`
  - 平台概览、脚本启停、脚本详情入口
- `脚本下载中心`
  - 扩展版本分发入口
- `系统管理`
  - 后端地址、AI 调用使用人、导出与系统概况
- `?view=admin` 进入时要求密码。
- `?view=downloads` 只负责扩展包下载，不承担后台配置职责。
- beta 通道继续走隐藏入口与口令解锁，不默认展示 beta 平台、beta 脚本与 beta 服务器地址。

## 当前站点脚本

```text
sites/
  alibaba-labelx/
    asr-transcription/
    asr-judgement/
  data-baker/
    round-one-quality/
  data-baker-cvpc/
    liuzhou-helper/
  magic-data/
    shared/
    hakka-helper/
    minnan-helper/
  abaka-ai/
    task-page/
  aishell-tech/
    minnan-helper/
    vietnamese-helper/
```

- `alibaba-labelx/asr-judgement/`
  - ASR 快判运行时
- `alibaba-labelx/asr-transcription/`
  - ASR 转写运行时
- `data-baker/round-one-quality/`
  - 标贝易采闽南语助手
- `data-baker-cvpc/liuzhou-helper/`
  - CVPC 柳州话助手
- `magic-data/hakka-helper/`
  - Magic Data 客家话助手
- `magic-data/minnan-helper/`
  - Magic Data 闽南语助手
- `abaka-ai/task-page/`
  - Task 页面助手
- `aishell-tech/minnan-helper/`
  - Aishell Tech 闽南语助手
- `aishell-tech/vietnamese-helper/`
  - Aishell Tech 越南语助手

## 版本与发布

- 默认保持 `extension/manifest.json` 当前版本不变。
- 当前开发周期固定为 `0.4.0`，除非用户明确要求打包、发布或提升版本号。
- 正式发布产物以 CRX 三件套为准：
  - `annotation-script-center-v<version>.crx`
  - `annotation-script-center-update.xml`
  - `annotation-script-center-crx-latest.json`
- 历史过程与发布流水统一查看 `log.md`。
