import { Browser } from 'puppeteer-core'

export interface ElectronAPI {
  readCookies: () => Promise<string>
  saveCookies: (cookies: string) => Promise<boolean>
  launchBrowser: (options: any) => Promise<Browser>
  closeBrowser: () => Promise<void>
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