/// <reference types="node" />
import { Browser, Page } from 'puppeteer-core'
import { TwitterConfig } from '../types/twitter'

export class TwitterService {
  private browser: Browser | null = null
  private page: Page | null = null
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

  private getChromePath(): string {
    const platform = process.platform
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
      const chromePath = this.getChromePath()
      console.log('Chrome 路径:', chromePath)

      const browser = await window.electronAPI.launchBrowser({
        executablePath: chromePath,
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
      })

      if (!browser) {
        throw new Error('浏览器启动失败')
      }
      this.browser = browser

      const page = await browser.newPage()
      if (!page) {
        throw new Error('创建页面失败')
      }
      this.page = page
      
      // 加载已保存的 cookies
      const cookiesStr = await window.electronAPI.readCookies()
      const cookies = JSON.parse(cookiesStr)
      if (cookies && cookies.length > 0) {
        await page.setCookie(...cookies)
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
      if (this.page) {
        // 保存 cookies
        const cookies = await this.page.cookies()
        if (cookies) {
          await window.electronAPI.saveCookies(JSON.stringify(cookies))
        }
        await this.page.close()
        this.page = null
      }

      if (this.browser) {
        await window.electronAPI.closeBrowser()
        this.browser = null
      }
    } catch (error) {
      console.error('关闭失败:', error)
      throw error
    }
  }

  async start() {
    if (!this.browser || !this.page) {
      throw new Error('浏览器未初始化')
    }

    this.isRunning = true
    let sentCount = 0

    try {
      await this.page.goto(
        `https://twitter.com/search?q=${encodeURIComponent(this.config.searchQuery)}&src=recent_search_click&f=live`
      )
      await this.page.waitForNetworkIdle()
      this.onLog('开始搜索用户...', 'info')

      while (this.isRunning) {
        const profileLinks = await this.findNewProfiles()
        
        for (let link of profileLinks) {
          if (!this.isRunning) break
          if (this.visitedUrls.has(link)) continue

          try {
            await this.sendMessageToProfile(link)
            sentCount++
            this.onSentCount(sentCount)
            await this.page.waitForTimeout(this.config.sendDelay)
          } catch (error: any) {
            this.onLog(`发送消息失败 ${link}: ${error.message}`, 'error')
          }

          this.visitedUrls.add(link)
        }

        // 滚动页面加载更多结果
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })
        await this.page.waitForTimeout(2000)
      }
    } catch (error: any) {
      this.onLog(`任务执行出错: ${error.message}`, 'error')
      throw error
    }
  }

  private async findNewProfiles(): Promise<string[]> {
    if (!this.page) {
      throw new Error('页面未初始化')
    }

    return await this.page.evaluate(() => {
      const profileLinks = new Set<string>()
      const profilePageLinkRegEx = /^\/[0-9A-Za-z]+$/
      const allElementsWithLinks = document.querySelectorAll(
        "div[data-testid='primaryColumn'] a[role='link']"
      )

      allElementsWithLinks.forEach((elem: Element) => {
        const profileLink = elem.getAttribute('href')
        if (
          profileLink?.match(profilePageLinkRegEx) &&
          !['/home', '/explore', '/notifications', '/messages'].includes(profileLink)
        ) {
          profileLinks.add('https://twitter.com' + profileLink)
        }
      })

      return Array.from(profileLinks)
    })
  }

  private async sendMessageToProfile(profileUrl: string) {
    if (!this.browser) {
      throw new Error('浏览器未初始化')
    }

    const profilePage = await this.browser.newPage()
    await profilePage.goto(profileUrl)

    try {
      await profilePage.waitForSelector('body', { timeout: 50000 })
      const msgBtn = await profilePage.waitForSelector(
        "button[data-testid='sendDMFromProfile']",
        { timeout: 20000 }
      )

      if (msgBtn) {
        this.onLog(`找到发送按钮: ${profileUrl}`, 'info')
        await msgBtn.click()

        const messageInput = await profilePage.waitForSelector(
          "div[role='textbox']",
          { timeout: 50000 }
        )

        if (messageInput) {
          await messageInput.type(this.config.messageTemplate)
          await profilePage.waitForTimeout(2000)

          const sendButton = await profilePage.waitForSelector(
            "button[data-testid='dmComposerSendButton']:not([aria-disabled='true'])",
            { timeout: 5000 }
          )

          if (sendButton) {
            await sendButton.click()
            this.onLog(`消息已发送: ${profileUrl}`, 'success')
          } else {
            throw new Error('发送按钮未启用')
          }
        } else {
          throw new Error('未找到消息输入框')
        }
      } else {
        throw new Error('未找到发送消息按钮')
      }
    } finally {
      await profilePage.close()
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