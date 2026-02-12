# M2M Walker — Claude Code Edition
# ===================================
# Paste this ENTIRE file into Claude Code (Ghostty)
# Prerequisites: Playwright installed (already confirmed on this Mac)
# Cost: $0 (MAX plan)
# ===================================

Read these files first for context, they are in ~/.openclaw/workspace/m2m/:
- projects.json (project URLs)
- personas.json (personas per phase)

Then execute the following task:

## TASK: Run Phase 4 SME Walker on NoorStudio

### TARGET
- URL: https://noorstudio-staging.vercel.app/
- Pages to check: /, /examples, /create, /pricing

### YOUR PERSONA (Fatima Hassan)
You are Fatima Hassan, a 34-year-old Muslim mother of 3 children (ages 4, 6, 9) living in Jeddah.
You homeschool with Islamic curriculum. You spend SAR 200-400/month on Islamic children's books but most are poor quality.
You dream of personalized Islamic stories with your kids' names and beautiful illustrations.
You are NOT technical. If something takes more than 3 clicks, you leave.
BE HARSH. Score based on whether a busy mom would use this, pay for it, and recommend it.

### ESCALATION LEVEL (Loop 1)
You're a curious first-time visitor. Willing to explore. Forgive minor issues. Score generously where intent is clear.

### METHOD
Use Playwright (already installed at /opt/homebrew/lib) to automate a REAL browser walkthrough.

Write a Playwright test script that:
1. Launches Chromium (NOT headless — headed mode so screenshots are real)
2. Sets viewport to 1024x768 (mobile: 375x812 for mobile test)
3. Sets locale to ar-SA and timezone to Asia/Riyadh
4. For EACH step below:
   - Navigate/interact as described
   - Take a screenshot (save to ~/m2m_reports/screenshots/)
   - Record timing (page load, interaction response)
   - Log what happened vs what was expected

### 12 STEPS TO EXECUTE

**Step 1: Landing Page First Impression**
- Navigate to https://noorstudio-staging.vercel.app/
- Wait for full load, record load time
- Screenshot immediately
- Record: What do you see? Is the value prop clear? Would Fatima stay?

**Step 2: Find and Click "Create a Book" CTA**
- Look for primary CTA button (Start, Create, Try Free, etc.)
- Click it
- Screenshot the result
- Record: How many clicks to start? Is the CTA obvious?

**Step 3: Select a Story Theme**
- On the creation page, look for theme/topic selection
- Try to select an Islamic theme (Prophets, Prayer, Kindness, Honesty)
- Screenshot
- Record: Are themes Islamic? Age-appropriate? Visually appealing?

**Step 4: Enter Children's Names**
- Find name input fields
- Type: Yusuf (for age 4), Maryam (for age 6), Ibrahim (for age 9)
- Also try Arabic: يوسف
- Screenshot after each entry
- Record: Does it accept names? Multiple children? Arabic text?

**Step 5: Generate/Preview the Storybook**
- Click generate/preview/create button
- Wait up to 30 seconds for generation
- Screenshot the result
- Record: Did it generate? How long? What quality?

**Step 6: Review Generated Content**
- Read through generated pages
- Screenshot sample pages
- Record: Is Islamic content authentic? Are names integrated? Would you read this to kids?

**Step 7: Test Different Age**
- Go back, try creating for a 9-year-old specifically
- Record: Does content adapt for age? Different complexity?

**Step 8: Find Pricing**
- Navigate to /pricing or find pricing info
- Screenshot
- Record: Is price clear? In SAR? What do you get? Is it competitive vs SAR 40-80 for physical books?

**Step 9: Test Error Handling**
- Try empty name submission
- Try very long name (50+ chars)
- Try special characters (!@#$%)
- Screenshot each error state
- Record: Does it handle errors gracefully?

**Step 10: Check Sharing/Delivery**
- Look for share buttons (WhatsApp, email)
- Look for download options (PDF, print)
- Screenshot
- Record: Can Fatima share with husband? Download for offline?

**Step 11: Check Book History/Library**
- Look for "My Books", library, history, account
- Screenshot
- Record: Can Fatima find books she already created?

**Step 12: Mobile Test**
- Resize viewport to 375x812 (iPhone)
- Navigate to landing page
- Try the create flow on mobile
- Screenshot
- Record: Does it work on mobile? (80%+ Saudi users browse on phone)

### OUTPUT
After running ALL 12 steps, compile a report and save to:
~/m2m_reports/noorstudio_phase4_loop1_claude_code.md

Use this EXACT format:

```
# M2M Phase 4 Report: NoorStudio
## Persona: Fatima Hassan (Jeddah, mother of 3)
## Loop: 1
## Date: [today]
## URL: https://noorstudio-staging.vercel.app/
## Method: Claude Code + Playwright (headed)

### SCORES
| Dimension | Score (1-10) | Notes |
|-----------|-------------|-------|
| First Impression | X/10 | ... |
| Value Proposition | X/10 | ... |
| Core Action (Create Book) | X/10 | ... |
| Trust Signals | X/10 | ... |
| Pricing Clarity | X/10 | ... |
| Polish / UX | X/10 | ... |
| Mobile Experience | X/10 | ... |
| Error Handling | X/10 | ... |
| Sharing/Delivery | X/10 | ... |
| Islamic Authenticity | X/10 | ... |

### OVERALL: X.X/10
### VERDICT: WOULD_PAY / WOULD_EXPLORE_MORE / WOULD_BOUNCE

### P0 ISSUES (must fix before any marketing)
1. [exact description + screenshot reference]

### P1 ISSUES (fix this sprint)
1. ...

### P2 ISSUES (nice to have)
1. ...

### FRICTION LOG
| Step | Action | Result | Expected | Friction | Screenshot |
|------|--------|--------|----------|----------|------------|
| 1 | Navigate to landing | ... | ... | X/10 | landing.png |
| 2 | Click CTA | ... | ... | X/10 | cta.png |
... (all 12 steps)

### COMPETITIVE POSITION
Compare to: Goodword Books (SAR 40-80/book), Kube Publishing, Wonderbly (no Islamic content)

### FATIMA'S VERDICT
"[Write as Fatima talking to her husband Ahmed over dinner about this site]"

### TOP 5 ACTIONS FOR NEXT SPRINT
1. [action] — Impact: HIGH/MED/LOW — Effort: X days
2. ...
3. ...
4. ...
5. ...
```

### CRITICAL RULES
- Take screenshots at EVERY step — they are your evidence
- ACTUALLY INTERACT (click buttons, fill forms, try to create/buy)
- If something is broken, document the exact error
- Score harshly — Fatima has 3 kids screaming, she won't forgive what you'd forgive
- Do NOT make up features you didn't see
- Do NOT assume things work if you didn't test them
- Record EXACT page load times
- Test with ARABIC text input (يوسف، مريم، إبراهيم)

Start now. Write the Playwright script and run it.
