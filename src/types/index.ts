import { Browser, Page } from 'puppeteer-core'

export interface TwitterConfig {
  searchQuery: string
  message: string
  frequency: number
}

export interface TaskResult {
  success: boolean
  error?: string
  profilesProcessed: number
  messagesSent: number
}

export interface ProfileProcessResult {
  success: boolean
  error?: string
  messageSent: boolean
}

export type LogLevel = 'info' | 'warning' | 'error' | 'success'

export interface LogMessage {
  level: LogLevel
  message: string
  timestamp: string
}

export interface TwitterServiceState {
  isRunning: boolean
  browser: Browser | null
  page: Page | null
  visitedUrls: Set<string>
  config: TwitterConfig | null
}

export interface ITwitterService {
  start(config: TwitterConfig): Promise<void>
  stop(): Promise<void>
  runTask(): Promise<TaskResult>
  processProfile(profileUrl: string): Promise<ProfileProcessResult>
} 