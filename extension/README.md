# 标注脚本中心扩展源码目录

本目录是 Chrome / Chromium MV3 扩展源码根目录，`manifest.json` 位于本目录下。

## 本地加载

- Edge：打开 `edge://extensions/`，开启开发人员模式，选择 `annotation-script-center/extension`
- Chrome：打开 `chrome://extensions/`，开启开发者模式，选择 `annotation-script-center/extension`
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
- Magic Data 当前包含客家话、闽南语、杭州话三套脚本；杭州话脚本沿用现有 beta 解锁口径，未解锁时不在脚本列表展示。
- `AI 设置`、`基础设置`、`快捷键` 保持脚本级独立保存。
- 快捷键面板统一复用 `extension/options/options-shared-shortcut-panel.js`。
- `?view=script` 详情页里标记了 `data-options-custom-select="true"` 的下拉统一复用 `extension/options/options-shared-select.js`；该共享组件只接管脚本详情页，不影响下载中心和系统管理页的原生下拉，并在菜单展开时只监听真实页面滚动与 `resize`，不再因为菜单内部滚动而自动关闭。
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
  bytedance-aidp/
    shared/
    jinhua-helper/
    suzhou-helper/
  magic-data/
    shared/
    hakka-helper/
    minnan-helper/
    hangzhou-helper/
  abaka-ai/
    task-page/
  aishell-tech/
    minnan-helper/
    vietnamese-helper/
    thai-helper/
    cn-en-short-drama/
```

- `alibaba-labelx/asr-judgement/`
  - ASR 快判运行时
- `alibaba-labelx/asr-transcription/`
  - ASR 转写运行时
- `data-baker/round-one-quality/`
  - 标贝易采闽南语助手
- `data-baker-cvpc/liuzhou-helper/`
  - CVPC 柳州话助手
- `bytedance-aidp/jinhua-helper/`
  - ByteDance AIDP 金华话脚本
- `bytedance-aidp/suzhou-helper/`
  - ByteDance AIDP 苏州话脚本
- `magic-data/hakka-helper/`
  - Magic Data 客家话助手
- `magic-data/minnan-helper/`
  - Magic Data 闽南语助手
- `magic-data/hangzhou-helper/`
  - Magic Data 杭州话脚本（隐藏 beta）
- `abaka-ai/task-page/`
  - Task 页面助手
- `aishell-tech/minnan-helper/`
  - Aishell Tech 闽南语助手
- `aishell-tech/vietnamese-helper/`
  - Aishell Tech 越南语助手
- `aishell-tech/thai-helper/`
  - Aishell Tech 泰语助手
- `aishell-tech/cn-en-short-drama/`
  - Aishell Tech 中英短剧脚本（只读当前媒体信息面板）

## 版本与发布

- 默认保持 `extension/manifest.json` 当前版本不变。
- 当前开发周期固定为 `0.4.0`，除非用户明确要求打包、发布或提升版本号。
- 正式发布产物以 CRX 三件套为准：
  - `annotation-script-center-v<version>.crx`
  - `annotation-script-center-update.xml`
  - `annotation-script-center-crx-latest.json`
- 历史过程与发布流水统一查看 `log.md`。
