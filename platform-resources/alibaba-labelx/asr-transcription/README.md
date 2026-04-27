# Alibaba LabelX ASR 转写资料

## 当前状态

本目录暂时只作为 ASR 转写的平台资料占位。当前迁移优先级仍是 `asr-judgement/` 快判资料。

转写运行时代码仍在：

```text
extension/sites/alibaba-labelx/asr-transcription/
```

## 后续迁移规则

- 转写页面结构、网络请求和统计资料后续按需迁入本目录。
- 不从快判目录提前抽公共 shared。
- 如果确认某些 LabelX 平台事实同时服务转写和快判，再提升到 `platform-resources/alibaba-labelx/README.md`。
