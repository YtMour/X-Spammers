declare module 'puppeteer-extra' {
  import { Browser, LaunchOptions } from 'puppeteer-core'
  
  interface PuppeteerExtra {
    use(plugin: any): void
    launch(options?: LaunchOptions): Promise<Browser>
  }
  
  const puppeteer: PuppeteerExtra
  export default puppeteer
}

declare module 'puppeteer-extra-plugin-stealth' {
  const StealthPlugin: () => any
  export default StealthPlugin
}

declare module 'fs/promises' {
  export function readFile(path: string, options: { encoding: string }): Promise<string>
  export function readFile(path: string, encoding: string): Promise<string>
} 