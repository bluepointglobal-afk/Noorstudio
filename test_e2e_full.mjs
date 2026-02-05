import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotDir = '/tmp/noorstudio-e2e';
fs.mkdirSync(screenshotDir, { recursive: true });

async function takeScreenshot(page, name) {
  const filepath = `${screenshotDir}/${name}.png`;
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  → Screenshot: ${filepath}`);
  return filepath;
}

async function waitAndClick(page, selector, timeout = 5000) {
  try {
    await page.locator(selector).first().waitFor({ timeout });
    await page.locator(selector).first().click();
    return true;
  } catch (e) {
    console.log(`  ✗ Could not find/click: ${selector}`);
    return false;
  }
}

async function fillInput(page, selector, value) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ timeout: 3000 });
    await el.fill(value);
    return true;
  } catch (e) {
    console.log(`  ✗ Could not fill input: ${selector}`);
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    console.log('\n========== NoorStudio E2E Test ==========');
    
    // STEP 1: Home page
    console.log('\n[STEP 1] Opening home page...');
    await page.goto('http://localhost:3007', { waitUntil: 'networkidle' });
    await takeScreenshot(page, '01-home');
    
    // STEP 2: Click Get Started
    console.log('\n[STEP 2] Clicking "Get Started"...');
    await waitAndClick(page, 'button:has-text("Get Started")');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '02-dashboard');
    
    // STEP 3: Look for "New Book" button on dashboard
    console.log('\n[STEP 3] Looking for "New Book" or create button...');
    const newBookSelectors = [
      'button:has-text("New Book")',
      'button:has-text("Create Book")',
      'button:has-text("Start")',
      'a:has-text("New Book")',
      '[href*="/app/books/new"]',
      'button:text("Create a new book")',
    ];
    
    let foundNewBook = false;
    for (const sel of newBookSelectors) {
      if (await waitAndClick(page, sel, 3000)) {
        foundNewBook = true;
        break;
      }
    }
    
    if (!foundNewBook) {
      console.log('  Attempting direct navigation to book builder...');
      await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'networkidle' });
    }
    
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '03-book-builder');
    
    // STEP 4: Create a 3-chapter book
    console.log('\n[STEP 4] Creating new book...');
    
    // Fill book title
    let success = await fillInput(page, 'input[placeholder*="title"], input[name="title"], input[placeholder*="Title"]', 'My Islamic Tale');
    if (success) console.log('  ✓ Book title entered');
    
    // Fill book description/theme
    success = await fillInput(page, 'textarea, input[placeholder*="description"], input[name="description"]', 'A beautiful story about kindness and friendship');
    if (success) console.log('  ✓ Book description entered');
    
    await takeScreenshot(page, '04-book-form');
    
    // Look for a "Create" or "Next" button
    console.log('\n[STEP 5] Submitting book form...');
    const submitSelectors = [
      'button:has-text("Create")',
      'button:has-text("Next")',
      'button:has-text("Start")',
      'button:text("Create Book")',
      'button[type="submit"]',
    ];
    
    let submitted = false;
    for (const sel of submitSelectors) {
      if (await waitAndClick(page, sel, 3000)) {
        submitted = true;
        console.log(`  ✓ Clicked: ${sel}`);
        break;
      }
    }
    
    if (!submitted) {
      console.log('  Could not find submit button. Checking page state...');
      const text = await page.innerText('body');
      console.log(text.substring(0, 300));
    }
    
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-after-book-creation');
    
    console.log('\n========== Test Complete ==========');
    console.log(`Screenshots saved to: ${screenshotDir}`);
    
  } catch (e) {
    console.error('Error:', e.message);
    await takeScreenshot(page, '99-error');
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
