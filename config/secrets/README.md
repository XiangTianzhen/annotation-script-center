# CRX 私钥目录说明

- 本目录用于存放企业发布用私钥，例如：`annotation-script-center.pem`。
- 私钥文件绝对不能提交到 Git 仓库。
- 当前 `.gitignore` 已忽略：
  - `config/secrets/*.pem`
  - `config/secrets/*.key`
  - `config/secrets/*.p12`

## 关键规则

- `annotation-script-center.pem` 必须长期保管并离线备份。
- 后续每个版本的 CRX 都必须使用同一个 `.pem` 打包。
- 如果私钥丢失并重新生成，扩展 `extension_id` 会变化，企业策略 `appid` 需要全部重配。
