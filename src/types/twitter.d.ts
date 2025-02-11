import { Protocol } from 'puppeteer'
import { Page, Browser } from 'puppeteer-core'

export interface TwitterConfig {
    searchQuery: string
    message: string
    frequency: number
}

export interface TaskResult {
    success: boolean
    error?: string
}

export interface ProfileProcessResult {
    success: boolean
    message: string
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export interface LogMessage {
    level: LogLevel
    message: string
    timestamp: string
} 