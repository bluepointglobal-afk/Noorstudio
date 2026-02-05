#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/noorstudio-e2e-robust';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let stepCounter = 0;

async function screenshot(page, name) {
  stepCounter++;
  const file = path.join(SCREENSHOT_DIR, `${String(stepCounter).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[${stepCounter}] ${name}`);
  return file;
}

async function clickButtonByText(page, text, maxWaitMs = 15000) {
  const selector = `button:has-text("${text}")`;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const btn = page.locator(selector).first();
    try {
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      
      if (isVisible && isEnabled) {
        await btn.click();
        await page.waitForTimeout(600);
        return true;
      }
      
      if (isVisible && !isEnabled) {
        console.log(`  [waiting] Button "${text}" found but disabled...`);
      }
    } catch (e) {
      // Element not found
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`  [timeout] Could not click "${text}"`);
  return false;
}

(async () => {
  console.log('=== NoorStudio E2E Test (Robust) ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  
  try {
    // 1. Home
    console.log('1. Home page');
    await page.goto('http://localhost:3007/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, 'home');
    
    // 2. Get Started
    console.log('2. Get Started');
    if (await clickButtonByText(page, 'Get Started', 8000)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'dashboard');
    
    // 3. Direct to new book (this might skip needing to navigate from dashboard)
    console.log('3. Book builder wizard');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, 'wizard-step1');
    
    // Check page state
    const step1Text = await page.innerText('body');
    console.log(`  Page loaded (${step1Text.length} chars)`);
    
    // 4. Step 1: Click Next (universe/KB already selected by default)
    console.log('4. Wizard Step 1 -> Step 2');
    if (await clickButtonByText(page, 'Next', 15000)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1200);
    } else {
      console.log('  [trying] Alternative next button selector');
      const nextButtons = page.locator('button');
      const count = await nextButtons.count();
      if (count > 0) {
        // Try the second to last button (last is usually close/cancel)
        const btn = nextButtons.nth(count - 2);
        try {
          await btn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log(`  [failed] Could not click alternative button`);
        }
      }
    }
    await screenshot(page, 'wizard-step2');
    
    // 5. Step 2: Template/Age
    console.log('5. Wizard Step 2 -> Step 3');
    // Click first card option if exists
    const cardOptions = page.locator('[role="button"]');
    const cardCount = await cardOptions.count();
    console.log(`  Found ${cardCount} card options`);
    if (cardCount > 0) {
      try {
        await cardOptions.first().click();
        await page.waitForTimeout(400);
      } catch (e) {}
    }
    
    if (await clickButtonByText(page, 'Next', 12000)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'wizard-step3');
    
    // 6. Step 3: Characters
    console.log('6. Wizard Step 3 -> Step 4');
    if (await clickButtonByText(page, 'Next', 12000)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'wizard-step4');
    
    // 7. Step 4: Formatting
    console.log('7. Wizard Step 4 -> Step 5');
    if (await clickButtonByText(page, 'Next', 12000)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'wizard-step5');
    
    // 8. Step 5: Create
    console.log('8. Creating project');
    
    // Fill title
    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0) {
      try {
        await inputs.first().fill('My Islamic Story');
        console.log('  Title filled');
      } catch (e) {
        console.log(`  Could not fill title: ${e.message}`);
      }
    }
    
    await page.waitForTimeout(500);
    await screenshot(page, 'before-create');
    
    // Click Create
    let created = false;
    for (const btnText of ['Create', 'Submit', 'Create Project', 'Finish']) {
      if (await clickButtonByText(page, btnText, 8000)) {
        console.log(`  Clicked: ${btnText}`);
        created = true;
        break;
      }
    }
    
    if (!created) {
      console.log('  Could not find Create button, trying last button');
      const lastBtn = page.locator('button').last();
      try {
        await lastBtn.click({ force: true });
      } catch (e) {}
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const projectUrl = page.url();
    console.log(`  Project URL: ${projectUrl}`);
    
    await screenshot(page, 'project-created');
    
    // 9. Generate chapters
    console.log('9. Generating chapters');
    
    const pageContent = await page.innerText('body');
    const hasGenerateButton = pageContent.toLowerCase().includes('generate');
    console.log(`  Page has 'generate': ${hasGenerateButton}`);
    
    // Try to find and click generate button 3 times for chapters 1-3
    for (let ch = 1; ch <= 3; ch++) {
      console.log(`  Chapter ${ch}...`);
      
      const genSelectors = [
        `button:has-text("Generate Chapter ${ch}")`,
        'button:has-text("Generate Chapter")',
        'button:has-text("Generate")',
      ];
      
      let generatedCh = false;
      for (const sel of genSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.count() > 0) {
          try {
            await btn.click();
            await page.waitForTimeout(6000);
            generatedCh = true;
            break;
          } catch (e) {}
        }
      }
      
      if (!generatedCh && ch === 1) {
        // Try any button that might trigger generation
        const allBtns = await page.locator('button').allTextContents();
        const relevant = allBtns.filter(t => t.length < 50);
        console.log(`    Available buttons: ${relevant.slice(0, 5).join(', ')}`);
      }
      
      await page.waitForLoadState('networkidle');
      await screenshot(page, `chapter-${ch}-result`);
      
      if (ch < 3) await page.waitForTimeout(1500);
    }
    
    console.log('\n✓ E2E Test Complete!');
    console.log(`📁 Screenshots: ${SCREENSHOT_DIR}`);
    
    // List all screenshots
    const files = fs.readdirSync(SCREENSHOT_DIR).sort();
    console.log(`\nGenerated ${files.length} screenshots:`);
    files.forEach(f => {
      const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
      const mb = (stat.size / 1024 / 1024).toFixed(2);
      console.log(`  ${f} (${mb}MB)`);
    });
    
  } catch (error) {
    console.error('\n✗ Fatal Error:', error.message);
    await screenshot(page, 'ERROR');
  } finally {
    await browser.close();
  }
})();
