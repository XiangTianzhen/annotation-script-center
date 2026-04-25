# LabelX ASR 更优判断网络采集索引

## 当前阶段

本目录记录通过 Chrome DevTools MCP 采集到的 LabelX ASR 更优判断相关网络请求结构。当前阶段已覆盖：

- 页面初始化
- 应用授权信息读取
- 任务数据读取
- 任务统计读取
- 任务面板读取
- 会话初始化
- 计时心跳
- 任务模板读取
- 页面自动触发的音频 media 加载
- 音频播放/暂停/拖动/快进/后退/倍速/重载触发的 media Range 行为
- 单选答案保存
- 填空答案自动保存
- 保存边界：清空填空、连续输入、连续单选
- 提交任务
- 提交任务前端必填校验阻断
- 自动领取空池路径
- 首页手动领取成功/失败
- 首页释放已领取子任务
- 首页未完成包“标注”打开详情页
- 题卡鼠标选中与快捷键上下题观察
- 提交后返回首页的列表加载请求
- 首页已完成子任务列表
- 详情页每页条数切换、真实翻页与筛选请求

本阶段未采集、未触发以下动作：

- 自动领取成功进入新详情页的路径
- 完成全部题目后的服务端提交失败响应
- 筛选“回答区数据”的 `filter.questions` 结构
- 音频加载失败、保存失败等异常路径

## 来源页面

- 标注首页：`https://labelx.alibaba-inc.com/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>`
- 未完成标注详情页：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 已完成只读详情页：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 采集方式：打开已登录详情页，过滤 DevTools Network 中的 XHR/fetch 与 media 请求。
- 验证方式：执行一次页面 reload，初始化请求序列稳定复现。
- 操作限制：仅在用户明确授权后操作首页领取/释放/标注打开、详情页选择/输入/筛选/音频/翻页/题卡选中/提交按钮；未提交当前测试包。

注意：实际复制的 URL 中，`subTaskId` 或其他 query value 可能夹带 `%0A`、`%20` 等编码空白。文档中的 endpoint 均使用修剪后的 canonical 形式；扩展实现必须先解码并 trim。

## 用户同步操作步骤

1. 用户提供标注首页与详情页 URL，并说明当前已登录。
2. 用户授权刷新页面采集初始化请求，未授权时不点击高风险按钮。
3. 用户确认可测试领取、释放、详情页选择、输入、筛选、音频和提交失败场景。
4. Agent 在首页手动领取一条可用任务，释放一次已领取任务。
5. Agent 对用户指定的空池任务尝试领取，记录“暂无待标注数据”业务失败。
6. Agent 进入详情页，分别测试单选保存、填空保存、保存边界、每页条数切换、真实翻页、筛选、音频播放/高级操作和未完成提交。
7. 用户授权继续测试后，Agent 在首页连续领取多条未完成包，点击 `标注` 验证新详情页标签页打开方式。
8. Agent 在详情页测试题卡鼠标选中与快捷键上下题行为，并记录未产生业务请求。

## 文件列表

| 文件 | 请求 | 说明 |
| --- | --- | --- |
| `01-survey-results.md` | `GET /api/v1/label/surveyResults` | 初始化阶段的 survey 探测，当前返回 404 |
| `02-list-auth-app-info.md` | `GET /api/v1/appInfo/listAuthAppInfo` | 应用授权/项目元信息 |
| `03-subtask-data.md` | `GET /api/v1/label/center/subTask/{subTaskId}/data` | 核心数据源，包含样本、音频、ASR 文本、已有标注 |
| `04-subtask-summary.md` | `GET /api/v1/label/center/subTask/{subTaskId}/summary` | 子任务统计 |
| `05-subtask-board.md` | `GET /api/v1/label/center/subTask/{subTaskId}/board` | 全量样本进度状态 |
| `06-timer.md` | `POST /api/v1/label/center/timer` | 页面计时/在线心跳 |
| `07-session.md` | `POST /api/v1/label/center/{subTaskId}/session` | 页面会话初始化 |
| `08-get-label-task-info.md` | `GET /api/v1/label/tasks/getLabelTaskInfo` | 任务模板、字段、选项、流程配置 |
| `09-audio-media.md` | `GET /oss-proxy-labelx/.../*.wav` | 页面自动触发和音频高级操作触发的音频分片请求 |
| `10-subtask-commit.md` | `POST /api/v1/label/center/subTask/{subTaskId}/commit` | 点击“提交任务”后的提交请求 |
| `11-label-fetch-auto.md` | `POST /api/v1/label/center/{taskId}/label/fetch` | 自动领取开启时提交后触发的领取请求 |
| `12-home-subtasks.md` | `GET /api/v1/label/center/subTasks` | 提交后返回首页，“我的任务”列表 |
| `13-home-tasks.md` | `GET /api/v1/label/center/tasks` | 提交后返回首页，“可领取的任务”列表 |
| `14-home-tasks-process.md` | `GET /api/v1/label/center/tasks/process` | 首页任务列表的进度/状态补充 |
| `15-home-subtasks-finished.md` | `GET /api/v1/label/center/subTasks?finished=true` | 标注首页“我的任务 / 已完成”列表 |
| `16-label-fetch-manual.md` | `POST /api/v1/label/center/{taskId}/label/fetch` | 首页手动领取，覆盖成功和空池失败 |
| `17-subtask-release.md` | `POST /api/v1/label/center/subTask/{subTaskId}/release` | 首页释放已领取子任务 |
| `18-subtask-data-save.md` | `POST /api/v1/label/center/subTask/{subTaskId}/data` | 单选、填空和保存边界 |
| `19-subtask-data-pagination-filter.md` | `GET /api/v1/label/center/subTask/{subTaskId}/data` | 每页条数、真实翻页和筛选对数据请求的影响 |
| `20-submit-client-validation.md` | 无新增网络请求 | 未完成包点击提交时前端必填校验阻断 |
| `21-item-selection-navigation.md` | 无新增业务请求 | 题卡选中、W/S、Shift+方向键上下题观察 |
| `22-home-open-subtask-detail.md` | 详情页初始化请求链 | 首页“标注”打开新详情页标签页 |
| `pending-capture.md` | 待采集 | 提交后 response、自动领取成功进入新详情页、回答区筛选和异常路径等待采集动作 |
| `next-session-handoff.md` | 接续说明 | 新对话继续采集时的上下文与优先级 |

