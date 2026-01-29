const { stream } = require('@netlify/functions');
const BaseScanner = require('../../handlers/baseHandler');
const handler139 = require('../../handlers/139'); // 假设你导出了 139 的逻辑

// 这里的变量名不要和上面的 stream 重名
exports.handler = stream(async (event, context) => {
    console.log("Request path:", event.path);

    // 获取驱动名称，例如从 /api/139 中获取 "139"
    const pathParts = event.path.split('/');
    const drive = pathParts[pathParts.length - 1];

    const handlers = {
        '139': handler139
    };

    if (!handlers[drive]) {
        return { 
            statusCode: 404, 
            body: JSON.stringify({ error: `Driver ${drive} not found` }) 
        };
    }

    // 返回流式响应
    return new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            // 定义发送函数，确保这里没有命名冲突
            const sendMsg = (msg) => controller.enqueue(encoder.encode(msg));

            let browser = null;
            try {
                browser = await BaseScanner.getBrowser();
                // 调用具体的网盘处理器
                await handlers[drive](browser, sendMsg);
            } catch (e) {
                console.error("Browser Error:", e);
                sendMsg(`data: ${JSON.stringify({ type: 'error', data: e.message })}\n\n`);
            } finally {
                if (browser) await browser.close();
                controller.close();
                console.log("Stream closed and process destroyed.");
            }
        }
    });
});
