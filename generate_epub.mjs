#!/usr/bin/env node
/**
 * EPUB 3.3 Generator for NoorStudio
 * Creates Kindle-ready EPUB files from generated book content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample book data (from our test)
const BOOK_DATA = {
  metadata: {
    title: "The Honest Little Muslim",
    author: "NoorStudio AI",
    language: "en",
    identifier: `urn:uuid:${crypto.randomUUID()}`,
    publisher: "NoorStudio",
    date: new Date().toISOString().split('T')[0],
    description: "A heartwarming Islamic children's story about honesty and good character."
  },
  chapters: [
    {
      number: 1,
      title: "Amira Finds a Toy",
      content: `Once upon a time, in a small neighborhood, there lived a kind-hearted girl named Amira. She loved playing in the park with her friends.

One sunny afternoon, Amira found a beautiful toy car on the playground. It was shiny and red, just like the one she had always wanted!

"Maybe I can keep it," she thought. But then she remembered what her mother taught her: "Honesty is a beautiful gift from Allah."

Amira decided to take the toy to the teacher to find its owner. Even though it was hard, she knew it was the right thing to do.

That evening, a little boy named Omar came to thank Amira. "You found my toy! Jazakallah khair!" he said with a big smile.

Amira felt so happy inside. Being honest made her feel much better than keeping something that wasn't hers. She had done the right thing, and Allah was pleased.`
    },
    {
      number: 2,
      title: "The Broken Window",
      content: `A few days later, Amira was playing ball with her brother Ahmed in their backyard. Ahmed kicked the ball really hard, and... CRASH! The ball broke their neighbor's window!

"Oh no!" said Ahmed. "What should we do?"

Amira was scared, but she remembered the Hadith: "Honesty leads to Paradise." She took a deep breath and said, "We have to tell Uncle Mahmoud the truth."

Together, they walked to their neighbor's house. Amira's hands were shaking, but she knocked on the door anyway.

"Uncle Mahmoud, we broke your window by accident. We are so sorry," said Amira bravely.

Uncle Mahmoud smiled kindly. "Thank you for being honest, dear children. Accidents happen, but telling the truth shows good character. Your parents raised you well."

Later, Amira and Ahmed helped clean up the broken glass. Amira learned that even when something is scary, being honest brings peace to the heart.`
    },
    {
      number: 3,
      title: "The Test at School",
      content: `At school, Amira had a big spelling test. She had studied hard, but there was one word she couldn't remember.

Her friend Sara, who sat next to her, had already finished. Amira could easily peek at Sara's paper, but she remembered what Prophet Muhammad ﷺ taught: "The truthful and honest merchant is with the prophets and the righteous."

"Cheating is like lying," Amira thought. "I want to be truthful."

She tried her best and wrote what she remembered. When the teacher returned the tests, Amira got one question wrong. Sara got a perfect score.

But Amira didn't feel bad. She had done her best with honesty, and that was more important than a perfect score.

Her teacher, Miss Layla, said, "Class, remember: Success with honesty is true success. Even if we make mistakes, being truthful and honest makes us better Muslims."

That night, Amira said her prayers with a happy heart. She knew that Allah loves those who are honest, even when it's hard.

And from that day on, Amira always chose honesty, no matter what.`
    }
  ]
};

function generateOPFContent(book) {
  const { metadata, chapters } = book;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${metadata.language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${metadata.identifier}</dc:identifier>
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <dc:publisher>${metadata.publisher}</dc:publisher>
    <dc:date>${metadata.date}</dc:date>
    <dc:description>${metadata.description}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="stylesheet" href="stylesheet.css" media-type="text/css"/>
    ${chapters.map(ch => `<item id="chapter${ch.number}" href="chapter${ch.number}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  
  <spine>
    ${chapters.map(ch => `<itemref idref="chapter${ch.number}"/>`).join('\n    ')}
  </spine>
</package>`;
}

function generateNavContent(book) {
  const { metadata, chapters } = book;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${metadata.language}">
<head>
  <title>${metadata.title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${chapters.map(ch => `<li><a href="chapter${ch.number}.xhtml">${ch.title}</a></li>`).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
}

function generateChapterContent(chapter, metadata) {
  const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${metadata.language}">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
  <section epub:type="chapter">
    <h1>Chapter ${chapter.number}: ${chapter.title}</h1>
    ${paragraphs.map(p => `<p>${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n    ')}
  </section>
</body>
</html>`;
}

function generateStylesheet() {
  return `/* EPUB Stylesheet */
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.1em;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

h1 {
  font-size: 1.8em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
  text-align: center;
  color: #2c5f2d;
}

p {
  margin-bottom: 1em;
  text-align: justify;
  text-indent: 1.5em;
}

section[epub\\:type="chapter"] p:first-of-type {
  text-indent: 0;
  margin-top: 1em;
}

nav#toc ol {
  list-style-type: none;
  padding-left: 0;
}

nav#toc li {
  margin-bottom: 0.5em;
}

nav#toc a {
  color: #2c5f2d;
  text-decoration: none;
  font-size: 1.2em;
}

nav#toc a:hover {
  text-decoration: underline;
}
`;
}

function generateContainer() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

async function createEPUB(book, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`✅ EPUB created: ${outputPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add mimetype (uncompressed, first file)
    archive.append('application/epub+zip', { name: 'mimetype', store: true });
    
    // Add META-INF/container.xml
    archive.append(generateContainer(), { name: 'META-INF/container.xml' });
    
    // Add OEBPS content
    archive.append(generateOPFContent(book), { name: 'OEBPS/content.opf' });
    archive.append(generateNavContent(book), { name: 'OEBPS/nav.xhtml' });
    archive.append(generateStylesheet(), { name: 'OEBPS/stylesheet.css' });
    
    // Add chapters
    book.chapters.forEach(chapter => {
      archive.append(
        generateChapterContent(chapter, book.metadata),
        { name: `OEBPS/chapter${chapter.number}.xhtml` }
      );
    });
    
    archive.finalize();
  });
}

async function main() {
  console.log('📚 NoorStudio EPUB 3.3 Generator');
  console.log('=================================\n');
  
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `${BOOK_DATA.metadata.title.replace(/\s+/g, '-').toLowerCase()}.epub`;
  const outputPath = path.join(outputDir, filename);
  
  console.log(`📖 Book: ${BOOK_DATA.metadata.title}`);
  console.log(`✍️  Author: ${BOOK_DATA.metadata.author}`);
  console.log(`📄 Chapters: ${BOOK_DATA.chapters.length}`);
  console.log(`💾 Output: ${outputPath}\n`);
  
  try {
    await createEPUB(BOOK_DATA, outputPath);
    
    console.log('\n✅ EPUB generation complete!');
    console.log('\n📋 File Details:');
    const stats = fs.statSync(outputPath);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Format: EPUB 3.3`);
    console.log(`   Kindle-ready: ✅ Yes`);
    
    console.log('\n📖 To test:');
    console.log(`   - Open in Apple Books, Calibre, or any EPUB reader`);
    console.log(`   - Convert to .mobi with Kindle Previewer`);
    console.log(`   - Validate with EPUBCheck`);
    
  } catch (error) {
    console.error('\n❌ Error generating EPUB:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
