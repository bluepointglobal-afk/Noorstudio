# NoorStudio Publishing Module - Integration Guide

## Overview

The NoorStudio Publishing Module provides complete export capabilities for:
- **KDP (Kindle Direct Publishing)**: Print-ready PDFs with bleed, spine calculation, and cover generation
- **Lulu**: Interior PDFs with headers/footers and custom formatting
- **Apple Books**: EPUB 3.3 compliant ebooks with accessibility features

## Installation

The publishing module is already integrated into NoorStudio. No additional installation needed.

## Quick Start

```typescript
import { publishBook, ISBNManagerImpl } from '@/lib/publishing';

// 1. Prepare your book data
const bookData = {
  layout,           // LayoutArtifactContent
  cover,            // CoverArtifactContent
  chapters,         // ChaptersArtifactContent
  illustrations,    // IllustrationArtifactContent (optional)
  projectTitle: "My Book Title",
  authorName: "Author Name",
};

// 2. Configure publishing settings
const config = {
  platform: "kdp",      // "kdp" | "lulu" | "apple"
  format: "pdf",        // "pdf" | "epub"
  trimSize: "6x9",      // "6x9" | "7x10" | "8.5x11" | "5x8" | "5.5x8.5"
  includeBleed: true,
  colorMode: "color",   // "color" | "grayscale"
  kdp: {
    paperType: "white",       // "white" | "cream"
    bindingType: "perfect",   // "perfect" | "casewrap"
    includeISBN: true,
  }
};

// 3. Generate publishing files
const results = await publishBook(
  { ...bookData, config },
  (progress) => {
    console.log(`${progress.stage}: ${progress.message}`);
  }
);

// 4. Download results
results.forEach(result => {
  downloadPublishingResult(result);
});
```

## Platform-Specific Usage

### 📚 KDP (Kindle Direct Publishing)

Generate print-ready PDFs for Amazon KDP with automatic spine width calculation.

```typescript
const kdpConfig = {
  platform: "kdp",
  format: "pdf",
  trimSize: "6x9",
  includeBleed: true,     // KDP requires 0.125" bleed
  colorMode: "grayscale", // B&W is cheaper for printing
  kdp: {
    paperType: "white",   // "white" | "cream"
    bindingType: "perfect",
    includeISBN: true,
  }
};

const results = await publishBook({ ...bookData, config: kdpConfig });

// Results will include:
// - Interior PDF (book content)
// - Cover PDF (with spine calculated based on page count)
```

**KDP Cover Specifications:**
- Spine width automatically calculated based on page count and paper type
- Bleed: 0.125" on all sides
- Safe zone: 0.125" from trim edge (no text/important elements)
- Cover dimensions: `(Front + Spine + Back) + Bleed`

**Page Count Validation:**
- Minimum: 24 pages
- Maximum: 828 pages

**Spine Width Formula:**
```
Spine Width = (Page Count / PPI) + Binding Adjustment

PPI (Pages Per Inch):
- White paper, B&W: 442
- White paper, Color: 220
- Cream paper, B&W: 476
- Cream paper, Color: Not supported
```

### 📖 Lulu

Generate interior PDFs with customizable headers and footers.

```typescript
const luluConfig = {
  platform: "lulu",
  format: "pdf",
  trimSize: "6x9",
  includeBleed: false,    // Lulu doesn't require bleed
  colorMode: "color",
  lulu: {
    bindingType: "perfect",          // "perfect" | "saddle-stitch" | "coil"
    paperWeight: "60lb",             // "60lb" | "70lb" | "80lb"
    headerFooter: {
      headerLeft: "{chapter}",       // Variables: {chapter}, {book}, {author}, {page}
      headerRight: "{book}",
      footerCenter: "{page}",
      font: "helvetica",
      fontSize: 9,
      alternateLeftRight: true,      // Different headers for left/right pages
    }
  }
};

const results = await publishBook({ ...bookData, config: luluConfig });
```

**Header/Footer Variables:**
- `{chapter}` - Current chapter title
- `{book}` - Book title
- `{author}` - Author name
- `{page}` - Page number

**Example Header/Footer Setup:**
```typescript
headerFooter: {
  // Left pages
  headerLeft: "{chapter}",
  footerLeft: "{author}",
  
  // Right pages (when alternateLeftRight: true)
  headerRight: "{book}",
  footerRight: undefined,
  
  // Centered on all pages
  footerCenter: "{page}",
  
  alternateLeftRight: true,
}
```

