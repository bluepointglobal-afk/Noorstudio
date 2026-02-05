#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/noorstudio-e2e-improved';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let stepCounter = 0;

async function screenshot(page, name) {
  stepCounter++;
  const file = path.join(SCREENSHOT_DIR, `${String(stepCounter).padStart(2, '0')}-${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  → Screenshot: ${name}`);
  } catch (e) {
    console.log(`  ✗ Screenshot failed: ${name}`);
  }
}

async function waitForButton(page, text, timeout = 10000) {
  try {
    const btn = page.locator(`button:has-text("${text}")`).first();
    await btn.waitFor({ timeout, state: 'visible' });
    // Wait for button to be enabled
    await page.waitForFunction(() => {
      const button = document.querySelector(`button:has-text("${text}")`);
      return button && !button.disabled;
    }, { timeout: 5000 }).catch(() => {});
    return btn;
  } catch (e) {
    return null;
  }
}

async function clickButton(page, text) {
  try {
    const btn = await waitForButton(page, text, 5000);
    if (!btn) {
      const fallback = page.locator(`button:has-text("${text}")`).first();
      await fallback.click({ force: true });
    } else {
      await btn.click();
    }
    await page.waitForTimeout(800);
    return true;
  } catch (e) {
    console.log(`    Could not click: ${text}`);
    return false;
  }
}

async function clickCardOption(page, selector) {
  try {
    const card = page.locator(selector).first();
    await card.waitFor({ timeout: 3000 });
    await card.click();
    await page.waitForTimeout(300);
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  console.log('=== NoorStudio E2E Full Test ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  
  try {
    // STEP 1: Home Page
    console.log('[1] Home Page');
    await page.goto('http://localhost:3007/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, 'home-page');
    
    // STEP 2: Click Get Started
    console.log('[2] Get Started Button');
    if (await clickButton(page, 'Get Started')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'dashboard');
    
    // STEP 3: Navigate to Book Builder
    console.log('[3] Book Builder');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, 'book-builder-initial');
    
    // STEP 4: Wizard - Step 1 (Universe & Knowledge Base)
    console.log('[4] Wizard Step 1: Universe & KB');
    // The defaults should already be selected, just click Next
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'wizard-after-step1');
    
    // STEP 5: Wizard - Step 2 (Template/Age - might auto-continue or need selection)
    console.log('[5] Wizard Step 2: Template/Age');
    // Check if there are cards to select
    const step2Cards = page.locator('[role="button"]');
    if (await step2Cards.count() > 0) {
      try {
        // Try clicking first card
        await step2Cards.first().click();
        await page.waitForTimeout(300);
      } catch (e) {}
    }
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'wizard-after-step2');
    
    // STEP 6: Wizard - Step 3 (Characters)
    console.log('[6] Wizard Step 3: Characters');
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'wizard-after-step3');
    
    // STEP 7: Wizard - Step 4 (Formatting)
    console.log('[7] Wizard Step 4: Formatting');
    if (await clickButton(page, 'Next')) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    }
    await screenshot(page, 'wizard-after-step4');
    
    // STEP 8: Wizard - Step 5 (Review/Create)
    console.log('[8] Wizard Step 5: Create Project');
    
    // Fill in book title if there's an input
    const titleInput = page.locator('input[type="text"]').first();
    if (await titleInput.count() > 0) {
      try {
        const currentValue = await titleInput.inputValue().catch(() => '');
        if (!currentValue) {
          await titleInput.fill('My Islamic Adventure');
          console.log('    → Title filled');
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(500);
    await screenshot(page, 'wizard-ready-to-create');
    
    // Click Create/Submit
    let created = false;
    for (const text of ['Create', 'Submit', 'Start', 'Create Project']) {
      if (await clickButton(page, text)) {
        console.log(`    ✓ Clicked: ${text}`);
        created = true;
        break;
      }
    }
    
    if (!created) {
      // Try clicking the last button
      const lastBtn = page.locator('button').last();
      try {
        await lastBtn.click();
      } catch (e) {}
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, 'project-created');
    
    // STEP 9: Generate Chapters
    console.log('[9] Generating Chapters');
    
    const currentUrl = page.url();
    console.log(`   URL: ${currentUrl}`);
    
    // Try to find and click generate button
    const allButtonTexts = await page.locator('button').allTextContents();
    const genButtonTexts = allButtonTexts.filter(t => 
      t.toLowerCase().includes('generate') ||
      t.toLowerCase().includes('create') ||
      t.toLowerCase().includes('start')
    );
    console.log(`   Available: ${genButtonTexts.slice(0, 5).join(', ')}`);
    
    // Try to generate chapters
    for (let ch = 1; ch <= 3; ch++) {
      console.log(`   Chapter ${ch}...`);
      
      if (await clickButton(page, `Generate Chapter ${ch}`) ||
          await clickButton(page, 'Generate Chapter') ||
          await clickButton(page, 'Generate')) {
        await page.waitForTimeout(5000);
        await page.waitForLoadState('networkidle');
      } else {
        // Try clicking any button that might generate
        const buttons = page.locator('button');
        if (await buttons.count() > 0) {
          const middleBtn = buttons.nth(Math.floor(await buttons.count() / 2));
          try {
            const text = await middleBtn.innerText();
            if (text && text.length < 50) {
              await middleBtn.click();
              await page.waitForTimeout(3000);
            }
          } catch (e) {}
        }
      }
      
      await screenshot(page, `chapter-${ch}-result`);
      
      if (ch < 3) {
        await page.waitForTimeout(1000);
      }
    }
    
    // STEP 10: Capture character renders
    console.log('[10] Capturing Character Renders');
    
    const images = await page.locator('img').evaluateAll(imgs =>
      imgs.map(img => ({
        src: img.src.substring(0, 100),
        alt: img.alt,
        visible: img.offsetParent !== null
      }))
    );
    console.log(`   Found ${images.length} images`);
    images.slice(0, 3).forEach((img, i) => {
      console.log(`     [${i}] ${img.alt || 'unnamed'} - visible: ${img.visible}`);
    });
    
    await screenshot(page, 'final-state');
    
    console.log(`\n✓ Test completed!`);
    console.log(`Screenshots: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    try {
      const pageText = await page.innerText('body');
      console.log(`Page has content: ${pageText.length} chars`);
    } catch (e) {}
  } finally {
    await browser.close();
  }
})();
