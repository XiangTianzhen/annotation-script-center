# ByteDance AIDP 苏州话脚本

## 定位

- 平台：`bytedance-aidp`
- 资料目录：`suzhou-helper`
- 目标页：
  - `https://aidp.bytedance.com/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
- 当前阶段：`beta`
- 当前状态：只完成脚本级资料初始化；尚未创建 `extension/sites/bytedance-aidp/` 运行时代码，也未注册脚本启停入口

## 当前资料覆盖

- `mark-v3` 详情页路由与 query 上下文
- 详情页初始化请求的首轮只读边界
- 详情页语义分区、挂载建议与动态重渲染风险
- 后续脚本接线前的写操作警戒线

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | 苏州话脚本入口、资料导航和接线边界 |
| `network/README.md` | `mark-v3` 详情页专项 Network 索引 |
| `network/01-mark-v3-detail-init.md` | `mark-v3` 详情页初始化与只读请求边界 |
| `page-structure/README.md` | `mark-v3` 详情页结构索引 |
| `page-structure/01-mark-v3-detail.md` | `mark-v3` 详情页语义分区、初版锚点和挂载边界 |

公共资料入口：

- 平台公共网络：`../network/README.md`
- 平台公共列表页网络：`../network/01-task-v2-home.md`
- 平台公共结构：`../page-structure/README.md`
- 平台公共列表页结构：`../page-structure/01-task-v2-home.md`

## 页面入口

| 页面 | URL 模式 | 说明 |
| --- | --- | --- |
| 苏州话详情页 | `/management/task-v2/{taskId}/mark-v3/{index}?from_pathname={path}&fs={value}&templateID={templateId}&templateType={templateType}` | 当前仅确认 `mark-v3` 路由结构和回列表上下文参数 |

## 后续运行时接线边界

- 当前不创建 `extension/sites/bytedance-aidp/suzhou-helper/`
- 当前不创建脚本级后端目录或统一后端注册
- 当前不预设脚本级快捷键、AI 面板或保存链路
- 后续若接运行时，优先先补：
  - 详情页真实 DOM 锚点
  - 字段结构
  - 媒体区域结构
  - 只读初始化请求

## 当前边界

- AI、保存、提交、领取、批量流转均不在本轮范围
- 不确认任何字段名、按钮文案或接口路径，除非后续在独立 Edge 窗口里完成补采
- 所有写动作默认保持人工确认边界

## 安全边界

- 不记录完整登录态、鉴权头、完整签名资源地址或原始请求包
- 后续若继续补采，优先使用独立 Edge 窗口或标签页，避免读取无关已登录页面
