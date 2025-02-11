import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol } from "puppeteer";
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import config from "./config";

// 使用 Stealth 插件提高 Puppeteer 隐私性能
puppeteer.use(StealthPlugin());

const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
];

const options = {
    args,
    headless: false,
};

async function main() {
    const browser = await puppeteer.launch(options);
    let cookies = await readFile("cookies.json", { encoding: "utf8" });
    let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
    let page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 720 });
    await page.setCookie(...cookieJson);

    try {
        await page.goto(`https://twitter.com/search?q=${config.searchQuery}&src=recent_search_click&f=live`);
        await page.waitForNetworkIdle();

        let asyncPageIteratorObj = {
            [Symbol.asyncIterator]: function () {
                return {
                    async next() {
                        let profileLinkFinderScriptResult = await page.evaluate(() => {
                            let lastLinkElemPos = Number(localStorage.getItem("lastLinkElemPos"));
                            console.log(lastLinkElemPos);
                            let newProfileLinks = [];
                            let profilePageLinkRegEx = /^\/[0-9A-Za-z]+$/;
                            let allElementsWithLinks = document.querySelectorAll("div[data-testid='primaryColumn'] a[role='link']");
                            allElementsWithLinks.forEach((elem) => {
                                let profileLink = elem.getAttribute("href");
                                if (profileLink?.match(profilePageLinkRegEx)) {
                                    if (
                                        !(
                                            profileLink == "/home" ||
                                            profileLink == "/explore" ||
                                            profileLink == "/notifications" ||
                                            profileLink == "/messages"
                                        )
                                    ) {
                                        newProfileLinks.push("https://twitter.com" + profileLink);
                                    }
                                }
                            });
                            allElementsWithLinks[allElementsWithLinks.length - 1].scrollIntoView();
                            return newProfileLinks;
                        });

                        return {
                            done: false,
                            value: profileLinkFinderScriptResult,
                        };
                    },
                };
            },
        };

        let visitedUrls = new Set();

        for await (let profileLinks of asyncPageIteratorObj) {
            let profileLinksSet = new Set(profileLinks);

            for (let link of profileLinksSet) {
                if (visitedUrls.has(link)) {
                    continue;
                }

                let profilePage = await browser.newPage();
                await profilePage.goto(link);

                try {
                    await profilePage.waitForSelector("body", { timeout: 50000 });

                    const msgBtn = await profilePage.waitForSelector("button[data-testid='sendDMFromProfile']", { timeout: 20000 });

                    if (msgBtn) {
                        console.log("Found send DM button for:", link);
                        await msgBtn.click();

                        const messageInput = await profilePage.waitForSelector("div[role='textbox']", { timeout: 50000 });

                        if (messageInput) {
                            await messageInput.type(config.message);

                            // 等待一会儿，以确保输入已完成
                            await profilePage.waitForTimeout(5000);

                            // 确保发送按钮可用
                            let sendButton;
                            let attempts = 0;
                            const maxAttempts = 5;

                            while (attempts < maxAttempts) {
                                sendButton = await profilePage.waitForSelector("button[data-testid='dmComposerSendButton']:not([aria-disabled='true'])", { timeout: 5000 });
                                if (sendButton) break;
                                attempts++;
                                await profilePage.waitForTimeout(5000);
                            }

                            if (sendButton) {
                                await sendButton.click();
                                console.log(`Message sent to ${link}`);
                            } else {
                                console.log(`Send button not found or not enabled for ${link}`);
                            }
                        } else {
                            console.log(`Message input box not found for ${link}`);
                        }

                        await profilePage.waitForTimeout(10000);

                    } else {
                        console.log(`No send DM button found for ${link}`);
                    }

                } catch (error) {
                    console.error(`Error sending message to ${link}:`, error);
                    await profilePage.screenshot({ path: `error_${Date.now()}.png` });
                    const htmlContent = await profilePage.content();
                    await require('fs').promises.writeFile(`error_${Date.now()}.html`, htmlContent);
                } finally {
                    await profilePage.close();
                }

                visitedUrls.add(link);
            }

            await page.waitForNetworkIdle();
        }
    } catch (error) {
        console.error("Main function error:", error);
    } finally {
        await browser.close();
    }
}

main();
