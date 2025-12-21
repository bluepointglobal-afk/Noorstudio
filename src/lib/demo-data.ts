// Demo data store for the NoorStudio prototype

export interface Character {
  id: string;
  name: string;
  role: string;
  ageRange: string;
  status: "draft" | "approved" | "locked";
  imageUrl: string;
  version: number;
  traits: string[];
  speechStyle: string;
  appearance: string;
  modestyRules: string;
  colorPalette: string[];
  knowledgeLevel: "basic" | "intermediate" | "advanced";
  poseSheetUrl?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  ageRange: string;
  category: string;
  coverUrl: string;
  status: "draft" | "in_progress" | "completed";
}

export interface Universe {
  id: string;
  name: string;
  description: string;
  characterCount: number;
  bookCount: number;
}

export interface KnowledgeBaseItem {
  id: string;
  universeId: string;
  category: "characters" | "settings" | "faith_rules" | "vocabulary" | "series_bible";
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  universeId: string;
  template: string;
  ageRange: string;
  status: "outline" | "chapters" | "illustrations" | "humanize" | "layout" | "cover" | "export" | "completed";
  characters: string[];
  createdAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  date: string;
  action: string;
  creditsUsed: number;
  type: "character" | "book";
}

// Demo characters with real images
export const demoCharacters: Character[] = [
  {
    id: "char-1",
    name: "Amira",
    role: "Curious Explorer",
    ageRange: "6-9",
    status: "approved",
    imageUrl: "/demo/characters/amira.png",
    version: 2,
    traits: ["curious", "brave", "kind"],
    speechStyle: "Enthusiastic and questioning",
    appearance: "Pink hijab, orange dress, warm smile",
    modestyRules: "Full coverage, bright colors",
    colorPalette: ["#E91E63", "#FF9800", "#FFF3E0"],
    knowledgeLevel: "intermediate",
    poseSheetUrl: "/demo/pose-sheets/amira-poses.png",
    createdAt: "2024-01-15",
  },
  {
    id: "char-2",
    name: "Yusuf",
    role: "Kind Helper",
    ageRange: "5-7",
    status: "approved",
    imageUrl: "/demo/characters/yusuf.png",
    version: 1,
    traits: ["helpful", "gentle", "patient"],
    speechStyle: "Soft and encouraging",
    appearance: "Blue thobe, striped kufi cap",
    modestyRules: "Traditional modest attire",
    colorPalette: ["#2196F3", "#BBDEFB", "#FFF"],
    knowledgeLevel: "basic",
    poseSheetUrl: "/demo/pose-sheets/yusuf-poses.png",
    createdAt: "2024-01-20",
  },
  {
    id: "char-3",
    name: "Fatima",
    role: "Wise Teacher",
    ageRange: "8-12",
    status: "approved",
    imageUrl: "/demo/characters/fatima.png",
    version: 3,
    traits: ["wise", "patient", "nurturing"],
    speechStyle: "Calm and instructive",
    appearance: "Gray hijab, professional attire, glasses",
    modestyRules: "Professional modest dress",
    colorPalette: ["#607D8B", "#455A64", "#ECEFF1"],
    knowledgeLevel: "advanced",
    createdAt: "2024-02-01",
  },
  {
    id: "char-4",
    name: "Omar",
    role: "Brave Friend",
    ageRange: "6-9",
    status: "locked",
    imageUrl: "/demo/characters/omar.png",
    version: 2,
    traits: ["brave", "loyal", "confident"],
    speechStyle: "Bold and supportive",
    appearance: "Vest, scarf, athletic build",
    modestyRules: "Casual modest clothing",
    colorPalette: ["#795548", "#BCAAA4", "#EFEBE9"],
    knowledgeLevel: "intermediate",
    createdAt: "2024-02-10",
  },
  {
    id: "char-5",
    name: "Layla",
    role: "Creative Artist",
    ageRange: "7-10",
    status: "approved",
    imageUrl: "/demo/characters/layla.png",
    version: 1,
    traits: ["creative", "imaginative", "expressive"],
    speechStyle: "Dreamy and descriptive",
    appearance: "Purple hijab, colorful dress, paintbrush",
    modestyRules: "Colorful modest attire",
    colorPalette: ["#9C27B0", "#26A69A", "#FFC107"],
    knowledgeLevel: "basic",
    createdAt: "2024-02-15",
  },
  {
    id: "char-6",
    name: "Zaid",
    role: "Thoughtful Student",
    ageRange: "9-12",
    status: "draft",
    imageUrl: "/demo/characters/zaid.png",
    version: 1,
    traits: ["studious", "thoughtful", "curious"],
    speechStyle: "Reflective and inquisitive",
    appearance: "Glasses, dark thobe, holding book",
    modestyRules: "Scholarly modest attire",
    colorPalette: ["#37474F", "#263238", "#ECEFF1"],
    knowledgeLevel: "advanced",
    createdAt: "2024-03-01",
  },
];

