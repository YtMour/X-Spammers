/// <reference types="node" />
import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/types/global'

// 暴露安全的 API 到渲染进程
const api: ElectronAPI = {
  readCookies: () => ipcRenderer.invoke('readCookies'),
  saveCookies: (cookies: string) => ipcRenderer.invoke('saveCookies', cookies),
  launchBrowser: (options: any) => ipcRenderer.invoke('launchBrowser', options),
  closeBrowser: () => ipcRenderer.invoke('closeBrowser')
}

contextBridge.exposeInMainWorld('electronAPI', api)

// 暴露 ipcRenderer 到 window 对象
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  once: (channel, func) => {
    ipcRenderer.once(channel, (event, ...args) => func(...args))
  },
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args)
  },
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args)
  }
})
