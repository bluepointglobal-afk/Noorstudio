# Mobile App Validation Adapter

## Persona
Consumer or SME from SCOPE.md

## Scenarios
- install → first open
- first success action
- repeat usage test

## Execution
- Emulator / TestFlight / Expo preview
- Gesture-based flows
- Offline + latency test

## Evaluation
Score each dimension (0-100):
- **First-use clarity:** Can user understand the app in 30 seconds?
- **Speed & friction:** Are interactions fast and smooth?
- **Habit potential:** Would user return daily/weekly?
- **Trust:** Does the app feel secure and reliable?
- **Store-readiness:** Would this pass App Store/Play Store review?

## Output
- VALIDATION_REPORT.md
- SCORE.json
- GAP_REPORT.md (if needed)

## Threshold
75%

---

## Example Scenarios for Mobile

### Scenario 1: Install → First Open
1. Download/install app
2. Complete any permissions prompts
3. View onboarding (if any)
4. Reach main screen

**Pass criteria:** Under 60 seconds from install to value preview

### Scenario 2: First Success Action
1. Perform the core action (post, search, create, etc.)
2. See confirmation/result
3. Understand next steps

**Pass criteria:** User completes primary action without confusion

### Scenario 3: Repeat Usage (Retention)
1. Close app completely
2. Return 24 hours later (simulated)
3. Resume where left off
4. Complete another action

**Pass criteria:** State persists, user remembers how to use app

### Scenario 4: Offline/Edge Cases
1. Enable airplane mode
2. Attempt core actions
3. Restore connectivity
4. Verify sync/recovery

**Pass criteria:** Graceful degradation, no data loss
