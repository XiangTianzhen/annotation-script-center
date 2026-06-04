# 01 登录路由与壳层

- `routeKey`: `login-shell`
- `riskLevel`: `readonly`

## 路由模式

- 登录路由：`#/login`
- 壳层根路径：`/app/web/`
- 2026-06-05 观察：
  - 有效会话访问 `#/login`，页面直接跳到 `#/home`
  - 因为本轮使用现成登录态，未停留在未登录表单页

## 前置条件

- 需要浏览器已有登录态，才能直接观察壳层
- 无登录态时应显示登录页，并走 `network/01-login-and-boot.md` 里的登录提交链

## `app/web` 壳层 DOM 树

```text
body
├─ #root
│  └─ 壳层主容器
│     ├─ 顶部提示：建议使用 Chrome
│     ├─ header
│     │  ├─ 页面标题区
│     │  └─ 顶部工具区（返回旧版 / 引导 / 消息 / 帮助 / 账户）
│     ├─ 左侧菜单区
│     │  └─ menu -> 首页 / 我的作业 / 个人账户
│     └─ main 内容区
├─ #aix-action-loading-host
└─ #aix-drop-panel                ← 浏览器侧下载叠加层，非平台正式结构
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
|------|------------|----------------------|------|
| 壳层根节点 | `#root` | `high` | `app/web` 主根节点 |
| 顶部导航 | `header` | `medium` | 需结合页面文本确认 |
| 左侧菜单 | `ul[role="menu"]` | `high` | 壳层稳定区域 |
| 我的作业入口 | `getByRole('menuitem', { name: '我的作业' })` | `high` | 比动态 `data-menu-id` 更稳 |
| 主内容区 | `main.ant-layout-content` | `medium` | 组件类稳定，哈希类不稳 |
| 第三方下载面板 | `#aix-drop-panel` | `avoid` | 不是平台原生节点 |

## 动态区域

- 左侧菜单高亮状态会变化
- 顶部 `消息` 区可能打开弹窗
- 组织标签区域随会话/组织切换改变

## 重渲染风险

- 避免依赖：
  - `.css-wjhehw`
  - `rc-menu-uuid-*`
  - 纯视觉 utility class 组合
- 壳层是 SPA，切路由时 `main` 会重绘，但 `header + menu` 通常保留

## 可挂载点建议

- 如果后续要做平台级辅助面板，优先：
  - `document.body` 固定浮层
  - `main` 内部独立容器
- 不建议：
  - 直接插到顶部导航按钮组
  - 直接插到左侧菜单树内部

## 页面区域与接口映射

- 左侧菜单：`user/meta.data.menus[]`
- 当前组织/终端上下文：`user/meta.default_*`
- 组织与角色补充信息：`user_center/info.data.structures[]`
- 壳层本身没有独立业务数据表；主要作用是承载后续列表页

## 本轮缺口

- 未登录表单节点和提交按钮仍待补采
