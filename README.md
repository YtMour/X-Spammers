# X-Spammers Twitter 自动私信机器人

一个基于 TypeScript 和 Puppeteer 开发的 Twitter 自动化私信工具。该工具可以自动向特定搜索结果页面的用户发送私信，无需使用 Twitter API。

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

## 📋 使用前提

- 目标用户必须允许接收来自非关注者的私信
- 对于限制私信的用户，需要 Twitter Plus 订阅才能发送

## 🚀 快速开始

### 1. 环境准备

- 安装 [Node.js](https://nodejs.org/en/download)（建议 v16 或更高版本）
- 下载并解压本项目

### 2. 获取 Twitter Cookies

1. 登录你的 Twitter 账号
2. 安装 Cookie Editor 浏览器扩展
   - [Chrome/Edge 版本](https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi)
   - [Firefox 版本](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
3. 导出 cookies 并保存为项目根目录下的 `cookies.json` 文件

> 注意：某些 Cookie 编辑器导出的 JSON 中可能需要将 `null` 替换为 `unspecified`

### 3. 项目配置

1. 安装依赖：
```bash
npm install
```

2. 编辑 `src/config.ts` 配置文件：
```typescript
let config: Config = {
    searchQuery: "你的搜索关键词",  // 例如："programming"
    message: "你要发送的消息"      // 例如："Hello!"
}
```

| 参数 | 说明 |
|------|------|
| searchQuery | 搜索关键词，可以是话题、标签或普通关键词 |
| message | 要自动发送的私信内容 |

### 4. 运行项目

```bash
npm start
```

## ⚠️ 注意事项

- 请合理使用，避免触发 Twitter 的反垃圾信息机制
- 建议控制发送频率，避免账号被限制
- 定期检查 cookies 是否过期
- 遵守 Twitter 的服务条款和使用规范

## 📝 许可证

本项目采用 [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html) 许可证。

这意味着：
- ✅ 您可以自由使用、修改和分发本软件
- ✅ 如果您修改了本软件，必须开源您的修改
- ✅ 如果您通过网络提供本软件的服务，必须开源您的完整源代码
- ❌ 不提供任何担保，使用风险自负

详细条款请参阅 [LICENSE](LICENSE) 文件。
