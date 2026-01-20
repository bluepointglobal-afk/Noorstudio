# Tasks: Image Generation + Consistent Character

> Generated: 2026-01-20
> Feature: #1 from BACKLOG.md
> Branch: `ralph/consistent-character-generation`

---

## Overview

Fix the image generation pipeline so that:
1. Character visual DNA actually influences generated images
2. 12-pose reference sheets work correctly
3. Characters remain consistent across all illustrations
4. Book covers include text, author, and follow best practices
5. AI suggests illustration scenes from chapter content

---

## Relevant Files

### Image Generation Core
- `server/routes/ai.ts` - Image generation endpoint
- `src/lib/ai/providers/imageProvider.ts` - NanoBanana provider
- `src/lib/ai/imagePrompts.ts` - Prompt builder (NEEDS FIX)
- `src/lib/ai/config.ts` - Provider selection

### Character System
- `src/lib/storage/charactersStore.ts` - Character data with poses
- `src/lib/models/index.ts` - Character type definitions
- `src/pages/app/CharacterDetailPage.tsx` - Character UI

### Illustration Pipeline
- `src/lib/ai/stageRunner.ts` - Pipeline orchestration
- `src/lib/ai/illustrationStage.ts` - Illustration generation
- `src/pages/app/ProjectWorkspacePage.tsx` - Workspace UI

### Cover Generation
- `src/lib/ai/coverPrompts.ts` - Cover prompt builder (if exists)
- `src/lib/types/artifacts.ts` - CoverArtifact type

---

## Tasks

### 0. Setup
- [ ] 0.1 Create branch: `git checkout -b ralph/consistent-character-generation`
- [ ] 0.2 Verify clean state: `git status`
- [ ] 0.3 Run typecheck baseline: `npx tsc --noEmit`

---

### 1. Fix Prompt → Image Mismatch

**Goal:** Character visual DNA (colors, clothing, features) must influence the generated image.

- [ ] 1.1 Audit current `buildCharacterPrompt()` in `src/lib/ai/imagePrompts.ts`
  - Document what visual DNA fields exist
  - Identify which fields are NOT being passed to prompt

- [ ] 1.2 Research NanoBanana pixar-3d-v1 prompt format
  - Check API docs for optimal prompt structure
  - Identify supported style/composition keywords

- [ ] 1.3 Restructure `buildCharacterPrompt()` to include ALL visual DNA:
  ```
  - Age range and gender
  - Skin tone description
  - Hair: color, style, length
  - Eyes: color, shape
  - Clothing: type, colors, modesty (hijab, long sleeves)
  - Accessories
  - Expression/mood
  - Art style (Pixar 3D)
  ```

- [ ] 1.4 Add negative prompt handling:
  - Exclude inappropriate content
  - Exclude style inconsistencies
  - Exclude non-Islamic dress elements when modesty rules apply

- [ ] 1.5 Test prompt with single character generation
  - Generate same character 3x
  - Verify visual DNA is reflected
  - Document results in `scripts/ralph/progress.txt`

- [ ] 1.6 Typecheck passes: `npx tsc --noEmit`

---

### 2. Fix 12-Pose Reference Sheet

**Goal:** Generate 12 poses for a character with consistent appearance.

- [ ] 2.1 Audit current pose generation logic
  - Identify why single API call fails
  - Check if sequential calls work

- [ ] 2.2 Implement sequential pose generation:
  - Generate poses one at a time
  - Use consistent seed across all poses
  - Add progress callback for UI updates

- [ ] 2.3 Create pose-specific prompt templates for all 12 poses:
  ```
  1. front_neutral - Standing facing camera
  2. front_smiling - Standing with smile
  3. side_left - Profile view left
  4. side_right - Profile view right
  5. three_quarter - 3/4 angle view
  6. walking - Mid-stride pose
  7. sitting - Seated position
  8. reading - Holding/reading a book
  9. praying - Prayer position (hands raised or prostration)
  10. pointing - Gesturing/pointing
  11. thinking - Hand on chin, contemplative
  12. surprised - Eyes wide, expressive
  ```

- [ ] 2.4 Update `charactersStore.ts` pose data structure:
  ```ts
  poseImages: {
    [poseType: string]: {
      url: string;
      seed: number;
      prompt: string;
      generatedAt: string;
    }
  }
  ```

- [ ] 2.5 Update `CharacterDetailPage.tsx`:
  - Show generation progress (0/12 → 12/12)
  - Display pose grid (4x3 layout)
  - Allow individual pose regeneration

- [ ] 2.6 Add "Regenerate All Poses" with same seed option

- [ ] 2.7 Test full 12-pose generation
  - Verify all poses generate
  - Verify visual consistency across poses
  - Document seed used in `progress.txt`

- [ ] 2.8 Typecheck passes

---

### 3. Character Consistency in Illustrations

**Goal:** Same character looks the same across all book illustrations.

- [ ] 3.1 Design consistency strategy:
  - Option A: Reference image (pass pose image URL to API)
  - Option B: Detailed text description from visual DNA
  - Option C: Seed consistency per character
  - Document chosen approach in `progress.txt`

- [ ] 3.2 Implement character reference in illustration prompts:
  - Extract character IDs from scene
  - Load character visual DNA for each
  - Build composite prompt with all characters (max 2-3)

- [ ] 3.3 Create `buildScenePrompt()` function:
  ```ts
  buildScenePrompt({
    sceneDescription: string,
    characters: Character[],  // max 2-3
    setting: string,
    mood: string,
    style: 'pixar-3d'
  }): string
  ```

