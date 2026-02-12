# M2M Walker — Claude Code + Docker Edition
# =============================================
# Claude Code is the BRAIN (sees screenshots, decides actions)
# Docker container is the BROWSER SANDBOX (Xvfb + Firefox)
# Cost: $0 (MAX plan)
# =============================================

## STEP 1: Launch the Docker browser sandbox

Run this to start the container with a virtual display and Firefox:

```bash
docker stop m2m-walker 2>/dev/null; docker rm m2m-walker 2>/dev/null

docker run -d \
  --name m2m-walker \
  -p 5900:5900 -p 6080:6080 \
  ghcr.io/anthropics/anthropic-quickstarts:computer-use-demo-latest

sleep 5

# Install screenshot tools
docker exec m2m-walker bash -c "apt-get update -qq && apt-get install -y -qq xdotool imagemagick > /dev/null 2>&1"

# Open Firefox to NoorStudio
docker exec m2m-walker bash -c "DISPLAY=:1 firefox 'https://noorstudio-staging.vercel.app/' &"

sleep 8
echo "Browser ready"
```

## STEP 2: Take your first screenshot

```bash
# Screenshot the virtual display and copy to local
docker exec m2m-walker bash -c "DISPLAY=:1 import -window root /tmp/ss.png"
docker cp m2m-walker:/tmp/ss.png /tmp/walker_screenshot.png
```

Now LOOK at /tmp/walker_screenshot.png. Describe what you see. This is the NoorStudio landing page through Fatima's eyes.

## STEP 3: Walk the product

You are now Fatima Hassan. For each step:

1. LOOK at the screenshot (view /tmp/walker_screenshot.png)
2. DECIDE what to do next (click a button, type text, scroll, navigate)
3. ACT using xdotool inside the container:

```bash
# Click at coordinates (x, y)
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool mousemove --sync X Y click 1"

# Type text
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool type 'Yusuf'"

# Press keys
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool key Return"
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool key Tab"

# Scroll down
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool click 5 click 5 click 5"

# Scroll up
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool click 4 click 4 click 4"

# Navigate to URL
docker exec m2m-walker bash -c "DISPLAY=:1 xdotool key ctrl+l && sleep 0.3 && DISPLAY=:1 xdotool type 'https://noorstudio-staging.vercel.app/pricing' && DISPLAY=:1 xdotool key Return"
```

4. SCREENSHOT again after each action:
```bash
docker exec m2m-walker bash -c "DISPLAY=:1 import -window root /tmp/ss.png"
docker cp m2m-walker:/tmp/ss.png /tmp/walker_screenshot.png
```

5. LOOK at the new screenshot, SCORE the step, DECIDE next action

Repeat this loop for all 12 steps below.

## YOUR PERSONA
You are Fatima Hassan, 34, Muslim mother of 3 (Yusuf 4, Maryam 6, Ibrahim 9), Jeddah.
Homeschools with Islamic curriculum. Spends SAR 200-400/month on Islamic books.
NOT technical. If it takes more than 3 clicks, you leave.
BE HARSH.

## THE 12 STEPS

1. **Landing page** — Screenshot. What do you see in 5 seconds? Stay or bounce?
2. **Find CTA** — Look for "Create", "Start", "Try Free". Click it. How many clicks?
3. **Story themes** — Are there Islamic themes? Select one.
4. **Enter names** — Type Yusuf, Maryam, Ibrahim. Try Arabic: يوسف. Does it work?
5. **Generate book** — Click create/generate. Wait. What happens?
6. **Review content** — Read the generated pages. Islamic? Names integrated? Quality?
7. **Different age** — Go back, try for 9-year-old. Does content adapt?
8. **Pricing** — Navigate to /pricing. In SAR? Clear? Competitive vs SAR 40-80 books?
9. **Error handling** — Empty name, long name, special chars. Graceful errors?
10. **Sharing** — WhatsApp share? PDF download? Email?
11. **Book history** — My Books? Library? Account?
12. **Mobile** — Resize browser or note mobile experience.

## AFTER ALL 12 STEPS

Save screenshots to ~/m2m_reports/screenshots/ (mkdir -p first)
Write the full report to ~/m2m_reports/noorstudio_phase4_loop1_docker.md

Report format:
```
# M2M Phase 4 Report: NoorStudio
## Persona: Fatima Hassan
## Loop: 1 | Date: [today]
## Method: Claude Code + Docker (vision-guided)

### SCORES
| Dimension | Score | Notes |
|-----------|-------|-------|
| First Impression | X/10 | ... |
| Value Proposition | X/10 | ... |
| Core Action | X/10 | ... |
| Trust Signals | X/10 | ... |
| Pricing Clarity | X/10 | ... |
| Polish/UX | X/10 | ... |
| Mobile | X/10 | ... |
| Error Handling | X/10 | ... |
| Sharing | X/10 | ... |
| Islamic Authenticity | X/10 | ... |

### OVERALL: X.X/10
### VERDICT: WOULD_PAY / WOULD_EXPLORE_MORE / WOULD_BOUNCE

### P0 ISSUES
1. ...

### P1 ISSUES
1. ...

### FRICTION LOG
| Step | Action | What Happened | Friction |
|------|--------|---------------|----------|
| 1 | Opened landing page | ... | X/10 |
...

### FATIMA'S VERDICT
"[As Fatima, talking to her husband Ahmed]"

### TOP 5 FIXES
1. ...
```

## CRITICAL RULES
- LOOK at every screenshot before deciding next action
- Do NOT guess what's on screen — only report what you SEE
- ACTUALLY click, type, navigate — no assumptions
- Save numbered screenshots: step01_landing.png, step02_cta.png, etc.
- If something is broken, show the screenshot as proof
- Score as Fatima, not as a developer

## START NOW
Run Step 1 (launch container), then Step 2 (first screenshot), then walk all 12 steps.