// Demo books with real cover images
export const demoBooks: Book[] = [
  {
    id: "book-1",
    title: "The Generous Traveler",
    author: "Sara Ahmad",
    ageRange: "5-8",
    category: "Values",
    coverUrl: "/demo/covers/generous-traveler.png",
    status: "completed",
  },
  {
    id: "book-2",
    title: "Ramadan with Amira",
    author: "Yusuf Khan",
    ageRange: "4-7",
    category: "Islamic",
    coverUrl: "/demo/covers/ramadan-amira.png",
    status: "completed",
  },
  {
    id: "book-3",
    title: "The Mountain of Patience",
    author: "Aisha Malik",
    ageRange: "7-10",
    category: "Adventure",
    coverUrl: "/demo/covers/mountain-patience.png",
    status: "completed",
  },
  {
    id: "book-4",
    title: "Learning Wudu with Omar",
    author: "Fatima Ali",
    ageRange: "4-6",
    category: "Educational",
    coverUrl: "/demo/covers/wudu-omar.png",
    status: "completed",
  },
  {
    id: "book-5",
    title: "Kindness in the Souk",
    author: "Zahra Ibrahim",
    ageRange: "6-9",
    category: "Values",
    coverUrl: "/demo/covers/kindness-souk.png",
    status: "in_progress",
  },
  {
    id: "book-6",
    title: "The Prophet's Garden",
    author: "Hassan Omar",
    ageRange: "8-12",
    category: "Seerah",
    coverUrl: "/demo/covers/prophets-garden.png",
    status: "draft",
  },
];

export const demoUniverses: Universe[] = [
  {
    id: "universe-1",
    name: "Amira's Adventures",
    description: "A series following Amira as she learns about Islamic values through everyday adventures",
    characterCount: 4,
    bookCount: 3,
  },
  {
    id: "universe-2",
    name: "Learning with Omar",
    description: "Educational series teaching Islamic practices to young children",
    characterCount: 2,
    bookCount: 2,
  },
  {
    id: "universe-3",
    name: "Tales of the Companions",
    description: "Stories inspired by the lives of the Prophet's companions",
    characterCount: 6,
    bookCount: 4,
  },
];

