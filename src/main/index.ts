import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp } from '@electron-toolkit/utils'
import { TwitterService } from './services/twitter'

let mainWindow: BrowserWindow | null = null
let twitterService: TwitterService | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 初始化 Twitter 服务
  twitterService = new TwitterService(mainWindow)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.x-spammers.app')
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 通信处理
ipcMain.handle('start-task', async (_, config) => {
  try {
    await twitterService?.start(config)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stop-task', async () => {
  try {
    await twitterService?.stop()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-config', async (event, config) => {
  // TODO: 实现配置保存逻辑
}) 