# Tasks: NanoBanana Image Generation Integration

## Relevant Files

- `server/index.ts` - Add image generation route
- `server/routes/ai.ts` - Existing AI routes (reference)
- `src/lib/ai/providers/imageProvider.ts` - Replace stub with real provider
- `src/lib/ai/imagePrompts.ts` - Prompt builder (exists)
- `src/lib/ai/config.ts` - Provider selection config
- `src/lib/storage/creditsStore.ts` - Credit deduction logic
- `src/lib/storage/charactersStore.ts` - Character data with poses
- `src/pages/app/CharacterDetailPage.tsx` - Reference sheet UI
- `src/pages/app/ProjectWorkspacePage.tsx` - Illustration/cover stages
- `src/components/ui/` - Reusable UI components

## Instructions

**IMPORTANT:** Check off each task as you complete it:
`- [ ]` → `- [x]`

Update after each sub-task, not just parent tasks.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create branch: `git checkout -b feature/nanobanana-image-generation`
  - [ ] 0.2 Verify clean working directory: `git status`

---

- [ ] 1.0 Server Proxy Setup
  - [ ] 1.1 Add `NANOBANANA_API_KEY` to `server/env.ts` validation schema
  - [ ] 1.2 Add `NANOBANANA_API_KEY` to `.env.example` with placeholder
  - [ ] 1.3 Create image route handler in `server/routes/ai.ts`:
    - Endpoint: `POST /api/ai/image`
    - Accept: `{ prompt, negative_prompt, width, height, num_images, seed, model }`
    - Validate request body with Zod schema
  - [ ] 1.4 Add JWT auth middleware to image route (copy pattern from text route)
  - [ ] 1.5 Add rate limiting: 15 requests per 10 minutes per IP
  - [ ] 1.6 Implement NanoBanana API call:
    - URL: `https://api.nanobanana.com/v1/generate` (verify actual endpoint)
    - Headers: `Authorization: Bearer ${NANOBANANA_API_KEY}`
    - Body: forward validated request params
  - [ ] 1.7 Log request/response to `ai_usage` table via Supabase
  - [ ] 1.8 Return image URLs/base64 array to client
  - [ ] 1.9 Add error handling: catch API errors, return structured error response
  - [ ] 1.10 Test with curl: `curl -X POST http://localhost:3001/api/ai/image -H "Authorization: Bearer <token>" -d '{"prompt":"test"}'`
  - [ ] 1.11 Typecheck passes: `npm run typecheck`

---

- [ ] 2.0 NanoBanana Provider + Error Handling
  - [ ] 2.1 Define `ImageGenerationRequest` type in `src/lib/ai/providers/imageProvider.ts`:
    ```ts
    { prompt, negativePrompt?, width, height, count, seed?, model? }
    ```
  - [ ] 2.2 Define `ImageGenerationResponse` type:
    ```ts
    { images: Array<{ url: string } | { base64: string }>, seed: number }
    ```
  - [ ] 2.3 Implement `nanobananaProvider.generate()`:
    - Call `POST /api/ai/image` via fetch
    - Include JWT from Supabase session
    - Parse response into `ImageGenerationResponse`
  - [ ] 2.4 Implement retry logic with exponential backoff:
    - Max 3 attempts
    - Delays: 2s, 4s, 8s
    - Retry on 5xx errors and network failures
    - Don't retry on 4xx (client errors)
  - [ ] 2.5 Implement fallback to mock provider:
    - After retries exhausted, return mock images
    - Add `placeholder: true` flag to response
    - Mock images should have "[Placeholder]" watermark text
  - [ ] 2.6 Add provider selection in `src/lib/ai/config.ts`:
    ```ts
    export const imageProvider =
      import.meta.env.VITE_AI_IMAGE_PROVIDER === 'nanobanana'
        ? nanobananaProvider
        : mockImageProvider;
    ```
  - [ ] 2.7 Update `.env.example` with `VITE_AI_IMAGE_PROVIDER=mock`
  - [ ] 2.8 Add cancel token support (AbortController) for in-progress requests
  - [ ] 2.9 Typecheck passes
  - [ ] 2.10 Verify in browser: set provider to nanobanana, trigger generation, check network tab

---

- [ ] 3.0 Character Reference Sheet Generation
  - [ ] 3.1 Update `src/lib/ai/imagePrompts.ts` - enhance `buildCharacterPosePrompt()`:
    - Include full character visual DNA
    - Include modesty rules (hijab, long sleeves, loose clothing)
    - Include style guide (Pixar 3D, Watercolor, etc.)
    - Include specific pose description
  - [ ] 3.2 Create pose prompt templates for all 12 poses:
    - Front, Side, 3/4 View, Walking, Running, Sitting
    - Reading, Praying, Smiling, Surprised, Pointing, Thinking
  - [ ] 3.3 Update `src/lib/storage/charactersStore.ts`:
    - Add `poseImages: Record<PoseType, { url: string, selected: boolean, alternatives: string[] }>`
    - Add `referenceSheetGenerated: boolean` flag
  - [ ] 3.4 Create `generateCharacterReferenceSheet()` function:
    - Generate 3 alternatives per pose (36 total images)
    - Use consistent seed for character
    - Return structured pose data
  - [ ] 3.5 Update `src/pages/app/CharacterDetailPage.tsx`:
    - Add "Generate Reference Sheet" button
    - Show generation progress (0/12 poses)
    - Display pose grid (4x3 layout)
  - [ ] 3.6 Add pose alternative selection UI:
    - Click pose to see 3 alternatives
    - Select one as primary
    - Save selection to character store
  - [ ] 3.7 Add "Regenerate Pose" button for individual poses
  - [ ] 3.8 Typecheck passes
  - [ ] 3.9 Verify in browser: create character, generate sheet, select poses, verify persistence

