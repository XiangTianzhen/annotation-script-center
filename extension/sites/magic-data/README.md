# Magic Data ANNOTATOR 前端目录

Magic Data 平台运行时代码采用“平台共享 + 脚本专属目录”结构。

## 目录结构

- `shared/`：页面识别、数据采集、network observer、共享 AI client 等平台共用模块。
- `hakka-helper/`：客家话助手入口。
- `minnan-helper/`：闽南语助手入口。
- `hangzhou-helper/`：杭州话脚本入口（隐藏 beta）。

## 运行边界

- 平台：`https://work.magicdatatech.com/*`
- 目标页面：
  - 客家话助手：`#/asrmark`、`#/asrmarkCheck`
  - 杭州话脚本：`#/asrmark`、`#/asrmarkCheck`
  - 闽南语助手：按其现有入口运行
- 所有脚本都只允许用户主动点击或快捷键触发 AI。
- 不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。

## 配置与入口

- options 首页统一后端地址，不在脚本详情页新增独立后端地址。
- Magic Data 三脚本默认互斥启用；启用一个会自动关闭另外两个。
- popup 在 Magic Data 页面只展示当前唯一生效脚本。
- 杭州话脚本沿用现有 beta 解锁口径；未解锁时不在脚本列表显示，解锁后可启停和进入详情页。
- 三脚本共享平台后端地址入口，但 `AI 设置`、`基础设置`、`快捷键` 仍按脚本独立保存。
- 杭州话首版沿用客家话前端能力：右侧 AI 面板、行内填入、原始输出、快捷键、当前页临时全自动链路都保留。
- Magic Data 详情页统一保存 `modelMode + recognitionStrategy + listenModel + compareModel + singleModel` 等显式字段，并同步维护 legacy 配置镜像，避免刷新后回退显示。
