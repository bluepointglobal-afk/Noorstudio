# NoorStudio - Critical Fixes Required
## Date: 2026-02-03
## Source: Architect feedback during E2E testing

---

## Image Generation Issues

### 1. Hallucinated Text in Images ⚠️
**Problem:** AI generates random/nonsense text visible in illustration backgrounds (signs, books, posters)

**Fix:**
- Add to image prompt: "no text, no letters, no words visible in the scene"
- Post-generation check: reject images with visible text characters
- Update NanoBanana prompt template to explicitly exclude text

**Example:** Illustration of library scene has gibberish on book spines → reject and regenerate

---

### 2. Character Consistency ⚠️
**Problem:** Same character looks different across illustrations (face, clothing, proportions change)

**Current:** Character Studio creates visual DNA but consistency isn't enforced in generation
**Fix:**
- Store character reference image (first successful generation)
- Use as img2img seed for subsequent illustrations
- Add character description to EVERY image prompt (not just first)
- Increase consistency weight in generation parameters

**Example:** Amina (9-year-old with hijab) should have identical face/hijab style in all 12 illustrations

---

### 3. Text Overlay Misspellings ⚠️
**Problem:** When adding text TO images (cover, chapter titles), there are typos

**Fix:**
- Run spellcheck on ALL text before rendering
- Use system fonts (not AI-generated text)
- Double-check against original story text
- Preview before finalizing

---

## Book Metadata

### 4. Word Count Display ❌
**Problem:** No indication of book length (parents/kids want to know)

**Fix:**
- Calculate total word count from all chapters
- Display on project dashboard: "Total: 2,847 words (~10-15 min read)"
- Add to export metadata
- Show on cover preview: "A 3,000-word adventure"

**Reference popular kids books:**
- Early readers (ages 5-7): 1,000-2,000 words
- Chapter books (ages 7-9): 5,000-10,000 words
- Middle grade (ages 9-12): 20,000-50,000 words

---

## Reverse Engineering Popular Kids Books

### Study These for Best Practices:
1. **Ivy and Bean** series (Annie Barrows)
   - Length: ~10,000 words
   - Illustrations: Every 2-3 pages
   - Font: Large, readable (14-16pt)
   - Layout: Generous margins, chapter breaks

2. **Diary of a Wimpy Kid** (Jeff Kinney)
   - Length: ~20,000 words
   - Style: Illustrations integrated with text
   - Layout: Hand-drawn feel, speech bubbles
   - Appeal: Humor, relatable scenarios

3. **Junie B. Jones** series (Barbara Park)
   - Length: 5,000-8,000 words
   - Voice: First person, conversational
   - Chapters: Short (500-700 words each)
   - Illustrations: Full page every chapter

### Apply to NoorStudio:
- Default target: 5,000-8,000 words (sweet spot for ages 7-9)
- Chapter length: 500-800 words (keeps attention)
- Illustration ratio: 1 illustration per chapter minimum
- Font size: 14pt body text (readable for target age)
- Page layout: Margins at least 1 inch (feels professional)

---

## Implementation Priority

| Fix | Priority | Effort | Impact |
|-----|----------|--------|--------|
| Hallucinated text in images | P0 | Medium | High (looks unprofessional) |
| Character consistency | P0 | High | Critical (breaks immersion) |
| Word count display | P1 | Low | Medium (parent expectation) |
| Text overlay spellcheck | P1 | Low | High (typos = instant reject) |
| Layout/formatting study | P2 | Medium | High (professional finish) |

---

## Testing Checklist (Before E2E Demo)

- [ ] Generate 4-chapter book with same character
- [ ] Verify character face/clothing identical across all 4 illustrations
- [ ] Check for NO hallucinated text in backgrounds
- [ ] Confirm word count displays correctly
- [ ] Verify cover text has zero typos
- [ ] Export PDF and compare to Ivy and Bean layout quality
- [ ] Parent persona test: "Would I pay for this?"

---

## Sample Book Spec (Use for E2E)

**Title:** The Mystery at Al-Noor Masjid
**Protagonist:** Amina (9 years old, wears light blue hijab, curious eyes, brown skin)
**Target Length:** 6,000 words (12 chapters × 500 words)
**Illustrations:** 12 (one per chapter)
**Style:** Pixar 3D, warm lighting, no text in scenes
**Age Range:** 7-10 years
**Theme:** Mystery, problem-solving, Islamic values (honesty, helping community)

**Character Consistency Test:**
- Generate Chapter 1 illustration → save as reference
- Use SAME face/hijab/proportions for Chapters 2-12
- If Chapter 5 Amina looks different → fail test, fix system
