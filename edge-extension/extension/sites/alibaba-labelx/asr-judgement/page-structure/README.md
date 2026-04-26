# 阿里 ASR 语音判别页面结构资料

## 迁移状态

本目录是迁移前的快判页面结构资料快照，暂时保留用于兼容历史链接。

新的主维护资料位置已经迁移到：

```text
platform-knowledge/alibaba-labelx/asr-judgement/page-structure/
platform-knowledge/alibaba-labelx/asr-judgement/network/
```

后续新增或修正 LabelX 页面结构、HTML 片段、网络请求采集资料时，应优先更新根目录 `platform-knowledge/` 下的对应文件。

## 当前保留内容

- `asr-judgement-detail/`：快判详情页 DOM 片段。
- `labeling-task-home/`：标注首页 DOM 片段。
- `check-task-home/`：审核首页资料。
- `network-capture/`：迁移前网络采集资料快照。
- `common-top-nav-avatar-dropdown.html`：顶部头像下拉结构快照。

## 修改原则

- 扩展运行时代码不依赖本目录加载。
- 如果必须修改本目录中的历史快照，需要同步修改 `platform-knowledge/alibaba-labelx/asr-judgement/` 中的主维护文件。
- 新开发优先读取 `platform-knowledge/`，不要再把新采集结果只放在本目录。
