# annotation-text-pipeline 第四批低风险规则

## 目的

本文件只描述当前第四批低风险文本规则扩充：
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

### 1. 中文括号内部空白的保守清理

目标：
- 只清理中文开括号 `（` 后的空白
- 只清理中文闭括号 `）` 前的空白
- 不调整括号位置，不处理 ASCII 括号

建议 `appliedRules`：
- `normalize-cjk-parenthesis-whitespace`

示例：
- `（ 你好 ）` -> `（你好）`
- `他说（ 测试 ）啊` -> `他说（测试）啊`
- `你好 ( test )` 保持不变
- `你好 （测试）` 保持不变

为什么低风险：
- 只处理中文括号内部的明显噪声空白
- 不修改括号外部排版
- 不依赖上下文、词典或配置

### 2. 连续重复分隔标点的局部归一

目标：
- 只归一连续重复、且字符相同的分隔标点
- 仅处理 `，`、`、`、`,` 这三类分隔标点
- 不归一混合标点组合

建议 `appliedRules`：
- `collapse-repeated-separator-punctuation`

示例：
- `你好，，世界` -> `你好，世界`
- `甲、、乙` -> `甲、乙`
- `hello,,world` -> `hello,world`
- `你好，、世界` 保持不变

为什么低风险：
- 只处理局部、同字符重复的分隔标点噪声
- 不推断语义，不改混合组合
- 规则是确定性的，输入相同输出恒定

## 本轮不做

- 不做 AI 标点修复
- 不做中文数字转换
- 不做自定义替换配置系统
- 不做云端词典
- 不新增文本入口
- 不修改 quickfill runner 的消费方式
- 不修改保存、提交、整页执行、校验、反馈和 apply 链路

## 验证关注点

- 新增规则命中时，`appliedRules` 必须包含对应规则名
- 新增规则未命中时，不能伪造规则命中
- 多条规则连续命中时，`appliedRules` 应按实际执行顺序反映
- 输入为空或仅空白 / 零宽噪声时，返回结构仍保持稳定，不抛异常
