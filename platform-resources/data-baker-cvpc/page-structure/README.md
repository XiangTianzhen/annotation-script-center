# DataBaker CVPC 页面结构索引

## 目录用途

本目录记录 `cvpc.data-baker.com` 首轮页面 DOM 结构，重点是稳定路由、稳定锚点、应避免依赖的动态 class，以及页面区域与接口数据的映射关系。

## 文件列表

| 编号 | 文件 | 页面/范围 |
|------|------|-----------|
| 01 | `01-login-and-shell.md` | `#/login` 路由行为 + `app/web` 壳层 |
| 02 | `02-post-login-home.md` | `#/home` 首页 |
| 03 | `03-home-to-editor-route.md` | `#/my-job` 到 job 列表 |
| 04 | `04-editor-asr.md` | `/app/editor/asr/` |
| - | `pending-capture.md` | 待补采项 |

## 阅读顺序

1. `01-login-and-shell.md`
2. `02-post-login-home.md`
3. `03-home-to-editor-route.md`
4. `04-editor-asr.md`

## 壳层划分

- `app/web`：
  - 统一壳层
  - 顶部导航 + 左侧菜单 + 主内容区
  - Ant Design 组件明显，`css-*` 哈希类不稳定
- `app/editor/asr`：
  - 独立编辑器
  - 顶部动作条 + 波形区 + 音频列表 + 标注区
  - Element UI 组件明显，`el-button--*` 只能做辅助选择器

## 统一约定

- `routeKey`：页面稳定标识
- `riskLevel`：`readonly`、`safe-ui`、`write-action`
- `selectorConfidence`：`high`、`medium`、`avoid`

## 本轮边界

- 仅记录标注员链路下的真实可见结构
- 不把 `AIX智能下载器` 之类浏览器侧叠加层当作平台正式结构
- 不把带随机前缀的菜单 ID、哈希 class、表格行序号当作稳定锚点
