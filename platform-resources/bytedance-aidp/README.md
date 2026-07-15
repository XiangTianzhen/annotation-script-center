# ByteDance AIDP 平台资料

## 平台定位

- 平台标识：`bytedance-aidp`
- 平台入口：`https://aidp.bytedance.com/management/task-v2?page=1`
- 当前脚本资料：
  - `suzhou-helper`
  - `jinhua-helper`
- 当前状态：`1.0.0` 双脚本运行时；当前已接入 `extension/sites/bytedance-aidp/suzhou-helper/`、`extension/sites/bytedance-aidp/jinhua-helper/` 两套 isolated runtime，并共用 `extension/sites/bytedance-aidp/shared/page-world/network-observer.js` 捕获当前条读取与暂存写回契约
- 首轮依据：
  - 用户提供的列表首页 URL
  - 用户提供的 `mark-v3` 详情页 URL
  - 仓库既有平台资料模板与文档约束

## 首轮范围

1. `https://aidp.bytedance.com/management/task-v2?page=1`
2. `https://aidp.bytedance.com/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
3. 平台公共资料只覆盖列表页路由、分页入口、详情跳转模式与首轮挂载边界
4. 苏州话 / 金华话脚本资料覆盖 `mark-v3` 详情页初始化、页面结构、分段建议、AI 推荐与暂存写回边界，不外扩到保存、提交、领取等写链路

## 文档约定

- `routeKey`：页面稳定标识
- `riskLevel`：`readonly`、`safe-ui`、`write-action`
- `selectorConfidence`：`high`、`medium`、`avoid`
- `requestClass`：`boot`、`data-read`、`navigation-read`、`detail-init`

## 推荐阅读顺序

1. `network/README.md`
2. `page-structure/README.md`
3. `network/01-task-v2-home.md`
4. `page-structure/01-task-v2-home.md`
5. `suzhou-helper/README.md`
6. `jinhua-helper/README.md`
7. `suzhou-helper/network/README.md`
8. `suzhou-helper/network/01-mark-v3-detail-init.md`
9. `suzhou-helper/page-structure/README.md`
10. `suzhou-helper/page-structure/01-mark-v3-detail.md`
11. `jinhua-helper/network/README.md`
12. `jinhua-helper/network/01-mark-v3-detail-init.md`
13. `jinhua-helper/page-structure/README.md`
14. `jinhua-helper/page-structure/01-mark-v3-detail.md`

## 当前覆盖状态

- `network/`：当前由索引 README + 1 份稳定参考页组成，覆盖列表首页路由、分页 query 和详情跳转 URL 组装口径
- `page-structure/`：当前由索引 README + 1 份稳定参考页组成，覆盖列表页的语义分区、初版稳定锚点和挂载边界
- `suzhou-helper/`：当前已补脚本级资料、AI 推荐、分段建议、批量识别和暂存写回边界
- `jinhua-helper/`：当前使用单次 Qwen Omni 原始 `listenText` 直填，保留脚本级资料、分段建议、批量识别和暂存写回边界；不翻译、不清洗、不做风险或强制填入
- 当前尚未完成 Edge 专窗下的真实页面补采；所有未能安全确认的 DOM / 请求细节统一留在对应文档的 `风险 / 未确认项`

## 首轮边界

- 不补保存、提交、领取、批量流转等写操作契约
- 不记录完整请求包、真实账号信息、完整签名资源地址或登录态明文

## 安全边界

- 后续如果继续做真实页面补采，优先使用独立的 Edge 窗口或标签页，避免混入无关已登录页面
- 当前文档只保留路由、query 键、页面语义分区、字段层级和风险说明
- 任何未在当前轮次安全确认的接口路径、字段名或按钮文案，都不得在文档里写成已确认结论
