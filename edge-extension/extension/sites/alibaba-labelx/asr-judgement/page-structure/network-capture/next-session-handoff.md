# 下次接续采集说明

## 当前上下文

本轮已完成并写入文档的内容包括：

- 首页手动领取、连续领取、释放。
- 首页未完成包点击 `标注` 打开新详情页标签页。
- 详情页初始化、数据读取、统计、面板、会话、模板读取。
- 单选保存、填空保存、保存边界。
- 每页条数、真实翻页、任务状态筛选。
- 音频播放、暂停、拖动、快进、后退、倍速、重载。
- 题卡鼠标选中和快捷键观察。
- 未完成包点击提交时的前端必填校验阻断。

用户已说明：后续新对话开始时，不需要再执行“全包填充为其他方言或语种”，因为答案已经由用户处理完成。下一轮只需要采集仍未完成的网络请求。

## 下次优先采集

1. 当前已完成答案后的 `提交任务`
   - 目标：读取 `/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/commit` response body。
   - 记录：request body、status、response 摘要、页面提示、提交后停留或跳转。

2. 自动领取开启时提交后的成功路径
   - 目标：读取提交后 `POST /api/v1/label/center/<REDACTED_TASK_ID>/label/fetch` response body。
   - 记录：是否返回新 `subTaskId`、是否进入新详情页、详情页 URL、后续初始化请求。

3. 自动领取关闭时提交
   - 目标：确认关闭自动领取后是否不触发 `label/fetch`。
   - 记录：提交后是否返回首页、是否刷新 `subTasks` / `tasks` / `tasks/process`。

4. 回答区数据筛选
   - 目标：补齐 `filter.questions` 的 query 结构。
   - 状态：本轮已打开筛选面板并新增筛选条件，但用户要求跳过，未继续选择题目与答案。

5. 真实用户快捷键上下题复测
   - 目标：如用户希望复测，确认真实键盘焦点状态下 `W/S` 或 `Shift+↑/↓` 是否改变 `.labelRender-item-selected`。
   - 记录：是否产生业务请求。

## 可跳过项

- 全包答案填充：用户已完成，不再重复。
- 异常路径：用户说明实际中一般不会出现，可暂不测试。
- 网络断开模拟：用户说明不符合实际使用场景，可暂不测试。

## 脱敏提醒

- 不记录完整 cookie、token、authorization、session、csrf。
- 不记录人员信息、完整音频签名 URL、完整 ASR 文本。
- `projectId`、`taskId`、`subTaskId`、`batchId`、`dataId`、`userId`、`traceId` 使用 `<REDACTED_*>`。
- 保存/提交 payload 只保留字段结构和少量枚举值示例。
