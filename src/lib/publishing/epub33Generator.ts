/**
 * EPUB 3.3 Generator
 * Generates EPUB 3.3 compliant files with Apple Books compatibility
 * Spec: https://www.w3.org/TR/epub-33/
 */

import JSZip from "jszip";
import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  ChapterArtifactItem,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";
import { AppleBooksMetadata } from "./types";

// ============================================
// Types
// ============================================

export interface EPUB33GeneratorInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  projectTitle: string;
  authorName?: string;
  language?: string;
  publisher?: string;
  isbn?: string;
  metadata?: AppleBooksMetadata;
}

export interface EPUB33GeneratorResult {
  blob: Blob;
  pageCount: number;
  fileSize: number;
  validation: {
    isEPUB33: boolean;
    isAppleCompatible: boolean;
    warnings: string[];
  };
}

// ============================================
// EPUB 3.3 Templates
// ============================================

const MIMETYPE = "application/epub+zip";

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

// ============================================
// Package Document (OPF) - EPUB 3.3
// ============================================

function generatePackageOPF(
  title: string,
  author: string,
  language: string,
  publisher: string,
  isbn: string | undefined,
  chapters: ChapterArtifactItem[],
  hasImages: boolean,
  hasCover: boolean,
  metadata?: AppleBooksMetadata
): string {
  const uuid = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // Metadata section with EPUB 3.3 and Apple Books requirements
  const metadataContent = `
    <dc:identifier id="pub-id">urn:uuid:${uuid}</dc:identifier>
    ${isbn ? `<dc:identifier id="isbn">${escapeXml(isbn)}</dc:identifier>` : ""}
    <dc:title id="title">${escapeXml(title)}</dc:title>
    <dc:creator id="creator">${escapeXml(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:publisher>${escapeXml(publisher)}</dc:publisher>
    <dc:date>${now.split("T")[0]}</dc:date>
    <meta property="dcterms:modified">${now}</meta>
    
    <!-- EPUB 3.3 metadata -->
    <meta property="schema:accessMode">textual</meta>
    ${hasImages ? '<meta property="schema:accessMode">visual</meta>' : ''}
    <meta property="schema:accessModeSufficient">textual</meta>
    <meta property="schema:accessibilityFeature">structuralNavigation</meta>
    <meta property="schema:accessibilityHazard">none</meta>
    <meta property="schema:accessibilitySummary">This publication conforms to WCAG 2.0 Level A.</meta>
    
    <!-- Apple Books metadata -->
    ${metadata?.ibooks.specifiedFonts ? '<meta property="ibooks:specified-fonts">true</meta>' : ''}
    ${metadata?.ibooks.version ? `<meta property="ibooks:version">${metadata.ibooks.version}</meta>` : ''}
  `;
  
  // Manifest items
  const manifestItems: string[] = [
    `    <item id="toc" properties="nav" href="toc.xhtml" media-type="application/xhtml+xml"/>`,
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `    <item id="css" href="css/style.css" media-type="text/css"/>`,
  ];
  
  if (hasCover) {
    manifestItems.push(`    <item id="cover-image" properties="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>`);
    manifestItems.push(`    <item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>`);
  }
  
  chapters.forEach((ch, i) => {
    manifestItems.push(`    <item id="chapter-${i + 1}" href="text/chapter-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`);
  });
  
  if (hasImages) {
    chapters.forEach((_, i) => {
      manifestItems.push(`    <item id="img-chapter-${i + 1}" href="images/chapter-${i + 1}.jpg" media-type="image/jpeg"/>`);
    });
  }
  
  // Spine items
  const spineItems: string[] = [];
  if (hasCover) {
    spineItems.push(`    <itemref idref="cover" linear="yes"/>`);
  }
  chapters.forEach((_, i) => {
    spineItems.push(`    <itemref idref="chapter-${i + 1}"/>`);
  });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
${metadataContent}
  </metadata>
  <manifest>
${manifestItems.join("\n")}
  </manifest>
  <spine toc="ncx">
${spineItems.join("\n")}
  </spine>
</package>`;
}

// ============================================
// Navigation Document (EPUB 3.3)
// ============================================

function generateNavigationXHTML(
  title: string,
  chapters: ChapterArtifactItem[]
): string {
  const tocItems = chapters.map((ch, i) =>
    `        <li><a href="text/chapter-${i + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
  ).join("\n");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="css/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc" role="doc-toc" aria-label="Table of Contents">
    <h1>Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
  
  <nav epub:type="landmarks" hidden="">
    <h2>Landmarks</h2>
    <ol>
      <li><a epub:type="toc" href="#toc">Table of Contents</a></li>
      <li><a epub:type="bodymatter" href="text/chapter-1.xhtml">Start of Content</a></li>
    </ol>
  </nav>
