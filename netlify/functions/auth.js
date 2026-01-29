const { stream } = require('@netlify/functions');
const BaseScanner = require('../../handlers/baseHandler');
const handler139 = require('../../handlers/139');

exports.handler = stream(async (event, context) => {
    // 1. 设置响应头 (SSE 协议)
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    };

    // 2. 提取网盘驱动
    const drive = event.path.split('/').pop();
    const handlers = { '139': handler139 };

    if (!handlers[drive]) {
        return { statusCode: 404, body: 'Drive not found' };
    }

    // 3. 获取 Netlify 提供的原始流
    const { responseStream } = context.streaming;
    context.streaming.setHeaders(headers);

    let browser = null;
    try {
        // 打印日志以便在 Netlify 后台控制台调试
        console.log(`Starting scanner for: ${drive}`);
        
        browser = await BaseScanner.getBrowser();
        
        // 封装通用的发送函数
        const sendMsg = (obj) => {
            responseStream.write(`data: ${JSON.stringify(obj)}\n\n`);
        };

        // 执行具体逻辑
        await handlers[drive](browser, sendMsg);
        
    } catch (error) {
        console.error("Runtime Error:", error);
        responseStream.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    } finally {
        if (browser) {
            console.log("Closing browser...");
            await browser.close();
        }
        // 必须显式结束流，否则客户端会一直挂起
        responseStream.end();
    }
});
