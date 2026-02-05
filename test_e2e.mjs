#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';

const SCREENSHOT_DIR = '/tmp/noorstudio-e2e-final';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let step = 0;

async function screenshot(page, name) {
  step++;
  const file = `${SCREENSHOT_DIR}/${String(step).padStart(2, '0')}-${name}.png`;
  try {
    await page.screenshot({ path: file, fullPage: true });
    console.log(`[${step}] Saved: ${name}`);
  } catch (e) {
    console.log(`[${step}] Screenshot failed: ${e.message}`);
  }
  return file;
}

async function waitForSelector(page, selector, timeout = 10000) {
  try {
    await page.locator(selector).first().waitFor({ timeout });
    return true;
  } catch (e) {
    return false;
  }
}

async function clickButton(page, text) {
  try {
    const btn = page.locator(`button:has-text("${text}")`).first();
    await btn.waitFor({ timeout: 3000 });
    await btn.click();
    await page.waitForTimeout(500);
    return true;
  } catch (e) {
    console.log(`  Could not click: ${text}`);
    return false;
  }
}

(async () => {
  console.log('=== NoorStudio E2E Test ===\n');
  let browser;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
    
    // 1. Load home page
    console.log('1. Loading home page...');
    await page.goto('http://localhost:3007/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'home-page');
    
    // 2. Click Get Started
    console.log('2. Clicking Get Started...');
    await clickButton(page, 'Get Started');
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'dashboard');
    
    // 3. Go to new book
    console.log('3. Navigating to book builder...');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, 'book-wizard-start');
    
    // 4. Navigate through wizard steps
    console.log('4. Stepping through book wizard...');
    
    // Step 1: Universe selection (already selected, just click Next)
    console.log('  - Step 1: Universe');
    await page.waitForTimeout(500);
    if (!await clickButton(page, 'Next')) {
      console.log('  Alternative: Trying arrow button');
      const nextBtn = page.locator('button:has(svg)').last();
      await nextBtn.click();
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await screenshot(page, 'wizard-step2');
    
    // Step 2: Template/Age
    console.log('  - Step 2: Template/Age');
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    await screenshot(page, 'wizard-step3');
    
    // Step 3: Characters
    console.log('  - Step 3: Characters');
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    await screenshot(page, 'wizard-step4');
    
    // Step 4: Formatting
    console.log('  - Step 4: Formatting');
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    await screenshot(page, 'wizard-step5');
    
    // Step 5: Review/Create
    console.log('  - Step 5: Create Project');
    
    // Fill in book title
    const titleInputs = page.locator('input[type="text"]');
    if (await titleInputs.count() > 0) {
      try {
        await titleInputs.first().fill('My Islamic Tale');
        console.log('    - Book title filled');
      } catch (e) {}
    }
    
    await page.waitForTimeout(500);
    await screenshot(page, 'wizard-ready-create');
    
    // Click Create button
    if (await clickButton(page, 'Create') || await clickButton(page, 'Submit') || await clickButton(page, 'Start')) {
      console.log('  - Create button clicked');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      console.log('  - Trying alternative create selector');
      const createBtn = page.locator('button').last();
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await screenshot(page, 'project-workspace');
    
    // 5. Now in project workspace - generate chapters
    console.log('5. Generating chapters...');
    
    const url = page.url();
    console.log(`   Current URL: ${url}`);
    
    // Look for chapter generation UI
    const bodyText = await page.innerText('body');
    console.log(`   Page loaded (${bodyText.length} chars)`);
    
    // Try to find chapter generation buttons
    const buttons = await page.locator('button').allTextContents();
    console.log(`   Found ${buttons.length} buttons`);
    const relevantButtons = buttons.filter(b => 
      b.toLowerCase().includes('generate') || 
      b.toLowerCase().includes('create') || 
      b.toLowerCase().includes('chapter') ||
      b.toLowerCase().includes('start')
    );
    console.log(`   Relevant buttons: ${relevantButtons.slice(0, 5).join(', ')}`);
    
    // Try to generate Chapter 1
    if (await clickButton(page, 'Generate') || 
        await clickButton(page, 'Create Chapter') ||
        await clickButton(page, 'Generate Chapter') ||
        await clickButton(page, 'Start Generating')) {
      console.log('  ✓ Generate button found and clicked');
      await page.waitForTimeout(5000);  // Wait for generation
      await page.waitForLoadState('networkidle');
    } else {
      console.log('  - Could not find generate button, trying alternatives');
      // Look for any button that might start generation
      const allButtons = await page.locator('button');
      if (await allButtons.count() > 0) {
        const btn = allButtons.nth(Math.floor(await allButtons.count() / 2));
        await btn.click();
        await page.waitForTimeout(3000);
      }
    }
    
    await screenshot(page, 'chapter1-generating');
    
    // Wait for results
    console.log('6. Waiting for chapter generation...');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'chapter1-generated');
    
    // Look for character renders/images
    console.log('7. Capturing character renders...');
    const images = await page.locator('img').allTextContents();
    console.log(`   Found ${images.length} image elements`);
    
    // Get all image sources
    const imageSrcs = await page.locator('img').evaluateAll(imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        class: img.className
      }))
    );
    console.log(`   Image sources:`);
    imageSrcs.slice(0, 5).forEach((img, i) => {
      console.log(`     [${i}] ${img.alt || 'no-alt'} - ${img.src.substring(0, 50)}`);
    });
    
    await screenshot(page, 'chapter1-results');
    
    // Try to generate Chapter 2
    console.log('8. Generating Chapter 2...');
    if (await clickButton(page, 'Generate Chapter 2') ||
        await clickButton(page, 'Next Chapter') ||
        await clickButton(page, 'Generate')) {
      console.log('  ✓ Chapter 2 generation started');
      await page.waitForTimeout(5000);
    }
    await screenshot(page, 'chapter2-generating');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'chapter2-generated');
    
    // Generate Chapter 3
    console.log('9. Generating Chapter 3...');
    if (await clickButton(page, 'Generate Chapter 3') ||
        await clickButton(page, 'Next Chapter') ||
        await clickButton(page, 'Generate')) {
      console.log('  ✓ Chapter 3 generation started');
      await page.waitForTimeout(5000);
    }
    await screenshot(page, 'chapter3-generating');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'chapter3-generated');
    
    console.log('\n✓ E2E test completed');
    console.log(`Screenshots: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (browser) {
      const page = (await browser.contexts()[0].pages())[0];
      if (page) {
        const bodyText = await page.innerText('body').catch(() => '');
        console.log('Page state:', bodyText.substring(0, 200));
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