---

- [ ] 4.0 Book Illustrations + Covers
  - [ ] 4.1 Update `src/lib/ai/imagePrompts.ts` - create `buildIllustrationPrompt()`:
    - Include scene description from chapter
    - Include character reference text (visual DNA of all characters in scene)
    - Include style consistency notes
    - Include dimension-specific composition hints
  - [ ] 4.2 Update `src/lib/ai/imagePrompts.ts` - create `buildCoverPrompt()`:
    - Front: title, main character, scene mood, style
    - Back: simpler design, space for synopsis, author photo area
  - [ ] 4.3 Update illustration stage in `src/lib/ai/stageRunner.ts`:
    - Replace mock call with real provider call
    - Pass character reference data
    - Generate 3 variants per illustration
  - [ ] 4.4 Update `src/pages/app/ProjectWorkspacePage.tsx` illustration UI:
    - Show illustration variants (3 options)
    - Allow selection of preferred variant
    - Show selected illustration in chapter view
  - [ ] 4.5 Implement cover stage in `src/lib/ai/stageRunner.ts`:
    - Generate front cover (portrait 1024x1536)
    - Generate back cover (portrait 1024x1536)
    - Store in project artifacts
  - [ ] 4.6 Update `src/pages/app/ProjectWorkspacePage.tsx` cover UI:
    - Show front/back cover previews
    - Allow individual regeneration
    - Display in export preview
  - [ ] 4.7 Typecheck passes
  - [ ] 4.8 Verify in browser: run illustration stage, see real images, select variants
  - [ ] 4.9 Verify in browser: run cover stage, see front/back covers

---

- [ ] 5.0 Dimension UI + Credit Integration
  - [ ] 5.1 Create `src/components/shared/DimensionPicker.tsx`:
    - Presets: Square (1024x1024), Landscape (1536x1024), Portrait (1024x1536)
    - Custom option with width/height inputs
    - Min: 512, Max: 2048, Step: 64
    - Visual preview of aspect ratio
  - [ ] 5.2 Add dimension picker to illustration generation UI
  - [ ] 5.3 Add dimension picker to cover generation UI (default: Portrait)
  - [ ] 5.4 Store selected dimensions in project settings
  - [ ] 5.5 Update `src/lib/storage/creditsStore.ts` - add image credit costs:
    ```ts
    IMAGE_CREDITS = {
      characterSheet: 8,    // 12 poses
      illustration: 2,      // single scene
      cover: 2,             // front or back
      poseAlternative: 1,   // single regeneration
    }
    ```
  - [ ] 5.6 Add pre-flight credit check before generation:
    - Calculate total cost
    - Show confirmation modal with cost
    - Block if insufficient credits
  - [ ] 5.7 Deduct credits only on successful generation (not on failure)
  - [ ] 5.8 Update billing page to show image credit usage in ledger
  - [ ] 5.9 Typecheck passes
  - [ ] 5.10 Verify in browser: change dimensions, confirm in generated images
  - [ ] 5.11 Verify in browser: check credit balance, generate, confirm deduction
  - [ ] 5.12 Verify in browser: insufficient credits shows upgrade prompt

---

- [ ] 6.0 Testing & Cleanup
  - [ ] 6.1 Add test: `src/test/image-generation.test.ts`
    - Test provider selection (mock vs nanobanana)
    - Test retry logic
    - Test fallback behavior
  - [ ] 6.2 Add test: credit deduction for image generation
  - [ ] 6.3 Update existing tests if any break
  - [ ] 6.4 Run full test suite: `npm test`
  - [ ] 6.5 Run linter: `npm run lint`
  - [ ] 6.6 Fix any lint errors
  - [ ] 6.7 Manual QA: full flow from character creation to cover generation
  - [ ] 6.8 Update STATUS.md: mark "Image Generation" as complete
  - [ ] 6.9 Update BACKLOG.md: check off Feature #1

---

- [ ] 7.0 Commit & Document
  - [ ] 7.1 Stage changes: `git add .`
  - [ ] 7.2 Commit with descriptive message
  - [ ] 7.3 Push branch: `git push -u origin feature/nanobanana-image-generation`
  - [ ] 7.4 Create PR (optional, if using PR workflow)

---

## Task Summary

| Parent | Sub-tasks | Est. Time |
|--------|-----------|-----------|
| 0. Feature branch | 2 | 5 min |
| 1. Server Proxy | 11 | 2 hrs |
| 2. Provider + Errors | 10 | 2 hrs |
| 3. Character Sheets | 9 | 3 hrs |
| 4. Illustrations + Covers | 9 | 3 hrs |
| 5. Dimensions + Credits | 12 | 2 hrs |
| 6. Testing | 9 | 1.5 hrs |
| 7. Commit | 4 | 15 min |

**Total: 66 sub-tasks**
