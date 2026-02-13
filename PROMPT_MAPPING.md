# Character Generation: User Input → DALL-E Prompt Mapping

## Summary

**12-Pose Generation**: ✅ **SINGLE API CALL** (generates all 12 poses in one 2048x1536 grid image)

**Initial Character Generation**: Currently using DALL-E (not ideal - see issues below)

---

## User Input Example

```
Name: Jassir
Role: Scholar
Age Range: 9-12
Skin Tone: Brown
Hair/Hijab: no
Outfit: Qatari outfit white, traditional islamic dress thawb
Accessories: smart watch
Art Style: watercolor
Traits: Wise, Curious, Patient
Color Palette: #E91E63, #FF9800, #FFF3E0
Modesty: Long sleeves, Loose clothing
```

---

## Prompt Generation Flow

### Step 1: Frontend - buildCriticalAttributesBlock()
**Location**: `src/lib/ai/improvedPrompts.ts`

Generates:
```
## CRITICAL CHARACTER ATTRIBUTES FOR "JASSIR" (MANDATORY COMPLIANCE)

🔴 HAIR/HIJAB: no
   [MANDATORY - TOP PRIORITY - DO NOT DEVIATE]
   VERIFICATION: Character MUST have exactly this hair/hijab description

🔴 ACCESSORIES: smart watch
   [MUST BE CLEARLY VISIBLE AND MATCH EXACTLY]
   VERIFICATION: All accessories must be present and identifiable

🔴 SKIN TONE: brown
   [EXACT MATCH REQUIRED - NO VARIATION]

🔴 OUTFIT: qatari outfit white, traditional islamic dress thawb
   [EXACT MATCH REQUIRED - ALL GARMENTS MUST BE PRESENT]

### MODESTY REQUIREMENTS (NON-NEGOTIABLE):
- LONG SLEEVES: Arms covered to wrists, no short sleeves
- LOOSE FIT: All garments loose-fitting, not form-revealing

---
**AI VERIFICATION CHECKLIST** - Confirm before generating:
- [ ] Hair/Hijab matches exactly: "no"
- [ ] Accessories all present: "smart watch"
- [ ] Skin tone is: "brown"
- [ ] Outfit components correct: "qatari outfit white, traditional islamic dress thawb"
---
```

### Step 2: Frontend - Add Style Context
```
## VISUAL STYLE
Soft, varying watercolor style children's book illustration with gentle color bleeding,
organic textures, classic children's book art

- Traditional wet-on-wet watercolor technique
- Visible paper texture beneath colors
- Soft color gradients with natural bleeding
- Delicate linework for details
- White of paper showing through in highlights
- Organic, hand-painted feel

Personality traits: wise, curious, patient - reflect this in facial expression and posture.

This is a REFERENCE IMAGE that will be used for all future illustrations.
The traits established here become LOCKED and IMMUTABLE.

OUTPUT SPECIFICATIONS:
- FRONT-FACING full-body character portrait
- Clean solid color or simple gradient background
- Character centered in frame, well-lit from front
- Warm, friendly, approachable expression
- Professional children's book character quality
- High detail on face and distinguishing features
Target Age: 9-12 years old
Art Style: watercolor

## POSE REQUIREMENT
Pose: front view, standing, friendly expression [⚠️ HIGH PRIORITY - MUST MATCH EXACTLY]
VERIFY: Before finalizing, confirm pose matches specification

## COLOR PALETTE
Primary Colors: #E91E63, #FF9800, #FFF3E0
Use these colors for outfit and accessories where applicable

## CHARACTER METADATA
Name: Jassir
Role: Scholar
Age Appearance: 9-12 years old

## TECHNICAL REQUIREMENTS
- Single character only, no other people
- Full body visible, head to toe
- Clean white or simple background
- High detail on face and accessories
- Professional children's book illustration quality
- NO text, watermarks, or labels
- Portrait orientation (3:4 aspect ratio)

## FINAL VERIFICATION (Before generating)
AI must confirm ALL critical attributes are present:
1. Hair/Hijab: "no" ← CHECK
2. Accessories: "smart watch" ← CHECK
3. Outfit: "qatari outfit white, traditional islamic dress thawb" ← CHECK
4. Skin Tone: "brown" ← CHECK
5. Age Appearance: 9-12 years old ← CHECK

If ANY attribute is unclear or cannot be rendered accurately, STOP and request clarification.
```

**Total Prompt Length**: ~3000 characters

---

### Step 3: Backend - DALL-E Wrapper (ai.ts)
**Location**: `server/routes/ai.ts` lines 642-660

Adds:
```
A single full-body character portrait for a children's book.

CRITICAL: Show ONLY ONE character in ONE pose - front-facing, standing, centered in frame.

[ENTIRE PROMPT FROM STEP 2 INSERTED HERE]

Style: Warm, inviting children's book illustration with Islamic aesthetic.
Character wears modest clothing (long sleeves, loose clothing).
Soft, gentle colors. 2D illustrated style like high-quality picture books.
Clean solid background. Professional character design.

IMPORTANT REQUIREMENTS:
- SINGLE character only (not multiple views or poses)
- ONE portrait (not a character sheet or grid)
- Front-facing full body view
- Centered in frame with clean background
- No text, no words, no letters, no numbers, no signatures, no watermarks.
```

**Final Prompt Length**: ~3500 characters

---

## The Problem with DALL-E for Initial Character

### Issue 1: Too Much Detail Overwhelms DALL-E
- The prompt has **3500+ characters** with detailed attributes
- DALL-E 3 often interprets complex prompts as "show me variations"
- Result: Generates 4 views of character instead of 1 clean portrait

### Issue 2: DALL-E Doesn't Follow Attribute Lists Well
- The "CRITICAL ATTRIBUTES" blocks are formatted for consistency models (like Replicate)
- DALL-E ignores structured markers like 🔴, [MANDATORY], checkboxes
- DALL-E prefers narrative descriptions over attribute lists

### Issue 3: Character Consistency
- DALL-E has no "reference image" input for consistency
- Each generation is independent
- Can't maintain the same character across multiple images

---

## Recommended Solution

### For Initial Character Generation:
**Option A: Simplify DALL-E Prompt** (Quick fix)
- Extract only essential attributes
- Use narrative description instead of checklist
- Remove verification blocks and emoji markers
- Reduce to ~500 characters

Example:
```
A full-body portrait of a 9-12 year old Middle Eastern boy named Jassir.
He has brown skin and wears a white Qatari thobe (traditional Islamic dress).
He wears a smart watch. Soft watercolor illustration style with gentle colors.
Front-facing view, standing, friendly expression. Clean white background.
Professional children's book character design. Single character only.
```

**Option B: Use FLUX/Stable Diffusion** (Better quality)
- These models handle detailed prompts better
- Support reference images for consistency
- More control over character attributes

### For 12-Pose Generation:
**Use Replicate `fofr/consistent-character`** (Designed for this)
- Takes the initial character image as reference
- Generates all 12 poses maintaining exact character appearance
- Single API call for efficiency
- **Requires**: $10+ in Replicate credits to avoid rate limiting

---

## Next Steps

1. **Add Replicate credits** ($10+) at https://replicate.com/account/billing
2. **Simplify DALL-E prompt** for initial character (see Option A above)
3. **Test flow**:
   - DALL-E → Simple prompt → Clean single character portrait
   - Approve character
   - Replicate → Use character as reference → 12 consistent poses

Would you like me to implement the simplified DALL-E prompt (Option A)?
