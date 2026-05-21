import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Capture console logs from the browser
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Capture unhandled errors
  page.on('pageerror', error => {
    console.error('BROWSER ERROR:', error.message);
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('local_dev_bypass', 'true');
  });

  try {
    await page.goto('http://localhost:8080/admin/autopilot', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log("Page loaded successfully.");
    
    // Check if the body is empty (white screen)
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    if (bodyHTML.trim() === '' || bodyHTML.includes('<div id="root"></div>') && bodyHTML.length < 100) {
       console.log("Warning: Page appears to be blank.");
    }
  } catch (err) {
    console.error("Navigation failed:", err.message);
  } finally {
    await browser.close();
  }
})();
