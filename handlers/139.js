const BaseScanner = require('./baseHandler');

module.exports = async (browser, send) => {
    const page = await browser.newPage();
    let authorization = null;

    // 监听网络请求
    await page.setRequestInterception(true);
    page.on('request', req => {
        const authHeader = req.headers()['authorization'];
        if (authHeader && authHeader.includes('Basic')) {
            authorization = authHeader.replace('Basic ', '');
        }
        req.continue();
    });

    await page.goto('https://yun.139.com/w/#/', { waitUntil: 'networkidle2' });

    // 提取二维码
    await page.waitForSelector('img[alt="Scan me!"]');
    const qr = await page.evaluate(() => document.querySelector('img[alt="Scan me!"]')?.src);
    
    if (qr) {
        send(BaseScanner.formatSSE('qr', qr));
    }

    // 等待扫码结果
    const success = await BaseScanner.waitFor(async () => {
        // 如果抓到了 auth，或者页面发生了跳转，说明成功
        return authorization !== null;
    }, 60);

    if (success && authorization) {
        send(BaseScanner.formatSSE('cookie', authorization));
    } else {
        send(BaseScanner.formatSSE('error', 'Scan timeout or failed'));
    }
};
