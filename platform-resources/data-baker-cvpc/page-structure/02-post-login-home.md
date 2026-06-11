# 02 登录后首页

## 页面标识 / 路由 / 前置条件

- `routeKey`: `home-shell`
- `riskLevel`: `readonly`

- 路由：`#/home`
- 前置条件：有效登录态

- 左侧菜单：`user/meta.data.menus[]`
- 组织芯片：`user/meta.default_*` + `user_center/info.data.structures[]`
- 欢迎页主区：当前没有额外业务接口回填

## 页面总览

- 左侧菜单：`user/meta.data.menus[]`
- 组织芯片：`user/meta.default_*` + `user_center/info.data.structures[]`
- 欢迎页主区：当前没有额外业务接口回填

## DOM 树 / 区域结构

```text
#root
└─ 壳层容器
   ├─ 顶部提示条
   ├─ header
   │  ├─ 标题：工作台
   │  └─ 工具区：返回旧版 / 引导 / 消息 / 帮助 / 账户
   ├─ 左侧菜单
   │  ├─ 首页
   │  ├─ 我的作业
   │  └─ 个人账户
   └─ main
      └─ 欢迎页容器
         └─ `欢迎使用AI数据平台`
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
|------|------------|----------------------|------|
| 标题文本 | `header >> text=工作台` | `high` | 首页壳层首屏可见 |
| 首页菜单项 | `getByRole('menuitem', { name: '首页' })` | `high` | 激活态可直接判断 |
| 我的作业菜单项 | `getByRole('menuitem', { name: '我的作业' })` | `high` | 后续主入口 |
| 个人账户菜单项 | `getByRole('menuitem', { name: '个人账户' })` | `high` | 文本稳定 |
| 欢迎文案 | `main h1:has-text("欢迎使用AI数据平台")` | `high` | 首页主体唯一锚点 |
| 消息空表弹窗 | `.ant-modal >> text=暂无数据` | `medium` | 只在弹窗可见时成立 |
| `#aix-drop-panel` | `#aix-drop-panel` | `avoid` | 第三方叠加层 |

## 动态区域 / 重渲染风险

- `消息` 可能拉起弹窗表格
- 左侧菜单激活项会切换
- 组织标签与账户信息跟会话关联

- 避免依赖哈希类：
  - `.css-wjhehw`
- 避免依赖动态菜单内部 ID：
  - `rc-menu-uuid-*`

## 可挂载点建议

- 首页本身不是业务操作页
- 如果只需要平台总入口提示，可挂在：
  - `main` 欢迎区外围
  - `document.body` 浮层
- 不建议把长期挂件压进欢迎文案中心，容易干扰后续壳层复用

## 页面区域与接口映射

- 左侧菜单：`user/meta.data.menus[]`
- 组织芯片：`user/meta.default_*` + `user_center/info.data.structures[]`
- 欢迎页主区：当前没有额外业务接口回填

## 写操作边界 / 未确认项

- 写操作默认维持人工确认边界；未确认链路不得按文案直接推断。