### 🍎 Apple Books

Generate EPUB 3.3 compliant ebooks with full accessibility support.

```typescript
const appleConfig = {
  platform: "apple",
  format: "epub",
  trimSize: "6x9",      // Used for layout calculations
  includeBleed: false,  // Not needed for EPUB
  colorMode: "color",
  apple: {
    fixedLayout: false,           // Reflowable text (recommended)
    specifiedFonts: false,        // Use reader's font preferences
    coverAspectRatio: "portrait", // "square" | "portrait"
  }
};

const results = await publishBook({ ...bookData, config: appleConfig });
```

**EPUB 3.3 Features:**
- ✓ Accessibility metadata (WCAG 2.0 Level A)
- ✓ Navigation document with landmarks
- ✓ Semantic HTML5 structure
- ✓ Dark mode CSS support
- ✓ Apple Books `ibooks:` namespace
- ✓ NCX for backward compatibility

**Apple Books Requirements:**
- Cover image: RGB JPEG or PNG
- Recommended dimensions: 1400×2100px minimum
- File size: Under 2GB
- Fonts: Either embedded or system fonts

## ISBN Management

### Setting Up ISBNs

```typescript
import { ISBNManagerImpl, saveISBNs } from '@/lib/publishing';

// Create ISBN manager
const isbnManager = new ISBNManagerImpl();

// Add ISBNs for different formats
isbnManager.addISBN({
  isbn13: "978-0-123456-78-5",
  isbn10: "0-123456-78-9",         // Optional
  format: "ebook",                  // "ebook" | "paperback" | "hardcover" | "audiobook"
  platform: "apple",                // "kdp" | "lulu" | "apple" | "universal"
  assignedDate: new Date().toISOString(),
  projectId: "my-book-project-id",
  notes: "Apple Books edition"
});

isbnManager.addISBN({
  isbn13: "978-0-987654-32-1",
  format: "paperback",
  platform: "kdp",
  assignedDate: new Date().toISOString(),
  projectId: "my-book-project-id",
  notes: "KDP paperback edition"
});

// Save to localStorage
saveISBNs(isbnManager);

// Use in publishing
const results = await publishBook({
  ...bookData,
  config,
  isbnManager    // ISBN will be automatically included in metadata
});
```

### ISBN Validation

```typescript
import { validateISBN13, validateISBN10, isbn10ToISBN13 } from '@/lib/publishing';

// Validate ISBN-13
const isValid = validateISBN13("978-0-123456-78-5");  // true

// Validate ISBN-10
const isValid10 = validateISBN10("0-123456-78-9");    // true

// Convert ISBN-10 to ISBN-13
const isbn13 = isbn10ToISBN13("0-123456-78-9");       // "978-0-123456-78-5"
```

### Retrieving ISBNs

```typescript
// Get ISBN for specific format and platform
const ebook ISBN = isbnManager.getISBN("ebook", "apple");

// Get all ISBNs for a project
const allISBNs = isbnManager.getProjectISBNs("my-book-project-id");

// Update ISBN
isbnManager.updateISBN("978-0-123456-78-5", {
  notes: "Updated notes"
});

// Remove ISBN
isbnManager.removeISBN("978-0-123456-78-5");
```

## Advanced Features

### Spine Width Calculator

Use the spine calculator independently for cover design:

```typescript
import { calculateSpineWidth, generateKDPCoverSpecs } from '@/lib/publishing';

// Calculate spine width
const spine = calculateSpineWidth({
  pageCount: 200,
  paperType: "white",
  bindingType: "perfect",
  color: false
});

console.log(`Spine width: ${spine.spineWidth}"`);
// Output: "Spine width: 0.4549"

// Generate complete cover specs
const coverSpecs = generateKDPCoverSpecs(
  6,      // trimWidth
  9,      // trimHeight
  200,    // pageCount
  "white",
  "perfect",
  false   // color
);