## 初始化请求序列

未完成或已完成只读详情页刷新后，XHR/fetch 请求按以下顺序稳定出现：

| 顺序 | 动作 | Method | URL 摘要 | Status | 作用判断 |
| --- | --- | --- | --- | --- | --- |
| 1 | 页面初始化 | GET | `/api/v1/label/surveyResults` | 404 | 旧 survey 状态探测或兼容请求，当前页面可忽略 |
| 2 | 应用授权 | GET | `/api/v1/appInfo/listAuthAppInfo` | 200 | 获取当前用户可访问的应用/项目元信息 |
| 3 | 任务数据读取 | GET | `/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/data` | 200 | 核心数据源；已完成详情页也会请求 |
| 4 | 任务统计读取 | GET | `/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/summary` | 200 | 子任务总数、错误数等统计 |
| 5 | 任务面板读取 | GET | `/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/board` | 200 | 全量样本进度面板 |
| 6 | 初始计时上报 | POST | `/api/v1/label/center/timer` | 200 | 页面计时心跳 |
| 7 | 会话初始化 | POST | `/api/v1/label/center/<REDACTED_SUBTASK_ID>/session` | 200 | 创建或返回页面 sessionId |
| 8 | 任务模板读取 | GET | `/api/v1/label/tasks/getLabelTaskInfo` | 200 | 获取模板字段、选项、流程配置 |

页面停留期间，`/api/v1/label/center/timer` 会继续周期性 POST。页面数据加载后还会自动出现音频 media 请求。

## 提交与自动领取空池链路

在详情页中，“自动领取”开关处于开启状态时，点击 `提交任务` 后观察到以下链路：

| 顺序 | 动作 | Method | URL 摘要 | Status | 作用判断 |
| --- | --- | --- | --- | --- | --- |
| 1 | 提交当前子任务包 | POST | `/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/commit` | 200 | 提交当前包 |
| 2 | 自动领取下一包 | POST | `/api/v1/label/center/<REDACTED_TASK_ID>/label/fetch` | 200 | 因自动领取开启而触发 |
| 3 | 返回标注首页 | GET | `/corpora/labeling/labelingTask?projectId=<REDACTED_PROJECT_ID>` | 200 | 未进入新详情页 |
| 4 | 首页我的任务 | GET | `/api/v1/label/center/subTasks` | 200 | 未完成子任务列表为空 |
| 5 | 首页可领取任务 | GET | `/api/v1/label/center/tasks` | 200 | 可领取任务列表 |
| 6 | 首页任务进度 | GET | `/api/v1/label/center/tasks/process` | 200 | 当前返回空数组 |

`commit` 与 `label/fetch` 的 response body 因页面导航在 DevTools 中不可再读取；当前只确认 status、payload 和后续页面行为。

## 脱敏规则

- 不记录完整 cookie、token、authorization、session、csrf、SSO 相关值。
- 不记录人员姓名、工号、账号、手机号、邮箱、部门路径等个人或组织敏感信息。
- 不记录完整音频签名 URL。音频 query 中的 `Expires`、`OSSAccessKeyId`、`Signature` 统一视为敏感值。
- 不记录完整 ASR 文本、完整响应体、完整 dataId 列表。
- 项目 ID、子任务 ID、任务 ID、批次 ID、用户 ID、sessionId、traceId 均使用 `<REDACTED_*>` 占位。
- 示例响应只保留结构和少量脱敏字段，不能作为完整接口契约。

## Content Script 总体建议

- 当前快判扩展已经使用 `page-world/network-*.js` 在 MAIN world 监听和改写 `data` 请求，再通过 `window.postMessage` 把摘要传给 ISOLATED world。
- 优先从 `03-subtask-data.md` 记录的 `data` 接口读取当前页样本、音频字段、ASR 文本字段、已有标注结果和 `duration`。
- `judgement-duration-summary.js` 负责只读总时长汇总；`page-world/network-summary.js` 负责从网络响应中提取总时长摘要。
- `judgement-page-size.js` 负责页面原生每页条数选择器；`page-world/network-url-rewriter.js` 负责把 data 请求改写为配置的 `pageSize`。
- 从 `08-get-label-task-info.md` 记录的模板接口读取字段、选项和组件类型，用于避免硬编码题目结构。
- 从页面 URL 解析 `projectId` 与 `subTaskId`，从 `data` 响应读取 `taskId`。
- URL 参数值必须先 `decodeURIComponent` 再 `trim`，避免 `%0A`、`%20` 进入内部 ID。
- 用 `template.scheme.contentList[].fieldName` 映射到 `dataList[].data` 的展示字段。
- 用 `template.scheme.answerList[]` 映射 `result.markResult[]` 的答案顺序。
- 默认不要主动调用 `session`、`timer`、提交、领取、保存类接口。
- 对提交和领取类请求，只做被动监听，不要由 content script 自动触发。
- 如果后续要实现保存、提交、领取或释放，必须先补充对应失败路径采集，并更新快判 README 与根目录 `log.md`。
