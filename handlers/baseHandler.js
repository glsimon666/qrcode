const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

class BaseScanner {
    /**
     * 初始化无头浏览器
     * 针对 Serverless 环境做了自动判断和优化
     */
    static async getBrowser() {
        return await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(), // 确保有 await
            headless: chromium.headless,
        });
    }

    /**
     * 统一的 SSE 消息格式化
     */
    static formatSSE(type, data) {
        return `data: ${JSON.stringify({ type, data })}\n\n`;
    }

    /**
     * 通用的等待逻辑
     * @param {Function} condition - 返回布尔值的函数
     * @param {number} timeout - 超时时间（秒）
     */
    static async waitFor(condition, timeout = 60) {
        let start = Date.now();
        while (Date.now() - start < timeout * 1000) {
            if (await condition()) return true;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return false;
    }
}

module.exports = BaseScanner;
