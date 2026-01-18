/**
 * EPUB Generator
 * Generates EPUB 3.0 compatible files from book content using JSZip
 */

import JSZip from "jszip";
import {
  LayoutArtifactContent,
  CoverArtifactContent,
  ChaptersArtifactContent,
  ChapterArtifactItem,
  IllustrationArtifactContent,
} from "@/lib/types/artifacts";

// ============================================
// Types
// ============================================

export interface EPUBGeneratorInput {
  layout: LayoutArtifactContent;
  cover: CoverArtifactContent;
  chapters: ChaptersArtifactContent;
  illustrations?: IllustrationArtifactContent;
  projectTitle: string;
  authorName?: string;
  language?: string;
  publisher?: string;
}

export interface EPUBGeneratorResult {
  blob: Blob;
  pageCount: number;
  fileSize: number;
}

export interface EPUBGeneratorProgress {
  current: number;
  total: number;
  message: string;
}

// ============================================
// EPUB Structure Templates
// ============================================

const MIMETYPE = "application/epub+zip";

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function generateContentOPF(
  title: string,
  author: string,
  language: string,
  chapters: ChapterArtifactItem[],
  hasImages: boolean,
  coverImageId?: string
): string {
  const uuid = crypto.randomUUID();
  const now = new Date().toISOString();

  const manifestItems: string[] = [
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="css" href="style.css" media-type="text/css"/>`,
  ];

  if (coverImageId) {
    manifestItems.push(`    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>`);
    manifestItems.push(`    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
  }

  chapters.forEach((ch, i) => {
    manifestItems.push(`    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`);
  });

  if (hasImages) {
    chapters.forEach((_, i) => {
      manifestItems.push(`    <item id="img${i + 1}" href="images/chapter${i + 1}.jpg" media-type="image/jpeg"/>`);
    });
  }

  const spineItems: string[] = [];
  if (coverImageId) {
    spineItems.push(`    <itemref idref="cover" linear="no"/>`);
  }
  chapters.forEach((_, i) => {
    spineItems.push(`    <itemref idref="chapter${i + 1}"/>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:publisher>NoorStudio</dc:publisher>
    <meta property="dcterms:modified">${now.split(".")[0]}Z</meta>
  </metadata>
  <manifest>
${manifestItems.join("\n")}
  </manifest>
  <spine toc="ncx">
${spineItems.join("\n")}
  </spine>
</package>`;
}

function generateTocNCX(
  title: string,
  chapters: ChapterArtifactItem[]
): string {
  const uuid = crypto.randomUUID();

  const navPoints = chapters.map((ch, i) => `
    <navPoint id="navpoint${i + 1}" playOrder="${i + 1}">
      <navLabel>
        <text>${escapeXml(ch.title)}</text>
      </navLabel>
      <content src="chapter${i + 1}.xhtml"/>
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

function generateNavXHTML(
  title: string,
  chapters: ChapterArtifactItem[]
): string {
  const tocItems = chapters.map((ch, i) =>
    `        <li><a href="chapter${i + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`;
}

function generateStyleCSS(): string {
  return `/* NoorStudio EPUB Styles */
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

h1 {
  font-size: 1.8em;
  margin-bottom: 0.5em;
  color: #1a1a1a;
  text-align: center;
}

h2 {
  font-size: 1.4em;
  margin-top: 2em;
  margin-bottom: 0.5em;
  color: #2a2a2a;
}

p {
  text-indent: 1.5em;
  margin: 0.5em 0;
  text-align: justify;
}

p:first-of-type {
  text-indent: 0;
}

.chapter-illustration {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1em auto;
}

.cover {
  text-align: center;
  padding: 2em;
}

.cover img {
  max-width: 100%;
  max-height: 100vh;
}

.vocabulary-note {
  font-style: italic;
  color: #666;
  margin: 1em 0;
  padding: 0.5em;
  background: #f9f9f9;
  border-left: 3px solid #ddd;
}
`;
}

function generateCoverXHTML(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body class="cover">
  <img src="images/cover.jpg" alt="${escapeXml(title)}"/>
</body>
</html>`;
}

function generateChapterXHTML(
  chapter: ChapterArtifactItem,
  chapterIndex: number,
  hasImage: boolean
): string {
  // Convert chapter content to paragraphs
  const paragraphs = chapter.content
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `    <p>${escapeXml(p.trim())}</p>`)
    .join("\n");

  const imageElement = hasImage
    ? `    <img class="chapter-illustration" src="images/chapter${chapterIndex + 1}.jpg" alt="Chapter ${chapter.chapterNumber} illustration"/>\n`
    : "";

  const vocabularyNotes = chapter.vocabularyNotes && chapter.vocabularyNotes.length > 0
    ? `    <div class="vocabulary-note">
      <strong>Vocabulary:</strong> ${chapter.vocabularyNotes.map(n => escapeXml(n)).join(", ")}
    </div>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>Chapter ${chapter.chapterNumber}: ${escapeXml(chapter.title)}</h2>
${imageElement}${paragraphs}
${vocabularyNotes}</body>
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

/**
 * Generate an EPUB from book content
 */
export async function generateEPUB(
  input: EPUBGeneratorInput,
  onProgress?: (progress: EPUBGeneratorProgress) => void
): Promise<EPUBGeneratorResult> {
  const {
    cover,
    chapters,
    illustrations,
    projectTitle,
    authorName = "Anonymous",
    language = "en",
  } = input;

  const chapterList = Array.isArray(chapters) ? chapters : [];
  const zip = new JSZip();

  const totalSteps = chapterList.length + 5; // chapters + structure files + images
  let currentStep = 0;

  // 1. Add mimetype (must be first, uncompressed)
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Creating EPUB structure...",
  });
  zip.file("mimetype", MIMETYPE, { compression: "STORE" });

  // 2. Add META-INF/container.xml
  zip.file("META-INF/container.xml", CONTAINER_XML);

  // 3. Add OEBPS content
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Generating table of contents...",
  });

  const hasImages = illustrations && illustrations.length > 0;
  const hasCover = !!cover.frontCoverUrl;

  // content.opf
  zip.file(
    "OEBPS/content.opf",
    generateContentOPF(projectTitle, authorName, language, chapterList, hasImages, hasCover ? "cover-image" : undefined)
  );

  // toc.ncx
  zip.file("OEBPS/toc.ncx", generateTocNCX(projectTitle, chapterList));

  // nav.xhtml
  zip.file("OEBPS/nav.xhtml", generateNavXHTML(projectTitle, chapterList));

  // style.css
  zip.file("OEBPS/style.css", generateStyleCSS());

  // 4. Add cover
  currentStep++;
  if (hasCover) {
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      message: "Adding cover image...",
    });

    zip.file("OEBPS/cover.xhtml", generateCoverXHTML(projectTitle));

    const coverData = await fetchImageAsArrayBuffer(cover.frontCoverUrl!);
    if (coverData) {
      zip.file("OEBPS/images/cover.jpg", coverData);
    }
  }

  // 5. Add chapters
  for (let i = 0; i < chapterList.length; i++) {
    currentStep++;
    onProgress?.({
      current: currentStep,
      total: totalSteps,
      message: `Adding chapter ${i + 1}...`,
    });

    const chapter = chapterList[i];
    const illustration = illustrations?.find(ill => ill.chapterNumber === chapter.chapterNumber);
    const hasChapterImage = !!illustration?.imageUrl;

    zip.file(
      `OEBPS/chapter${i + 1}.xhtml`,
      generateChapterXHTML(chapter, i, hasChapterImage)
    );

    // Add chapter illustration if available
    if (hasChapterImage && illustration?.imageUrl) {
      const imgData = await fetchImageAsArrayBuffer(illustration.imageUrl);
      if (imgData) {
        zip.file(`OEBPS/images/chapter${i + 1}.jpg`, imgData);
      }
    }
  }

  // 6. Generate EPUB blob
  currentStep++;
  onProgress?.({
    current: currentStep,
    total: totalSteps,
    message: "Finalizing EPUB...",
  });

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
  };
}

// ============================================
// Exports
// ============================================

export { MIMETYPE };
