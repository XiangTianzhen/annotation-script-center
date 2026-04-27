# annotation-text-pipeline 第三批低风险规则

第四批规则已单独整理到：
- `docs/text-pipeline-rules-v4.md`

## 目的

本文件只描述当前第三批低风险文本规则扩充：
- 规则必须继续落在 `extension/sites/alibaba-labelx/annotation-text-pipeline.js`
- 规则必须保持纯函数、确定性、可解释
- 规则必须不改变现有输入输出契约

当前 `run(sourceText)` 仍返回：

```js
{
  inputText: string,
  normalizedText: string,
  generatedText: string,
  appliedRules: string[],
}
```

## 本轮新增规则

### 1. 中文成对引号邻近空白的保守清理

目标：
- 只清理中文开引号后的空白
- 只清理中文闭引号前的空白
- 不推断引号内外语义，不调整引号位置

建议 `appliedRules`：
- `normalize-cjk-quote-whitespace`

示例：
- `“ 你好 ”` -> `“你好”`
- `‘ 测试 ’` -> `‘测试’`
- `他说 “你好”` 保持不变
- `" hello "` 保持不变

为什么低风险：
- 只处理中文引号内部的明显噪声空白
- 不改 ASCII 引号，不扩展到引号外部排版
- 不依赖上下文、词典或配置

### 2. 尾部分隔标点加终止标点的保守清理

目标：
- 只在字符串尾部清理多余的分隔标点
- 仅处理逗号 / 顿号 / 英文逗号紧邻终止标点的组合
- 允许分隔标点与终止标点之间存在中文闭引号
- 不改句中标点，不改尾部混合终止标点组合

建议 `appliedRules`：
- `strip-trailing-separator-before-terminal-punctuation`

示例：
- `你好，。` -> `你好。`
- `你好吗，？` -> `你好吗？`
- `你好、！` -> `你好！`
- `“你好”，！` -> `“你好”！`
- `你好？！` 保持不变

为什么低风险：
- 只作用于字符串尾部
- 只去掉明显多余的分隔标点
- 不对 `？！`、`!?` 之类终止标点组合做主观归一

## 本轮不做

- 不做 AI 标点修复
- 不做中文数字转换
- 不做自定义替换配置系统
- 不做云端词典
- 不新增文本入口
- 不修改 quickfill runner 的消费方式
- 不修改保存、提交、校验、反馈和 apply 链路

## 验证关注点

- 新增规则命中时，`appliedRules` 必须包含对应规则名
- 新增规则未命中时，不能伪造规则命中
- 多条规则连续命中时，`appliedRules` 应按实际执行顺序反映
- 输入为空或仅空白 / 零宽噪声时，返回结构仍保持稳定，不抛异常
