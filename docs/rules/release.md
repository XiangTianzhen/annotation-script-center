# 发布规则（ASC_RELEASE）

本文档定义正式发布流程，适用于 `ASC_RELEASE`。

## 触发条件

- 发布前必须确认：目录正确、分支为 `main`、工作区无无关改动。
- 发布前必须完成真实浏览器验收（核心功能可用、关键页面无持续报错）。

## 必做步骤

1. 提升 `extension/manifest.json` patch 版本。
2. 运行必需验证（`node --check`、manifest 路径检查、发布脚本检查）。
3. 生成 CRX 三件套：
   - `dist/annotation-script-center-v<version>.crx`
   - `dist/annotation-script-center-update.xml`
   - `dist/annotation-script-center-crx-latest.json`
4. 校验三件套版本、下载地址和文件存在性。
5. 通过后执行：
   - `git commit`
   - `git tag v<version>`
   - `git push origin main`
   - `git push origin v<version>`

## 禁止事项

- 发布验证失败时，禁止 commit、tag、push。
- 禁止提交 `config/secrets`、`.pem`、运行数据目录（如 `statistics-data`、`export-data`、`audit-data`）、临时采集文件。
- 禁止在发布流程中提交 token、cookie、authorization、API Key 等敏感信息。
