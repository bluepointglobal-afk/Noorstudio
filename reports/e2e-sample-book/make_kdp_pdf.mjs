import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jsPDF } from "jspdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------
// Helpers
// --------------------------------------------
function readFileAsDataURL(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
  const buf = fs.readFileSync(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function addFullPageImage(doc, dataUrl, w, h) {
  // jsPDF requires a format hint sometimes
  const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
  doc.addImage(dataUrl, fmt, 0, 0, w, h);
}

function addHeader(doc, text, x, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(text, x, y);
}

function addBody(doc, text, x, y, maxWidth, lineHeight, fontSize = 12) {
  doc.setFont("times", "normal");
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line, idx) => {
    doc.text(line, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function addFooterPageNumber(doc, pageNum, pageW, pageH) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(String(pageNum), pageW / 2, pageH - 24, { align: "center" });
}

// --------------------------------------------
// KDP-ish settings (demo)
// --------------------------------------------
// Use a KDP-supported trim size from NoorStudio's generator list.
// 8.5x11" (Letter). This PDF is "print-ready" in the sense that it is sized correctly.
// If you need full-bleed, add 0.125" bleed and keep text inside safe margins.
const INCH = 72;
const TRIM = { w: 8.5 * INCH, h: 11 * INCH };

const MARGINS = { top: 60, bottom: 60, inner: 72, outer: 54 };
const LINE_H = 18;

const ASSETS_ROOT = path.resolve(__dirname, "../../public/demo");
const spread1 = readFileAsDataURL(path.join(ASSETS_ROOT, "spreads/spread-1.png"));
const spread2 = readFileAsDataURL(path.join(ASSETS_ROOT, "spreads/spread-2.png"));
// Note: demo bundle contains spread-1 and spread-2 only.
const spread3 = spread1;
const coverArt = readFileAsDataURL(path.join(ASSETS_ROOT, "covers/ramadan-amira.png"));

// --------------------------------------------
// Story content (age 8-12)
// --------------------------------------------
const title = "Amina and the Masjid Mystery";
const subtitle = "A gentle detective story for curious kids";
const author = "Noor Studio Sample";

const blurb =
  "When something small goes missing at the neighborhood masjid, Amina—nine years old and already a careful thinker—decides to investigate. " +
  "With respectful manners, sharp eyes, and a notebook full of clues, she learns that the best mysteries are solved with honesty, patience, and teamwork.";

const authorBio =
  "Noor Studio Sample creates faith-friendly stories that celebrate curiosity, kindness, and good character. " +
  "Our books aim to reflect everyday Muslim life with warmth and respectful adab.";

const chapters = [
  {
    t: "Chapter 1 — The Missing Library Card",
    img: spread1,
    txt:
      "On Saturday morning, Amina tied her navy hijab and checked her detective notebook. “Bismillah,” she whispered, ready for the day.\n\n" +
      "At the masjid, she helped set out slippers neatly and greeted everyone with a soft voice. After Qur’an class, the librarian Auntie Salma frowned. “My library card is gone,” she said.\n\n" +
      "Amina’s eyes widened—not in panic, but in focus. “May I help look for it?” she asked politely. Auntie Salma nodded. Amina wrote her first clue: LAST SEEN—ON THE DESK." 
  },
  {
    t: "Chapter 2 — Clues in Quiet Places",
    img: spread2,
    txt:
      "Amina walked slowly, as if the hallway itself could speak. She remembered the masjid rules: be clean, be calm, and be kind.\n\n" +
      "She noticed a tiny trail of paper bits near the shoe shelves. Not trash—more like little torn corners. She didn’t touch them yet. She took a picture with her eyes and drew the shape in her notebook.\n\n" +
      "“We should ask before moving anything,” she reminded herself. Amina found the custodian Uncle Kareem. “Assalamu alaikum. May I check the lost-and-found box with you?”\n\n" +
      "Together they opened it. No card. But Amina spotted something else: a sticky note that read, PLEASE RETURN AFTER DUHR." 
  },
  {
    t: "Chapter 3 — The “Mystery” Gets Smaller",
    img: spread3,
    txt:
      "Amina’s friend Yusuf wanted to help. “Maybe a jinn took it!” he whispered. Amina shook her head gently.\n\n" +
      "“Let’s not guess scary things,” she said. “Most problems have normal answers.”\n\n" +
      "They retraced steps: the desk, the bookshelf, the carpet line. Amina looked for what was different. Then she noticed the desk drawer was slightly open, as if someone had bumped it.\n\n" +
      "With Auntie Salma watching, Amina slid the drawer out. Inside was the library card—stuck to a piece of tape meant for labeling books.\n\n" +
      "Auntie Salma laughed with relief. “Alhamdulillah! I must have set it down and the tape caught it.”" 
  },
  {
    t: "Chapter 4 — A Better System",
    img: spread2,
    txt:
      "Amina didn’t celebrate like a superhero. She just smiled and wrote: SOLVED—BY CAREFUL THINKING.\n\n" +
      "“Can we make it easier next time?” she asked. Together, they made a small ‘Library Tools’ tray: card, pens, tape, labels—each with its place.\n\n" +
      "Before leaving, Amina made a quiet du’a: “O Allah, help me be honest and helpful.”\n\n" +
      "As the sun warmed the sidewalk, Yusuf grinned. “Okay,” he admitted, “normal answers are pretty great.” Amina tapped her notebook. “That’s the detective way.”" 
  }
];

// --------------------------------------------
// Build PDF
// --------------------------------------------
const doc = new jsPDF({ unit: "pt", format: [TRIM.w, TRIM.h] });

let logicalPageNum = 0;

// Front cover
addFullPageImage(doc, coverArt, TRIM.w, TRIM.h);
// Title overlay for a more "designed" look
{
  doc.setFillColor(0, 0, 0);
  doc.setGState?.(new doc.GState({ opacity: 0.35 }));
  doc.rect(0, TRIM.h * 0.62, TRIM.w, TRIM.h * 0.38, "F");
  doc.setGState?.(new doc.GState({ opacity: 1 }));

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(title, TRIM.w / 2, TRIM.h * 0.72, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(subtitle, TRIM.w / 2, TRIM.h * 0.77, { align: "center" });

  doc.setFontSize(12);
  doc.text(author, TRIM.w / 2, TRIM.h * 0.83, { align: "center" });

  doc.setTextColor(0, 0, 0);
}

// Title page
doc.addPage();
logicalPageNum++;
{
  const x = MARGINS.inner;
  addHeader(doc, title, x, TRIM.h * 0.30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(subtitle, x, TRIM.h * 0.30 + 36);

  doc.setFontSize(12);
  doc.text(`By ${author}`, x, TRIM.h * 0.30 + 70);

  addFooterPageNumber(doc, logicalPageNum, TRIM.w, TRIM.h);
}

// Copyright page
doc.addPage();
logicalPageNum++;
{
  const x = MARGINS.inner;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const text =
    `Copyright © ${new Date().getFullYear()} ${author}\n\n` +
    "All rights reserved.\n\n" +
    "This is a demo book generated for NoorStudio end-to-end testing.\n" +
    "No part of this publication may be reproduced without permission.";
  addBody(doc, text, x, TRIM.h * 0.25, TRIM.w - MARGINS.inner - MARGINS.outer, 16, 11);

  addFooterPageNumber(doc, logicalPageNum, TRIM.w, TRIM.h);
}

// Chapters
for (let i = 0; i < chapters.length; i++) {
  const ch = chapters[i];

  // Illustration page
  doc.addPage();
  logicalPageNum++;
  {
    // full-width image near top
    const imgH = 280;
    const imgW = TRIM.w - MARGINS.inner - MARGINS.outer;
    const x = MARGINS.inner;
    const y = MARGINS.top;

    const fmt = ch.img.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(ch.img, fmt, x, y, imgW, imgH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(ch.t, x, y + imgH + 36);

    doc.setDrawColor(220);
    doc.line(x, y + imgH + 44, x + imgW, y + imgH + 44);

    addFooterPageNumber(doc, logicalPageNum, TRIM.w, TRIM.h);
  }

  // Text page
  doc.addPage();
  logicalPageNum++;
  {
    const isLeft = logicalPageNum % 2 === 0; // approximate; only affects inner/outer
    const x = isLeft ? MARGINS.outer : MARGINS.inner;
    const right = isLeft ? MARGINS.inner : MARGINS.outer;
    const maxW = TRIM.w - x - right;

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    let y = MARGINS.top;
    y = addBody(doc, ch.txt, x, y, maxW, LINE_H, 12) + 10;

    addFooterPageNumber(doc, logicalPageNum, TRIM.w, TRIM.h);
  }
}

// The End
doc.addPage();
logicalPageNum++;
{
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("THE END", TRIM.w / 2, TRIM.h / 2, { align: "center" });
  addFooterPageNumber(doc, logicalPageNum, TRIM.w, TRIM.h);
}

// Back cover
doc.addPage();
addFullPageImage(doc, coverArt, TRIM.w, TRIM.h);
{
  // white panel
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(230);
  doc.roundedRect(54, 90, TRIM.w - 108, TRIM.h - 180, 12, 12, "FD");

  const x = 80;
  const maxW = TRIM.w - 160;

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Back Cover", x, 130);

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  let y = 160;
  y = addBody(doc, blurb, x, y, maxW, 18, 12) + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("About the Author", x, y);
  y += 18;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  y = addBody(doc, authorBio, x, y, maxW, 18, 12) + 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("noorstudio.ai (sample)", x, TRIM.h - 110);
}

const outPath = path.resolve(__dirname, "Amina_and_the_Masjid_Mystery_KDP.pdf");
const pdfBytes = doc.output("arraybuffer");
fs.writeFileSync(outPath, Buffer.from(pdfBytes));

console.log(`Wrote PDF: ${outPath}`);
console.log(`Pages: ${doc.getNumberOfPages()}`);
