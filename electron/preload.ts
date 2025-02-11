/// <reference types="node" />
import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/electron'

// 暴露安全的 API 到渲染进程
const api: ElectronAPI = {
  readCookies: () => ipcRenderer.invoke('readCookies'),
  saveCookies: (cookies: string) => ipcRenderer.invoke('saveCookies', cookies),
  launchBrowser: (options: any) => ipcRenderer.invoke('launchBrowser', options),
  closeBrowser: () => ipcRenderer.invoke('closeBrowser'),
  getPlatform: () => ipcRenderer.invoke('getPlatform'),
  setCookies: (cookies: any[]) => ipcRenderer.invoke('setCookies', cookies),
  goto: (url: string) => ipcRenderer.invoke('goto', url),
  evaluate: (script: string | Function) => ipcRenderer.invoke('evaluate', script),
  waitForSelector: (selector: string, options?: any) => ipcRenderer.invoke('waitForSelector', selector, options),
  click: (selector: string) => ipcRenderer.invoke('click', selector),
  type: (selector: string, text: string) => ipcRenderer.invoke('type', selector, text),
  waitForTimeout: (timeout: number) => ipcRenderer.invoke('waitForTimeout', timeout)
}

contextBridge.exposeInMainWorld('electronAPI', api)

// 暴露 ipcRenderer 到 window 对象
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  once: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (event, ...args) => func(...args))
  },
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  },
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  }
})
