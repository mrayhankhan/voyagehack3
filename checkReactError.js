import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('PAGE ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.error('UNCAUGHT PAGE EXCEPTION:', error.message);
    });

    try {
        await page.goto('http://localhost:5173/event/evt-001', {waitUntil: 'networkidle2', timeout: 8000});
        // Wait a bit to let react render crash
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        console.error('Navigate error:', e.message);
    }
    await browser.close();
})();