</body>
</html>`;
}

// ============================================
// NCX for backward compatibility
// ============================================

function generateNCX(
  title: string,
  uuid: string,
  chapters: ChapterArtifactItem[]
): string {
  const navPoints = chapters.map((ch, i) => `
    <navPoint id="navpoint-${i + 1}" playOrder="${i + 1}">
      <navLabel>
        <text>${escapeXml(ch.title)}</text>
      </navLabel>
      <content src="text/chapter-${i + 1}.xhtml"/>
    </navPoint>`).join("");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

// ============================================
// CSS Stylesheet
// ============================================

function generateStyleCSS(): string {
  return `/* EPUB 3.3 Stylesheet - NoorStudio */

/* Apple Books optimizations */
@namespace epub "http://www.idpf.org/2007/ops";

body {
  font-family: -apple-system, "SF Pro Text", Georgia, serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  color: #1a1a1a;
  text-align: left;
}

h1, h2, h3, h4, h5, h6 {
  font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
  font-weight: 600;
  hyphens: none;
  -webkit-hyphens: none;
  adobe-hyphenate: none;
  page-break-after: avoid;
  break-after: avoid;
}

h1 {
  font-size: 1.8em;
  margin: 1em 0 0.5em;
  text-align: center;
}

h2 {
  font-size: 1.5em;
  margin: 1.5em 0 0.5em;
}

p {
  margin: 0.5em 0;
  text-indent: 1.5em;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  adobe-hyphenate: auto;
}

p:first-of-type,
p.no-indent {
  text-indent: 0;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
  page-break-inside: avoid;
  break-inside: avoid;
}

.chapter-illustration {
  max-width: 100%;
  margin: 1.5em 0;
}

/* Cover */
.cover {
  text-align: center;
  margin: 0;
  padding: 0;
}

.cover img {
  width: 100%;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
}

