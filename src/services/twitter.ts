/// <reference types="node" />
import { TwitterConfig } from '../types/twitter'

export class TwitterService {
  private isRunning: boolean = false
  private visitedUrls: Set<string> = new Set()
  private config: TwitterConfig
  private onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  private onSentCount: (count: number) => void
  private readonly DELAYS = {
    PAGE_LOAD: 10000,      // 页面加载等待时间
    SCROLL_INTERVAL: 8000, // 滚动间隔
    BUTTON_CHECK: 3000,    // 按钮检查间隔
    MESSAGE_SEND: 5000,    // 发送消息后等待时间
    RETRY_DELAY: 15000     // 错误重试等待时间
  }
  private readonly MAX_RETRIES = 3  // 最大重试次数

  constructor(
    config: TwitterConfig,
    onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void,
    onSentCount: (count: number) => void
  ) {
    this.config = config
    this.onLog = onLog
    this.onSentCount = onSentCount
  }

  private async getChromePath(): Promise<string> {
    const platform = await window.electronAPI.getPlatform()
    switch (platform) {
      case 'win32':
        return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      case 'darwin':
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      case 'linux':
        return '/usr/bin/google-chrome'
      default:
        throw new Error(`不支持的操作系统: ${platform}`)
    }
  }

  async init() {
    try {
      const chromePath = await this.getChromePath()
      console.log('Chrome 路径:', chromePath)

      const success = await window.electronAPI.launchBrowser({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
      })

      if (!success) {
        throw new Error('浏览器启动失败')
      }
      
      // 加载已保存的 cookies
      const cookiesStr = await window.electronAPI.readCookies()
      try {
        const cookies = JSON.parse(cookiesStr)
        if (cookies && cookies.length > 0) {
          // 格式化 cookies
          const formattedCookies = cookies.map((cookie: any) => ({
            ...cookie,
            sameSite: 'None',
            secure: true
          }))
          const result = await window.electronAPI.setCookies(formattedCookies)
          if (!result) {
            throw new Error('设置 cookies 失败')
          }
          this.onLog('Cookies 加载成功', 'success')
        }
      } catch (error: any) {
        this.onLog(`Cookies 加载失败: ${error.message}`, 'error')
        throw error
      }

      return true
    } catch (error) {
      console.error('初始化失败:', error)
      await this.close()
      throw error
    }
  }

  async close() {
    try {
      await window.electronAPI.closeBrowser()
    } catch (error) {
      console.error('关闭失败:', error)
      throw error
    }
  }

