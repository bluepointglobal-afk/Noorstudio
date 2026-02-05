const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Opening http://localhost:3007...');
  await page.goto('http://localhost:3007', { waitUntil: 'networkidle' });
  
  console.log('Page loaded');
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/step1-home.png', fullPage: true });
  console.log('Screenshot 1: Home page saved');
  
  // Take a snapshot of the page content
  const content = await page.content();
  console.log('Page title:', await page.title());
  
  // Look for buttons
  const buttons = await page.locator('button').count();
  console.log('Buttons found:', buttons);
  
  // Get all text content
  const text = await page.innerText('body');
  console.log('Page text:', text.substring(0, 500));
  
  await browser.close();
})();
