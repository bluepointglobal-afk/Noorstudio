#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const dir = '/tmp/noorstudio-e2e-simple';
fs.mkdirSync(dir, { recursive: true });

let counter = 0;

async function screenshot(page, name) {
  counter++;
  const file = path.join(dir, `${String(counter).padStart(2, '0')}-${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ [${counter}] ${name}`);
    return file;
  } catch (e) {
    console.log(`✗ [${counter}] ${name}: ${e.message}`);
  }
}

(async () => {
  console.log('=== NoorStudio E2E Test ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  
  try {
    // 1. Home
    console.log('Step 1: Loading home...');
    await page.goto('http://localhost:3007/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'home');
    
    // 2. Click Get Started
    console.log('Step 2: Get Started...');
    const startBtn = page.locator('button:has-text("Get Started")');
    if (await startBtn.count() > 0) {
      await startBtn.first().click();
      await page.waitForLoadState('networkidle');
    }
    await screenshot(page, 'dashboard');
    
    // 3. Go to book builder
    console.log('Step 3: Book builder...');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, 'book-new');
    
    // 4. Click through wizard
    console.log('Step 4: Wizard navigation...');
    for (let i = 0; i < 5; i++) {
      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
        await page.waitForTimeout(1500);
      } else {
        break;
      }
      await screenshot(page, `wizard-step-${i+1}`);
    }
    
    // 5. Create project
    console.log('Step 5: Create project...');
    
    // Try to fill title
    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0) {
      try {
        await inputs.first().fill('My Story');
      } catch (e) {}
    }
    
    // Click Create
    const createBtn = page.locator('button:has-text("Create")');
    if (await createBtn.count() > 0) {
      await createBtn.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    await screenshot(page, 'project');
    
    // 6. Generate
    console.log('Step 6: Generate chapters...');
    
    // Try generation
    const genBtn = page.locator('button:has-text("Generate")');
    if (await genBtn.count() > 0) {
      for (let ch = 1; ch <= 3; ch++) {
        console.log(`  Chapter ${ch}...`);
        await genBtn.first().click();
        await page.waitForTimeout(5000);
        await screenshot(page, `chapter-${ch}`);
      }
    } else {
      // Alternative: list all buttons and try them
      const allBtns = await page.locator('button').allTextContents();
      console.log(`  Found buttons: ${allBtns.slice(0, 5).join(', ')}`);
    }
    
    await screenshot(page, 'final');
    
    console.log(`\n✓ Complete! See: ${dir}`);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
