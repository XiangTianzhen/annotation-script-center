# DataBaker CVPC 柳州话脚本

## 定位

- 平台：`data-baker-cvpc`
- 脚本 ID：`dataBakerCvpcLiuzhouAssistant`
- 目标页：`https://cvpc.data-baker.com/app/editor/asr/`
- 当前阶段：`beta`

## 当前能力

- 当前音频上下文读取：
  - `project_id`
  - `task_id`
  - `process_id`
  - `data_id`
  - `job_id`
  - `annotation/meta`
  - `template.attrs / entry_attrs / moment_attrs`
  - 当前音频签名 URL：运行时优先从页内观察桥映射获取，缺失时再回退到 `annotation/meta`、DOM audio、Performance 与同源 iframe audio
- 当前页工具面板：
  - 生成画段建议
  - 当前段 AI 推荐
  - 当前段填入建议
  - 当前段设为 `Valid / Invalid`
  - 当前音频内“未填写段落补为有效”的受限入口
- 独立后端接口：
  - `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`

## 规则资产

- 柳州话规则整理稿：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
- 柳州话发音对照表：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-pronunciation-reference.csv`

## 当前边界

- AI 建议只作辅助，不自动保存、不自动提交、不自动切下一条。
- `全局 Invalid` 不做自动判定。
- 批量范围固定为“当前音频 / 当前作业”，不跨整包遍历。
- 画段建议当前只提供“建议生成 + 人工确认”。
- 真实 `segment create/update`、保存链路和字段持久化请求当前仍未补采完成。

## 写入契约状态

- 已补齐：
  - `annotation/meta` 模板字段读取
  - 当前页 `Valid / Invalid` DOM 选择入口
  - 当前页文本输入框的实验性就地填入适配层
- 仍待真实补采：
  - 画段创建 / 更新的真实 payload
  - 保存接口
  - 当前段与页面字段的稳定写入契约
  - `attrs / entry_attrs / moment_attrs` 的完整写入映射

## 运行时目录

```text
extension/sites/data-baker-cvpc/liuzhou-helper/
  README.md
  content.js
  page-world/
    audio-observer.js
  data-api.js
  ai-recommendation.js
  segmentation-controller.js
  ui-panel.js
  shortcuts.js
```

## 后端目录

```text
platform-resources/data-baker-cvpc/liuzhou-helper/
  README.md
  backend/
    index.js
    ai-routes.js
    segment-routes.js
    ai-service.js
    segment-service.js
  ai/
    adapter.js
    assets/
      liuzhou-rules.md
      liuzhou-pronunciation-reference.csv
```
