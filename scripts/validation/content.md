# Content Validation Adapter

## Persona
Creator or Consumer from SCOPE.md

## Scenarios
- content discovery
- content consumption
- content action (share/save/apply)

## Execution
- Manual review
- Readability scoring
- Engagement proxy checks

## Evaluation
Score each dimension (0-100):
- **Relevance:** Does content match user intent?
- **Quality:** Is content accurate, well-written, valuable?
- **Accessibility:** Is content easy to consume?
- **Actionability:** Can user do something with this?
- **Differentiation:** Is this better than free alternatives?

## Output
- VALIDATION_REPORT.md
- SCORE.json
- GAP_REPORT.md (if needed)

## Threshold
75%

---

## Example Scenarios for Content

### Scenario 1: Discovery → First Read
1. Search or browse for topic
2. Find relevant content
3. Begin consuming

**Pass criteria:** User finds what they need within 3 clicks

### Scenario 2: Full Consumption
1. Read/watch/listen to full piece
2. Understand key takeaways
3. Feel satisfied

**Pass criteria:** Content delivers on headline promise

### Scenario 3: Action After Consumption
1. Save/bookmark for later
2. Share with someone
3. Apply learning or make decision

**Pass criteria:** Content drives real-world action

### Quality Checks
- [ ] No factual errors
- [ ] Clear structure (headings, flow)
- [ ] Appropriate length for topic
- [ ] Readable (Flesch score appropriate for audience)
- [ ] Mobile-friendly formatting
