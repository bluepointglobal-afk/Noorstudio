//   - noorstudio.kb.v1 (knowledge bases list)
//   - noorstudio.kb.items.v1.<kbId> (items per KB)

import { KnowledgeBaseSchema, KnowledgeBaseItemSchema } from "@/lib/validation/schemas";
import { validateArrayAndRepair } from "./validation";

// ============================================
// Types
// ============================================

export type KBCategory =
  | "faith_rules"
  | "vocabulary_rules"
  | "characters"
  | "settings"
  | "series_bible"
  | "illustration_rules";

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseItem {
  id: string;
  kbId: string;
  title: string;
  category: KBCategory;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Constants
// ============================================

const KB_LIST_KEY = "noorstudio.kb.v1";
const KB_ITEMS_PREFIX = "noorstudio.kb.items.v1.";

export const KB_CATEGORIES: { id: KBCategory; label: string; description: string }[] = [
  { id: "faith_rules", label: "Faith Rules", description: "Islamic adab, modesty, and religious guidelines" },
  { id: "vocabulary_rules", label: "Vocabulary Rules", description: "Age-appropriate language and Islamic terms" },
  { id: "characters", label: "Characters", description: "Character profiles and personality guidelines" },
  { id: "settings", label: "Settings", description: "Locations, environments, and world-building" },
  { id: "series_bible", label: "Series Bible", description: "Overarching story rules and continuity" },
  { id: "illustration_rules", label: "Illustration Rules", description: "Visual style, modesty, and art guidelines" },
];

// ============================================
// Helper Functions
// ============================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getItemsKey(kbId: string): string {
  return `${KB_ITEMS_PREFIX}${kbId}`;
}

// ============================================
// Knowledge Base CRUD
// ============================================

export function listKnowledgeBases(): KnowledgeBase[] {
  try {
    const stored = localStorage.getItem(KB_LIST_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(KB_LIST_KEY, parsed, KnowledgeBaseSchema);
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse knowledge bases from localStorage");
    }
    return [];
  }
}

export function getKnowledgeBase(id: string): KnowledgeBase | null {
  const kbs = listKnowledgeBases();
  return kbs.find((kb) => kb.id === id) || null;
}

export function createKnowledgeBase(name: string, description: string = ""): KnowledgeBase {
  const now = new Date().toISOString();
  const kb: KnowledgeBase = {
    id: generateId("kb"),
    name,
    description,
    createdAt: now,
    updatedAt: now,
  };

  const kbs = listKnowledgeBases();
  kbs.push(kb);
  localStorage.setItem(KB_LIST_KEY, JSON.stringify(kbs));

  // Initialize empty items array for this KB
  localStorage.setItem(getItemsKey(kb.id), JSON.stringify([]));

  return kb;
}

export function renameKnowledgeBase(id: string, name: string, description?: string): KnowledgeBase | null {
  const kbs = listKnowledgeBases();
  const index = kbs.findIndex((kb) => kb.id === id);
  if (index < 0) return null;

  kbs[index] = {
    ...kbs[index],
    name,
    description: description ?? kbs[index].description,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(KB_LIST_KEY, JSON.stringify(kbs));
  return kbs[index];
}

export function deleteKnowledgeBase(id: string): boolean {
  const kbs = listKnowledgeBases();
  const filtered = kbs.filter((kb) => kb.id !== id);
  if (filtered.length === kbs.length) return false;

  localStorage.setItem(KB_LIST_KEY, JSON.stringify(filtered));
  // Also remove all items for this KB
  localStorage.removeItem(getItemsKey(id));
  return true;
}

// ============================================
// Knowledge Base Items CRUD
// ============================================

export function listItems(kbId: string): KnowledgeBaseItem[] {
  const key = getItemsKey(kbId);
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(key, parsed, KnowledgeBaseItemSchema);
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse KB items from localStorage");
    }
    return [];
  }
}

export function getItem(kbId: string, itemId: string): KnowledgeBaseItem | null {
  const items = listItems(kbId);
  return items.find((item) => item.id === itemId) || null;
}

export interface CreateItemInput {
  title: string;
  category: KBCategory;
  body: string;
  tags: string[];
}

export function createItem(kbId: string, input: CreateItemInput): KnowledgeBaseItem {
  const now = new Date().toISOString();
  const item: KnowledgeBaseItem = {
    id: generateId("kbi"),
    kbId,
    title: input.title,
    category: input.category,
    body: input.body,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };

  const items = listItems(kbId);
  items.unshift(item); // Add to beginning
  localStorage.setItem(getItemsKey(kbId), JSON.stringify(items));

  // Update KB's updatedAt
  renameKnowledgeBase(kbId, getKnowledgeBase(kbId)?.name || "");

  return item;
}

