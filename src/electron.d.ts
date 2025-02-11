import { Browser } from 'puppeteer-core'

export interface ElectronAPI {
  readCookies: () => Promise<string>
  saveCookies: (cookies: string) => Promise<boolean>
  launchBrowser: (options: any) => Promise<boolean>
  closeBrowser: () => Promise<boolean>
  getPlatform: () => Promise<string>
  setCookies: (cookies: any[]) => Promise<boolean>
  goto: (url: string) => Promise<boolean>
  evaluate: (script: string | Function) => Promise<any>
  waitForSelector: (selector: string, options?: any) => Promise<boolean>
  click: (selector: string) => Promise<boolean>
  type: (selector: string, text: string) => Promise<boolean>
  waitForTimeout: (timeout: number) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    ipcRenderer: {
      on: (channel: string, func: (...args: any[]) => void) => void
      once: (channel: string, func: (...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
} 