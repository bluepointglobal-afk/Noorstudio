// NoorStudio Data Models
// TypeScript types for the MVP (no DB yet)

// ============================================
// Status Enums
// ============================================

export type AssetStatus = "draft" | "approved" | "locked";

export type ProjectStage =
  | "outline"
  | "chapters"
  | "illustrations"
  | "humanize"
  | "layout"
  | "cover"
  | "export"
  | "completed";

export type BookStatus = "draft" | "in_progress" | "completed";

export type CreditType = "character" | "book";

export type KnowledgeCategory =
  | "characters"
  | "settings"
  | "faith_rules"
  | "vocabulary"
  | "series_bible";

export type KnowledgeLevel = "basic" | "intermediate" | "advanced";

export type PlanTier = "creator" | "author" | "studio";

// ============================================
// Universe (Series/World Container)
// ============================================

export interface Universe {
  id: string;
  name: string;
  description: string;
  characterCount: number;
  bookCount: number;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// Knowledge Base Item
// ============================================

export interface KnowledgeBaseItem {
  id: string;
  universeId: string;
  category: KnowledgeCategory;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Character
// ============================================

export interface Character {
  id: string;
  name: string;
  role: string;
  ageRange: string;
  status: AssetStatus;
  imageUrl: string;
  version: number;
  traits: string[];
  speechStyle: string;
  appearance: string;
  modestyRules: string;
  colorPalette: string[];
  knowledgeLevel: KnowledgeLevel;
  poseSheetUrl?: string;
  createdAt: string;
  updatedAt?: string;
  universeId?: string;
}

// ============================================
// Pose (12 Standard Poses)
// ============================================

export type PoseName =
  | "front_neutral"
  | "front_happy"
  | "front_thinking"
  | "side_left"
  | "side_right"
  | "back_view"
  | "sitting"
  | "walking"
  | "praying"
  | "reading"
  | "pointing"
  | "waving";

export interface Pose {
  id: number;
  name: string;
  poseKey: PoseName;
  status: AssetStatus;
  thumbnailUrl?: string;
}

export const DEFAULT_POSES: Omit<Pose, "thumbnailUrl">[] = [
  { id: 1, name: "Front Neutral", poseKey: "front_neutral", status: "draft" },
  { id: 2, name: "Front Happy", poseKey: "front_happy", status: "draft" },
  { id: 3, name: "Front Thinking", poseKey: "front_thinking", status: "draft" },
  { id: 4, name: "Side Left", poseKey: "side_left", status: "draft" },
  { id: 5, name: "Side Right", poseKey: "side_right", status: "draft" },
  { id: 6, name: "Back View", poseKey: "back_view", status: "draft" },
  { id: 7, name: "Sitting", poseKey: "sitting", status: "draft" },
  { id: 8, name: "Walking", poseKey: "walking", status: "draft" },
  { id: 9, name: "Praying", poseKey: "praying", status: "draft" },
  { id: 10, name: "Reading", poseKey: "reading", status: "draft" },
  { id: 11, name: "Pointing", poseKey: "pointing", status: "draft" },
  { id: 12, name: "Waving", poseKey: "waving", status: "draft" },
];

// ============================================
// Character Styles
// ============================================

export type CharacterStyle =
  | "pixar-3d"
  | "watercolor"
  | "anime"
  | "2d-vector"
  | "paper-cutout";

export interface StyleOption {
  id: CharacterStyle;
  label: string;
  description: string;
}

export const CHARACTER_STYLES: StyleOption[] = [
  { id: "pixar-3d", label: "Pixar 3D", description: "High-quality 3D render with soft lighting" },
  { id: "watercolor", label: "Soft Watercolor", description: "Gentle, artistic watercolor style" },
  { id: "anime", label: "Anime / Manga", description: "Vibrant Japanese animation style" },
  { id: "2d-vector", label: "2D Vector", description: "Clean, flat modern illustration" },
  { id: "paper-cutout", label: "Paper Cutout", description: "Textured paper collage style" },
];

// ============================================
// Book Project
// ============================================

export interface BookProject {
  id: string;
  title: string;
  universeId: string;
  template: string;
  ageRange: string;
  stage: ProjectStage;
  characterIds: string[];
  createdAt: string;
  updatedAt?: string;
  // Stage artifacts
  artifacts?: ProjectArtifacts;
}

export interface ProjectArtifacts {
  outline?: OutlineArtifact;
  chapters?: ChapterArtifact[];
  illustrations?: IllustrationArtifact[];
  layout?: LayoutArtifact;
  cover?: CoverArtifact;
  exportFiles?: ExportArtifact[];
}

export interface OutlineArtifact {
  chapters: string[];
  synopsis: string;
  generatedAt: string;
}

export interface ChapterArtifact {
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  generatedAt: string;
}

export interface IllustrationArtifact {
  id: string;
  chapterNumber: number;
  scene: string;
  characterIds: string[];
  imageUrl?: string;
  status: AssetStatus;
  generatedAt: string;
}

export interface LayoutArtifact {
  pageCount: number;
  spreads: SpreadLayout[];
  generatedAt: string;
}

export interface SpreadLayout {
  spreadNumber: number;
  leftPage: PageLayout;
  rightPage: PageLayout;
}

export interface PageLayout {
  type: "text" | "image" | "mixed";
  content?: string;
  imageUrl?: string;
}

export interface CoverArtifact {
  frontCoverUrl?: string;
  backCoverUrl?: string;
  spineText?: string;
  generatedAt: string;
}

export interface ExportArtifact {
  format: "pdf" | "epub" | "print_ready";
  fileUrl: string;
  fileSize: number;
  generatedAt: string;
}

// ============================================
// Credit Ledger Entry
// ============================================

export interface CreditLedgerEntry {
  id: string;
  userId?: string;
  date: string;
  action: string;
  creditsUsed: number;
  creditType: CreditType;
  projectId?: string;
  characterId?: string;
}

// ============================================
// User Credits
// ============================================

export interface UserCredits {
  characterCredits: number;
  characterCreditsMax: number;
  bookCredits: number;
  bookCreditsMax: number;
  plan: PlanTier;
}

// ============================================
// Pipeline Stage Definition
// ============================================

export interface PipelineStage {
  id: ProjectStage;
  label: string;
  description: string;
  creditCost: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "outline", label: "Outline", description: "Story structure and chapter breakdown", creditCost: 3 },
  { id: "chapters", label: "Chapters", description: "Generate chapter content", creditCost: 10 },
  { id: "illustrations", label: "Illustrations", description: "Scene illustrations", creditCost: 8 },
  { id: "humanize", label: "Humanize/Edit", description: "Review and polish content", creditCost: 2 },
  { id: "layout", label: "Layout", description: "Page layouts and formatting", creditCost: 3 },
  { id: "cover", label: "Cover/Back", description: "Cover and back cover design", creditCost: 5 },
  { id: "export", label: "Export", description: "Final export files", creditCost: 2 },
];

// ============================================
// Book Templates
// ============================================

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  icon?: string;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  { id: "adventure", name: "Middle-Grade Adventure", description: "Epic journeys with moral lessons for ages 8-12", ageRange: "8-12" },
  { id: "values", name: "Junior Values Story", description: "Gentle tales about honesty, kindness, and sharing for ages 4-7", ageRange: "4-7" },
  { id: "educational", name: "Educational (Salah/Quran)", description: "Learn Islamic practices through engaging illustrated stories", ageRange: "4-8" },
  { id: "seerah", name: "Seerah-Inspired", description: "Stories from the Prophet's life adapted for young readers", ageRange: "6-12" },
];

// ============================================
// Age Ranges
// ============================================

export const AGE_RANGES = ["3-5", "4-6", "5-7", "6-8", "7-9", "8-10", "9-12"] as const;
export type AgeRange = typeof AGE_RANGES[number];

// ============================================
// Layout Styles
// ============================================

export interface LayoutStyle {
  id: string;
  name: string;
  description: string;
}

export const LAYOUT_STYLES: LayoutStyle[] = [
  { id: "text-under", name: "Text Under Image", description: "Full-width image with text below" },
  { id: "split-page", name: "Split Page", description: "Text on left, illustration on right" },
  { id: "full-image", name: "Full Image + Caption", description: "Full-page illustration with caption overlay" },
];