- [ ] 3.4 Add character positioning hints:
  - "Character A on the left"
  - "Character B in the center"
  - Relative sizes based on age

- [ ] 3.5 Implement illustration generation with consistency:
  - Pass character seeds if API supports
  - Include full visual DNA in prompt
  - Reference pose sheet style

- [ ] 3.6 Test multi-character scene:
  - Generate scene with 2 characters
  - Verify both match their reference sheets
  - Generate 3 scenes, verify consistency

- [ ] 3.7 Typecheck passes

---

### 4. Book Covers with Text

**Goal:** Generate professional front/back covers with text rendering.

- [ ] 4.1 Research children's book cover best practices:
  - Title placement (top 1/3)
  - Author name placement
  - Illustration composition
  - Age-appropriate design elements

- [ ] 4.2 Create `buildFrontCoverPrompt()`:
  ```
  - Main character(s) in engaging pose
  - Scene hint from book theme
  - Space for title at top
  - Space for author at bottom
  - Bright, appealing colors
  - Islamic aesthetic elements (geometric patterns, etc.)
  ```

- [ ] 4.3 Create `buildBackCoverPrompt()`:
  ```
  - Simpler design than front
  - Space for synopsis (top 60%)
  - Space for barcode (bottom right)
  - Optional: small author photo area
  - Optional: series branding
  ```

- [ ] 4.4 Implement text overlay system:
  - Use canvas or image library for text
  - Title: Large, readable font
  - Author: Smaller, elegant font
  - Synopsis: Body text on back

- [ ] 4.5 Create cover text styles:
  ```ts
  CoverTextStyle = {
    title: { font, size, color, shadow, position },
    author: { font, size, color, position },
    synopsis: { font, size, color, maxWidth, position }
  }
  ```

- [ ] 4.6 Update cover stage in `stageRunner.ts`:
  - Generate base cover image
  - Apply text overlay
  - Store final composite

- [ ] 4.7 Update cover UI in workspace:
  - Show cover preview with text
  - Allow text style customization
  - Allow text content editing

- [ ] 4.8 Test cover generation:
  - Generate front cover with title + author
  - Generate back cover with synopsis
  - Verify text is readable and positioned correctly

- [ ] 4.9 Typecheck passes

---

### 5. AI-Suggested Illustration Scenes

**Goal:** AI analyzes chapter content and suggests 2-3 illustration opportunities.

- [ ] 5.1 Create `analyzeChapterForIllustrations()` function:
  ```ts
  analyzeChapterForIllustrations(
    chapterText: string,
    characters: Character[]
  ): IllustrationSuggestion[]
  ```

- [ ] 5.2 Define `IllustrationSuggestion` type:
  ```ts
  {
    sceneDescription: string;
    charactersInScene: string[];  // character IDs
    emotionalTone: string;
    suggestedComposition: string;
    pagePosition: 'early' | 'middle' | 'late';
    confidence: number;
  }
  ```

- [ ] 5.3 Implement Claude-based scene analysis:
  - Send chapter text to Claude
  - Request 2-3 illustration moments
  - Parse structured response

- [ ] 5.4 Create illustration suggestion prompt:
  ```
  Analyze this children's book chapter and suggest 2-3 moments
  that would make good illustrations. For each, provide:
  - Scene description (what's happening)
  - Which characters are present
  - Emotional tone
  - Composition suggestion
  ```

- [ ] 5.5 Update illustration stage workflow:
  - Auto-suggest scenes after chapter generation
  - Show suggestions in UI
  - Allow user to accept/modify/add scenes

- [ ] 5.6 Update workspace UI for suggestions:
  - Display AI suggestions as cards
  - "Accept" button to queue for generation
  - "Edit" button to modify description
  - "Add Custom" for manual scenes

- [ ] 5.7 Test suggestion flow:
  - Generate a chapter
  - Verify 2-3 suggestions appear
  - Accept suggestions and generate illustrations
  - Verify illustrations match suggestions

- [ ] 5.8 Typecheck passes

---

### 6. Integration & Testing

- [ ] 6.1 End-to-end test: Character → Poses → Chapter → Suggestions → Illustrations → Cover
  - Create new character
  - Generate 12-pose sheet
  - Create book with character
  - Generate chapter
  - Review AI suggestions
  - Generate illustrations
  - Generate cover
  - Verify consistency throughout

- [ ] 6.2 Run test suite: `npm test`

- [ ] 6.3 Run linter: `npm run lint`

- [ ] 6.4 Fix any errors

- [ ] 6.5 Update STATUS.md to reflect progress

- [ ] 6.6 Typecheck passes: `npx tsc --noEmit`

---

### 7. Commit & Document

- [ ] 7.1 Stage changes: `git add .`
- [ ] 7.2 Commit with message describing all changes
- [ ] 7.3 Push branch: `git push -u origin ralph/consistent-character-generation`
- [ ] 7.4 Update `scripts/ralph/progress.txt` with learnings

---

## Task Summary

| Section | Sub-tasks | Focus |
|---------|-----------|-------|
| 0. Setup | 3 | Branch creation |
| 1. Prompt Fix | 6 | Visual DNA → Image |
| 2. 12-Pose Sheet | 8 | Sequential generation |
| 3. Consistency | 7 | Multi-scene matching |
| 4. Covers | 9 | Text + best practices |
| 5. AI Suggestions | 8 | Chapter analysis |
| 6. Integration | 6 | End-to-end testing |
| 7. Commit | 4 | Documentation |

**Total: 51 sub-tasks**

---

## Verification Commands

```bash
# Typecheck
npx tsc --noEmit

# Tests
npm test

# Lint
npm run lint

# Dev server
npm run dev
```
