# Web App Validation Adapter

## Persona
Web user from SCOPE.md

## Scenarios
- landing → signup
- core value action
- output consumption

## Execution
- Browser flow
- Lighthouse check
- Accessibility sanity

## Evaluation
Score each dimension (0-100):
- **Clarity:** Is the value proposition immediately clear?
- **Speed:** Does the page load fast? (Lighthouse performance)
- **UX:** Is navigation intuitive?
- **Deliverable usefulness:** Does output meet user needs?
- **Competitive parity:** Is it at least as good as alternatives?

## Output
- VALIDATION_REPORT.md
- SCORE.json
- GAP_REPORT.md (if needed)

## Threshold
80%

---

## Example Scenarios for Web

### Scenario 1: Landing → Signup
1. Visit landing page
2. Understand value prop within 10 seconds
3. Click CTA
4. Complete signup

**Pass criteria:** Clear path from landing to authenticated state

### Scenario 2: Core Value Action
1. Navigate to main feature
2. Complete primary workflow
3. View result

**Pass criteria:** User achieves goal without external help

### Scenario 3: Output Consumption
1. Generate or view deliverable
2. Download/share/export
3. Use in external context

**Pass criteria:** Output is immediately useful outside the app

### Technical Checks
- [ ] Lighthouse Performance > 70
- [ ] Lighthouse Accessibility > 80
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Core Web Vitals pass
