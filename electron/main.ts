/// <reference types="node" />
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const puppeteer = require('puppeteer-core')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteerExtra = require('puppeteer-extra')

// 使用 Stealth 插件
puppeteerExtra.use(StealthPlugin())

// 设置应用路径
const DIST_PATH = path.join(__dirname, '../dist')
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(__dirname, '../public')
const PRELOAD_PATH = path.join(__dirname, '../dist-electron/preload.js')

let win = null
let browser = null
let activePage = null

// 浏览器启动参数
const defaultBrowserArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certifcate-errors',
  '--ignore-certifcate-errors-spki-list',
  '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  })

  if (process.env.VITE_DEV_SERVER_URL && win) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else if (win) {
    win.loadFile(path.join(DIST_PATH, 'index.html'))
  }

  // 开发环境下打开开发者工具
  if (!app.isPackaged && win) {
    win.webContents.openDevTools()
  }
}

// 处理文件读写
ipcMain.handle('readCookies', () => {
  return new Promise((resolve) => {
    const cookiesPath = path.join(app.getPath('userData'), 'cookies.json')
    fs.readFile(cookiesPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('读取 cookies 失败:', err)
        resolve('[]') // 如果文件不存在，返回空数组
      } else {
        resolve(data)
      }
    })
  })
})

ipcMain.handle('saveCookies', async (event, cookies) => {
  return new Promise((resolve) => {
    const cookiesPath = path.join(app.getPath('userData'), 'cookies.json')
    fs.writeFile(cookiesPath, cookies, 'utf-8', (err) => {
      if (err) {
        console.error('保存 cookies 失败:', err)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
})

// 获取操作系统平台
ipcMain.handle('getPlatform', () => {
  return process.platform
})

// 处理浏览器操作
ipcMain.handle('launchBrowser', async (event, options) => {
  try {
    const browserOptions = {
      ...options,
      args: [...defaultBrowserArgs, ...(options.args || [])],
      defaultViewport: null
    }
    
    browser = await puppeteerExtra.launch(browserOptions)
    activePage = await browser.newPage()
    await activePage.setViewport({ width: 1280, height: 800 })
    return true
  } catch (error) {
    console.error('启动浏览器失败:', error)
    throw error
  }
})

ipcMain.handle('closeBrowser', async () => {
  try {
    if (activePage) {
      const cookies = await activePage.cookies()
      if (cookies) {
        const cookiesPath = path.join(app.getPath('userData'), 'cookies.json')
        await fs.promises.writeFile(cookiesPath, JSON.stringify(cookies), 'utf-8')
      }
      await activePage.close()
      activePage = null
    }
    if (browser) {
      await browser.close()
      browser = null
    }
    return true
  } catch (error) {
    console.error('关闭浏览器失败:', error)
    throw error
  }
})

// 页面操作
ipcMain.handle('setCookies', async (event, cookies) => {
  if (activePage) {
    try {
      // 确保 sameSite 属性正确
      const formattedCookies = cookies.map(cookie => ({
        ...cookie,
        sameSite: cookie.sameSite === 'unspecified' ? 'None' : cookie.sameSite || 'None'
      }))
      await activePage.setCookie(...formattedCookies)
      return true
    } catch (error) {
      console.error('设置 cookies 失败:', error)
      return false
    }
  }
  return false
})

// 错误处理和截图功能
async function captureError(page, error) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = path.join(app.getPath('userData'), `error_${timestamp}.png`)
    const htmlPath = path.join(app.getPath('userData'), `error_${timestamp}.html`)
    
    await page.screenshot({ path: screenshotPath })
    const htmlContent = await page.content()
    await fs.promises.writeFile(htmlPath, htmlContent)
    
    console.error('错误详情已保存:', { screenshotPath, htmlPath, error })
  } catch (captureError) {
    console.error('保存错误详情失败:', captureError)
  }
}

ipcMain.handle('goto', async (event, url) => {
  if (activePage) {
    try {
      // 设置更长的超时时间，并分步等待页面加载
      await Promise.all([
        activePage.goto(url, {
          timeout: 120000, // 增加到 120 秒
          waitUntil: 'domcontentloaded' // 先等待 DOM 加载
        }),
        // 等待网络基本空闲
        activePage.waitForNetworkIdle({
          timeout: 120000,
          idleTime: 500
        }).catch(() => {
          console.log('网络等待超时，继续执行');
        })
      ]);
      
      // 等待一下以确保页面渲染
      await activePage.waitForTimeout(3000);

      // 检查页面是否有效
      const isValid = await activePage.evaluate(() => {
        return document.body !== null && document.querySelector('div[data-testid="primaryColumn"]') !== null;
      });

      if (!isValid) {
        console.warn('页面加载可能不完整，但继续执行');
      }

      return true;
    } catch (error) {
      console.error('页面导航失败:', error);
      await captureError(activePage, error);
      // 即使超时也返回true，让程序继续执行
      return true;
    }
  }
  return false;
})

ipcMain.handle('evaluate', async (event, script) => {
  if (activePage) {
    try {
      // 如果脚本是字符串形式的函数，先执行它
      if (script.trim().startsWith('(')) {
        return await activePage.evaluate(script)
      }
      // 否则，将字符串包装成函数
      const fn = new Function(`return ${script}`)()
      return await activePage.evaluate(fn)
    } catch (error) {
      console.error('执行脚本失败:', error)
      return null
    }
  }
  return null
})

ipcMain.handle('waitForSelector', async (event, selector, options) => {
  if (activePage) {
    const element = await activePage.waitForSelector(selector, options)
    return element !== null
  }
  return false
})

ipcMain.handle('click', async (event, selector) => {
  if (activePage) {
    await activePage.click(selector)
    return true
  }
  return false
})

ipcMain.handle('type', async (event, selector, text) => {
  if (activePage) {
    await activePage.type(selector, text)
    return true
  }
  return false
})

ipcMain.handle('waitForTimeout', async (event, timeout) => {
  if (activePage) {
    await activePage.waitForTimeout(timeout)
    return true
  }
  return false
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
  win = null
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
