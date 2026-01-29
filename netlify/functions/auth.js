const { stream } = require('@netlify/functions');
const BaseScanner = require('../../handlers/baseHandler');
const handler139 = require('../../handlers/139');

exports.handler = stream(async (event, context) => {
    // 1. 提取驱动名称
    const drive = event.path.split('/').pop();
    const handlers = { '139': handler139 };

    if (!handlers[drive]) {
        return { statusCode: 404, body: 'Driver not found' };
    }

    // 2. 获取响应流引用
    const responseStream = context.streaming.responseStream;
    
    // 设置必要的 SSE 响应头
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    };
    
    // 注意：在 stream 模式下，我们通过 context 直接操作流，而不是 return 一个对象
    context.streaming.setHeaders(headers);

    let browser = null;
    try {
        browser = await BaseScanner.getBrowser();
        // 传入流写入函数
        const sendMsg = (data) => {
            responseStream.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        await handlers[drive](browser, sendMsg);
    } catch (e) {
        console.error("Runtime Error:", e);
        responseStream.write(`data: ${JSON.stringify({ type: 'error', data: e.message })}\n\n`);
    } finally {
        if (browser) await browser.close();
        responseStream.end(); // 必须手动结束流
    }
});
