# 平台资料库

## 目录定位

`platform-knowledge/` 是浏览器无关的平台资料库，用来沉淀 LabelX 等平台的页面结构、网络请求、接口字段、统计格式和已知限制。

这些资料服务于 Edge 扩展和未来 Chrome 扩展，避免同一份 DOM / 网络知识在两套扩展目录中重复维护。

## 维护边界

- 这里不放运行时代码，不参与扩展 manifest 加载。
- 这里记录跨浏览器通用的平台事实，例如 URL、DOM 片段、接口样例、字段含义和验证结论。
- Edge / Chrome 差异仍应收敛到扩展 manifest、浏览器 API 兼容层、打包配置或少量适配文件。
- 新增资料时按“平台 / 脚本项目 / 资料类型”归档。

## 当前结构

```text
platform-knowledge/
  alibaba-labelx/
    README.md
    asr-judgement/
      README.md
      page-structure/
      network/
      statistics/
      unfinished.md
    asr-transcription/
      README.md
```

## 使用规则

- 涉及 LabelX 页面 DOM 或网络接口时，优先读本目录，再修改扩展运行时代码。
- `page-structure/` 放页面结构、稳定选择器和代表性 HTML 片段。
- `network/` 放请求 URL、请求 / 响应结构、采集结论和待采集项。
- `statistics/` 放统计 CSV、上传 payload、服务端合并契约等资料。
- `unfinished.md` 放未完成方案、风险和后续验证条件。
