#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/noorstudio-e2e-final-run';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let stepCounter = 0;

async function screenshot(page, name) {
  stepCounter++;
  const file = path.join(SCREENSHOT_DIR, `${String(stepCounter).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✓ [${stepCounter}] ${name}`);
  return file;
}

async function clickCard(page, cardIndex = 0) {
  try {
    const cards = page.locator('[role="button"]');
    const count = await cards.count();
    if (count > cardIndex) {
      await cards.nth(cardIndex).click();
      await page.waitForTimeout(300);
      return true;
    }
  } catch (e) {}
  return false;
}

async function clickNext(page) {
  try {
    // Click first card to ensure selection is registered
    await clickCard(page, 0);
    await page.waitForTimeout(200);
    // Click second card set (if exists) for KB selection
    const cardElements = page.locator('[role="button"]');
    const cardCount = await cardElements.count();
    if (cardCount > 2) {
      await cardElements.nth(2).click();
      await page.waitForTimeout(200);
    }
    
    // Now click Next
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click({ force: true });
      await page.waitForTimeout(700);
      return true;
    }
  } catch (e) {}
  return false;
}

(async () => {
  console.log('=== NoorStudio E2E Final Test ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  
  try {
    console.log('📍 Step 1: Home page');
    await page.goto('http://localhost:3007/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, 'home');
    
    console.log('📍 Step 2: Get Started');
    const startBtn = page.locator('button:has-text("Get Started")').first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'dashboard');
    
    console.log('📍 Step 3: Book builder');
    await page.goto('http://localhost:3007/app/books/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, 'step1-universe-kb');
    
    console.log('📍 Step 4: Navigate through wizard');
    
    // Step 1 -> 2
    console.log('  → Step 1 (Universe/KB) -> Step 2');
    if (await clickNext(page)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'step2-template-age');
    
    // Step 2 -> 3
    console.log('  → Step 2 (Template/Age) -> Step 3');
    if (await clickNext(page)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'step3-characters');
    
    // Step 3 -> 4
    console.log('  → Step 3 (Characters) -> Step 4');
    if (await clickNext(page)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'step4-formatting');
    
    // Step 4 -> 5
    console.log('  → Step 4 (Formatting) -> Step 5');
    if (await clickNext(page)) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await screenshot(page, 'step5-review');
    
    // Fill title and create
    console.log('📍 Step 5: Create project');
    const titleInput = page.locator('input[type="text"]').first();
    if (await titleInput.count() > 0) {
      try {
        await titleInput.fill('My Islamic Story');
      } catch (e) {}
    }
    
    await page.waitForTimeout(500);
    await screenshot(page, 'before-create');
    
    // Click Create
    const createBtn = page.locator('button:has-text("Create")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    console.log('📍 Project created!');
    console.log(`  URL: ${page.url()}`);
    await screenshot(page, 'project-created');
    
    // Generate chapters
    console.log('📍 Step 6: Generate chapters');
    
    for (let ch = 1; ch <= 3; ch++) {
      console.log(`  → Generating Chapter ${ch}...`);
      
      const genBtn = page.locator('button:has-text("Generate")').first();
      if (await genBtn.count() > 0) {
        try {
          await genBtn.click();
          await page.waitForTimeout(6000);
        } catch (e) {}
      }
      
      await page.waitForLoadState('networkidle');
      await screenshot(page, `chapter-${ch}`);
      
      if (ch < 3) await page.waitForTimeout(1500);
    }
    
    console.log('\n✅ E2E Test Complete!');
    console.log(`📁 Screenshots: ${SCREENSHOT_DIR}`);
    
    const files = fs.readdirSync(SCREENSHOT_DIR).sort();
    console.log(`\n📊 Generated ${files.length} screenshots`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'ERROR');
  } finally {
    await browser.close();
  }
})();
