# 01 列表首页 `/management/task-v2?page=1`

## 页面标识 / 路由 / 前置条件

- `routeKey`: `task-v2-home`
- `riskLevel`: `readonly`

- 路径：`/management/task-v2`
- 关键 Query：
  - `page`

- 已登录到 AIDP 管理后台
- 当前页面可进入任务列表并跳转到 `mark-v3` 详情页

## 页面总览

- 当前只安全确认这是任务管理列表页，首轮按页面语义拆成：
  - 列表筛选区
  - 任务列表区
  - 分页区
  - 行级详情跳转入口
- 具体列头、筛选字段、按钮文案和 DOM 类名仍待独立 Edge 窗口补采。

## DOM 树 / 区域结构

```text
body
└─ 管理页根容器
   ├─ 顶部上下文区（待确认）
   ├─ 列表筛选区
   │  ├─ 搜索 / 查询条件（待确认）
   │  └─ 过滤 / 重置动作（待确认）
   ├─ 任务列表区
   │  ├─ 列头区域（待确认）
   │  └─ 行级详情入口
   └─ 分页区
      ├─ 当前页信息
      └─ 翻页动作
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
| --- | --- | --- | --- |
| 列表页路由 | `location.pathname === "/management/task-v2"` | `high` | 首层页面识别锚点 |
| 当前页码 | `new URLSearchParams(location.search).get("page")` | `high` | 分页上下文直接来自 URL |
| 详情跳转链接 | `a[href*="/management/task-v2/"][href*="/mark-v3/"]` | `medium` | 依赖详情页 URL 模式，待真实页面复核 |
| 顶部 header | `header.aidp-foundation-layout-header` | `medium` | 当前用于列表页账号切换按钮挂载 |
| 右侧用户区 | `[class^="frame-user-info-"]` | `medium` | 当前用于定位头像与按钮插入区 |
| 主内容区 | `main, [role="main"]` | `medium` | 只作外层语义容器候选 |
| 表格行 | `table tbody tr, [role="row"]` | `medium` | 当前仅作通用语义候选 |
| 分页控件 | `a[href*="page="], button[aria-label*="page"]` | `medium` | 需真实页面确认组件实现 |
| 哈希类名 / 打包产物类名 | `data-v-*`、CSS Modules 哈希类 | `avoid` | 禁止作为唯一依据 |

## 动态区域 / 重渲染风险

- 列表筛选动作可能触发整表刷新
- 翻页后列表行和分页按钮状态会重渲染
- 行级操作区和列表顺序不应作为长期稳定锚点
- 在真实页面补采前，避免依赖：
  - `nth-child`
  - 瞬时高亮态 class
  - 纯文本列序号

## 可挂载点建议

- 如后续要接入列表页辅助 UI，优先选择：
  - 顶部 header 内已确认的右侧用户区
  - 真实头像入口左侧的独立 sibling 节点
- 当前扩展已采用：
  - 以 `header.aidp-foundation-layout-header` 为顶层锚点
  - 在右侧用户区头像左侧插入紧凑 `切换账号` 按钮
  - 按钮点击后直接清理 AIDP 主站、`mpsso.jiyunhudong.com` 与该 SSO 顶层站点下的第三方登录 Cookie 并刷新页面
- 不建议：
  - 回退到主内容区上方独立助手条
  - 直接覆盖行级详情入口
  - 直接插进分页控件内部
  - 依赖未确认的哈希类名挂载

## 页面区域与接口映射

- 列表页路由：`/management/task-v2?page={page}`
- 列表数据接口：待补采
- 详情跳转 URL：`/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`

## 写操作边界 / 未确认项

- 当前列表页账号切换按钮直接调用扩展后台清理 AIDP 主站、`mpsso.jiyunhudong.com` 与该 SSO 顶层站点下的第三方登录 Cookie，再刷新页面；不调用平台写接口。
- 当前未确认列表页是否存在领取、分配、批量操作或状态流转按钮。
- 当前未确认筛选区是否会触发服务端写状态或仅改本地视图。
- 在真实页面补采前，任何行级按钮和批量动作都应视为 `write-action`。
