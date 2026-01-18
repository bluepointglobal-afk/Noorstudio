# PRD: PDF/EPUB Export

## Overview
Implement the Export Stage to generate downloadable PDF and EPUB files from composed book layouts, enabling users to download their finished books.

## Current State
- Export UI exists in ProjectWorkspacePage
- ExportArtifactContent type defined in artifacts.ts
- Stale detection works (knows when regeneration needed)
- **NO file generation** - pdfkit/jsPDF not integrated
- **NO EPUB assembly** - epub-gen not integrated
- **NO storage** - Supabase Storage bucket unused

## User Stories

### US-001: PDF Generation Service (Priority 1)
**As a developer, I want a PDF generation service so that books can be exported as PDF files.**

**Acceptance Criteria:**
- Create `src/lib/export/pdfGenerator.ts`
- Use jsPDF library for browser-side PDF generation
- Accept LayoutArtifactContent and CoverArtifactContent as input
- Generate PDF with correct page dimensions based on trim size
- Include front cover as first page
- Render text pages with proper fonts and margins
- Embed images (illustrations) at correct positions
- Include back cover as last page
- Return PDF as Blob
- Typecheck passes

### US-002: EPUB Generation Service (Priority 2)
**As a developer, I want an EPUB generation service so that books can be exported as EPUB files.**

**Acceptance Criteria:**
- Create `src/lib/export/epubGenerator.ts`
- Generate EPUB 3.0 compatible files
- Create proper EPUB structure (META-INF, OEBPS, mimetype)
- Generate content.opf manifest with all resources
- Generate toc.ncx for navigation
- Convert chapters to XHTML format
- Embed images as base64 or references
- Include cover image in metadata
- Return EPUB as Blob
- Typecheck passes

### US-003: Export Stage Runner (Priority 3)
**As a developer, I want the export stage integrated into stageRunner.ts so that it runs in the pipeline.**

**Acceptance Criteria:**
- Create `runExportStage()` function
- Add "export" to AIStageType union
- Takes project with layout, cover, and chapter artifacts
- Generates PDF and EPUB concurrently
- Shows progress during generation
- Returns ExportArtifactContent with file metadata
- Typecheck passes

### US-004: Blob Download Utility (Priority 4)
**As a developer, I want a download utility so that users can download generated files.**

**Acceptance Criteria:**
- Create `src/lib/export/downloadUtils.ts`
- Implement `downloadBlob(blob, filename)` function
- Generate sanitized filenames from project title
- Support PDF and EPUB MIME types
- Trigger browser download dialog
- Typecheck passes

### US-005: Export UI Integration (Priority 5)
**As an author, I want to export my book from the workspace so that I can download it.**

**Acceptance Criteria:**
- Update Export tab in ProjectWorkspacePage
- Show format selection (PDF, EPUB, or both)
- Show export progress during generation
- Display download buttons when ready
- Show file sizes
- Handle errors gracefully with toast messages
- Typecheck passes
- Verify in browser: can download PDF and EPUB

### US-006: Print-Ready PDF Variant (Priority 6)
**As an author, I want a print-ready PDF so that I can send it to a print service.**

**Acceptance Criteria:**
- Add "print-ready" option to export formats
- Include bleed marks (0.125" on all sides)
- Include crop marks at corners
- Use CMYK color space indication
- Flatten transparency
- Embed fonts
- Typecheck passes

### US-007: Export Progress and Caching (Priority 7)
**As an author, I want export progress shown and results cached so that re-exports are fast.**

**Acceptance Criteria:**
- Show progress bar during PDF/EPUB generation
- Cache generated Blobs in memory during session
- Detect when source artifacts change (stale detection)
- Show "regenerate" option when stale
- Clear cache on project save
- Typecheck passes

## Technical Notes

### Libraries to Use
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.1"
}
```
Note: Using jsPDF for browser-side generation (no server required).

### Trim Size to PDF Dimensions (in points, 72pt = 1 inch)
- 6x9: 432 x 648 points
- 7x10: 504 x 720 points
- 8.5x11: 612 x 792 points

### Export Artifact Structure
```typescript
interface ExportArtifactContent {
  files: ExportArtifactItem[];
  generatedAt: string;
}

interface ExportArtifactItem {
  format: "pdf" | "epub" | "pdf-print";
  fileUrl?: string;        // If uploaded to storage
  fileSize: number;        // In bytes
  pageCount: number;
  cached: boolean;         // In-memory cache status
}
```

### File Naming Convention
- PDF: `{project-title}-{timestamp}.pdf`
- EPUB: `{project-title}-{timestamp}.epub`
- Print PDF: `{project-title}-print-{timestamp}.pdf`

## Dependencies
- Layout Stage (need spreads)
- Cover Stage (need cover images)
- Chapters (need text content)
- Illustrations (need images)

## Out of Scope
- Supabase Storage upload (future)
- Shareable download links (future)
- Batch export (future)
- Custom fonts (future)
