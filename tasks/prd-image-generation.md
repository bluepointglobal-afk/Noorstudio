# PRD: NanoBanana Image Generation Integration

## Introduction

Replace the mock image provider with real NanoBanana API integration to enable actual AI-generated images for character reference sheets, book illustrations, and covers. This completes the visual pipeline and unblocks the full book creation flow.

## Goals

- Enable real AI image generation via NanoBanana API (pixar-3d-v1 model)
- Maintain character consistency across all illustrations using reference sheets
- Support all image types: character poses, book illustrations, front/back covers
- Provide graceful error handling with retry and fallback mechanisms
- Allow user-configurable image dimensions

## User Stories

### US-001: Server Proxy for NanoBanana API
**Description:** As a developer, I want all NanoBanana API calls routed through the Express server so that API keys remain secure and rate limiting is enforced.

**Acceptance Criteria:**
- [ ] New route `POST /api/ai/image` accepts image generation requests
- [ ] Server validates JWT auth before processing
- [ ] Server injects `NANOBANANA_API_KEY` from environment
- [ ] Request/response logged to `ai_usage` table
- [ ] Rate limiting applied (15 req/10min per IP, matching existing)
- [ ] Typecheck passes
- [ ] Test with curl/Postman

---

### US-002: NanoBanana Provider Implementation
**Description:** As a developer, I want a NanoBanana provider that replaces the mock so that real images are generated.

**Acceptance Criteria:**
- [ ] Implement `nanobananaProvider` in `src/lib/ai/providers/imageProvider.ts`
- [ ] Provider calls server proxy (not direct API)
- [ ] Supports `pixar-3d-v1` model
- [ ] Accepts: prompt, negative_prompt, dimensions, count, seed
- [ ] Returns: array of image URLs or base64 data
- [ ] Provider selection via `VITE_AI_IMAGE_PROVIDER` env var
- [ ] Typecheck passes
- [ ] Verify in browser with test generation

---

### US-003: Character Reference Sheet Generation
**Description:** As an author, I want to generate a 12-pose character reference sheet so that my character looks consistent across all book illustrations.

**Acceptance Criteria:**
- [ ] Generate 12 poses: Front, Side, 3/4, Walking, Running, Sitting, Reading, Praying, Smiling, Surprised, Pointing, Thinking
- [ ] Each pose prompt includes: character visual DNA, style, modesty rules
- [ ] User can select from 3 alternatives per pose
- [ ] Selected poses saved to character record
- [ ] Reference sheet displayed as grid in Character Detail page
- [ ] Typecheck passes
- [ ] Verify in browser: create character, generate sheet, select poses

---

### US-004: Book Illustration Generation
**Description:** As an author, I want to generate illustrations for my book scenes so that my story has visual content.

**Acceptance Criteria:**
- [ ] Illustration prompt includes: scene description, character reference sheet, style guide
- [ ] Character reference sheet passed as image reference (if NanoBanana supports) OR as detailed text description
- [ ] User can choose dimensions: Square (1024x1024), Landscape (1536x1024), Portrait (1024x1536)
- [ ] Generate 3 variants, user selects one
- [ ] Selected illustration attached to chapter/spread
- [ ] Typecheck passes
- [ ] Verify in browser: run illustration stage, see real images

---

### US-005: Cover Generation (Front & Back)
**Description:** As an author, I want to generate front and back cover images so that my book has professional covers.

**Acceptance Criteria:**
- [ ] Front cover prompt includes: title, main character, scene hint, style
- [ ] Back cover prompt includes: simpler design, space for synopsis text
- [ ] Dimensions: Portrait for front (1024x1536), same for back
- [ ] User can regenerate covers independently
- [ ] Cover images stored in project export data
- [ ] Typecheck passes
- [ ] Verify in browser: run cover stage, see generated covers

---

### US-006: Dimension Selection UI
**Description:** As an author, I want to choose image dimensions so that illustrations fit my book layout needs.

**Acceptance Criteria:**
- [ ] Dimension picker component with presets: Square, Landscape, Portrait, Custom
- [ ] Custom allows width/height input (min 512, max 2048, step 64)
- [ ] Default dimension per context: Square for poses, Landscape for spreads, Portrait for covers
- [ ] Selection persisted per project
- [ ] Typecheck passes
- [ ] Verify in browser: change dimensions, see reflected in generation

---

### US-007: Error Handling & Retry
**Description:** As an author, I want graceful error handling so that temporary API failures don't lose my work.

