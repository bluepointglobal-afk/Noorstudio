# NoorStudio Publishing Module

**Complete publishing pipeline for KDP, Lulu, and Apple Books**

## 🎯 Features

### ✅ EPUB 3.3 Export
- Full EPUB 3.3 specification compliance
- Apple Books compatibility with `ibooks:` namespace
- Accessibility metadata (WCAG 2.0 Level A)
- Semantic HTML5 structure with ARIA landmarks
- Dark mode CSS support
- NCX for backward compatibility (EPUB 2.0 readers)

### 📚 KDP (Kindle Direct Publishing)
- **Interior PDF**: Print-ready with proper margins and bleed
- **Cover PDF**: Automatic spine width calculation based on page count
- Bleed support (0.125" on all sides)
- Safe zone validation (0.125" from trim)
- Page count validation (24-828 pages)
- Multiple paper types: white, cream
- Multiple trim sizes: 6×9", 7×10", 8.5×11", 5×8", 5.5×8.5"

### 📖 Lulu Print-on-Demand
- Interior PDF with headers and footers
- Configurable header/footer templates with variables
- Left/right page alternation
- Multiple binding types: perfect, saddle-stitch, coil
- Paper weight options: 60lb, 70lb, 80lb
- Custom margins and formatting

### 🔢 ISBN Management
- ISBN-13 and ISBN-10 validation
- Format conversion (ISBN-10 ↔ ISBN-13)
- Multi-format support: ebook, paperback, hardcover, audiobook
- Platform-specific ISBNs
- LocalStorage persistence
- Project-based organization

### 📐 Spine Width Calculator
- KDP-compliant PPI (Pages Per Inch) tables
- Automatic calculation based on:
  - Page count
  - Paper type (white/cream)
  - Binding type (perfect/casewrap)
  - Color mode (B&W/color)
- Binding adjustment for perfect binding
- Validation warnings for thin spines

## 📦 Module Structure

```
src/lib/publishing/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript type definitions
├── isbnManager.ts              # ISBN validation and management
├── spineCalculator.ts          # KDP spine width calculations
├── epub33Generator.ts          # EPUB 3.3 generator
├── kdpPDFGenerator.ts          # KDP PDF generator
├── luluPDFGenerator.ts         # Lulu PDF generator
├── publishBook.ts              # Unified publishing orchestrator
├── INTEGRATION_GUIDE.md        # Detailed integration guide
└── README.md                   # This file
```

## 🚀 Quick Start

```typescript
import { publishBook } from '@/lib/publishing';

const results = await publishBook({
  layout,
  cover,
  chapters,
  illustrations,
  projectTitle: "My Book",
  authorName: "Author Name",
  config: {
    platform: "kdp",
    format: "pdf",
    trimSize: "6x9",
    includeBleed: true,
    colorMode: "color",
  }
});

// Download generated files
results.forEach(result => {
  downloadPublishingResult(result);
});
```

## 📋 Supported Platforms

| Platform | Formats | Features |
|----------|---------|----------|
| **KDP** | PDF (Interior + Cover) | Spine calculation, bleed, validation |
| **Lulu** | PDF (Interior) | Headers/footers, custom binding |
| **Apple Books** | EPUB 3.3 | Accessibility, dark mode, iBooks support |

## 🔧 Configuration Options

### Trim Sizes
- `6x9` (standard novel)
- `7x10` (textbooks, manuals)
- `8.5x11` (workbooks, guides)
- `5x8` (small paperbacks)
- `5.5x8.5` (digests)

### Paper Types (KDP)
- `white` - Standard white paper (supports B&W and color)
- `cream` - Cream/ivory paper (B&W only)

### Binding Types
- `perfect` - Perfect binding (glued spine)
- `casewrap` - Hardcover casewrap
- `saddle-stitch` - Stapled binding (Lulu)
- `coil` - Spiral/coil binding (Lulu)

### Color Modes
- `color` - Full color printing
- `grayscale` - Black and white

## 📊 Technical Specifications

### KDP Spine Width Formula

```
Spine Width (inches) = (Page Count / PPI) + Binding Adjustment

PPI (Pages Per Inch):
├── White Paper, B&W:     442 PPI
├── White Paper, Color:   220 PPI
└── Cream Paper, B&W:     476 PPI

Binding Adjustment:
└── Perfect Binding:      +0.0025 inches
```

### KDP Cover Dimensions

```
Total Width  = Bleed + Back Cover + Spine + Front Cover + Bleed
Total Height = Bleed + Trim Height + Bleed

Where:
├── Bleed          = 0.125 inches (all sides)
├── Safe Zone      = 0.125 inches (from trim edge)
├── Cover Width    = Trim Width
└── Spine Width    = Calculated based on page count
```

### EPUB 3.3 Metadata

```xml
<package version="3.0">
  <metadata>
    <!-- Accessibility -->
    <meta property="schema:accessMode">textual</meta>
    <meta property="schema:accessMode">visual</meta>
    <meta property="schema:accessibilityFeature">structuralNavigation</meta>
    
    <!-- Apple Books -->
    <meta property="ibooks:specified-fonts">true</meta>
  </metadata>
</package>
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd 03_REPOS/Noorstudio
node test_publishing_phase1.mjs
```

**Test Coverage:**
- ✅ ISBN validation (ISBN-13, ISBN-10)
- ✅ Spine width calculation (all paper types)
- ✅ KDP cover specifications
- ✅ Lulu header/footer templates
- ✅ EPUB 3.3 structure validation
- ✅ Apple Books compatibility

## 📖 Usage Examples

### Example 1: KDP Paperback

```typescript
import { publishBook, ISBNManagerImpl } from '@/lib/publishing';

const isbnManager = new ISBNManagerImpl();
isbnManager.addISBN({
  isbn13: "978-0-123456-78-5",
  format: "paperback",
  platform: "kdp",
  assignedDate: new Date().toISOString(),
  projectId: "my-book-id"
});

const results = await publishBook({
  layout,
  cover,
  chapters,
  projectTitle: "My Paperback Book",
  authorName: "John Doe",
  config: {
    platform: "kdp",
    format: "pdf",
    trimSize: "6x9",
    includeBleed: true,
    colorMode: "grayscale",
    kdp: {
      paperType: "white",
      bindingType: "perfect",
      includeISBN: true
    }
  },
  isbnManager
});

// Results: Interior PDF + Cover PDF
console.log(results[0].specs.interior.margins);
console.log(results[1].specs.cover.spineWidth);
```

### Example 2: Apple Books EPUB

```typescript
const results = await publishBook({
  layout,
  cover,
  chapters,
  illustrations,
  projectTitle: "My eBook",
  authorName: "Jane Smith",
  publisher: "My Publishing House",
  config: {
    platform: "apple",
    format: "epub",
    trimSize: "6x9",
    apple: {
      fixedLayout: false,
      specifiedFonts: false,
      coverAspectRatio: "portrait"
    }
  }
});

// Results: EPUB 3.3 file
console.log(results[0].validation.isAppleCompatible); // true
```

### Example 3: Lulu with Custom Headers

```typescript
const results = await publishBook({
  layout,
  cover,
  chapters,
  projectTitle: "Professional Manual",
  authorName: "Expert Author",
  config: {
    platform: "lulu",
    format: "pdf",
    trimSize: "8.5x11",
    colorMode: "color",
    lulu: {
      bindingType: "perfect",
      paperWeight: "70lb",
      headerFooter: {
        headerLeft: "{chapter}",
        headerRight: "{book}",
        footerLeft: "{author}",
        footerCenter: "{page}",
        footerRight: "© 2026",
        font: "helvetica",
        fontSize: 9,
        alternateLeftRight: true
      }
    }
  }
});
```

## 🎨 Customization

### Custom Header/Footer Variables

Available variables for Lulu headers/footers:
- `{page}` - Current page number
- `{chapter}` - Current chapter title
- `{book}` - Book title
- `{author}` - Author name

### Layout Customization

All generators respect the layout settings from `LayoutArtifactContent`:
- Margins (top, bottom, inside, outside)
- Line height
- Font sizes
- Paragraph spacing

## 🐛 Validation & Error Handling

All exports include comprehensive validation:

```typescript
const results = await publishBook({ ... });

results.forEach(result => {
  if (!result.validation.passed) {
    console.error('Validation failed:', result.validation.errors);
  }
  
  if (result.validation.warnings.length > 0) {
    console.warn('Warnings:', result.validation.warnings);
  }
});
```

**Common Warnings:**
- Page count below KDP minimum (24 pages)
- Spine width too narrow for text (< 0.06")
- Image loading failures
- Missing ISBN

## 📚 Documentation

- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Complete integration instructions
- **[Type Definitions](./types.ts)** - Full TypeScript API reference
- **[Test Suite](../../test_publishing_phase1.mjs)** - Test examples and validation

## 🔗 External Resources

- [KDP Print Specifications](https://kdp.amazon.com/en_US/help/topic/G201834180)
- [Lulu Print Requirements](https://www.lulu.com/create/books)
- [Apple Books Asset Guide](https://help.apple.com/itc/booksassetguide/)
- [EPUB 3.3 Specification](https://www.w3.org/TR/epub-33/)
- [WCAG 2.0 Guidelines](https://www.w3.org/WAI/WCAG20/quickref/)

## 🎯 Roadmap

### Phase 2 (Future)
- [ ] IngramSpark PDF export
- [ ] Draft2Digital EPUB export
- [ ] Interactive EPUB with multimedia
- [ ] Fixed-layout EPUB for illustrated books
- [ ] Print preview mode
- [ ] Cover template generator
- [ ] Batch processing UI
- [ ] Cloud storage integration (S3, Cloudinary)

## 📄 License

Part of NoorStudio - Islamic Children's Book Publisher

---

**Version:** 1.0.0  
**Last Updated:** February 5, 2026  
**Author:** NoorStudio Development Team
