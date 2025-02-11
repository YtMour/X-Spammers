# Twitter 自动私信工具

> ⚠️ **重要安全提醒**：本项目使用 `cookies.json` 存储 Twitter 登录凭证。该文件包含敏感信息，已被添加到 `.gitignore` 中，永远不会被提交到代码仓库。请勿分享或提交此文件。

一个基于 Electron + Vue 3 开发的 Twitter 自动化私信工具，提供简洁的图形界面操作。该工具可以自动向特定搜索结果页面的用户发送私信。

## ⚠️ 免责声明

本项目仅供学习和研究使用，请勿用于以下行为：
- 批量骚扰他人
- 发送垃圾广告信息
- 传播非法或有害内容
- 违反 Twitter 服务条款的任何行为
- 任何可能损害他人权益的行为

**使用本工具造成的任何后果由使用者自行承担。**

## ✨ 功能特性

- 🤖 自动化发送私信
- 🔍 支持关键词搜索
- 🕒 可配置发送延迟
- 📊 实时任务状态监控
- 📝 详细的操作日志
- 🎨 简洁美观的界面

## 🔧 技术栈

- Electron - 跨平台桌面应用框架
- Vue 3 - 用户界面框架
- TypeScript - 类型安全的 JavaScript
- Element Plus - 现代化的 UI 组件库
- Pinia - 状态管理
- SCSS - 样式预处理器
- Puppeteer - 浏览器自动化工具

## 📋 使用前提

- Node.js 16.x 或更高版本
- Twitter 账号及 Cookies
- 目标用户必须允许接收来自非关注者的私信
- 对于限制私信的用户，需要 Twitter Plus 订阅才能发送

## 🚀 快速开始

### 1. 安装依赖

```bash
# 使用淘宝镜像源（推荐国内用户使用）
npm config set registry https://registry.npmmirror.com
npm install

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 2. 配置 Twitter Cookies

1. 登录你的 Twitter 账号
2. 安装 Cookie Editor 浏览器扩展
   - [Chrome/Edge 版本](https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi)
   - [Firefox 版本](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
3. 复制 cookies 模板文件：
```bash
cp cookies.template.json cookies.json
```
4. 将导出的 cookies 内容替换到 `cookies.json` 中

### 3. 开发调试

```bash
npm run electron:dev
```

### 4. 构建应用

```bash
npm run electron:build
```

## 💻 使用说明

1. **基本设置**
   - 输入搜索关键词
   - 设置发送消息内容
   - 配置发送延迟时间

2. **运行控制**
   - 点击"开始任务"启动
   - 点击"停止任务"暂停
   - 实时查看运行状态
   - 查看操作日志

## 🔒 重要注意事项

### 安全建议
- 永远不要分享您的 `cookies.json` 文件
- 定期更换 Twitter 密码和 cookies
- 使用专门的 Twitter 账号进行操作
- 不要在公共设备上使用本工具

### 使用限制
- 请合理设置发送延迟，建议至少 5 秒以上
- 每天发送消息数量不要过多，建议不超过 100 条
- 定期检查 cookies 是否过期
- 遵守 Twitter 平台的使用频率限制

### 异常处理
- 如遇到频率限制，请立即停止并等待至少 24 小时
- 定期检查错误日志，及时处理异常情况
- 如账号收到警告，建议立即停止使用
- 保持对 Twitter 政策更新的关注

## 📝 许可证

本项目采用 [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html) 许可证。

这意味着：
- ✅ 您可以自由使用、修改和分发本软件
- ✅ 如果您修改了本软件，必须开源您的修改
- ✅ 如果您通过网络提供本软件的服务，必须开源您的完整源代码
- ❌ 不提供任何担保，使用风险自负

详细条款请参阅 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。如果您在使用过程中遇到任何问题，请：
1. 查看 [Issue](../../issues) 是否已有相关问题
2. 如果没有，创建新的 Issue 并详细描述问题