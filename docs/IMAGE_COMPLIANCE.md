# Image Generation Compliance System

## Overview

This document describes the compliance guard system implemented to prevent hallucinations and maintain strict consistency in book covers, back covers, and illustrations.

## Problem Statement

The previous image generation system had several issues:
1. **Cover hallucinations**: AI would generate incorrect text, titles, or author names
2. **Character inconsistency**: Characters would look different across illustrations
3. **Multi-character confusion**: When multiple characters appeared together, their features would blend
4. **Style drift**: Art style would vary between scenes
5. **Modesty violations**: Hijab and modesty requirements not consistently enforced

## Solution Architecture

### 1. Compliance Guard (`src/lib/ai/complianceGuard.ts`)

Central module that enforces strict rules for all image generation:

```typescript
// Key exports:
- buildCoverComplianceRules()    // Rules for cover generation
- buildIllustrationComplianceRules()  // Rules for illustrations
- enforceComplianceCoverPrompt()      // Validate and enhance cover prompts
- enforceComplianceIllustrationPrompt() // Validate and enhance illustration prompts
- buildCharacterIdentityBlock()       // Immutable character traits
- preflightCoverGeneration()          // Pre-generation validation
```

### 2. Character Identity Anchors

Each character now has immutable traits that are "locked" and enforced in every prompt:

| Trait | Description | Enforcement Level |
|-------|-------------|-------------------|
| Skin Tone | Exact color/tone | MANDATORY |
| Hair/Hijab | Style and coverage | MANDATORY |
| Clothing Style | Outfit rules | MANDATORY |
| Accessories | Distinguishing items | MANDATORY |
| Color Palette | Primary colors | RECOMMENDED |

### 3. Multi-Character Differentiation

When scenes contain multiple characters:
- Each character gets a numbered identifier
- Comparison tables are generated for clarity
- Explicit warnings against feature blending
- Relative sizing guidance based on age

## Cover Compliance Process

### Front Cover
1. **NO TEXT GENERATION**: Blank space left for post-processing
2. **Character matching**: Must match reference images exactly
3. **Style lock**: Only approved art style used
4. **Orientation**: Strict 2:3 portrait ratio
5. **Composition**: Space reserved at top (title) and bottom (author)

### Back Cover
1. **Synopsis space**: Large blank center area (40-50%)
2. **Style continuity**: Must match front cover exactly
3. **No barcodes**: Added in print preparation
4. **Softer mood**: Complementary to front cover

## Illustration Compliance Process

1. **Character identity block** prepended to every prompt
2. **Pose sheet references** included when available
3. **Modesty enforcement** with explicit rules
4. **Style technical details** for rendering consistency
5. **Quality checklist** for AI self-verification

## Negative Prompts

### Cover Negative Prompt
```
text, words, letters, numbers, title, author, signature, watermark, 
logo, barcode, ISBN, typography, font, writing, blurry, distorted, 
low quality, pixelated, artifacts, bad anatomy, deformed, ugly, 
mutated, disfigured, scary, violent, inappropriate, revealing clothing, 
tight clothing, horizontal, landscape orientation
```

### Illustration Negative Prompt
```
text, words, letters, numbers, watermark, signature, different face, 
changed appearance, wrong skin tone, inconsistent character, missing hijab, 
different hair color, wrong clothing, character variation, blurry, 
distorted, low quality, artifacts, bad anatomy, deformed, scary, 
violent, inappropriate, revealing clothing
```

## API Changes

### Server-side (`server/routes/ai.ts`)
- Task-specific negative prompts
- Higher guidance scale for covers (8.5 vs 7.5)
- More inference steps for cover quality (35 vs 30)

### Client-side Prompts
- Enhanced character descriptions with indexed identifiers
- Multi-character differentiation guides
- Technical style specifications
- Explicit modesty enforcement blocks

## Character Generation Changes

### Initial Character (`buildCharacterPrompt`)
- Identity document format with locked traits table
- Explicit no-text rule with repeated warnings
- Quality checklist for AI self-verification
- Style lock statement

### Pose Sheet (`buildPoseSheetPrompt`)
- Immutable traits table
- Per-pose consistency requirements
- Quality verification checklist
- No text/labels rule

## Validation Functions

### Pre-flight Checks
```typescript
preflightCoverGeneration(context, coverType)
// Returns: { ready: boolean, blockers: string[], warnings: string[] }
```

### Scene Validation
```typescript
validateSceneCharacters(characters, sceneDescription)
// Returns: { valid: boolean, issues: string[] }
```

## Usage Example

```typescript
import { 
  buildCoverComplianceRules,
  enforceComplianceCoverPrompt,
  preflightCoverGeneration 
} from '@/lib/ai/complianceGuard';

// 1. Pre-flight check
const preflight = preflightCoverGeneration(context, 'front');
if (!preflight.ready) {
  console.error('Blockers:', preflight.blockers);
  return;
}

// 2. Build compliance rules
const rules = buildCoverComplianceRules(context);

// 3. Enforce compliance on prompt
const result = enforceComplianceCoverPrompt(basePrompt, rules, 'front');

// 4. Use corrected prompt
if (result.valid) {
  generateImage({ prompt: result.correctedPrompt, ... });
}
```

## Best Practices

1. **Always lock characters** before using in illustrations
2. **Generate pose sheets** for main characters
3. **Review compliance warnings** before generation
4. **Use pre-flight checks** for covers
5. **Include all relevant characters** in scene character list

## Troubleshooting

### Character looks different
- Ensure pose sheet is generated and approved
- Check that character status is "locked"
- Verify reference images are being passed to API

### Text appearing on covers
- Check negative prompt is being sent
- Verify guidance scale is high enough
- Ensure "NO TEXT" rule is in prompt header

### Style inconsistency
- Lock the art style in character visualDNA
- Use same characters across all scenes
- Don't mix characters from different universes

## Files Modified

1. `src/lib/ai/complianceGuard.ts` - NEW: Central compliance module
2. `src/lib/ai/imagePrompts.ts` - ENHANCED: Full compliance integration
3. `src/lib/ai/providers/imageProvider.ts` - ENHANCED: Character consistency
4. `src/lib/storage/charactersStore.ts` - ENHANCED: Character/pose prompts
5. `server/routes/ai.ts` - ENHANCED: Task-specific negative prompts

## Version History

- v1.0 (2026-01-09): Initial compliance system implementation
