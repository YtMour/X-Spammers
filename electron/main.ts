/// <reference types="node" />
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const puppeteer = require('puppeteer-core')

// 设置应用路径
const DIST_PATH = path.join(__dirname, '../dist')
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(__dirname, '../public')
const PRELOAD_PATH = path.join(__dirname, '../dist-electron/preload.js')

let win = null
let browser = null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
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

// 处理浏览器操作
ipcMain.handle('launchBrowser', async (event, options) => {
  try {
    browser = await puppeteer.launch(options)
    return browser
  } catch (error) {
    console.error('启动浏览器失败:', error)
    throw error
  }
})

ipcMain.handle('closeBrowser', async () => {
  if (browser) {
    await browser.close()
    browser = null
  }
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
