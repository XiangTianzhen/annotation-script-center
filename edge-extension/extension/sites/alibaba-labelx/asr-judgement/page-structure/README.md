# 阿里 ASR 语音判别页面结构资料

## 迁移状态

本目录只保留迁移跳转说明，不再保留快判页面结构和网络采集内容。

新的主维护资料位置已经迁移到：

```text
platform-knowledge/alibaba-labelx/asr-judgement/page-structure/
platform-knowledge/alibaba-labelx/asr-judgement/network/
```

后续新增或修正 LabelX 页面结构、HTML 片段、网络请求采集资料时，应优先更新根目录 `platform-knowledge/` 下的对应文件。

## 已移除内容

- `asr-judgement-detail/` 已迁移到 `platform-knowledge/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/`。
- `labeling-task-home/` 已迁移到 `platform-knowledge/alibaba-labelx/asr-judgement/page-structure/labeling-task-home/`。
- `check-task-home/` 已迁移到 `platform-knowledge/alibaba-labelx/asr-judgement/page-structure/check-task-home/`。
- `network-capture/` 已迁移到 `platform-knowledge/alibaba-labelx/asr-judgement/network/`。
- `common-top-nav-avatar-dropdown.html` 已迁移到 `platform-knowledge/alibaba-labelx/asr-judgement/page-structure/common-top-nav-avatar-dropdown.html`。

## 修改原则

- 扩展运行时代码不依赖本目录加载。
- 新开发优先读取 `platform-knowledge/`，不要再把新采集结果放在本目录。