  async start() {
    this.isRunning = true
    let sentCount = 0
    const startTime = new Date()

    try {
      while (this.isRunning) {
        try {
          // 导航到搜索页面
          const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(this.config.searchQuery)}&src=recent_search_click&f=live`
          this.onLog(`正在访问搜索页面: ${this.config.searchQuery}`, 'info')
          await window.electronAPI.goto(searchUrl)
          
          // 等待页面加载
          this.onLog('⌛ 等待页面加载...', 'info')
          await window.electronAPI.waitForTimeout(this.DELAYS.PAGE_LOAD)

          // 等待内容出现
          this.onLog('👀 等待内容出现...', 'info')
          await window.electronAPI.waitForSelector("div[data-testid='primaryColumn']", { timeout: 30000 })
          await window.electronAPI.waitForTimeout(5000)

          // 开始查找用户
          this.onLog(`✨ 开始搜索用户 [关键词: ${this.config.searchQuery}]`, 'info')
          let profileLinks = await this.findNewProfiles()
          
          // 如果没有找到用户，尝试滚动加载更多
          if (profileLinks.length === 0) {
            this.onLog('❌ 未找到任何用户', 'warning')
            this.onLog('尝试备用方法...', 'info')
            
            // 滚动加载更多内容
            for (let i = 0; i < 3; i++) {
              await window.electronAPI.evaluate(`
                () => {
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              `)
              
              this.onLog('⏳ 等待新内容加载...', 'info')
              await window.electronAPI.waitForTimeout(8000)
              
              profileLinks = await this.findNewProfiles()
              if (profileLinks.length > 0) {
                break
              }
              
              this.onLog('📝 未找到新的用户，继续搜索...', 'info')
              this.onLog('⏬ 滚动页面加载更多结果', 'info')
            }
          }

          if (profileLinks.length === 0) {
            continue
          }

          this.onLog(`🎯 找到 ${profileLinks.length} 个用户`, 'success')
          
          // 处理找到的用户
          for (const link of profileLinks) {
            if (!this.isRunning) break
            if (this.visitedUrls.has(link)) continue

            try {
              this.onLog(`🔄 正在处理用户: ${link}`, 'info')
              await this.sendMessageToProfile(link)
              sentCount++
              this.onSentCount(sentCount)
              
              const runTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
              this.onLog(`📊 统计信息 - 已发送: ${sentCount} | 运行时间: ${runTime}秒 | 平均: ${(sentCount / (runTime / 60)).toFixed(2)}条/分钟`, 'success')
              
              await window.electronAPI.waitForTimeout(this.config.sendDelay)
            } catch (error: any) {
              this.onLog(`❌ 发送消息失败 ${link}: ${error.message}`, 'error')
            }

            this.visitedUrls.add(link)
          }

        } catch (error: any) {
          this.onLog(`❌ 执行出错: ${error.message}`, 'error')
          await window.electronAPI.waitForTimeout(this.DELAYS.RETRY_DELAY)
        }
      }
    } catch (error: any) {
      this.onLog(`❌ 任务执行失败: ${error.message}`, 'error')
      throw error
    }
  }

  private async findNewProfiles(): Promise<string[]> {
    try {
      // 首先验证页面状态
      const pageStatus = await window.electronAPI.evaluate(
        "({tweets: document.querySelectorAll(\"article[data-testid='tweet']\").length, userNames: document.querySelectorAll(\"div[data-testid='User-Name']\").length})"
      );
      
      console.log('页面元素统计:', pageStatus);

      // 等待一下确保页面完全加载
      await window.electronAPI.waitForTimeout(2000);

      // 方法1：从推文中查找用户
      const result = await window.electronAPI.evaluate(`
        (() => {
          const users = [];
          const seen = new Set();
          
          // 从推文中查找
          const tweets = document.querySelectorAll("article[data-testid='tweet']");
          console.log('找到推文数量:', tweets.length);
          
          for (const tweet of tweets) {
            const links = tweet.querySelectorAll("a[role='link']");
            for (const link of links) {
              const text = link.textContent?.trim() || '';
              if (text.startsWith('@')) {
                const username = text.substring(1);
                if (!seen.has(username) && !['home', 'explore', 'notifications', 'messages', 'compose'].includes(username)) {
                  seen.add(username);
                  users.push('https://twitter.com/' + username);
                }
              }
            }
          }
          
          return users;
        })()
      `);

      if (!Array.isArray(result) || result.length === 0) {
        console.log('未找到用户，尝试备用方法');
        
        // 方法2：从用户卡片中查找
        const backupResult = await window.electronAPI.evaluate(`
          (() => {
            const users = [];
            const seen = new Set();
            
            // 从用户卡片中查找
            const userCells = document.querySelectorAll('div[data-testid="UserCell"]');
            console.log('找到用户卡片:', userCells.length);
            
            for (const cell of userCells) {
              const spans = cell.querySelectorAll('span');
              for (const span of spans) {
                const text = span.textContent?.trim() || '';
                if (text.startsWith('@')) {
                  const username = text.substring(1);
                  if (!seen.has(username) && !['home', 'explore', 'notifications', 'messages', 'compose'].includes(username)) {
                    seen.add(username);
                    users.push('https://twitter.com/' + username);
                  }
                }
              }
            }
            
            // 如果还没找到，尝试其他方法
            if (users.length === 0) {
              const allSpans = document.querySelectorAll('span');
              for (const span of allSpans) {
                const text = span.textContent?.trim() || '';
                if (text.startsWith('@')) {
                  const username = text.substring(1);
                  if (!seen.has(username) && !['home', 'explore', 'notifications', 'messages', 'compose'].includes(username)) {
                    seen.add(username);
                    users.push('https://twitter.com/' + username);
                  }
                }
              }
            }
            
            return users;
          })()
        `);

        if (Array.isArray(backupResult) && backupResult.length > 0) {
          console.log('使用备用方法找到的用户:', backupResult);
          return backupResult;
        }
      }

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('查找用户出错:', error);
      return [];
    }
  }

  private async sendMessageToProfile(profileUrl: string): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.MAX_RETRIES) {
      try {
        this.onLog(`🌐 正在访问用户页面: ${profileUrl}`, 'info');
        await window.electronAPI.goto(profileUrl);
        
        // 等待页面加载
        await window.electronAPI.waitForTimeout(this.DELAYS.PAGE_LOAD);
        
        // 等待发送消息按钮出现
        const hasMsgBtn = await window.electronAPI.evaluate(`
          () => new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkButton = () => {
              const buttons = document.querySelectorAll('div[class*="css-146c3p1"][class*="r-bcqeeo"][class*="r-qvutc0"]');
              for (const btn of buttons) {
                const svg = btn.querySelector('svg');
                if (svg && svg.querySelector('path[d*="M2.504 21.866"]')) {
                  resolve(true);
                  return;
                }
              }
              
              if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkButton, ${this.DELAYS.BUTTON_CHECK});
              } else {
                resolve(false);
              }
            };
            
            checkButton();
          })
        `);

        if (!hasMsgBtn) {
          throw new Error('未找到发送消息按钮');
        }

        // 点击发送消息按钮
        this.onLog(`✨ 找到发送按钮: ${profileUrl}`, 'info');
        await window.electronAPI.evaluate(`
          () => {
            const buttons = document.querySelectorAll('div[class*="css-146c3p1"][class*="r-bcqeeo"][class*="r-qvutc0"]');
            for (const btn of buttons) {
              const svg = btn.querySelector('svg');
              if (svg && svg.querySelector('path[d*="M2.504 21.866"]')) {
                const clickableParent = btn.closest('div[role="button"]');
                if (clickableParent) {
                  clickableParent.click();
                  return true;
                }
              }
            }
            return false;
          }
        `);

        // 等待消息输入框出现
        await window.electronAPI.waitForTimeout(this.DELAYS.BUTTON_CHECK);
        const hasInput = await window.electronAPI.waitForSelector(
          "div[role='textbox']",
          { timeout: this.DELAYS.PAGE_LOAD }
        );

        if (hasInput) {
          // 输入消息
          this.onLog(`⌨️ 正在输入消息...`, 'info');
          await window.electronAPI.type(
            "div[role='textbox']",
            this.config.messageTemplate
          );
          await window.electronAPI.waitForTimeout(this.DELAYS.BUTTON_CHECK);

          // 等待发送按钮可用
          let hasSendBtn = false;
          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts && !hasSendBtn) {
            hasSendBtn = await window.electronAPI.waitForSelector(
              "div[role='button'][data-testid='dmComposerSendButton']:not([aria-disabled='true'])",
              { timeout: 5000 }
            );
            if (!hasSendBtn) {
              attempts++;
              this.onLog(`⏳ 等待发送按钮可用 (${attempts}/${maxAttempts})...`, 'info');
              await window.electronAPI.waitForTimeout(this.DELAYS.BUTTON_CHECK);
            }
          }

          if (hasSendBtn) {
            await window.electronAPI.click(
              "div[role='button'][data-testid='dmComposerSendButton']:not([aria-disabled='true'])"
            );
            this.onLog(`✅ 消息已发送: ${profileUrl}`, 'success');
            await window.electronAPI.waitForTimeout(this.DELAYS.MESSAGE_SEND);
            return;
          } else {
            throw new Error('发送按钮未启用');
          }
        } else {
          throw new Error('未找到消息输入框');
        }
      } catch (error: any) {
        retryCount++;
        if (retryCount < this.MAX_RETRIES) {
          this.onLog(`⚠️ 发送失败，等待重试 (${retryCount}/${this.MAX_RETRIES}): ${error.message}`, 'warning');
          await window.electronAPI.waitForTimeout(this.DELAYS.RETRY_DELAY);
        } else {
          throw new Error(`发送消息失败: ${error.message}`);
        }
      }
    }
  }

  async stop() {
    this.isRunning = false
    await this.close()
  }

  updateConfig(newConfig: TwitterConfig) {
    this.config = newConfig
  }
} 