console.log(coverSpecs);
// {
//   trimWidth: 6,
//   trimHeight: 9,
//   spineWidth: 0.4549,
//   totalWidth: 12.7049,
//   totalHeight: 9.25,
//   frontCoverX: 6.5799,
//   backCoverX: 0.125,
//   ...
// }
```

### Progress Tracking

Monitor export progress with callbacks:

```typescript
const results = await publishBook(
  { ...bookData, config },
  (progress) => {
    console.log(`Stage: ${progress.stage}`);
    console.log(`Progress: ${progress.current}/${progress.total}`);
    console.log(`Message: ${progress.message}`);
    
    // Update UI progress bar
    updateProgressBar(progress.current / progress.total);
  }
);
```

### Validation Results

Each export includes validation feedback:

```typescript
results.forEach(result => {
  console.log(`File: ${result.filename}`);
  console.log(`Platform: ${result.platform}`);
  console.log(`Format: ${result.format}`);
  console.log(`Validation: ${result.validation.passed ? 'PASSED' : 'FAILED'}`);
  
  if (result.validation.warnings.length > 0) {
    console.warn('Warnings:', result.validation.warnings);
  }
  
  if (result.validation.errors.length > 0) {
    console.error('Errors:', result.validation.errors);
  }
});
```

## Batch Publishing

Generate files for multiple platforms at once:

```typescript
const platforms = ['kdp', 'lulu', 'apple'];
const allResults = [];

for (const platform of platforms) {
  const config = {
    platform,
    format: platform === 'apple' ? 'epub' : 'pdf',
    trimSize: '6x9',
    includeBleed: platform === 'kdp',
    colorMode: 'color',
  };
  
  const results = await publishBook({ ...bookData, config });
  allResults.push(...results);
}

// Download all files
downloadAllResults(allResults);
```

## UI Integration Example

```typescript
import { publishBook, downloadPublishingResult } from '@/lib/publishing';
import { useState } from 'react';

function PublishingPanel() {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);

  const handlePublish = async (platform) => {
    const config = {
      platform,
      format: platform === 'apple' ? 'epub' : 'pdf',
      trimSize: '6x9',
      includeBleed: platform === 'kdp',
      colorMode: 'color',
    };

    const results = await publishBook(
      { layout, cover, chapters, illustrations, projectTitle, authorName, config },
      (prog) => {
        setProgress(prog.current / prog.total);
        setMessage(prog.message);
      }
    );

    setResults(results);
  };

  return (
    <div>
      <button onClick={() => handlePublish('kdp')}>Export to KDP</button>
      <button onClick={() => handlePublish('lulu')}>Export to Lulu</button>
      <button onClick={() => handlePublish('apple')}>Export to Apple Books</button>
      
      {progress > 0 && (
        <div>
          <progress value={progress} max={1} />
          <p>{message}</p>
        </div>
      )}
      
      {results.map((result, i) => (
        <button key={i} onClick={() => downloadPublishingResult(result)}>
          Download {result.filename}
        </button>
      ))}
    </div>
  );
}
```

## Troubleshooting

### Issue: Spine width too narrow for text
**Solution:** Increase page count or avoid placing text on spine. KDP minimum is 0.06".

### Issue: Page count below KDP minimum
**Solution:** Add content or adjust layout to reach 24 pages minimum.

### Issue: Cover image not loading
**Solution:** Ensure cover URLs are accessible and images are in JPEG format.

### Issue: EPUB validation fails on Apple Books
**Solution:** Check that cover is RGB (not CMYK) and images are web-optimized.

## File Naming Convention

Generated files follow this pattern:
- `{book-title}-KDP-Interior.pdf`
- `{book-title}-KDP-Cover.pdf`
- `{book-title}-Lulu.pdf`
- `{book-title}.epub`

Special characters are replaced with hyphens and the filename is sanitized.

## Next Steps

1. **UI Integration**: Add publishing panel to NoorStudio interface
2. **ISBN Database**: Implement persistent ISBN storage (database/Supabase)
3. **Cover Upload**: Add UI for custom cover image upload
4. **Preview Mode**: Generate low-res previews before final export
5. **Batch Export**: One-click export to all platforms

## Support & Resources

- **KDP Specifications**: https://kdp.amazon.com/en_US/help/topic/G201834180
- **Lulu Guidelines**: https://www.lulu.com/create/books
- **Apple Books Guidelines**: https://help.apple.com/itc/booksassetguide/
- **EPUB 3.3 Spec**: https://www.w3.org/TR/epub-33/

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-05  
**Module Location:** `src/lib/publishing/`
