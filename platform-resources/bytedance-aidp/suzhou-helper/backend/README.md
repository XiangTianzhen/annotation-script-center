# ByteDance AIDP 苏州话脚本后端

## 目录定位

- 目录：`platform-resources/bytedance-aidp/suzhou-helper/backend`
- 类型：脚本级统一后端路由
- 当前只承载 `mark-v3` 详情页分段建议预览，不承载平台提交、领取或批量流转

## 当前文件

| 文件 | 职责 |
| --- | --- |
| `index.js` | 注册苏州话脚本后端路由 |
| `segment-routes.js` | 暴露分段建议健康检查与预览接口 |

## 当前接口

- `GET /api/bytedance-aidp/suzhou-helper/segment/health`
  - 健康检查与规则摘要
- `POST /api/bytedance-aidp/suzhou-helper/segment/preview`
  - 输入当前音频 URL、时长、现有分段和静音参数
  - 输出建议分段与变化摘要

## 实现说明

- 当前直接复用 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/segment-service.js`
- 差异只放在路由命名空间：
  - CVPC：`/api/data-baker-cvpc/liuzhou-helper/segment/*`
  - AIDP：`/api/bytedance-aidp/suzhou-helper/segment/*`

## 当前边界

- 当前不接平台鉴权字段、签名地址持久化
- 当前不直接调用 AIDP 保存、提交或切题接口
- 当前只提供“生成分段建议”的后端分析能力；真正写回平台仍由浏览器扩展使用页面内捕获的暂存契约完成
