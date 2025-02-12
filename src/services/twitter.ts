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
      this.onLog(`🌐 正在访问用户页面: ${profileUrl}`, 'info')
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
          this.onLog(`⚠️ 该用户需要验证才能发送私信: ${profileUrl}`, 'warning')
          return { success: false, message: '需要验证才能发送私信' }

        case 'protected':
          this.stats.protected++
          this.onLog(`⚠️ 跳过受保护的账号: ${profileUrl}`, 'warning')
          return { success: false, message: '受保护的账号' }

        case 'blocked':
          this.stats.blocked++
          this.onLog(`⚠️ 该用户无法接收私信: ${profileUrl}`, 'warning')
          return { success: false, message: '无法接收私信' }

        case 'no_button':
          this.stats.noButton++
          this.onLog(`⚠️ 未找到私信按钮: ${profileUrl}`, 'warning')
          return { success: false, message: '未找到私信按钮' }

        case 'ready':
          if (accountStatus.buttonInfo.disabled || !accountStatus.buttonInfo.visible) {
            this.onLog(`⚠️ 私信按钮不可用: ${profileUrl}`, 'warning')
            return { success: false, message: '私信按钮不可用' }
          }

          // 点击发送消息按钮后，等待消息框完全加载
          this.onLog(`✨ 找到发送按钮: ${profileUrl}`, 'info')
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
            this.onLog(`⚠️ 点击私信按钮失败: ${profileUrl}`, 'warning')
            return { success: false, message: '点击私信按钮失败' }
          }

          // 优化等待消息框加载逻辑
          this.onLog(`⌛ 等待消息框加载...`, 'info')
          
          try {
            // 使用Promise.race同时检查多个选择器
            await Promise.race([
              window.electronAPI.waitForSelector("div[data-testid='dmDrawer']", { timeout: 10000 }),
              window.electronAPI.waitForSelector("div[data-testid='dmComposerTextInput']", { timeout: 10000 }),
              window.electronAPI.waitForSelector("div[role='textbox'][contenteditable='true']", { timeout: 10000 })
            ])
            
            // 等待短暂时间让界面完全就绪
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
              // 如果还在加载，额外等待
              await window.electronAPI.waitForTimeout(3000)
            }
            
          } catch (error) {
            this.onLog(`⚠️ 等待消息框超时，尝试继续操作...`, 'warning')
          }
          
          // 输入消息
          const messageInput = await window.electronAPI.evaluate(`
            (() => {
              const editor = document.querySelector("div[data-testid='dmComposerTextInput']");
              if (!editor) return false;
              
              try {
                // 1. 聚焦编辑器
                editor.click();
                editor.focus();
                
                // 2. 使用 execCommand 插入文本
                document.execCommand('insertText', false, \`${this.config.messageTemplate}\`);
                
                // 3. 触发必要的事件
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
            this.onLog(`⚠️ 未找到消息输入框或输入失败: ${profileUrl}`, 'warning')
            return { success: false, message: '未找到消息输入框或输入失败' }
          }

          // 检查发送按钮状态
          const sendButtonState = await window.electronAPI.evaluate(`
            (() => {
              const button = document.querySelector("button[data-testid='dmComposerSendButton']");
              if (!button) return null;
              
              return {
                enabled: !button.disabled && !button.getAttribute('aria-disabled'),
                visible: button.offsetParent !== null,
                testid: button.getAttribute('data-testid'),
                text: button.textContent
              };
            })()
          `)

          if (!sendButtonState || !sendButtonState.enabled || !sendButtonState.visible) {
            this.onLog(`⚠️ 发送按钮未启用: ${profileUrl}`, 'warning')
            return { success: false, message: '发送按钮未启用' }
          }

          // 测试模式：不实际点击发送按钮，只输出状态
          this.onLog(`🔍 发送按钮状态检查 [${profileUrl}]:`, 'info')
          this.onLog(`✓ 按钮可用: ${sendButtonState.enabled}`, 'info')
          this.onLog(`✓ 按钮可见: ${sendButtonState.visible}`, 'info')
          this.onLog(`✓ 按钮ID: ${sendButtonState.testid}`, 'info')
          this.onLog(`✓ 消息已准备就绪，测试成功`, 'success')

          // 等待一下模拟发送延迟
          await window.electronAPI.waitForTimeout(this.DELAYS.MESSAGE_SEND)
          return { success: true, message: '测试成功 - 消息未实际发送' }

        default:
          return { success: false, message: '未知状态' }
      }
    } catch (error: any) {
      this.stats.errors++
      this.onLog(`❌ 处理失败: ${profileUrl} - ${error.message}`, 'error')
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