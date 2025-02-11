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
  }
} 