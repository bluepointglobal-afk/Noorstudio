#!/usr/bin/env node
/**
 * Create EPUB from HTML content
 * Simple EPUB 3.0 generator without dependencies
 */

import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOK_DIR = path.join(__dirname, 'output', '32page-book-complete');
const EPUB_DIR = path.join(BOOK_DIR, 'epub-temp');
const OUTPUT_EPUB = path.join(BOOK_DIR, 'Amiras-Amazing-Adventure.epub');

console.log('📱 Creating EPUB 3.0 package...\n');

// Clean and create temp directory
if (fs.existsSync(EPUB_DIR)) {
  fs.rmSync(EPUB_DIR, { recursive: true });
}
fs.mkdirSync(EPUB_DIR, { recursive: true });
fs.mkdirSync(path.join(EPUB_DIR, 'META-INF'), { recursive: true });
fs.mkdirSync(path.join(EPUB_DIR, 'OEBPS'), { recursive: true });
fs.mkdirSync(path.join(EPUB_DIR, 'OEBPS', 'images'), { recursive: true });

// Load metadata
const metadata = JSON.parse(fs.readFileSync(path.join(BOOK_DIR, 'book-metadata.json'), 'utf-8'));

// 1. mimetype (must be first, uncompressed)
await fsPromises.writeFile(path.join(EPUB_DIR, 'mimetype'), 'application/epub+zip');
console.log('✓ mimetype');

// 2. META-INF/container.xml
const containerXML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

await fsPromises.writeFile(path.join(EPUB_DIR, 'META-INF', 'container.xml'), containerXML);
console.log('✓ META-INF/container.xml');

// 3. Copy images
const imagesDir = path.join(BOOK_DIR, 'images');
const images = fs.readdirSync(imagesDir);
for (const img of images) {
  const src = path.join(imagesDir, img);
  const dest = path.join(EPUB_DIR, 'OEBPS', 'images', img);
  await fsPromises.copyFile(src, dest);
}
console.log(`✓ Copied ${images.length} images`);

// 4. OEBPS/content.opf (package document)
const imageManifest = images.map((img, i) => {
  const ext = path.extname(img).substring(1);
  const mediaType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
  return `    <item id="img${i+1}" href="images/${img}" media-type="${mediaType}"/>`;
}).join('\n');

const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="book-id">noorstudio-${Date.now()}</dc:identifier>
    <dc:publisher>NoorStudio</dc:publisher>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
    <dc:description>${metadata.subtitle}</dc:description>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${imageManifest}
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;

await fsPromises.writeFile(path.join(EPUB_DIR, 'OEBPS', 'content.opf'), contentOPF);
console.log('✓ OEBPS/content.opf');

// 5. OEBPS/content.xhtml (main content)
const htmlContent = fs.readFileSync(path.join(BOOK_DIR, 'book-epub.html'), 'utf-8');
await fsPromises.writeFile(path.join(EPUB_DIR, 'OEBPS', 'content.xhtml'), htmlContent);
console.log('✓ OEBPS/content.xhtml');

// 6. OEBPS/nav.xhtml (EPUB 3 navigation)
const navXHTML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="content.xhtml">Cover</a></li>
      <li><a href="content.xhtml">Story</a></li>
    </ol>
  </nav>
</body>
</html>`;

await fsPromises.writeFile(path.join(EPUB_DIR, 'OEBPS', 'nav.xhtml'), navXHTML);
console.log('✓ OEBPS/nav.xhtml');

// 7. OEBPS/toc.ncx (EPUB 2 backward compatibility)
const tocNCX = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="noorstudio-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle>
    <text>${metadata.title}</text>
  </docTitle>
  <navMap>
    <navPoint id="content">
      <navLabel><text>${metadata.title}</text></navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

await fsPromises.writeFile(path.join(EPUB_DIR, 'OEBPS', 'toc.ncx'), tocNCX);
console.log('✓ OEBPS/toc.ncx\n');

// 8. Package into EPUB (ZIP with specific requirements)
console.log('📦 Packaging EPUB...\n');

// Remove old EPUB if exists
if (fs.existsSync(OUTPUT_EPUB)) {
  fs.unlinkSync(OUTPUT_EPUB);
}

// Use Node.js built-in to create ZIP
// EPUB requires: mimetype first (uncompressed), then everything else
const { execSync } = await import('child_process');

try {
  // Create EPUB using zip command
  process.chdir(EPUB_DIR);
  
  // Add mimetype (uncompressed, must be first)
  execSync('zip -0 -X ../Amiras-Amazing-Adventure.epub mimetype', { stdio: 'ignore' });
  
  // Add META-INF and OEBPS
  execSync('zip -r ../Amiras-Amazing-Adventure.epub META-INF OEBPS', { stdio: 'ignore' });
  
  process.chdir(__dirname);
  
  const epubStats = await fsPromises.stat(OUTPUT_EPUB);
  console.log(`✅ EPUB created: Amiras-Amazing-Adventure.epub`);
  console.log(`   Size: ${Math.round(epubStats.size / 1024)} KB\n`);
  
  // Verify EPUB structure
  console.log('🔍 Verifying EPUB structure...');
  const zipList = execSync(`unzip -l "${OUTPUT_EPUB}"`, { encoding: 'utf-8' });
  const hasRequired = 
    zipList.includes('mimetype') &&
    zipList.includes('container.xml') &&
    zipList.includes('content.opf') &&
    zipList.includes('content.xhtml');
  
  if (hasRequired) {
    console.log('✅ EPUB structure valid!\n');
  } else {
    console.log('⚠️  EPUB may have structure issues\n');
  }
  
} catch (error) {
  console.error(`❌ EPUB packaging failed: ${error.message}`);
  console.error('   Trying alternative method...\n');
  
  // Try using archiver if zip command fails
  const output = createWriteStream(OUTPUT_EPUB);
  const archive = archiver('zip', { 
    zlib: { level: 9 },
    store: true // No compression for mimetype
  });
  
  output.on('close', () => {
    console.log(`✅ EPUB created: ${archive.pointer()} bytes\n`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add mimetype without compression
  archive.file(path.join(EPUB_DIR, 'mimetype'), { 
    name: 'mimetype',
    store: true 
  });
  
  // Add everything else
  archive.directory(path.join(EPUB_DIR, 'META-INF'), 'META-INF');
  archive.directory(path.join(EPUB_DIR, 'OEBPS'), 'OEBPS');
  
  await archive.finalize();
}

// Cleanup temp directory
fs.rmSync(EPUB_DIR, { recursive: true });
console.log('✅ Cleaned up temporary files\n');

console.log('═══════════════════════════════════════════════════════');
console.log('✅ EPUB GENERATION COMPLETE!');
console.log('═══════════════════════════════════════════════════════\n');
console.log('📱 EPUB file ready for:');
console.log('   • Apple Books');
console.log('   • Lulu Publishing');
console.log('   • Google Play Books');
console.log('   • Kobo\n');
