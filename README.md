# X-Spammers Twitter 自动私信工具

> ⚠️ **重要安全提醒**：本项目使用 `cookies.json` 存储 Twitter 登录凭证。该文件包含敏感信息，已被添加到 `.gitignore` 中，永远不会被提交到代码仓库。请勿分享或提交此文件，使用 `cookies.template.json` 作为模板创建您自己的 `cookies.json` 文件。

一个基于 Electron + Vue 3 开发的 Twitter 自动化私信工具，提供图形界面操作。该工具可以自动向特定搜索结果页面的用户发送私信，无需使用 Twitter API。

## ⚠️ 免责声明

本项目仅供学习和研究使用，请勿用于以下行为：
- 批量骚扰他人
- 发送垃圾广告信息
- 传播非法或有害内容
- 违反 Twitter 服务条款的任何行为
- 任何可能损害他人权益的行为

**使用本工具造成的任何后果由使用者自行承担。**

## ✨ 特性

- 🤖 自动化发送私信到目标用户
- 🔍 支持多种搜索方式（热门、最新、用户等）
- 🌐 无需 Twitter API，使用浏览器会话模拟
- 💻 跨平台支持（Windows、Linux、MacOS）
- 🔄 智能防重复发送机制
- ⏸️ 自动识别频率限制并暂停
- 🎨 美观的图形界面
- 🌙 支持暗色主题
- 📊 实时任务状态监控
- 🔔 详细的操作日志

## 🔧 技术栈

- Electron - 跨平台桌面应用框架
- Vue 3 - 用户界面框架
- TypeScript - 类型安全的 JavaScript
- Naive UI - 现代化的 UI 组件库
- Puppeteer - 浏览器自动化工具
- SCSS - 样式预处理器
- Vite - 现代前端构建工具

## 📋 使用前提

- 目标用户必须允许接收来自非关注者的私信
- 对于限制私信的用户，需要 Twitter Plus 订阅才能发送
- Node.js 16.x 或更高版本
- 现代浏览器（推荐 Chrome）

## 🚀 快速开始

### 1. 环境准备

- 安装 [Node.js](https://nodejs.org/en/download)（建议 v16 或更高版本）
- 下载并解压本项目

### 2. 获取 Twitter Cookies

1. 登录你的 Twitter 账号
2. 安装 Cookie Editor 浏览器扩展
   - [Chrome/Edge 版本](https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi)
   - [Firefox 版本](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
3. 复制 cookies 模板文件：
```bash
cp cookies.template.json cookies.json
```
4. 使用 Cookie Editor 导出您的 Twitter cookies，并替换 `cookies.json` 中的内容

> 注意：`cookies.json` 文件包含敏感信息，已被添加到 `.gitignore` 中，不会被提交到代码仓库。详细说明请参考 [cookies 设置文档](docs/cookies-setup.md)。

### 3. 安装依赖

如果下载速度慢，建议使用以下方式之一：

**方式一：使用淘宝镜像源**
```bash
# 设置淘宝镜像源
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm install

# 如果想恢复官方源，可以使用：
# npm config set registry https://registry.npmjs.org
```

**方式二：使用 cnpm**
```bash
# 安装 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用 cnpm 安装依赖
cnpm install
```

### 4. 开发模式

```bash
npm run dev
```

### 5. 构建应用

```bash
npm run electron:build
```

## 💡 使用说明

1. **配置搜索条件**
   - 设置搜索关键词
   - 配置发送消息内容
   - 调整发送频率

2. **运行控制**
   - 点击"启动任务"开始执行
   - 可随时点击"停止任务"暂停
   - 实时查看运行日志
   - 支持暗色主题切换

3. **注意事项**
   - 建议适度调整发送频率，避免触发限制
   - 定期检查 cookies 是否过期
   - 关注错误日志，及时处理异常情况

## 🔒 安全建议

- 不要将你的 cookies.json 文件分享给他人
- 定期更换发送消息内容
- 避免频繁使用以防账号被限制
- 遵守 Twitter 的使用条款和规范

## 📝 许可证

本项目采用 [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html) 许可证。

这意味着：
- ✅ 您可以自由使用、修改和分发本软件
- ✅ 如果您修改了本软件，必须开源您的修改
- ✅ 如果您通过网络提供本软件的服务，必须开源您的完整源代码
- ❌ 不提供任何担保，使用风险自负

详细条款请参阅 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 📞 支持

如果您在使用过程中遇到任何问题，请：
1. 查看 [Issue](../../issues) 是否已有相关问题
2. 如果没有，创建新的 Issue 并详细描述问题