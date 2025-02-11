# Cookies 设置说明

为了保护您的 Twitter 账号安全，本项目使用了特殊的 cookies 管理方式。`cookies.json` 文件包含敏感信息，已被添加到 `.gitignore` 中，不会被提交到代码仓库。

## 初始设置

1. 复制模板文件：
```bash
cp cookies.template.json cookies.json
```

2. 使用 Cookie Editor 导出您的 Twitter cookies，并替换 `cookies.json` 中的内容。

## 文件说明

- `cookies.template.json`: 模板文件，展示了所需的 cookies 结构
- `cookies.json`: 实际使用的文件，包含您的个人 cookies 数据（此文件不会被提交到仓库）

## 重要提醒

- `cookies.json` 文件包含敏感信息，永远不要手动提交此文件
- 定期更新您的 cookies 以保持登录状态
- 不要将您的 cookies 分享给他人
- 如果怀疑 cookies 泄露，请立即在 Twitter 上更改密码

## 安全建议

1. 定期检查 git 状态，确保 cookies.json 没有被意外暂存：
```bash
git status
```

2. 如果发现 cookies.json 被意外暂存，请执行：
```bash
git reset cookies.json
```

3. 如果需要更新 cookies 模板结构，请编辑 `cookies.template.json` 文件 