export const demoKnowledgeBase: KnowledgeBaseItem[] = [
  {
    id: "kb-1",
    universeId: "universe-1",
    category: "characters",
    title: "Amira Character Bible",
    body: "Amira is a 7-year-old Muslim girl who loves exploring and asking questions. She lives with her parents and grandmother in a suburban home...",
    tags: ["main character", "protagonist", "child"],
    createdAt: "2024-01-15",
    updatedAt: "2024-02-01",
  },
  {
    id: "kb-2",
    universeId: "universe-1",
    category: "faith_rules",
    title: "Salah References",
    body: "When depicting prayer scenes, characters should face qibla direction. Wudu should be shown correctly...",
    tags: ["prayer", "salah", "wudu"],
    createdAt: "2024-01-16",
    updatedAt: "2024-01-16",
  },
  {
    id: "kb-3",
    universeId: "universe-1",
    category: "vocabulary",
    title: "Age-Appropriate Terms (5-8)",
    body: "Use simple Islamic terms with gentle explanations: Allah (God), Salah (prayer), Jannah (paradise)...",
    tags: ["vocabulary", "age 5-8", "islamic terms"],
    createdAt: "2024-01-17",
    updatedAt: "2024-02-15",
  },
  {
    id: "kb-4",
    universeId: "universe-1",
    category: "settings",
    title: "Amira's Home",
    body: "A warm, cozy suburban home with Islamic art on walls, prayer rugs in the living room, and a small library...",
    tags: ["home", "setting", "environment"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-18",
  },
  {
    id: "kb-5",
    universeId: "universe-2",
    category: "series_bible",
    title: "Educational Series Guidelines",
    body: "Each book focuses on one Islamic practice. Structure: Introduction, Steps, Practice, Review...",
    tags: ["series", "structure", "educational"],
    createdAt: "2024-02-01",
    updatedAt: "2024-02-20",
  },
];

export const demoProjects: Project[] = [
  {
    id: "project-1",
    title: "Ramadan with Amira",
    universeId: "universe-1",
    template: "Islamic",
    ageRange: "4-7",
    status: "completed",
    characters: ["char-1"],
    createdAt: "2024-01-20",
  },
  {
    id: "project-2",
    title: "The Generous Traveler",
    universeId: "universe-1",
    template: "Values",
    ageRange: "5-8",
    status: "layout",
    characters: ["char-1", "char-2"],
    createdAt: "2024-02-15",
  },
  {
    id: "project-3",
    title: "Learning Wudu with Omar",
    universeId: "universe-2",
    template: "Educational",
    ageRange: "4-6",
    status: "illustrations",
    characters: ["char-4"],
    createdAt: "2024-03-01",
  },
];

export const demoCreditLedger: CreditLedgerEntry[] = [
  { id: "ledger-1", date: "2024-03-15", action: "Generate pose sheet for Amira", creditsUsed: 5, type: "character" },
  { id: "ledger-2", date: "2024-03-14", action: "Regenerate pose #3", creditsUsed: 1, type: "character" },
  { id: "ledger-3", date: "2024-03-13", action: "Generate chapter illustrations", creditsUsed: 8, type: "book" },
  { id: "ledger-4", date: "2024-03-12", action: "Create new character", creditsUsed: 2, type: "character" },
  { id: "ledger-5", date: "2024-03-11", action: "Generate book chapters", creditsUsed: 10, type: "book" },
  { id: "ledger-6", date: "2024-03-10", action: "Regenerate illustration #5", creditsUsed: 2, type: "book" },
];

// User credits state
export interface UserCredits {
  characterCredits: number;
  characterCreditsMax: number;
  bookCredits: number;
  bookCreditsMax: number;
  plan: "creator" | "author" | "studio";
}

export const demoUserCredits: UserCredits = {
  characterCredits: 7,
  characterCreditsMax: 10,
  bookCredits: 15,
  bookCreditsMax: 25,
  plan: "author",
};

// Pose data for pose sheet management
export interface Pose {
  id: number;
  name: string;
  status: "draft" | "approved" | "locked";
  thumbnailUrl?: string;
}

export const defaultPoses: Pose[] = [
  { id: 1, name: "Front Neutral", status: "approved" },
  { id: 2, name: "Front Happy", status: "approved" },
  { id: 3, name: "Front Thinking", status: "approved" },
  { id: 4, name: "Side Left", status: "draft" },
  { id: 5, name: "Side Right", status: "approved" },
  { id: 6, name: "Back View", status: "draft" },
  { id: 7, name: "Sitting", status: "approved" },
  { id: 8, name: "Walking", status: "approved" },
  { id: 9, name: "Praying", status: "approved" },
  { id: 10, name: "Reading", status: "approved" },
  { id: 11, name: "Pointing", status: "draft" },
  { id: 12, name: "Waving", status: "approved" },
];

// Pipeline stages
export const pipelineStages = [
  { id: "outline", label: "Outline", description: "Story structure and chapter breakdown" },
  { id: "chapters", label: "Chapters", description: "Generate chapter content" },
  { id: "illustrations", label: "Illustrations", description: "Scene illustrations" },
  { id: "humanize", label: "Humanize/Edit", description: "Review and polish content" },
  { id: "layout", label: "Layout", description: "Page layouts and formatting" },
  { id: "cover", label: "Cover/Back", description: "Cover and back cover design" },
  { id: "export", label: "Export", description: "Final export files" },
] as const;

// Templates
export const bookTemplates = [
  { id: "adventure", name: "Middle-Grade Adventure", description: "Epic journeys with moral lessons for ages 8-12", ageRange: "8-12" },
  { id: "values", name: "Junior Values Story", description: "Gentle tales about honesty, kindness, and sharing for ages 4-7", ageRange: "4-7" },
  { id: "educational", name: "Educational (Salah/Quran)", description: "Learn Islamic practices through engaging illustrated stories", ageRange: "4-8" },
  { id: "seerah", name: "Seerah-Inspired", description: "Stories from the Prophet's life adapted for young readers", ageRange: "6-12" },
];

export const ageRanges = ["3-5", "4-6", "5-7", "6-8", "7-9", "8-10", "9-12"];

export const layoutStyles = [
  { id: "text-under", name: "Text Under Image", description: "Full-width image with text below" },
  { id: "split-page", name: "Split Page", description: "Text on left, illustration on right" },
  { id: "full-image", name: "Full Image + Caption", description: "Full-page illustration with caption overlay" },
];
