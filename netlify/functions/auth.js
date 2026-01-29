const { stream } = require('@netlify/functions');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// 导入处理器
const handlers = {
    '139': require('../../handlers/139'),
    // 'aliyun': require('../../handlers/aliyun'), // 以后扩展
};

exports.handler = stream(async (event, context) => {
    // 获取路径中的驱动名称，例如 /auth/139 -> drive = "139"
    const pathParts = event.path.split('/');
    const drive = pathParts[pathParts.length - 1];

    if (!handlers[drive]) {
        return { statusCode: 404, body: JSON.stringify({ error: "Driver not found" }) };
    }

    return new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const send = (msg) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));

            let browser = null;
            try {
                browser = await puppeteer.launch({
                    args: chromium.args,
                    executablePath: await chromium.executablePath,
                    headless: chromium.headless,
                });

                // 执行对应网盘的逻辑
                await handlers[drive](browser, send);

            } catch (e) {
                send({ type: 'error', data: e.message });
            } finally {
                if (browser) await browser.close();
                controller.close();
            }
        }
    });
});