export function updateItem(
  kbId: string,
  itemId: string,
  partial: Partial<Omit<KnowledgeBaseItem, "id" | "kbId" | "createdAt">>
): KnowledgeBaseItem | null {
  const items = listItems(kbId);
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) return null;

  items[index] = {
    ...items[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getItemsKey(kbId), JSON.stringify(items));

  // Update KB's updatedAt
  renameKnowledgeBase(kbId, getKnowledgeBase(kbId)?.name || "");

  return items[index];
}

export function deleteItem(kbId: string, itemId: string): boolean {
  const items = listItems(kbId);
  const filtered = items.filter((item) => item.id !== itemId);
  if (filtered.length === items.length) return false;

  localStorage.setItem(getItemsKey(kbId), JSON.stringify(filtered));

  // Update KB's updatedAt
  renameKnowledgeBase(kbId, getKnowledgeBase(kbId)?.name || "");

  return true;
}

// ============================================
// Query Helpers
// ============================================

export function getItemsByCategory(kbId: string, category: KBCategory): KnowledgeBaseItem[] {
  return listItems(kbId).filter((item) => item.category === category);
}

export function searchItems(kbId: string, query: string): KnowledgeBaseItem[] {
  const q = query.toLowerCase();
  return listItems(kbId).filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

// ============================================
// KB Rules Summary (for artifacts)
// ============================================

export interface KBRulesSummary {
  faithRules: string[];
  vocabularyRules: string[];
  illustrationRules: string[];
  kbName: string;
}

export function getKBRulesSummary(kbId: string): KBRulesSummary {
  const kb = getKnowledgeBase(kbId);
  const items = listItems(kbId);

  // Extract first line or first 100 chars of body for each rule
  const summarizeItem = (item: KnowledgeBaseItem): string => {
    const firstLine = item.body.split("\n")[0];
    const summary = firstLine.length > 100 ? firstLine.slice(0, 100) + "..." : firstLine;
    return `${item.title}: ${summary}`;
  };

  const faithRules = items
    .filter((item) => item.category === "faith_rules")
    .slice(0, 3)
    .map(summarizeItem);

  const vocabularyRules = items
    .filter((item) => item.category === "vocabulary_rules")
    .slice(0, 3)
    .map(summarizeItem);

  const illustrationRules = items
    .filter((item) => item.category === "illustration_rules")
    .slice(0, 3)
    .map(summarizeItem);

  return {
    faithRules,
    vocabularyRules,
    illustrationRules,
    kbName: kb?.name || "Unknown KB",
  };
}

// Format rules as text block for artifacts
export function formatKBRulesForArtifact(summary: KBRulesSummary, ageRange: string): string {
  const lines: string[] = [];

  lines.push(`=== Knowledge Base Applied: ${summary.kbName} ===`);
  lines.push(`Target Age: ${ageRange}`);
  lines.push("");

  if (summary.faithRules.length > 0) {
    lines.push("FAITH & ADAB RULES:");
    summary.faithRules.forEach((rule) => lines.push(`  - ${rule}`));
    lines.push("");
  }

  if (summary.vocabularyRules.length > 0) {
    lines.push("VOCABULARY GUIDELINES:");
    summary.vocabularyRules.forEach((rule) => lines.push(`  - ${rule}`));
    lines.push("");
  }

  if (summary.illustrationRules.length > 0) {
    lines.push("ILLUSTRATION RULES:");
    summary.illustrationRules.forEach((rule) => lines.push(`  - ${rule}`));
    lines.push("");
  }

  lines.push("=".repeat(50));
  lines.push("");

  return lines.join("\n");
}

// ============================================
// Demo Data Seeding
// ============================================

export function seedDefaultKBIfEmpty(): void {
  const existing = listKnowledgeBases();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  // Create Default KB
  const defaultKB: KnowledgeBase = {
    id: "kb-default",
    name: "NoorStudio Default KB",
    description: "General Islamic children's content guidelines",
    createdAt: now,
    updatedAt: now,
  };

  // Create K&S KB
  const ksKB: KnowledgeBase = {
    id: "kb-ks",
    name: "Khaled & Sumaya KB",
    description: "Character bibles and series rules for Khaled & Sumaya adventures",
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(KB_LIST_KEY, JSON.stringify([defaultKB, ksKB]));

  // Default KB Items
  const defaultItems: KnowledgeBaseItem[] = [
    {
      id: "kbi-default-1",
      kbId: "kb-default",
      title: "Prayer Depiction Guidelines",
      category: "faith_rules",
      body: "When depicting prayer (salah), always show proper wudu preparation. Characters should face the qibla direction. Show reverence and focus during prayer scenes. Avoid depicting prophets or companions directly.",
      tags: ["prayer", "salah", "wudu", "adab"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-default-2",
      kbId: "kb-default",
      title: "Islamic Greetings & Phrases",
      category: "vocabulary_rules",
      body: "Use 'Assalamu Alaikum' for greetings. Include 'Bismillah' before starting activities. Say 'Alhamdulillah' for gratitude. Use 'InshaAllah' when discussing future plans. Keep explanations simple for young readers.",
      tags: ["greetings", "arabic", "phrases", "age-appropriate"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-default-3",
      kbId: "kb-default",
      title: "Modesty in Illustrations",
      category: "illustration_rules",
      body: "Female characters should wear appropriate hijab/head covering. Clothing should be loose and modest for all characters. Avoid depicting awrah. Use warm, welcoming color palettes. Characters should have kind, gentle expressions.",
      tags: ["modesty", "hijab", "clothing", "visual-style"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-default-4",
      kbId: "kb-default",
      title: "Age 4-7 Vocabulary Level",
      category: "vocabulary_rules",
      body: "Use simple sentences (5-8 words). Introduce one new Islamic term per spread. Always provide gentle context for Arabic words. Use repetition for key concepts. Avoid complex theological discussions.",
      tags: ["age-4-7", "vocabulary", "reading-level"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-default-5",
      kbId: "kb-default",
      title: "Food & Halal Guidelines",
      category: "faith_rules",
      body: "Only depict halal food items. Show 'Bismillah' before eating and 'Alhamdulillah' after. Emphasize sharing food with others. Include family meal scenes to show Islamic family values.",
      tags: ["halal", "food", "eating", "family"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-default-6",
      kbId: "kb-default",
      title: "Positive Role Models",
      category: "characters",
      body: "Characters should demonstrate Islamic values through actions. Show respect for parents and elders. Include diverse Muslim characters. Avoid stereotypes. Characters should solve problems through patience, kindness, and faith.",
      tags: ["characters", "values", "diversity", "role-models"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // K&S KB Items
  const ksItems: KnowledgeBaseItem[] = [
    {
      id: "kbi-ks-1",
      kbId: "kb-ks",
      title: "Khaled Character Bible",
      category: "characters",
      body: "Khaled is an 8-year-old boy, curious and adventurous. He wears a white kufi and blue thobe. His catchphrase is 'Let's find out together!' He loves exploring and asking questions about Islam. He's brave but sometimes rushes into things.",
      tags: ["khaled", "main-character", "boy", "curious"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-ks-2",
      kbId: "kb-ks",
      title: "Sumaya Character Bible",
      category: "characters",
      body: "Sumaya is a 7-year-old girl, thoughtful and kind. She wears a pink hijab and loves purple. Her catchphrase is 'SubhanAllah, how wonderful!' She's patient and often helps Khaled think things through. She loves reading and nature.",
      tags: ["sumaya", "main-character", "girl", "thoughtful"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-ks-3",
      kbId: "kb-ks",
      title: "K&S Series Tone",
      category: "series_bible",
      body: "The K&S series should feel warm, safe, and educational. Each story has a clear Islamic lesson. Adventures are age-appropriate (no real danger). Humor is gentle and kind. Every book ends with characters reflecting on what they learned.",
      tags: ["tone", "series-rules", "editorial"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-ks-4",
      kbId: "kb-ks",
      title: "K&S Home Setting",
      category: "settings",
      body: "Khaled and Sumaya live in a cozy suburban home. The living room has a prayer corner with a beautiful rug. Their kitchen always smells like Mama's cooking. The backyard has a garden where they play and observe nature.",
      tags: ["home", "setting", "environment"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "kbi-ks-5",
      kbId: "kb-ks",
      title: "K&S Art Style Guide",
      category: "illustration_rules",
      body: "Use soft, rounded character designs. Color palette: warm teal, soft gold, gentle pink, sky blue. Backgrounds should be detailed but not distracting. Characters have expressive, friendly eyes. Maintain consistent character proportions across all books.",
      tags: ["art-style", "colors", "visual-consistency"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  localStorage.setItem(getItemsKey("kb-default"), JSON.stringify(defaultItems));
  localStorage.setItem(getItemsKey("kb-ks"), JSON.stringify(ksItems));
}

// ============================================
// Clear Functions
// ============================================

export function clearAllKnowledgeBases(): void {
  const kbs = listKnowledgeBases();
  kbs.forEach((kb) => localStorage.removeItem(getItemsKey(kb.id)));
  localStorage.removeItem(KB_LIST_KEY);
}
