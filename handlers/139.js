module.exports = async (browser, send) => {
    const page = await browser.newPage();
    let authFound = false;

    // 1. 开启请求拦截，监听 Authorization
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = request.url();
        // 匹配目标 API
        if (url.includes('queryControlSwitch')) {
            const auth = request.headers()['authorization'];
            if (auth && auth.startsWith('Basic ')) {
                const token = auth.replace('Basic ', '');
                send({ type: 'cookie', data: token });
                authFound = true;
            }
        }
        request.continue();
    });

    // 2. 访问 139 登录页
    await page.goto('https://yun.139.com/w/#/', { waitUntil: 'networkidle2' });

    // 3. 提取二维码
    await page.waitForSelector('img[alt="Scan me!"]');
    const qrBase64 = await page.evaluate(() => {
        return document.querySelector('img[alt="Scan me!"]')?.src;
    });

    if (qrBase64) {
        send({ type: 'qr', data: qrBase64 });
    }

    // 4. 等待扫码（1分钟循环检查）
    let timer = 0;
    while (!authFound && timer < 60) {
        await new Promise(r => setTimeout(r, 2000));
        timer += 2;
        // 如果页面发生了重定向或URL变化，通常意味着扫码成功
    }

    if (!authFound) {
        throw new Error("Wait timeout or scan failed");
    }
};
