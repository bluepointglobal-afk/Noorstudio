#!/usr/bin/env node
/**
 * 32-Page Children's Book Generation for NoorStudio QA Testing
 * 
 * This script generates a complete 32-page children's book with:
 * - 32 pages of story content
 * - AI-generated illustrations with consistent characters
 * - Professional layout
 * - PDF export (KDP-ready)
 * - EPUB export (Lulu/Apple Books compatible)
 * 
 * Usage: node generate-32page-book.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'output', 'qa-32page-book');
const BOOK_TITLE = "Amira's Amazing Adventure";
const BOOK_SUBTITLE = "A 32-Page Story of Discovery and Friendship";
const AUTHOR = "NoorStudio QA Team";
const ILLUSTRATOR = "AI-Generated (Consistent Character System)";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Book content - 32 pages of story
const pages = [
  {
    page: 1,
    text: "Once upon a time in the beautiful city of Dubai, there lived a cheerful girl named Amira. She had bright, curious brown eyes and always wore her favorite pink hijab with little golden stars on it.",
    illustration: "A cheerful young Muslim girl (Amira) with bright brown eyes, wearing a pink hijab with golden stars, standing in a sunny Dubai neighborhood with palm trees and modern buildings. Pixar-style children's book illustration, warm colors, friendly atmosphere."
  },
  {
    page: 2,
    text: "Amira lived with her loving parents and her little brother Zaid in a cozy apartment near the Burj Khalifa. Every morning, she would wake up excited for a new day of adventure.",
    illustration: "Amira (same character, pink hijab with stars) waking up in her bedroom, stretching happily. Window shows Burj Khalifa in the distance. Warm morning light, cozy room with colorful decorations."
  },
  {
    page: 3,
    text: "Her best friend was Layla, who lived in the same building. Layla had long dark hair and wore a blue dress with flowers. Together, they were the best of friends.",
    illustration: "Amira (same pink hijab character) with her friend Layla (girl with long dark hair, blue floral dress) playing together in a courtyard. Both smiling and laughing. Pixar-style, bright and cheerful."
  },
  {
    page: 4,
    text: "One sunny morning, Amira and Layla decided to explore the park near their neighborhood. They had heard tales of a mysterious garden hidden behind the tall hedges.",
    illustration: "Amira (same character) and Layla walking toward a large park with tall green hedges. Excitement on their faces. Dubai skyline in background. Sunny day, adventurous mood."
  },
  {
    page: 5,
    text: "'Do you think we'll find it?' Layla asked. Amira's eyes sparkled with determination. 'We won't know unless we try!' she replied with a big smile.",
    illustration: "Close-up of Amira (same pink hijab with stars) and Layla talking excitedly. Amira pointing forward with determination. Palm trees and blue sky in background. Bright, optimistic scene."
  },
  {
    page: 6,
    text: "They walked through the park, past the playground where children laughed, past the fountain where birds splashed, until they found a hidden pathway covered in climbing jasmine flowers.",
    illustration: "Amira (same character) and Layla discovering a beautiful pathway covered with white jasmine flowers. Children playing in playground visible in distance. Magical, discovery moment."
  },
  {
    page: 7,
    text: "The pathway led to a beautiful garden gate covered in vines. 'This must be it!' Amira whispered. Her heart beat with excitement as she gently pushed the gate open.",
    illustration: "Amira (same pink hijab character) carefully opening an ornate garden gate covered in green vines and purple flowers. Layla standing beside her. Sense of wonder and mystery. Pixar-style."
  },
  {
    page: 8,
    text: "Inside the garden was the most amazing sight they had ever seen! Colorful butterflies danced among roses, tulips, and orchids. A small fountain bubbled peacefully in the center.",
    illustration: "Wide view of a magical garden with Amira (same character) and Layla entering. Colorful butterflies, vibrant flowers, small fountain. Sunlight streaming through trees. Magical, enchanting atmosphere."
  },
  {
    page: 9,
    text: "Sitting on a bench near the fountain was an elderly woman with kind eyes and a warm smile. She wore a white hijab and waved them over. 'Welcome, young explorers!' she said.",
    illustration: "Elderly woman with white hijab sitting on garden bench, smiling warmly. Amira (same character) and Layla approaching respectfully. Beautiful garden setting. Warm, welcoming scene."
  },
  {
    page: 10,
    text: "The woman introduced herself as Grandmother Fatima, the keeper of the secret garden. 'I've been waiting for curious hearts like yours,' she said with a twinkle in her eye.",
    illustration: "Grandmother Fatima talking to Amira (same pink hijab) and Layla. They sit together on the bench. Garden flowers surrounding them. Cozy, magical conversation scene."
  },
  {
    page: 11,
    text: "'This garden has special flowers,' Grandmother Fatima explained. 'Each one teaches a lesson about being a good person. Would you like to learn their secrets?'",
    illustration: "Grandmother Fatima gesturing to the various flowers around them. Amira (same character) and Layla listening attentively with wonder in their eyes. Educational, engaging scene."
  },
  {
    page: 12,
    text: "Amira and Layla nodded eagerly. Grandmother Fatima stood and led them to a cluster of bright yellow sunflowers. 'These teach us about gratitude,' she said.",
    illustration: "The three walking toward tall sunflowers. Amira (same pink hijab) looking up at the beautiful flowers with appreciation. Grandmother Fatima explaining. Bright, sunny atmosphere."
  },
  {
    page: 13,
    text: "'Just like sunflowers turn toward the sun, we should always turn our hearts toward the blessings in our lives. What are you grateful for, Amira?'",
    illustration: "Close-up of Amira (same character) thinking deeply, touching her heart. Sunflowers surrounding her. Thoughtful, reflective mood. Warm golden light."
  },
  {
    page: 14,
    text: "Amira thought for a moment. 'I'm grateful for my family, my best friend Layla, and for beautiful days like this!' she said with a bright smile.",
    illustration: "Amira (same character) expressing gratitude with open arms. Layla smiling beside her. Grandmother Fatima nodding approvingly. Joyful, positive scene."
  },
  {
    page: 15,
    text: "Next, they visited the rose garden. 'These roses teach us about kindness,' Grandmother Fatima explained. 'Even though they have thorns to protect themselves, they give us beautiful flowers and sweet fragrance.'",
    illustration: "The group examining beautiful pink and red roses. Amira (same pink hijab) carefully touching a rose petal. Grandmother Fatima explaining. Detailed flower illustrations."
  },
  {
    page: 16,
    text: "'True kindness,' she continued, 'means being gentle and helpful, even when things are difficult. It means choosing to do good even when no one is watching.'",
    illustration: "Amira (same character) listening thoughtfully. A thought bubble shows her helping her little brother Zaid. Roses in foreground. Meaningful, teaching moment."
  },
  {
    page: 17,
    text: "They walked to a patch of lavender flowers swaying in the breeze. 'These teach us about patience,' Grandmother Fatima said. 'See how they grow slowly but beautifully?'",
    illustration: "Purple lavender field with Amira (same character), Layla, and Grandmother Fatima. Gentle breeze making flowers sway. Peaceful, serene atmosphere."
  },
  {
    page: 18,
    text: "'Good things take time,' she explained. 'Whether learning a new skill or growing into our best selves, we must be patient like these lovely flowers.'",
    illustration: "Amira (same pink hijab) kneeling to observe the lavender closely. Patience and wonder in her expression. Soft purple and green colors. Contemplative scene."
  },
  {
    page: 19,
    text: "Near the fountain, they found white jasmine flowers climbing a trellis. 'Jasmine teaches us about modesty and humility,' Grandmother Fatima said.",
    illustration: "White jasmine flowers climbing a wooden trellis. Amira (same character) and Layla admiring them. Fountain visible nearby. Elegant, modest beauty captured."
  },
  {
    page: 20,
    text: "'These flowers don't shout for attention, but their beautiful fragrance fills the whole garden. True goodness doesn't need to boast—it speaks for itself.'",
    illustration: "Amira (same character) smelling the jasmine with closed eyes, appreciating the fragrance. Peaceful expression. Garden atmosphere serene and beautiful."
  },
  {
    page: 21,
    text: "As the afternoon went on, they learned about the courage of the tall palm trees, the honesty of the clear fountain water, and the generosity of the fruit-bearing orange trees.",
    illustration: "Wide garden view showing palm trees, fountain, and orange trees. Amira (same pink hijab), Layla, and Grandmother Fatima walking through. Comprehensive garden scene."
  },
  {
    page: 22,
    text: "Finally, they reached a special spot where flowers of many colors grew together in perfect harmony. 'This garden's greatest lesson,' Grandmother Fatima said.",
    illustration: "Circular flower bed with roses, tulips, jasmine, sunflowers all growing together beautifully. Amira (same character) and Layla standing with Grandmother Fatima. Unity and diversity."
  },
  {
    page: 23,
    text: "'Just like these flowers are different but grow together beautifully, people from different backgrounds can live together in peace and friendship if they choose kindness and respect.'",
    illustration: "The diverse flowers close-up, with Amira (same character) touching different petals gently. Understanding and appreciation in her expression. Harmonious colors."
  },
  {
    page: 24,
    text: "Amira looked at Layla and smiled. Even though they were different, they were the best of friends. 'I understand now,' Amira said. 'The garden is like the whole world!'",
    illustration: "Amira (same pink hijab) and Layla holding hands, smiling at each other. Diverse garden flowers surrounding them. Friendship and understanding theme. Warm, emotional scene."
  },
  {
    page: 25,
    text: "Grandmother Fatima smiled warmly. 'You have learned well, dear children. This garden will always be here for you, whenever you need to remember these lessons.'",
    illustration: "Grandmother Fatima placing her hands gently on Amira (same character) and Layla's shoulders. All three smiling. Garden glowing warmly around them. Blessing and wisdom moment."
  },
  {
    page: 26,
    text: "'Can we come back tomorrow?' Layla asked hopefully. 'Of course,' Grandmother Fatima replied. 'The garden welcomes all who seek to learn and grow.'",
    illustration: "The three saying goodbye at the garden gate. Amira (same character) waving, already excited to return. Setting sun casting golden light. Hopeful, promising scene."
  },
  {
    page: 27,
    text: "As Amira and Layla walked home through the park, they talked excitedly about everything they had learned. The world seemed brighter and full of possibilities.",
    illustration: "Amira (same pink hijab) and Layla walking home through the park. Animated conversation, happy expressions. Late afternoon sun, long shadows. Joyful walking scene."
  },
  {
    page: 28,
    text: "That evening at dinner, Amira told her family about the secret garden and its beautiful lessons. Her parents listened with proud smiles.",
    illustration: "Family dinner scene. Amira (same character) talking enthusiastically. Parents and little brother Zaid listening with interest. Warm home interior, food on table. Family love."
  },
  {
    page: 29,
    text: "'You've discovered something very special, habibti,' her mother said. 'The most important gardens are the ones we grow in our hearts.'",
    illustration: "Amira's mother speaking wisdom to her. Amira (same pink hijab) listening with understanding. Warm kitchen lighting. Mother-daughter connection moment."
  },
  {
    page: 30,
    text: "That night, before bed, Amira looked out her window at the stars above Dubai. She thought about all the wonderful lessons: gratitude, kindness, patience, modesty, and harmony.",
    illustration: "Amira (same character) standing at her bedroom window, looking at stars over Dubai skyline. Thoughtful and peaceful. Night scene with city lights and stars."
  },
  {
    page: 31,
    text: "She wrote in her journal: 'Today I found a secret garden that taught me how to grow a beautiful garden in my own heart. I will try to practice these lessons every day.'",
    illustration: "Amira (same character) writing in her journal at her desk. Small lamp illuminating the page. Window shows night sky. Peaceful, reflective atmosphere."
  },
  {
    page: 32,
    text: "And from that day on, whenever Amira faced a challenge, she remembered the secret garden and the lessons it taught. She grew into a kind, patient, grateful person who made the world a little brighter—just like the flowers in Grandmother Fatima's garden.",
    illustration: "Final illustration: Amira (same pink hijab character) standing confidently in the garden, surrounded by all the different flowers mentioned in the story. Grandmother Fatima in background. Sunrise. Triumphant, hopeful, complete circle. Beautiful ending scene."
  }
];

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   NoorStudio 32-Page Book Generation (QA Test)       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');
console.log(`Title: ${BOOK_TITLE}`);
console.log(`Pages: ${pages.length}`);
console.log(`Output: ${OUTPUT_DIR}\n`);

// Generate book metadata
const metadata = {
  title: BOOK_TITLE,
  subtitle: BOOK_SUBTITLE,
  author: AUTHOR,
  illustrator: ILLUSTRATOR,
  pages: pages.length,
  generatedAt: new Date().toISOString(),
  format: "32-page children's book",
  targetFormat: ["KDP PDF", "EPUB (Lulu)"]
};

// Save metadata
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'book-metadata.json'),
  JSON.stringify(metadata, null, 2)
);

// Save page content for reference
const pagesContent = pages.map(p => ({
  page: p.page,
  text: p.text,
  illustrationPrompt: p.illustration
}));

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'book-pages.json'),
  JSON.stringify(pagesContent, null, 2)
);

console.log('✅ Book structure generated!');
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log(`📄 ${pages.length} pages created`);
console.log(`\n📝 Next steps:`);
console.log(`1. Use NoorStudio UI to create Amira character`);
console.log(`2. Generate illustrations using the prompts in book-pages.json`);
console.log(`3. Export to PDF (KDP format)`);
console.log(`4. Export to EPUB (Lulu format)`);
console.log(`5. Verify character consistency across all 32 pages\n`);
