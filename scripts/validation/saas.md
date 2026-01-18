# SaaS Validation Adapter

## Persona
Derive SME persona from SCOPE.md

## Scenarios
Generate 1–3 end-to-end workflows:
- onboarding → value
- core action → deliverable
- export / share / decision

## Execution
- Deploy to staging
- Create realistic test account
- Run Playwright flows
- Capture outputs

## Evaluation
Score each dimension (0-100):
- **Mission fit:** Does the product solve the stated problem?
- **Deliverable quality:** Are outputs professional and accurate?
- **Outcome achieved:** Does user get the promised value?
- **UX:** Is the flow intuitive and efficient?
- **Market readiness:** Would an SME pay for this today?

## Output
- VALIDATION_REPORT.md
- SCORE.json
- GAP_REPORT.md (if needed)

## Threshold
80%

---

## Example Scenarios for SaaS

### Scenario 1: Onboarding → First Value
1. Sign up with business email
2. Complete onboarding wizard
3. Connect data source or upload sample
4. View first insight/report

**Pass criteria:** User sees meaningful value within 5 minutes

### Scenario 2: Core Workflow → Deliverable
1. Navigate to main feature
2. Configure parameters
3. Execute action
4. Download/export deliverable

**Pass criteria:** Deliverable is professional-quality and accurate

### Scenario 3: Decision Support → Action
1. Review generated analysis
2. Compare options
3. Make a decision
4. Document or share

**Pass criteria:** User has confidence to act on the output
