# PRD: Layout Stage Implementation

## Overview
Implement the Layout Stage to compose book pages from text content and illustrations, creating a print-ready spread-based layout.

## User Stories

### US-001: Layout Artifact Types (Priority 1)
**As a developer, I want comprehensive layout artifact types so that page composition is well-structured.**

**Acceptance Criteria:**
- Update LayoutArtifactContent in artifacts.ts to include spreads
- Add PagePosition type (left/right)
- Add ContentBlock type for text/image placement
- Add margin and gutter specifications
- Typecheck passes

### US-002: Text Flow Algorithm (Priority 2)
**As a developer, I want text to flow correctly across pages so that chapters are readable.**

**Acceptance Criteria:**
- Create calculateTextPages() function that estimates pages needed per chapter
- Handle word count per page based on trim size and font size
- Support text-only, image-only, and mixed page types
- Keep paragraphs together when possible (avoid orphan lines)
- Typecheck passes

### US-003: Illustration Placement (Priority 3)
**As a developer, I want illustrations placed appropriately so that images enhance the reading experience.**

**Acceptance Criteria:**
- Create placeIllustrations() function
- Each chapter gets one spread with illustration
- Support full-spread images and half-page images
- Illustrations appear on correct spread for their chapter
- Never place two full-spread images consecutively
- Typecheck passes

### US-004: Spread Composition (Priority 4)
**As a developer, I want spreads composed properly so that left and right pages work together.**

**Acceptance Criteria:**
- Create composeSpread() function
- Left page = even numbers, right page = odd numbers
- First page of chapter always on right (recto)
- Handle blank pages for proper pagination
- Support different trim sizes (6x9, 7x10, 8.5x11)
- Typecheck passes

### US-005: Layout Stage Runner (Priority 5)
**As a developer, I want the layout stage integrated into stageRunner.ts so that it runs in the pipeline.**

**Acceptance Criteria:**
- Create runLayoutStage() function in stageRunner.ts
- Takes chapters, illustrations, and project settings as input
- Outputs LayoutArtifact with all spreads
- Shows progress during composition
- Typecheck passes

### US-006: Layout Preview UI (Priority 6)
**As an author, I want to preview my book layout so that I can see how pages will look.**

**Acceptance Criteria:**
- Create LayoutPreview component showing spread thumbnails
- Display page numbers on each page
- Show which pages have text vs images
- Indicate chapter starts
- Add spread navigation (previous/next)
- Typecheck passes
- Verify in browser: layout preview displays correctly

### US-007: Page Reordering (Priority 7)
**As an author, I want to adjust page order so that I can customize my book layout.**

**Acceptance Criteria:**
- Add drag-and-drop spread reordering in LayoutPreview
- Prevent invalid reorders (cover pages stay fixed)
- Update page numbers after reorder
- Save reordered layout to artifact
- Typecheck passes

## Technical Notes

### Existing Types (from models/index.ts)
```typescript
interface LayoutArtifact {
  pageCount: number;
  spreads: SpreadLayout[];
  generatedAt: string;
}

interface SpreadLayout {
  spreadNumber: number;
  leftPage: PageLayout;
  rightPage: PageLayout;
}

interface PageLayout {
  type: "text" | "image" | "mixed";
  content?: string;
  imageUrl?: string;
}
```

### Layout Constants
- Standard children's book: 24-32 pages
- Typical spread: 2 pages (left + right)
- Text pages: ~100-150 words for ages 4-8
- Image spreads: Full bleed or inset

### Trim Sizes
- 6x9 inches (standard)
- 7x10 inches (premium)
- 8.5x11 inches (landscape picture book)

## Dependencies
- Chapters artifact (text content)
- Illustrations artifact (images)
- Project settings (trim size, layout style)

## Out of Scope
- PDF generation (Feature 4)
- Print-ready bleed marks (Feature 4)
- Custom fonts (future)
