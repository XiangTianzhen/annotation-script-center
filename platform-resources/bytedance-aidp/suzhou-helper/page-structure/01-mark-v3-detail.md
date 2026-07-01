# 01 `mark-v3` 详情页

## 页面标识 / 路由 / 前置条件

- `routeKey`: `suzhou-mark-v3-detail`
- `riskLevel`: `readonly`

- 路径：`/management/task-v2/{taskId}/mark-v3/{index}`
- 关键 Query：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`

- 已登录到 AIDP 管理后台
- 当前账号对目标任务与条目具备详情页访问权限

## 页面总览

- 当前只安全确认这是 `mark-v3` 详情工作页，首轮按后续脚本接线需要拆成：
  - 顶部任务 / 条目上下文区
  - 主工作区
  - 标注字段区
  - 页面动作区
- 具体字段名、按钮文案、媒体组件和布局细节，仍待独立 Edge 窗口补采。

## DOM 树 / 区域结构

```text
body
└─ mark-v3 详情根容器
   ├─ 顶部任务 / 条目上下文区（待确认）
   ├─ 主工作区
   │  ├─ 媒体或内容展示区（待确认）
   │  └─ 辅助信息区（待确认）
   ├─ 标注字段区
   │  ├─ 字段标题 / 字段体（待确认）
   │  └─ 当前条目反馈区（待确认）
   └─ 页面动作区
      ├─ 暂存 / 保存类动作（待确认）
      └─ 提交 / 流转类动作（待确认）
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
| --- | --- | --- | --- |
| 详情页路由 | `/\\/management\\/task-v2\\/[^/]+\\/mark-v3\\/[^/?#]+/.test(location.pathname)` | `high` | 首层页面识别锚点 |
| 当前任务 ID | `location.pathname.split("/")[3]` | `high` | 来自已知 URL 模式 |
| 当前索引 | `location.pathname.split("/")[5]` | `high` | 来自已知 URL 模式 |
| 模板上下文 | `new URLSearchParams(location.search).get("templateID")` | `high` | 当前只确认 query 级锚点 |
| 返回列表上下文 | `new URLSearchParams(location.search).get("from_pathname")` | `high` | 用于回列表链路识别 |
| 主内容区 | `main, [role="main"], form` | `medium` | 仅作语义容器候选 |
| 返回列表链接 | `a[href*="/management/task-v2"]` | `medium` | 待真实页面复核 |
| 哈希类名 / 瞬时渲染 class | `data-v-*`、CSS Modules 哈希类 | `avoid` | 禁止作为唯一依据 |

## 动态区域 / 重渲染风险

- 当前条目切换后，主工作区和字段区可能整体重渲染
- 媒体区域、富文本区域或动态校验提示当前都未补采
- 在真实页面补采前，避免依赖：
  - `nth-child`
  - 临时高亮态 class
  - 仅凭按钮顺序判断动作语义

## 可挂载点建议

- 如后续要接入详情页辅助 UI，优先选择：
  - 字段区外层的独立 sibling 节点
  - 主工作区与字段区之间的安全空白区
- 不建议：
  - 直接覆盖媒体展示区
  - 直接混进平台主动作按钮组
  - 未补采前插到未知富文本或画布内部

## 页面区域与接口映射

- 页面路由：`/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
- 详情初始化接口：待补采
- 字段、媒体、状态类接口：待补采

## 写操作边界 / 未确认项

- 当前未确认详情页的保存、提交、领取、切条、流转或快捷键入口。
- 当前未确认字段编辑区是普通表单、富文本、画布还是混合容器。
- 在真实页面补采前，字段编辑、状态切换和任何主动作按钮都应视为 `write-action`。
