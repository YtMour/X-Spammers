import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol } from "puppeteer";
import { Page, Browser } from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { BrowserWindow } from 'electron';
import { TwitterConfig, LogLevel, LogMessage } from '@/types/twitter';
import { join } from 'path';
import { app } from 'electron';
import { 
  ITwitterService, 
  TwitterServiceState, 
  TaskResult, 
  ProfileProcessResult
} from '../../types';

// 使用 Stealth 插件提高 Puppeteer 隐私性能
puppeteer.use(StealthPlugin());

export class TwitterService implements ITwitterService {
    private state: TwitterServiceState = {
        isRunning: false,
        browser: null,
        page: null,
        visitedUrls: new Set<string>(),
        config: null
    };

    private window: BrowserWindow;

    constructor(window: BrowserWindow) {
        this.window = window;
    }

    private sendLog(level: LogLevel, message: string): void {
        const logMessage: LogMessage = {
            level,
            message,
            timestamp: new Date().toLocaleTimeString()
        };
        this.window.webContents.send('log-message', logMessage);
    }

    async start(config: TwitterConfig): Promise<void> {
        try {
            if (this.state.isRunning) {
                throw new Error('任务已在运行中');
            }

            this.state.config = config;
            this.sendLog('info', '正在启动浏览器...');

            const cookies = JSON.parse(
                await readFile(join(app.getPath('userData'), 'cookies.json'), 'utf-8')
            );

            this.state.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.state.page = await this.state.browser.newPage();
            await this.state.page.setCookie(...cookies);

            this.state.isRunning = true;
            this.sendLog('success', '浏览器启动成功');

            while (this.state.isRunning) {
                try {
                    const result = await this.runTask();
                    if (!result.success) {
                        this.sendLog('error', `任务执行失败: ${result.error}`);
                        break;
                    }
                    this.sendLog('info', `处理了 ${result.profilesProcessed} 个用户，发送了 ${result.messagesSent} 条消息`);
                    await new Promise(resolve => setTimeout(resolve, config.frequency * 1000));
                } catch (error) {
                    this.sendLog('error', `任务执行出错: ${error instanceof Error ? error.message : String(error)}`);
                    break;
                }
            }
        } catch (error) {
            this.sendLog('error', `启动失败: ${error instanceof Error ? error.message : String(error)}`);
            await this.stop();
            throw error;
        }
    }

    async stop(): Promise<void> {
        this.state.isRunning = false;
        if (this.state.page) {
            await this.state.page.close();
            this.state.page = null;
        }
        if (this.state.browser) {
            await this.state.browser.close();
            this.state.browser = null;
        }
        this.state.config = null;
        this.state.visitedUrls.clear();
        this.sendLog('info', '任务已停止');
    }

    async runTask(): Promise<TaskResult> {
        if (!this.state.page || !this.state.config) {
            throw new Error('浏览器或配置未初始化');
        }

        const result: TaskResult = {
            success: true,
            profilesProcessed: 0,
            messagesSent: 0
        };

        try {
            await this.state.page.goto(`https://twitter.com/search?q=${encodeURIComponent(this.state.config.searchQuery)}&f=user`);
            await this.state.page.waitForSelector('article');

            const newProfileLinks = await this.state.page.evaluate(() => {
                const articles = document.querySelectorAll('article');
                const links: string[] = [];
                articles.forEach(article => {
                    const userLink = article.querySelector('a[href*="/status/"]');
                    if (userLink) {
                        const href = userLink.getAttribute('href');
                        if (href) {
                            links.push('https://twitter.com' + href);
                        }
                    }
                });
                return links;
            });

            for (const profileUrl of newProfileLinks) {
                if (this.state.visitedUrls.has(profileUrl)) {
                    continue;
                }

                const profileResult = await this.processProfile(profileUrl);
                result.profilesProcessed++;
                if (profileResult.messageSent) {
                    result.messagesSent++;
                }

                this.state.visitedUrls.add(profileUrl);
            }

            return result;
        } catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : String(error);
            return result;
        }
    }

    async processProfile(profileUrl: string): Promise<ProfileProcessResult> {
        if (!this.state.page || !this.state.config) {
            throw new Error('浏览器或配置未初始化');
        }

        const result: ProfileProcessResult = {
            success: true,
            messageSent: false
        };

        try {
            await this.state.page.goto(profileUrl);
            await this.state.page.waitForSelector('[data-testid="sendDMFromProfile"]');
            
            await this.state.page.click('[data-testid="sendDMFromProfile"]');
            await this.state.page.waitForSelector('[data-testid="dmComposerTextInput"]');

            await this.state.page.type(
                '[data-testid="dmComposerTextInput"]',
                this.state.config.message
            );

            const sendButton = await this.waitForSendButton();
            if (!sendButton) {
                throw new Error('发送按钮未就绪');
            }

            await sendButton.click();
            result.messageSent = true;
            this.sendLog('success', `成功发送消息到: ${profileUrl}`);

            return result;
        } catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : String(error);
            this.sendLog('warning', `处理用户失败 ${profileUrl}: ${error instanceof Error ? error.message : String(error)}`);
            return result;
        }
    }

    private async waitForSendButton(): Promise<any> {
        try {
            await this.state.page?.waitForSelector('[data-testid="dmComposerSendButton"]:not([disabled])', {
                timeout: 5000
            });
            return await this.state.page?.$('[data-testid="dmComposerSendButton"]');
        } catch {
            return null;
        }
    }
} 