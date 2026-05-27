# Aishell Tech 页面结构索引

## 目录用途

本目录保存 Aishell Tech 数据处理工作平台的页面 DOM 结构采集记录。

## 文件列表

| 编号 | 文件 | 页面 | 状态 |
|------|------|------|------|
| 01 | `01-index.md` | 首页 `/index` | 完成 |
| 02 | `02-mytask-index.md` | 我的任务列表 `/mytask/index` | 完成 |
| 03 | `03-mytask-detail.md` | 任务详情 `/mytask/detail/:taskId` | 完成 |
| 04 | `04-mytask-mark.md` | 数据标注 `/mytask/mark` | 完成 |
| 05 | `05-organization.md` | 我的团队 `/organization/myteam` | 初版占位完成，详细 DOM 待补 |
| - | `pending-capture.md` | 待补采项清单 | 持续更新 |

## 全局组件

### 页面壳层

```
#app
└─ .wrapper
   └─ .v-layout-horizontal.fixed
      ├─ .layout-header.fixed-header
      │   ├─ .v-header                        ← 顶部导航栏
      │   └─ .tabs-horizontal                 ← 多 Tab 标签页
      ├─ .v-main.main-padding                 ← 页面内容区
      │   └─ .v-app-main
      │       ├─ section → #data-view → ...   ← 各页面内容
      │       └─ footer.v-footer              ← 页脚
      └─ (Tab 关闭下拉菜单 .v-tabs-more)
```

### 顶部导航栏

- **容器**：`.v-header`
- **布局**：`el-row` 两栏（el-col-6 + el-col-18）

#### 左侧：Logo

- **容器**：`.logo-container.logo-container-horizontal`
- **Logo 图片**：`img[src="/static/img/logo.340a3be1.png"]`
- **平台名称**：`span.title.hidden-xs-only`（"数据处理工作平台"）
- **链接**：`a[href="/"]`（router-link，点击回首页）

#### 右侧：功能面板

- **容器**：`.right-panel`

| 组件 | 选择器 | 说明 |
|------|--------|------|
| 水平菜单 | `ul.el-menu--horizontal` | 3 个 `li.el-menu-item`，背景 `#282c34` |
| 首页 | `li.el-menu-item.is-active`（含 `.i-icon-home-two`） | 当前页高亮底边框 `rgba(255,255,255,0.95)` |
| 我的任务 | `li.el-menu-item`（含 `.i-icon-data-sheet`） | 点击跳转 `/mytask/index` |
| 我的团队 | `li.el-menu-item`（含 `.i-icon-every-user`） | 点击跳转 `/organization/myteam` |
| 全屏按钮 | `.i-icon-full-screen-one` | 右上角工具栏 |
| 刷新按钮 | `.i-icon-refresh` | 右上角工具栏 |
| 用户头像 | `.avatar-dropdown` → `.el-dropdown` | 含 `el-avatar--circle` 头像图 + "ASmnbz001【标注人员】" |

#### 用户下拉菜单

- **容器**：`.el-dropdown-menu`（id 动态生成，display:none 默认隐藏）
- **菜单项**：
  - "修改密码"：`.i-icon-edit-two` + `li.el-dropdown-menu__item`
  - "退出登录"：`.i-icon-logout` + `li.el-dropdown-menu__item`

### 多 Tab 标签页

- **容器**：`.tabs-horizontal` → `.v-tabs`
- **Tab 组件**：`.el-tabs.el-tabs--card`
- **Tab 项**：`div.el-tabs__item`
  - `id` 属性格式 `tab-<路由>`（如 `tab-/index`）
  - `id` 对应 `aria-controls="pane-<路由>"`
  - 活跃 Tab：`.is-active`
  - 可关闭：`.is-closable`（含 `.el-icon-close` 关闭按钮）
- **Tab 内容区**：`.el-tab-pane`，`id` 格式 `pane-<路由>`
- **更多按钮**：`.v-tabs-more`（下拉菜单 `tabs-more`），含：关闭其他、关闭左侧、关闭右侧、关闭全部

### 页脚

- **选择器**：`footer.v-footer`
- **内容**：`数据处理工作平台 2026`
- **位置**：`.v-app-main` 内，在所有 section 下方

## 读取顺序建议

1. `01-index.md` → 壳层
2. `02-mytask-index.md` → 任务列表
3. `03-mytask-detail.md` → 任务详情
4. `04-mytask-mark.md` → 数据标注（核心工作页）
5. `05-organization.md` → 组织管理占位与后续补采入口

## 接入判断

- 当前资料已足够支撑首阶段运行时代码围绕“我的任务 → 任务详情 → 数据标注”开工。
- `05-organization.md` 目前只承担组织管理页占位说明，不建议把组织管理能力纳入首阶段脚本范围。