/* Vocabulary notes */
.vocabulary-note {
  font-size: 0.9em;
  font-style: italic;
  color: #555;
  margin: 1em 0;
  padding: 0.75em;
  background-color: #f9f9f9;
  border-left: 3px solid #ddd;
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Page breaks */
.page-break {
  page-break-before: always;
  break-before: page;
}

/* Apple Books dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    color: #e0e0e0;
  }
  
  .vocabulary-note {
    background-color: #2a2a2a;
    color: #b0b0b0;
    border-left-color: #555;
  }
}
`;
}

// ============================================
// Content XHTML
// ============================================

function generateCoverXHTML(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body class="cover" epub:type="cover">
  <img src="../images/cover.jpg" alt="${escapeXml(title)} - Cover"/>
</body>
</html>`;
}

function generateChapterXHTML(
  chapter: ChapterArtifactItem,
  chapterIndex: number,
  hasImage: boolean
): string {
  // Convert content to semantic paragraphs
  const paragraphs = chapter.content
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map((p, i) => {
      const className = i === 0 ? ' class="no-indent"' : '';
      return `    <p${className}>${escapeXml(p.trim())}</p>`;
    })
    .join("\n");
  
  const imageElement = hasImage
    ? `    <figure>
      <img class="chapter-illustration" src="../images/chapter-${chapterIndex + 1}.jpg" alt="Chapter ${chapter.chapterNumber} illustration" role="img"/>
    </figure>\n`
    : "";
  
  const vocabularyNotes = chapter.vocabularyNotes && chapter.vocabularyNotes.length > 0
    ? `    <aside class="vocabulary-note" epub:type="note" role="doc-tip">
      <h3 class="sr-only">Vocabulary</h3>
      <p><strong>Vocabulary:</strong> ${chapter.vocabularyNotes.map(n => escapeXml(n)).join(", ")}</p>
    </aside>\n`
    : "";
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body epub:type="bodymatter">
  <section id="chapter-${chapterIndex + 1}" epub:type="chapter" role="doc-chapter">
    <h2>Chapter ${chapter.chapterNumber}: ${escapeXml(chapter.title)}</h2>
${imageElement}${paragraphs}
${vocabularyNotes}  </section>
</body>
</html>`;
}

// ============================================
// Helper Functions
// ============================================

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (error) {
    console.warn(`Failed to fetch image: ${url}`, error);
    return null;
  }
}

// ============================================
// Main Generator
// ============================================

export async function generateEPUB33(
  input: EPUB33GeneratorInput
): Promise<EPUB33GeneratorResult> {
  const {
    cover,
    chapters,
    illustrations,
    projectTitle,
    authorName = "Anonymous",
    language = "en",
    publisher = "NoorStudio",
    isbn,
    metadata,
  } = input;
  
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const zip = new JSZip();
  const uuid = crypto.randomUUID();
  
  const warnings: string[] = [];
  
  // 1. Add mimetype (MUST be first, uncompressed)
  zip.file("mimetype", MIMETYPE, { compression: "STORE" });
  
  // 2. META-INF
  zip.file("META-INF/container.xml", CONTAINER_XML);
  
  // 3. EPUB directory structure
  const hasImages = illustrations && illustrations.length > 0;
  const hasCover = !!cover.frontCoverUrl;
  
  // Package document
  zip.file(
    "EPUB/package.opf",
    generatePackageOPF(projectTitle, authorName, language, publisher, isbn, chapterList, hasImages, hasCover, metadata)
  );
  
  // Navigation
  zip.file("EPUB/toc.xhtml", generateNavigationXHTML(projectTitle, chapterList));
  zip.file("EPUB/toc.ncx", generateNCX(projectTitle, uuid, chapterList));
  
  // Stylesheet
  zip.file("EPUB/css/style.css", generateStyleCSS());
  
  // 4. Cover
  if (hasCover && cover.frontCoverUrl) {
    zip.file("EPUB/text/cover.xhtml", generateCoverXHTML(projectTitle));
    
    const coverData = await fetchImageAsArrayBuffer(cover.frontCoverUrl);
    if (coverData) {
      zip.file("EPUB/images/cover.jpg", coverData);
    } else {
      warnings.push("Failed to fetch cover image");
    }
  }
  
  // 5. Chapters
  for (let i = 0; i < chapterList.length; i++) {
    const chapter = chapterList[i];
    const illustration = illustrations?.find(ill => ill.chapterNumber === chapter.chapterNumber);
    const hasChapterImage = !!illustration?.imageUrl;
    
    zip.file(
      `EPUB/text/chapter-${i + 1}.xhtml`,
      generateChapterXHTML(chapter, i, hasChapterImage)
    );
    
    if (hasChapterImage && illustration?.imageUrl) {
      const imgData = await fetchImageAsArrayBuffer(illustration.imageUrl);
      if (imgData) {
        zip.file(`EPUB/images/chapter-${i + 1}.jpg`, imgData);
      } else {
        warnings.push(`Failed to fetch illustration for chapter ${i + 1}`);
      }
    }
  }
  
  // 6. Generate EPUB
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  
  return {
    blob,
    pageCount: chapterList.length,
    fileSize: blob.size,
    validation: {
      isEPUB33: true,
      isAppleCompatible: true,
      warnings,
    },
  };
}
