/// <reference types="node" />
import { TwitterConfig } from '../types/twitter'

export class TwitterService {
  private isRunning: boolean = false
  private visitedUrls: Set<string> = new Set()
  private visitTimes: Map<string, number> = new Map()
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
  private stats = {
    totalAttempts: 0,
    successCount: 0,
    verificationRequired: 0,
    protected: 0,
    blocked: 0,
    noButton: 0,
    errors: 0,
    startTime: 0
  }

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
    this.stats = {
      totalAttempts: 0,
      successCount: 0,
      verificationRequired: 0,
      protected: 0,
      blocked: 0,
      noButton: 0,
      errors: 0,
      startTime: Date.now()
    }
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
            if (this.visitedUrls.has(link)) {
              this.onLog(`⏭️ 跳过已处理的用户: ${link}`, 'info')
              continue
            }

            try {
              this.onLog(`🔄 正在处理用户: ${link}`, 'info')
              const result = await this.sendMessageToProfile(link)
              
              // 只有成功发送消息才计数和记录
              if (result.success) {
              sentCount++
              this.onSentCount(sentCount)
                
                this.stats.successCount++
                const runTime = Math.floor((Date.now() - this.stats.startTime) / 1000)
                this.onLog(`📊 详细统计:
                总尝试: ${this.stats.totalAttempts}
                成功: ${this.stats.successCount}
                需验证: ${this.stats.verificationRequired}
                受保护: ${this.stats.protected}
                已屏蔽: ${this.stats.blocked}
                无按钮: ${this.stats.noButton}
                错误数: ${this.stats.errors}
                运行时间: ${runTime}秒
                平均速度: ${(this.stats.successCount / (runTime / 60)).toFixed(2)}条/分钟`, 'success')
                
              await window.electronAPI.waitForTimeout(this.config.sendDelay)
                this.visitedUrls.add(link) // 只记录成功发送的用户
              }
            } catch (error: any) {
              this.stats.errors++
              this.onLog(`❌ 发送消息失败 ${link}: ${error.message}`, 'error')
            }
          }

        } catch (error: any) {
          this.stats.errors++
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
      // 等待推文加载
      await window.electronAPI.waitForSelector("article[data-testid='tweet']", { timeout: 10000 })
      
      // 提取用户信息
      const result = await window.electronAPI.evaluate(`
        (() => {
          const users = new Set();
          
          // 从推文中提取作者
            const tweets = document.querySelectorAll("article[data-testid='tweet']");
          
          for (const tweet of tweets) {
            try {
              const authorElement = tweet.querySelector("div[data-testid='User-Name']");
              if (authorElement) {
                const authorLink = authorElement.querySelector("a[role='link']");
                if (authorLink) {
                  const href = authorLink.getAttribute('href');
                  if (href && href.startsWith('/')) {
                    const username = href.split('/')[1];
                    // 过滤系统账号和推广内容
                    if (username && 
                        !['home', 'explore', 'notifications', 'messages', 'compose', 'i'].includes(username) &&
                        !tweet.querySelector("[data-testid='tweet-promoted-indicator']")) {
                      users.add('https://twitter.com/' + username);
                    }
                  }
                }
              }
            } catch (e) {
              console.error('处理推文时出错:', e);
              continue;
            }
          }
          
          return Array.from(users);
        })()
      `)

      // 过滤已访问的用户
      const newUsers = Array.isArray(result) ? 
        result.filter(url => !this.visitedUrls.has(url)) : 
        []
      
      console.log(`总共找到 ${result?.length || 0} 个用户，其中 ${newUsers.length} 个新用户`)
      return newUsers
      
    } catch (error) {
      console.error('查找用户出错:', error)
      return []
    }
  }

  private async sendMessageToProfile(profileUrl: string): Promise<{ success: boolean; message?: string }> {
    try {
      this.stats.totalAttempts++
      const username = profileUrl.split('/').pop()
      this.onLog(`🎯 开始处理用户: @${username}`, 'info')
      await window.electronAPI.goto(profileUrl)
        
      // 等待页面加载
      await window.electronAPI.waitForTimeout(this.DELAYS.PAGE_LOAD)

      // 首先检查账号状态
      const accountStatus = await window.electronAPI.evaluate(`
        (() => {
          // 检查是否需要验证
          const verificationText = document.querySelector('div[dir="ltr"]')?.textContent || '';
          if (verificationText.includes('cannot message this user because you are not verified')) {
            return { status: 'verification_required' };
          }

          // 检查是否是受保护账号
          const isProtected = document.querySelector('div[data-testid="socialContext"]')?.textContent?.includes('受保护');
          if (isProtected) {
            return { status: 'protected' };
          }

          // 检查是否无法发送私信
          const pageText = document.body.textContent || '';
          if (pageText.includes('无法发送私信') || 
              pageText.includes('你无法发送') || 
              pageText.includes('不接收私信') ||
              pageText.includes('Cannot send') ||
              pageText.includes('Message unavailable')) {
            return { status: 'blocked' };
          }

          // 检查私信按钮
          const button = document.querySelector('button[data-testid="sendDMFromProfile"]') || 
                        document.querySelector('button[aria-label="Message"]') ||
                        document.querySelector('button svg path[d*="M1.998 5.5c0-1.381"]')?.closest('button');
          
          if (!button) {
            return { status: 'no_button' };
          }

          return {
            status: 'ready',
            buttonInfo: {
              disabled: button.disabled,
              ariaDisabled: button.getAttribute('aria-disabled'),
              visible: button.offsetParent !== null
            }
          };
        })()
      `)

      // 根据账号状态处理
      switch (accountStatus.status) {
        case 'verification_required':
          this.stats.verificationRequired++
          this.onLog(`⛔ @${username} - 需要验证才能发送私信`, 'warning')
          return { success: false, message: '需要验证才能发送私信' }

        case 'protected':
          this.stats.protected++
          this.onLog(`🔒 @${username} - 账号已受保护`, 'warning')
          return { success: false, message: '受保护的账号' }

        case 'blocked':
          this.stats.blocked++
          this.onLog(`🚫 @${username} - 无法接收私信`, 'warning')
          return { success: false, message: '无法接收私信' }

        case 'no_button':
          this.stats.noButton++
          this.onLog(`❌ @${username} - 未找到私信按钮`, 'warning')
          return { success: false, message: '未找到私信按钮' }

        case 'ready':
          if (accountStatus.buttonInfo.disabled || !accountStatus.buttonInfo.visible) {
            this.onLog(`⚠️ @${username} - 私信按钮不可用`, 'warning')
            return { success: false, message: '私信按钮不可用' }
          }

          // 点击发送消息按钮
          this.onLog(`📨 @${username} - 准备发送私信...`, 'info')
          const clicked = await window.electronAPI.evaluate(`
            (() => {
              const button = document.querySelector('button[data-testid="sendDMFromProfile"]') || 
                            document.querySelector('button[aria-label="Message"]') ||
                            document.querySelector('button svg path[d*="M1.998 5.5c0-1.381"]')?.closest('button');
              
              if (button) {
                try {
                  button.click();
                  return true;
                } catch (e) {
                  console.error('点击按钮时出错:', e);
                  return false;
                }
              }
              return false;
            })()
          `)

          if (!clicked) {
            this.onLog(`❌ @${username} - 点击私信按钮失败`, 'warning')
            return { success: false, message: '点击私信按钮失败' }
          }

          // 等待消息框加载
          this.onLog(`⌛ @${username} - 等待消息框加载...`, 'info')
          
          try {
            await Promise.race([
              window.electronAPI.waitForSelector("div[data-testid='dmDrawer']", { timeout: 10000 }),
              window.electronAPI.waitForSelector("div[data-testid='dmComposerTextInput']", { timeout: 10000 }),
              window.electronAPI.waitForSelector("div[role='textbox'][contenteditable='true']", { timeout: 10000 })
            ])
            
            await window.electronAPI.waitForTimeout(2000)
            
            // 检查输入框状态
            const editorStatus = await window.electronAPI.evaluate(`
              (() => {
                const editor = document.querySelector("div[data-testid='dmComposerTextInput']") ||
                              document.querySelector("div[role='textbox'][contenteditable='true']");
                const loadingOverlay = document.querySelector('div[aria-label="加载中"]') ||
                                     document.querySelector('div[role="progressbar"]');
                                     
                return {
                  editorFound: !!editor,
                  isLoading: !!loadingOverlay,
                  isVisible: editor ? (
                    window.getComputedStyle(editor).opacity !== '0' &&
                    window.getComputedStyle(editor).display !== 'none'
                  ) : false
                };
              })()
            `)
            
            if (!editorStatus.editorFound || !editorStatus.isVisible) {
              throw new Error('输入框未就绪');
            }
            
            if (editorStatus.isLoading) {
              await window.electronAPI.waitForTimeout(3000)
            }
            
          } catch (error) {
            this.onLog(`⚠️ @${username} - 等待消息框超时，尝试继续...`, 'warning')
          }
          
          // 输入消息
          const messageInput = await window.electronAPI.evaluate(`
            (() => {
              const editor = document.querySelector("div[data-testid='dmComposerTextInput']") ||
                           document.querySelector("div[role='textbox'][contenteditable='true']");
              if (!editor) return false;
              
              try {
                editor.click();
                editor.focus();
                document.execCommand('insertText', false, \`${this.config.messageTemplate}\`);
                editor.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  inputType: 'insertText',
                  data: \`${this.config.messageTemplate}\`
                }));
                return true;
              } catch (e) {
                console.error('设置消息内容时出错:', e);
                return false;
              }
            })()
          `)

          if (!messageInput) {
            this.onLog(`❌ @${username} - 消息输入失败`, 'warning')
            return { success: false, message: '消息输入失败' }
          }

          // 点击发送按钮
          const sendResult = await window.electronAPI.evaluate(`
            (() => {
              const sendButton = document.querySelector("button[data-testid='dmComposerSendButton']");
              if (!sendButton || sendButton.disabled || sendButton.getAttribute('aria-disabled') === 'true') {
                return false;
              }
              try {
                sendButton.click();
                return true;
              } catch (e) {
                return false;
              }
            })()
          `)

          if (!sendResult) {
            this.onLog(`❌ @${username} - 发送失败`, 'error')
            return { success: false, message: '发送失败' }
          }

          // 等待发送完成
          await window.electronAPI.waitForTimeout(this.DELAYS.MESSAGE_SEND)
          
          // 验证发送状态
          const sendStatus = await window.electronAPI.evaluate(`
            (() => {
              const errorElements = document.querySelectorAll('[role="alert"], [aria-live="polite"]');
              for (const el of errorElements) {
                if (el.textContent?.includes('发送失败') || 
                    el.textContent?.includes('Failed to send') ||
                    el.textContent?.includes('error')) {
                  return { success: false, error: el.textContent };
                }
              }
              return { success: true };
            })()
          `)

          if (!sendStatus.success) {
            this.onLog(`❌ @${username} - ${sendStatus.error || '发送失败'}`, 'error')
            return { success: false, message: sendStatus.error || '发送失败' }
          }

          this.stats.successCount++
          const runTime = Math.floor((Date.now() - this.stats.startTime) / 1000)
          this.onLog(`✅ @${username} - 发送成功！`, 'success')
          this.onLog(`📊 统计数据:
          ✓ 总处理: ${this.stats.totalAttempts}
          ✓ 成功数: ${this.stats.successCount}
          ⚠️ 需验证: ${this.stats.verificationRequired}
          🔒 受保护: ${this.stats.protected}
          🚫 已屏蔽: ${this.stats.blocked}
          ❌ 无按钮: ${this.stats.noButton}
          ⛔ 错误数: ${this.stats.errors}
          ⏱️ 运行时间: ${Math.floor(runTime / 60)}分${runTime % 60}秒
          📈 平均速度: ${(this.stats.successCount / (runTime / 60)).toFixed(2)}条/分钟`, 'success')

          return { success: true, message: '发送成功' }

        default:
          return { success: false, message: '未知状态' }
      }
    } catch (error: any) {
      this.stats.errors++
      const username = profileUrl.split('/').pop()
      this.onLog(`❌ @${username} - ${error.message}`, 'error')
      return { success: false, message: error.message }
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