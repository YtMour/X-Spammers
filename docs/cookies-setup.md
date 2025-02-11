# Cookies 设置说明

为了保护您的 Twitter 账号安全，本项目使用了特殊的 cookies 管理方式。

## 初始设置

1. 复制模板文件：
```bash
cp cookies.template.json cookies.json
```

2. 设置 Git 忽略文件更改：
```bash
git update-index --assume-unchanged cookies.json
```

3. 使用 Cookie Editor 导出您的 Twitter cookies，并替换 `cookies.json` 中的内容。

## 注意事项

- `cookies.json` 文件包含敏感信息，永远不要提交或分享此文件
- 如果需要更新 cookies 模板，请编辑 `cookies.template.json` 文件
- 如果需要重新跟踪 cookies.json 的更改：
```bash
git update-index --no-assume-unchanged cookies.json
```

## 重要提醒

- 定期更新您的 cookies 以保持登录状态
- 不要将您的 cookies 分享给他人
- 如果怀疑 cookies 泄露，请立即在 Twitter 上更改密码 