**Acceptance Criteria:**
- [ ] On API failure: show clear error message with reason
- [ ] Automatic retry with exponential backoff (3 attempts, 2s/4s/8s delays)
- [ ] After retries exhausted: offer manual retry button
- [ ] Fallback to mock with "[Placeholder - Generation Failed]" watermark
- [ ] Failed requests logged for debugging
- [ ] Credits NOT deducted on failure
- [ ] Typecheck passes
- [ ] Verify: disconnect network, trigger generation, see graceful handling

---

### US-008: Credit Integration
**Description:** As a user, I want image generation to consume credits appropriately so that usage is tracked and limited.

**Acceptance Criteria:**
- [ ] Credit costs per operation:
  - Character sheet (12 poses): 8 credits (existing)
  - Single illustration: 2 credits
  - Cover (front or back): 2 credits
  - Pose alternative (1 image): 1 credit
- [ ] Pre-flight credit check before generation starts
- [ ] Credits deducted only on successful generation
- [ ] Insufficient credits shows upgrade prompt
- [ ] Typecheck passes
- [ ] Verify: check balance, generate, confirm deduction

---

## Functional Requirements

- **FR-1:** All image API calls must go through server proxy (`/api/ai/image`)
- **FR-2:** Provider must support switching between mock and NanoBanana via env var
- **FR-3:** Character reference sheets must be includable in illustration prompts
- **FR-4:** All generated images must respect modesty/compliance rules in prompts
- **FR-5:** Image URLs/data must be stored persistently (not just session)
- **FR-6:** Generation progress must be shown (spinner, percentage if available)
- **FR-7:** Cancel button must abort in-progress generation

## Non-Goals (Out of Scope)

- **NOT** implementing image editing/inpainting
- **NOT** supporting other AI image providers (Midjourney, DALL-E, etc.)
- **NOT** building a general-purpose image generator
- **NOT** automated compliance checking of generated images (separate feature)
- **NOT** batch generation queue system (separate feature)

## Technical Considerations

### NanoBanana API Integration
- API endpoint: `https://api.nanobanana.com/v1/generate` (verify actual endpoint)
- Model: `pixar-3d-v1`
- Auth: Bearer token via `NANOBANANA_API_KEY`
- Request format: JSON with prompt, negative_prompt, width, height, num_images, seed
- Response: Array of image URLs or base64

### Character Consistency Strategy
- **Primary method:** Include full character visual DNA in every prompt
- **Reference text format:**
  ```
  Character: [Name], [Age] year old [gender]
  Style: [Pixar 3D / Watercolor / etc.]
  Appearance: [skin tone], [hair/hijab description], [outfit]
  Modesty: Always wearing hijab, long sleeves, loose clothing
  Expression: [current pose expression]
  Reference: Maintain consistency with attached 12-pose reference sheet
  ```
- **If NanoBanana supports image references:** Also pass pose grid image

### Existing Code Integration Points
- `src/lib/ai/providers/imageProvider.ts` - Replace stub with real implementation
- `src/lib/ai/imagePrompts.ts` - Prompt builder already exists
- `server/index.ts` - Add `/api/ai/image` route
- `src/lib/ai/config.ts` - Provider selection
- `src/lib/storage/creditsStore.ts` - Credit deduction

### Environment Variables
```
# Server
NANOBANANA_API_KEY=sk-...

# Client
VITE_AI_IMAGE_PROVIDER=nanobanana  # or "mock"
```

## Success Metrics

- Real images generated successfully in all contexts (character, illustration, cover)
- Character consistency maintained across illustrations (subjective review)
- Error rate < 5% after retries
- Average generation time < 30 seconds per image
- Zero API key exposure to client

## Open Questions

1. Does NanoBanana support image-to-image or image references for consistency?
2. What is the actual NanoBanana API endpoint and request format?
3. Are there rate limits on NanoBanana beyond our self-imposed limits?
4. Should we cache/store generated images in Supabase Storage or keep URLs?
5. What is the image URL expiration policy from NanoBanana?

---

## Summary

| User Story | Priority | Complexity |
|------------|----------|------------|
| US-001: Server Proxy | P0 | Medium |
| US-002: NanoBanana Provider | P0 | Medium |
| US-003: Character Reference Sheet | P0 | High |
| US-004: Book Illustrations | P0 | High |
| US-005: Cover Generation | P1 | Medium |
| US-006: Dimension Selection UI | P1 | Low |
| US-007: Error Handling & Retry | P0 | Medium |
| US-008: Credit Integration | P0 | Low |
