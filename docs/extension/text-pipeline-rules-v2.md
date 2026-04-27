# annotation-text-pipeline 第二批低风险规则

第三批规则已单独整理到：
- `docs/text-pipeline-rules-v3.md`

## 目的

本文件只描述当前第二批低风险文本规则扩充：
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

### 1. 标点邻近空白的保守清理

目标：
- 清理明显属于噪声的标点前空白
- 仅在中文标点后接中文字符或另一标点时，清理中间空白

建议 `appliedRules`：
- `normalize-punctuation-whitespace`

示例：
- `你好 ，世界` -> `你好，世界`
- `你好， 世界` -> `你好，世界`
- `Hello , world` -> `Hello, world`
- `你好， ok` 保持不变

为什么低风险：
- 只处理标点附近的明显噪声空白
- 不依赖上下文、词典或配置
- 不引入语义推断

### 2. 尾部重复终止标点的保守归一

目标：
- 只归一尾部连续重复、且字符相同的终止标点
- 不改混合终止标点组合

建议 `appliedRules`：
- `collapse-repeated-terminal-punctuation`

示例：
- `你好！！` -> `你好！`
- `你好吗？？？` -> `你好吗？`
- `hello...` -> `hello.`
- `真的吗？！` 保持不变

为什么低风险：
- 只作用于尾部重复终止标点
- 相同字符重复归一是确定性的
- 对 `？！`、`!?` 这类混合表达不做主观改写

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
