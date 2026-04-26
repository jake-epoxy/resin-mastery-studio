import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:8080/JasonWaller', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  if (content.includes('PartnershipAgreement')) {
      console.log("Component is rendered!");
  } else {
      console.log("Component is NOT rendered.");
  }
  
  await browser.close();
})();
