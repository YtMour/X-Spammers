﻿# X-Spammers


> ⚠️ **重要安全提醒**：本项目使用 `cookies.json` 存储 X (Twitter) 登录凭证。该文件包含敏感信息，已被添加到 `.gitignore` 中，永远不会被提交到代码仓库。请勿分享或提交此文件。

一个基于 Electron + Vue3 + TypeScript 开发的 X (Twitter) 自动化私信工具，提供简洁的图形界面操作。该工具可以自动向特定搜索结果页面的用户发送私信。

## ⚠️ 免责声明 - ⚠️ 不承担任何责任

本项目仅供学习和研究使用，请勿用于以下行为：
- 批量骚扰他人
- 发送垃圾广告信息
- 传播非法或有害内容
- 违反 X (Twitter) 服务条款的任何行为
- 任何可能损害他人权益的行为

**使用本工具造成的任何后果由使用者自行承担。**

## 🌟 主要功能

- 🤖 自动搜索并处理用户
- 📨 自动发送私信功能
- 🔄 智能重试机制
- 📊 实时统计信息
- 🎯 精确的用户状态检测
- 🔒 安全的 Cookie 管理
- 🛡️ 内置安全保护机制

## ✨ 功能特性

- 🤖 自动化功能
  - 支持关键词搜索
  - 可配置发送延迟
  - 实时任务状态监控
  - 详细的操作日志
  - 简洁美观的界面

- 💡 智能用户检测
  - 验证状态检查
  - 受保护账号检测
  - 私信权限验证
  - 按钮状态智能判断
  - 发送状态验证

- 🎯 高效的消息处理
  - 并行选择器检查
  - 优化的等待机制
  - 智能的状态检测
  - 自动重试机制
  - 错误自动恢复

- 📊 完整的统计系统
  - 总处理数量
  - 成功率统计
  - 各类失败原因统计
  - 运行时间统计
  - 平均处理速度
  - 实时状态更新

## 🔧 技术栈

- Electron - 跨平台桌面应用框架
- Vue 3 - 用户界面框架
- TypeScript - 类型安全的 JavaScript
- Element Plus - 现代化的 UI 组件库
- Pinia - 状态管理
- SCSS - 样式预处理器
- Puppeteer - 浏览器自动化工具

## 📋 使用前提

- 需要安装Google Chrome 浏览器
- Google Chrome 浏览器
- X (Twitter) 账号及 Cookies
- 目标用户必须允许接收来自非关注者的私信
- 对于限制私信的用户，需要 Twitter Plus 订阅才能发送

## 🚀 快速开始

### 1. 安装

 [Releases 1](https://github.com/YtMour/X-Spammers/releases)中的安装文件
或手动拉取代码进行手动编译

### 2. 配置 Cookies

1. 登录你的 X (Twitter) 账号
2. 安装 Cookie Editor 浏览器扩展
   - [Chrome/Edge 版本](https://microsoftedge.microsoft.com/addons/detail/cookieeditor/neaplmfkghagebokkhpjpoebhdledlfi)
   - [Firefox 版本](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)
3. 复制 cookies 

​	直接将cookies复制进程序窗口即可导入

## 🛠️ 配置说明

### 基本配置
```typescript
interface TwitterConfig {
  searchQuery: string;      // 搜索关键词
  messageTemplate: string;  // 消息模板
  sendDelay: number;       // 发送延迟(ms)
}
```

### 延迟配置
```typescript
const DELAYS = {
  PAGE_LOAD: 10000,      // 页面加载等待时间
  SCROLL_INTERVAL: 8000, // 滚动间隔
  BUTTON_CHECK: 3000,    // 按钮检查间隔
  MESSAGE_SEND: 5000,    // 发送消息后等待时间
  RETRY_DELAY: 15000     // 错误重试等待时间
}
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
   - 查看详细日志

## 🔍 状态说明

工具会自动检测以下状态：
- ✅ 发送成功
- ⚠️ 需要验证
- 🔒 受保护账号
- ⛔ 已屏蔽
- ❌ 无法发送
- 📨 准备发送
- ⌛ 等待中
- 🎯 处理中

## 📊 统计指标

实时统计显示：
- ✓ 总处理数量
- ✓ 成功发送数
- ⚠️ 需要验证数
- 🔒 受保护账号数
- 🚫 已屏蔽账号数
- ❌ 无按钮账号数
- ⛔ 错误次数
- ⏱️ 运行时间
- 📈 平均处理速度

## 🔒 重要注意事项

### 安全建议
- 永远不要分享您的 `cookies.json` 文件
- 定期更换密码和 cookies
- 使用专门的账号进行操作
- 不要在公共设备上使用本工具
- 注意账号安全和隐私保护

### 使用限制
- 请合理设置发送延迟，建议至少 5 秒以上
- 每天发送消息数量不要过多，建议不超过 100 条
- 定期检查 cookies 是否过期
- 遵守平台的使用频率限制
- 避免频繁切换账号

### 异常处理
- 遇到频率限制立即停止并等待 24 小时
- 定期检查错误日志，及时处理异常
- 收到警告立即停止使用
- 保持对平台政策更新的关注
- 定期备份重要数据

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

## 🔄 更新日志

### v1.0.0
- ✨ 首次发布
- 🎯 完整的自动化私信功能
- 🛡️ 内置安全保护机制
- 📊 详细的统计系统
- 🔒 完善的错误处理
