/// <reference types="node" />
import { TwitterConfig } from '../types/twitter'

export class TwitterService {
  private isRunning: boolean = false
  private visitedUrls: Set<string> = new Set()
  private config: TwitterConfig
  private onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  private onSentCount: (count: number) => void

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
    let retryCount = 0
    const maxRetries = 3
    const startTime = new Date()

    try {
      while (this.isRunning) {
        try {
          // 导航到搜索页面
          const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(this.config.searchQuery)}&src=recent_search_click&f=live`
          this.onLog(`正在访问搜索页面: ${this.config.searchQuery}`, 'info')
          await window.electronAPI.goto(searchUrl)
          
          // 等待搜索结果加载
          this.onLog('⌛ 等待页面加载...', 'info')
          const hasResults = await window.electronAPI.waitForSelector(
            "div[data-testid='primaryColumn']",
            { timeout: 30000 }
          )

          if (!hasResults) {
            throw new Error('搜索结果加载失败')
          }

          // 等待推文或用户卡片出现
          this.onLog('👀 等待内容出现...', 'info')
          const hasContent = await window.electronAPI.evaluate(`
            () => new Promise((resolve) => {
              let attempts = 0;
              const maxAttempts = 10;
              
              const checkContent = () => {
                const tweets = document.querySelectorAll('article[data-testid="tweet"]');
                const userCards = document.querySelectorAll('div[data-testid="UserCell"]');
                
                if (tweets.length > 0 || userCards.length > 0) {
                  resolve(true);
                } else if (attempts < maxAttempts) {
                  attempts++;
                  setTimeout(checkContent, 1000);
                } else {
                  resolve(false);
                }
              };
              
              checkContent();
            })
          `);

          if (!hasContent) {
            this.onLog('⚠️ 页面内容加载超时，尝试继续处理...', 'warning');
          }

          this.onLog(`✨ 开始搜索用户 [关键词: ${this.config.searchQuery}]`, 'info')

          const profileLinks = await this.findNewProfiles()
          if (profileLinks.length === 0) {
            this.onLog('📝 未找到新的用户，继续搜索...', 'info')
            // 滚动页面加载更多结果
            this.onLog('⏬ 滚动页面加载更多结果', 'info')
            await window.electronAPI.evaluate(`
              () => {
                return new Promise((resolve) => {
                  let lastHeight = document.body.scrollHeight;
                  
                  // 先滚动到底部
                  window.scrollTo(0, document.body.scrollHeight);
                  
                  // 等待一会儿看是否有新内容加载
                  setTimeout(() => {
                    const newHeight = document.body.scrollHeight;
                    console.log('滚动前高度:', lastHeight, '滚动后高度:', newHeight);
                    
                    // 尝试点击"显示更多"按钮
                    const showMoreButtons = document.querySelectorAll('div[role="button"][data-testid="cellInnerDiv"]');
                    if (showMoreButtons.length > 0) {
                      console.log('找到显示更多按钮');
                      showMoreButtons.forEach(button => {
                        if (button.textContent?.includes('显示') || button.textContent?.includes('Show')) {
                          button.click();
                        }
                      });
                    }
                    
                    resolve(newHeight > lastHeight);
                  }, 2000);
                });
              }
            `);
            
            // 等待新内容加载
            this.onLog('⏳ 等待新内容加载...', 'info');
            await window.electronAPI.waitForTimeout(5000);
            continue
          }
          
          this.onLog(`🎯 本次找到 ${profileLinks.length} 个新用户`, 'success')
          
          for (let link of profileLinks) {
            if (!this.isRunning) break
            if (this.visitedUrls.has(link)) {
              this.onLog(`⏭️ 跳过已访问用户: ${link}`, 'info')
              continue
            }

            try {
              this.onLog(`🔄 正在处理用户: ${link}`, 'info')
              await this.sendMessageToProfile(link)
              sentCount++
              const runTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
              this.onSentCount(sentCount)
              this.onLog(`📊 统计信息 - 已发送: ${sentCount} | 运行时间: ${runTime}秒 | 平均: ${(sentCount / (runTime / 60)).toFixed(2)}条/分钟`, 'success')
              await window.electronAPI.waitForTimeout(this.config.sendDelay)
            } catch (error: any) {
              this.onLog(`❌ 发送消息失败 ${link}: ${error.message}`, 'error')
            }

            this.visitedUrls.add(link)
          }

          // 滚动页面加载更多结果
          this.onLog('⏬ 滚动页面加载更多结果', 'info')
          await window.electronAPI.evaluate(`
            () => {
              return new Promise((resolve) => {
                let lastHeight = document.body.scrollHeight;
                
                // 先滚动到底部
                window.scrollTo(0, document.body.scrollHeight);
                
                // 等待一会儿看是否有新内容加载
                setTimeout(() => {
                  const newHeight = document.body.scrollHeight;
                  console.log('滚动前高度:', lastHeight, '滚动后高度:', newHeight);
                  
                  // 尝试点击"显示更多"按钮
                  const showMoreButtons = document.querySelectorAll('div[role="button"][data-testid="cellInnerDiv"]');
                  if (showMoreButtons.length > 0) {
                    console.log('找到显示更多按钮');
                    showMoreButtons.forEach(button => {
                      if (button.textContent?.includes('显示') || button.textContent?.includes('Show')) {
                        button.click();
                      }
                    });
                  }
                  
                  resolve(newHeight > lastHeight);
                }, 2000);
              });
            }
          `);
          
          // 等待新内容加载
          this.onLog('⏳ 等待新内容加载...', 'info');
          await window.electronAPI.waitForTimeout(5000);
          
          // 重置重试计数
          retryCount = 0
        } catch (error: any) {
          retryCount++
          this.onLog(`⚠️ 执行出错 (${retryCount}/${maxRetries}): ${error.message}`, 'error')
          
          if (retryCount >= maxRetries) {
            throw new Error('连续失败次数过多，停止任务')
          }
          
          // 等待一段时间后重试
          this.onLog(`🕒 等待 5 秒后重试...`, 'warning')
          await window.electronAPI.waitForTimeout(5000)
        }
      }
    } catch (error: any) {
      this.onLog(`❌ 任务执行出错: ${error.message}`, 'error')
      throw error
    }
  }

  private async findNewProfiles(): Promise<string[]> {
    try {
      // 使用字符串形式的函数来避免序列化问题
      const result = await window.electronAPI.evaluate(`
        () => {
          const profileLinks = new Set();
          
          // 查找所有用户卡片容器
          const userContainers = document.querySelectorAll('div[class*="css-175oi2r r-eqz5dr r-16y2uox r-1wbh5a2"]');
          console.log('找到用户容器数量:', userContainers.length);
          
          for (const container of userContainers) {
            try {
              // 在容器内查找用户名元素
              const userNameElements = container.querySelectorAll('div[class*="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci"]');
              
              for (const elem of userNameElements) {
                const text = elem.textContent?.trim();
                if (text && text.startsWith('@')) {
                  // 查找父级链接元素
                  const parentLink = elem.closest('a[role="link"]');
                  if (parentLink) {
                    const href = parentLink.getAttribute('href');
                    if (href && href.startsWith('/') && href.split('/').length === 2) {
                      const username = href.substring(1);
                      // 排除特殊用户名和已知非用户链接
                      if (
                        !['home', 'explore', 'notifications', 'messages', 'compose', 'search'].includes(username) &&
                        !href.includes('/status/') &&
                        !href.includes('/photo') &&
                        !href.includes('/media')
                      ) {
                        console.log('找到用户:', username, '显示名称:', text);
                        profileLinks.add('https://twitter.com' + href);
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.error('处理用户容器时出错:', e);
            }
          }

          // 如果没有找到用户，尝试查找推文中的用户
          if (profileLinks.size === 0) {
            const tweets = document.querySelectorAll('article[data-testid="tweet"]');
            console.log('找到推文数量:', tweets.length);
            
            tweets.forEach(tweet => {
              try {
                const userNameElement = tweet.querySelector('div[class*="css-1rynq56 r-bcqeeo r-qvutc0"]');
                if (userNameElement) {
                  const text = userNameElement.textContent?.trim();
                  if (text && text.startsWith('@')) {
                    const parentLink = userNameElement.closest('a[role="link"]');
                    if (parentLink) {
                      const href = parentLink.getAttribute('href');
                      if (href && href.startsWith('/') && href.split('/').length === 2) {
                        const username = href.substring(1);
                        if (
                          !['home', 'explore', 'notifications', 'messages', 'compose', 'search'].includes(username) &&
                          !href.includes('/status/') &&
                          !href.includes('/photo') &&
                          !href.includes('/media')
                        ) {
                          console.log('找到用户(通过推文):', username, '显示名称:', text);
                          profileLinks.add('https://twitter.com' + href);
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                console.error('处理推文时出错:', e);
              }
            });
          }

          // 记录页面状态
          console.log('当前页面用户卡片数量:', document.querySelectorAll('div[class*="css-175oi2r r-eqz5dr r-16y2uox r-1wbh5a2"]').length);
          console.log('当前页面推文数量:', document.querySelectorAll('article[data-testid="tweet"]').length);

          const links = Array.from(profileLinks);
          console.log('最终找到的用户链接:', links);
          return links;
        }
      `);

      if (Array.isArray(result)) {
        this.onLog(`🔍 找到 ${result.length} 个用户链接`, 'info');
        if (result.length > 0) {
          this.onLog(`🔗 示例用户: ${result[0].split('/').pop()}`, 'info');
          this.onLog(`📊 用户列表: ${result.map(url => url.split('/').pop()).join(', ')}`, 'info');
        } else {
          this.onLog('⚠️ 未找到任何用户，正在记录页面状态...', 'warning');
          // 记录当前页面状态
          await window.electronAPI.evaluate(`
            () => {
              const userCards = document.querySelectorAll('div[class*="css-175oi2r r-eqz5dr r-16y2uox r-1wbh5a2"]');
              const tweets = document.querySelectorAll('article[data-testid="tweet"]');
              console.log('页面状态:', {
                userCards: userCards.length,
                tweets: tweets.length,
                bodyContent: document.body.innerHTML
              });
            }
          `);
        }
        return result;
      }
      return [];
    } catch (error) {
      console.error('查找用户失败:', error);
      this.onLog(`❌ 查找用户时出错: ${error}`, 'error');
      return [];
    }
  }

  private async sendMessageToProfile(profileUrl: string) {
    try {
      this.onLog(`🌐 正在访问用户页面: ${profileUrl}`, 'info')
      await window.electronAPI.goto(profileUrl)
      
      // 等待页面加载
      const hasBody = await window.electronAPI.waitForSelector('body', { timeout: 50000 })
      if (!hasBody) {
        throw new Error('页面加载失败')
      }

      // 等待发送消息按钮出现（使用新的选择器）
      const hasMsgBtn = await window.electronAPI.evaluate(`
        () => new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 10;
          
          const checkButton = () => {
            // 使用新的选择器查找发送消息按钮
            const buttons = document.querySelectorAll('div[class*="css-146c3p1"][class*="r-bcqeeo"][class*="r-qvutc0"]');
            for (const btn of buttons) {
              // 检查是否包含发送消息图标
              const svg = btn.querySelector('svg');
              if (svg && svg.querySelector('path[d*="M2.504 21.866"]')) {
                resolve(true);
                return;
              }
            }
            
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkButton, 1000);
            } else {
              resolve(false);
            }
          };
          
          checkButton();
        })
      `);

      if (!hasMsgBtn) {
        throw new Error('未找到发送消息按钮')
      }

      // 点击发送消息按钮
      this.onLog(`✨ 找到发送按钮: ${profileUrl}`, 'info')
      await window.electronAPI.evaluate(`
        () => {
          const buttons = document.querySelectorAll('div[class*="css-146c3p1"][class*="r-bcqeeo"][class*="r-qvutc0"]');
          for (const btn of buttons) {
            const svg = btn.querySelector('svg');
            if (svg && svg.querySelector('path[d*="M2.504 21.866"]')) {
              // 找到最近的可点击父元素
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
      const hasInput = await window.electronAPI.waitForSelector(
        "div[role='textbox']",
        { timeout: 50000 }
      )

      if (hasInput) {
        // 输入消息
        this.onLog(`⌨️ 正在输入消息...`, 'info')
        await window.electronAPI.type(
          "div[role='textbox']",
          this.config.messageTemplate
        )
        await window.electronAPI.waitForTimeout(2000)

        // 等待发送按钮可用，多次尝试
        let hasSendBtn = false
        let attempts = 0
        const maxAttempts = 5

        while (attempts < maxAttempts && !hasSendBtn) {
          hasSendBtn = await window.electronAPI.waitForSelector(
            "div[role='button'][data-testid='dmComposerSendButton']:not([aria-disabled='true'])",
            { timeout: 5000 }
          )
          if (!hasSendBtn) {
            attempts++
            this.onLog(`⏳ 等待发送按钮可用 (${attempts}/${maxAttempts})...`, 'info')
            await window.electronAPI.waitForTimeout(2000)
          }
        }

        if (hasSendBtn) {
          await window.electronAPI.click(
            "div[role='button'][data-testid='dmComposerSendButton']:not([aria-disabled='true'])"
          )
          this.onLog(`✅ 消息已发送: ${profileUrl}`, 'success')
          // 等待消息发送完成
          await window.electronAPI.waitForTimeout(5000)
        } else {
          throw new Error('发送按钮未启用')
        }
      } else {
        throw new Error('未找到消息输入框')
      }
    } catch (error: any) {
      throw new Error(`发送消息失败: ${error.message}`)
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