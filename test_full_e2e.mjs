import { chromium } from 'playwright';
import fs from 'fs';

const dir = '/tmp/noorstudio-e2e-full';
fs.mkdirSync(dir, { recursive: true });

let stepCounter = 0;

async function screenshot(page, name) {
  stepCounter++;
  const fname = `${dir}/${String(stepCounter).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: fname, fullPage: true });
  console.log(`[${stepCounter}] ${fname}`);
  return fname;
}

async function clickAndWait(page, selector, timeout = 5000) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ timeout });
    await el.click();
    await page.waitForTimeout(500);
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  try {
    console.log('=== NoorStudio E2E Full Test ===\n');
    
    // Home
    console.log('1. Open home page');
    await page.goto('http://localhost:3007', { waitUntil: 'networkidle' });
    await screenshot(page, 'home');
    
    // Get Started
    console.log('2. Click Get Started');
    await clickAndWait(page, 'button:has-text("Get Started")');
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'dashboard');
    
    // Navigate to new book
    console.log('3. Navigate to book builder');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'networkidle' });
    await screenshot(page, 'book-builder-step1');
    
    // Step 1: Universe is already selected, click Next
    console.log('4. Step 1 - Click Next (universe selection)');
    await clickAndWait(page, 'button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'book-builder-step2');
    
    // Step 2: Template/Age selection
    console.log('5. Step 2 - Select template or continue');
    // Look for selectable options
    const step2Text = await page.innerText('body');
    if (step2Text.includes('Template') || step2Text.includes('Age')) {
      console.log('  On template/age step');
      // Try to select first option or click Next
      await page.waitForTimeout(500);
      await clickAndWait(page, 'button:has-text("Next")');
      await page.waitForLoadState('networkidle');
    }
    await screenshot(page, 'book-builder-step2-done');
    
    // Step 3: Characters selection
    console.log('6. Step 3 - Characters selection');
    const step3Text = await page.innerText('body');
    if (step3Text.includes('Character')) {
      console.log('  On character step');
      // Skip character selection or use defaults
      await page.waitForTimeout(500);
    }
    await screenshot(page, 'book-builder-step3');
    
    // Click Next
    if (await clickAndWait(page, 'button:has-text("Next")')) {
      await page.waitForLoadState('networkidle');
    }
    await screenshot(page, 'book-builder-step3-done');
    
    // Step 4: Formatting
    console.log('7. Step 4 - Formatting/Layout');
    await page.waitForTimeout(500);
    await screenshot(page, 'book-builder-step4');
    
    if (await clickAndWait(page, 'button:has-text("Next")')) {
      await page.waitForLoadState('networkidle');
    }
    await screenshot(page, 'book-builder-step4-done');
    
    // Step 5: Review/Create
    console.log('8. Step 5 - Review and create');
    await page.waitForTimeout(500);
    await screenshot(page, 'book-builder-step5');
    
    // Fill in book title if needed
    const titleInput = page.locator('input[type="text"]').first();
    if (await titleInput.count() > 0) {
      try {
        await titleInput.fill('My Islamic Tale');
        console.log('  Book title filled');
      } catch (e) {}
    }
    
    await screenshot(page, 'book-builder-step5-filled');
    
    // Click Create/Start/Submit
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Submit"), button:has-text("Start")').first();
    if (await createBtn.count() > 0) {
      console.log('9. Click Create Book');
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    await screenshot(page, 'book-created');
    
    // Now we should be in the project workspace - generate chapters
    console.log('10. Generate Chapter 1');
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    const bodyText = await page.innerText('body');
    console.log(`Page has: ${bodyText.length} chars`);
    console.log(`Sample text: ${bodyText.substring(0, 200)}`);
    
    await screenshot(page, 'project-workspace');
    
    // Look for chapter generation button
    const genButtons = await page.locator('button').allTextContents();
    console.log(`Available buttons: ${genButtons.slice(0, 5).join(', ')}`);
    
    // Try to find and click "Generate" or "Create Chapter" button
    if (await clickAndWait(page, 'button:has-text("Generate"), button:has-text("Create Chapter"), button:has-text("Start")')) {
      console.log('11. Clicked generate button');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await screenshot(page, 'after-generate-click');
    
    console.log('\n✓ Test sequence complete');
    
  } catch (e) {
    console.error('Error:', e.message);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
})();
