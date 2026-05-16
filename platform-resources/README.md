# 平台资源库

## 目录定位

`platform-resources/` 是浏览器无关的平台资源库，用来沉淀 LabelX、DataBaker 等平台的页面结构、网络请求、接口字段、统计格式、已知限制和本地调试工具。

这些资源服务于 Chrome / Edge 共用的 `extension/` 扩展源码，避免同一份 DOM / 网络知识或本地后端调试工具在多个目录中重复维护。

## 维护边界

- 这里不放扩展运行时代码，不参与扩展 manifest 加载。
- 可以放浏览器无关的本地调试工具，例如统计上传接收服务。
- 这里记录跨浏览器通用的平台事实，例如 URL、DOM 片段、接口样例、字段含义和验证结论。
- Chrome / Edge 差异仍应收敛到扩展 manifest、浏览器 API 兼容层、打包配置或少量适配文件。
- 新增资料或工具时按“平台 / 脚本项目 / 资源类型”归档。

## 当前结构

```text
platform-resources/
  backend/
    server.js
    app.js
    router.js
    registry.js
    response.js
    config.js
  alibaba-labelx/
    README.md
    asr-judgement/
      README.md
      ai/
      page-structure/
      network/
      backend/
      unfinished.md
    asr-transcription/
      README.md
  data-baker/
    round-one-quality/
      README.md
      page-structure.md
      network.md
      backend/
  abaka-ai/
    README.md
    network.md
    page-structure.md
    actions.md
    i18n.md
    network/
      README.md
      task-page/
      common/
    task21/
      README.md
      network.md
      network/
        README.md
      page-structure.md
    task17/
      README.md
      network.md
      page-structure.md
```

## 使用规则

- 涉及 LabelX 页面 DOM 或网络接口时，优先读本目录，再修改扩展运行时代码。
- 涉及 DataBaker 页面 DOM 或网络接口时，优先读 `data-baker/round-one-quality/`，不要把 DataBaker 逻辑写入 Alibaba LabelX 目录。
- 涉及 Abaka AI Task 页面结构采集时，先读 `abaka-ai/README.md`；公共页面结构、动作风险、多语言和 Network 维护在 `abaka-ai/` 根目录，Task21 same_font 专项读 `abaka-ai/task21/README.md`，Task17 对比与空池差异读 `abaka-ai/task17/README.md`。
- `page-structure/` 放页面结构、稳定选择器和代表性 HTML 片段。
- `network/` 放请求 URL、请求 / 响应结构、采集结论和待采集项。
- `ai/` 放快判 AI 规则、提示词模板和少量 few-shot 示例，不放完整雷题库。
- 根级 `backend/` 是统一 Node 后端入口，只负责启动、基础路由、响应工具和项目 API 注册。
- 项目级 `backend/` 放浏览器无关的本地调试服务，并维护统计 CSV、上传 payload、服务端合并契约等资料；不被扩展 manifest 加载。
- `unfinished.md` 放未完成方案、风险和后续验证条件。

