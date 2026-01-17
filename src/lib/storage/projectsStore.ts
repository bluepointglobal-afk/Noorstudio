// Projects Store - localStorage persistence for Book Projects
// Key: noorstudio.projects.v1

import { ProjectStage } from "@/lib/models";
import { ProjectSchema } from "@/lib/validation/schemas";
import { validateArrayAndRepair } from "./validation";
import { getNamespacedKey } from "./keys";

// ============================================
// Types
// ============================================

export type LayoutStyle = "text-under-image" | "split-page" | "full-bleed-caption";
export type TrimSize = "8.5x8.5" | "8x10" | "A4";
export type ExportTarget = "pdf" | "epub";
export type TemplateType = "adventure" | "values" | "educational" | "seerah";

export type PipelineStageStatus = "pending" | "running" | "completed" | "error";

export interface PipelineStageState {
  name: ProjectStage;
  status: PipelineStageStatus;
  progress: number;
  message?: string;
  completedAt?: string;
}

export interface TextArtifact {
  type: "outline" | "chapters" | "humanize";
  content: unknown;
  generatedAt: string;
}

export interface ImageArtifact {
  type: "illustration" | "cover" | "layout";
  content: unknown;
  generatedAt: string;
}

export interface ExportArtifact {
  type: "export";
  content: Array<{ format: string; fileUrl: string; fileSize: number }>;
  generatedAt: string;
}

// ============================================
// Export Package Types (v1)
// ============================================

export type ExportFileType = "pdf" | "epub" | "md" | "json" | "txt" | "png";

export interface ExportFile {
  filename: string;
  type: ExportFileType;
  category: "cover" | "interior" | "manuscript" | "metadata";
  previewUrl?: string;
  sizeEstimate: string;
}

export interface ExportPackage {
  generatedAt: string;
  version: number;
  layoutStyle: LayoutStyle;
  trimSize: TrimSize;
  ageRange: string;
  exportTargets: ExportTarget[];
  characterNames: string[];
  kbName: string;
  files: {
    coverFront: ExportFile;
    coverBack: ExportFile;
    interiorPreview: ExportFile[];
    manuscript: ExportFile;
    metadata: ExportFile;
    license: ExportFile;
  };
}

export interface ExportHistory {
  version: number;
  generatedAt: string;
  exportTargets: ExportTarget[];
}

// Tracking for stale export detection
export interface ProjectChangeTracker {
  lastCharacterChangeAt?: string;
  lastKBChangeAt?: string;
}

export interface MetaArtifact {
  type: "meta";
  content: unknown;
  generatedAt: string;
}

export type ProjectArtifact = TextArtifact | ImageArtifact | ExportArtifact | MetaArtifact;

export interface StoredProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  // Universe & Knowledge Base
  universeId: string;
  universeName: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;

  // Book Basics
  ageRange: string;
  templateType: TemplateType;
  synopsis: string;
  learningObjective: string;
  setting: string;

  // Characters (locked only)
  characterIds: string[];

  // Formatting
  layoutStyle: LayoutStyle;
  trimSize: TrimSize;
  exportTargets: ExportTarget[];

  // Pipeline state
  pipeline: PipelineStageState[];
  currentStage: ProjectStage;

  // Artifacts produced by stages
  artifacts: Record<string, ProjectArtifact>;

  // Export Package (v1)
  exportPackage?: ExportPackage;
  exportHistory?: ExportHistory[];
  changeTracker?: ProjectChangeTracker;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "noorstudio.projects.v1";

// Credit costs for each stage
export const STAGE_CREDIT_COSTS: Record<ProjectStage, number> = {
  outline: 1,
  chapters: 3,
  illustrations: 8,
  humanize: 2,
  layout: 2,
  cover: 5,
  export: 2,
  completed: 0,
};

// Default pipeline stages
const DEFAULT_PIPELINE: PipelineStageState[] = [
  { name: "outline", status: "pending", progress: 0 },
  { name: "chapters", status: "pending", progress: 0 },
  { name: "illustrations", status: "pending", progress: 0 },
  { name: "humanize", status: "pending", progress: 0 },
  { name: "layout", status: "pending", progress: 0 },
  { name: "cover", status: "pending", progress: 0 },
  { name: "export", status: "pending", progress: 0 },
];

// Mock universes for MVP
export const MOCK_UNIVERSES = [
  { id: "universe-default", name: "NoorStudio Default", description: "Default universe for new stories" },
  { id: "universe-ks", name: "Khaled & Sumaya Universe", description: "Adventures of Khaled and Sumaya" },
];

// Mock knowledge bases for MVP
export const MOCK_KNOWLEDGE_BASES = [
  { id: "kb-default", name: "Default KB", description: "General Islamic children's content guidelines" },
  { id: "kb-ks", name: "K&S Knowledge Base", description: "Character bibles and series rules for K&S" },
];

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// CRUD Functions
// ============================================

export function listProjects(): StoredProject[] {
  try {
    const key = getNamespacedKey(STORAGE_KEY);
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return validateArrayAndRepair(key, parsed, ProjectSchema) as StoredProject[];
  } catch {
    if (import.meta.env.DEV) {
      console.error("Failed to parse projects from localStorage");
    }
    return [];
  }
}

export function getProject(id: string): StoredProject | null {
  const projects = listProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveProject(project: StoredProject): void {
  const projects = listProjects();
  const existingIndex = projects.findIndex((p) => p.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }

  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(projects));
}

export interface CreateProjectInput {
  title: string;
  universeId: string;
  universeName: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  ageRange: string;
  templateType: TemplateType;
  synopsis: string;
  learningObjective: string;
  setting: string;
  characterIds: string[];
  layoutStyle: LayoutStyle;
  trimSize: TrimSize;
  exportTargets: ExportTarget[];
}

export function createProject(input: CreateProjectInput): StoredProject {
  const now = new Date().toISOString();

  const project: StoredProject = {
    id: generateId(),
    title: input.title,
    createdAt: now,
    updatedAt: now,

    universeId: input.universeId,
    universeName: input.universeName,
    knowledgeBaseId: input.knowledgeBaseId,
    knowledgeBaseName: input.knowledgeBaseName,

    ageRange: input.ageRange,
    templateType: input.templateType,
    synopsis: input.synopsis,
    learningObjective: input.learningObjective,
    setting: input.setting,

    characterIds: input.characterIds,

    layoutStyle: input.layoutStyle,
    trimSize: input.trimSize,
    exportTargets: input.exportTargets,

    pipeline: JSON.parse(JSON.stringify(DEFAULT_PIPELINE)),
    currentStage: "outline",

    artifacts: {},
  };

  saveProject(project);
  return project;
}

export function updateProject(id: string, partial: Partial<StoredProject>): StoredProject | null {
  const projects = listProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index < 0) return null;

  const updated: StoredProject = {
    ...projects[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  projects[index] = updated;
  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(projects));

  return updated;
}

export function deleteProject(id: string): boolean {
  const projects = listProjects();
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) return false;

  localStorage.setItem(getNamespacedKey(STORAGE_KEY), JSON.stringify(filtered));
  return true;
}

// ============================================
// Pipeline Management
// ============================================

export function updatePipelineStage(
  projectId: string,
  stageName: ProjectStage,
  update: Partial<PipelineStageState>
): StoredProject | null {
  const project = getProject(projectId);
  if (!project) return null;

  const updatedPipeline = project.pipeline.map((stage) => {
    if (stage.name === stageName) {
      return { ...stage, ...update };
    }
    return stage;
  });

  return updateProject(projectId, { pipeline: updatedPipeline });
}

export function addArtifact(
  projectId: string,
  stageName: string,
  artifact: ProjectArtifact
): StoredProject | null {
  const project = getProject(projectId);
  if (!project) return null;

  const updatedArtifacts = {
    ...project.artifacts,
    [stageName]: artifact,
  };

  return updateProject(projectId, { artifacts: updatedArtifacts });
}

export function getNextStage(currentStage: ProjectStage): ProjectStage | null {
  const stages: ProjectStage[] = [
    "outline",
    "chapters",
    "illustrations",
    "humanize",
    "layout",
    "cover",
    "export",
    "completed",
  ];
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex < 0 || currentIndex >= stages.length - 1) return null;
  return stages[currentIndex + 1];
}

export function canRunStage(project: StoredProject, stageName: ProjectStage): boolean {
  // Define dependencies for each stage
  // Some stages can run in parallel (illustrations and humanize both depend on chapters)
  const stageDependencies: Record<ProjectStage, ProjectStage | null> = {
    outline: null,           // Can always run
    chapters: "outline",     // Needs outline
    illustrations: "chapters", // Needs chapters
    humanize: "chapters",    // Needs chapters (can run in parallel with illustrations)
    layout: "illustrations", // Needs illustrations
    cover: "layout",         // Needs layout
    export: "cover",         // Needs cover
    completed: "export",     // Needs export
  };

  const dependency = stageDependencies[stageName];
  const currentStage = project.pipeline.find((s) => s.name === stageName);

  // Can't run if already running or completed
  if (currentStage?.status === "running" || currentStage?.status === "completed") {
    return false;
  }

  // First stage (outline) can always run
  if (dependency === null) {
    return true;
  }

  // Check if dependency is completed
  const depStage = project.pipeline.find((s) => s.name === dependency);
  return depStage?.status === "completed";
}

export function getCompletedStagesCount(project: StoredProject): number {
  return project.pipeline.filter((s) => s.status === "completed").length;
}

// ============================================
// Demo Data Seeding
// ============================================

export function seedDemoProjectIfEmpty(): void {
  const existing = listProjects();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const demoProject: StoredProject = {
    id: "proj-demo-1",
    title: "Amira's Ramadan Adventures",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: now,

    universeId: "universe-default",
    universeName: "NoorStudio Default",
    knowledgeBaseId: "kb-default",
    knowledgeBaseName: "Default KB",

    ageRange: "5-8",
    templateType: "values",
    synopsis: "Join Amira as she discovers the beauty of Ramadan through family traditions, acts of kindness, and the joy of giving.",
    learningObjective: "Children will learn about the importance of generosity, gratitude, and family during Ramadan.",
    setting: "A warm suburban home and neighborhood during the holy month of Ramadan.",

    characterIds: ["char-demo-2"], // Yusuf (locked)

    layoutStyle: "text-under-image",
    trimSize: "8.5x8.5",
    exportTargets: ["pdf", "epub"],

    pipeline: [
      { name: "outline", status: "completed", progress: 100, completedAt: "2024-01-21T10:00:00Z" },
      { name: "chapters", status: "completed", progress: 100, completedAt: "2024-01-22T10:00:00Z" },
      { name: "illustrations", status: "pending", progress: 0 },
      { name: "humanize", status: "pending", progress: 0 },
      { name: "layout", status: "pending", progress: 0 },
      { name: "cover", status: "pending", progress: 0 },
      { name: "export", status: "pending", progress: 0 },
    ],
    currentStage: "illustrations",

    artifacts: {
      outline: {
        type: "outline",
        content: {
          chapters: [
            "Chapter 1: The Morning Prayer - Amira learns about Fajr",
            "Chapter 2: Kindness at School - Helping a new friend",
            "Chapter 3: The Ramadan Gift - Sharing with neighbors",
            "Chapter 4: Gratitude Under the Stars - Saying Alhamdulillah",
          ],
          synopsis: "A heartwarming story about a young Muslim girl who discovers the beauty of Islamic values through everyday adventures.",
        },
        generatedAt: "2024-01-21T10:00:00Z",
      },
      chapters: {
        type: "chapters",
        content: [
          {
            chapterNumber: 1,
            title: "The Morning Prayer",
            content: "Amira woke up to the gentle sound of her mother's voice calling her for Fajr prayer...",
            wordCount: 96,
          },
          {
            chapterNumber: 2,
            title: "Kindness at School",
            content: "At school, Amira noticed a new girl sitting alone during lunch...",
            wordCount: 82,
          },
        ],
        generatedAt: "2024-01-22T10:00:00Z",
      },
    },
  };

  saveProject(demoProject);
}

// ============================================
// Clear Functions
// ============================================

export function clearAllProjects(): void {
  localStorage.removeItem(getNamespacedKey(STORAGE_KEY));
}

// ============================================
// Export Package Functions (v1)
// ============================================

const DEMO_COVERS = [
  "/demo/covers/generous-traveler.png",
  "/demo/covers/ramadan-amira.png",
  "/demo/covers/mountain-patience.png",
];

const DEMO_SPREADS = [
  "/demo/spreads/spread-1.png",
  "/demo/spreads/spread-2.png",
];

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
}

export function getArtifactContent<T>(project: StoredProject, stage: string): T | null {
  const artifact = project.artifacts[stage];
  if (!artifact) return null;

  if ("content" in artifact) {
    return artifact.content as T;
  }
  return null;
}

export function validateExportReadiness(project: StoredProject): ExportValidationResult {
  const errors: string[] = [];

  // Check Outline completed
  const outlineStage = project.pipeline.find((s) => s.name === "outline");
  if (outlineStage?.status !== "completed") {
    errors.push("Outline stage must be completed");
  }

  // Check Chapters completed
  const chaptersStage = project.pipeline.find((s) => s.name === "chapters");
  if (chaptersStage?.status !== "completed") {
    errors.push("Chapters stage must be completed");
  }

  // Check at least one character
  if (!project.characterIds || project.characterIds.length === 0) {
    errors.push("At least one locked character is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isExportStale(project: StoredProject): boolean {
  if (!project.exportPackage) return false;

  const exportTime = new Date(project.exportPackage.generatedAt).getTime();
  const tracker = project.changeTracker;

  if (tracker?.lastCharacterChangeAt) {
    const charChangeTime = new Date(tracker.lastCharacterChangeAt).getTime();
    if (charChangeTime > exportTime) return true;
  }

  if (tracker?.lastKBChangeAt) {
    const kbChangeTime = new Date(tracker.lastKBChangeAt).getTime();
    if (kbChangeTime > exportTime) return true;
  }

  return false;
}

export function generateExportPackage(
  project: StoredProject,
  characterNames: string[],
  kbName: string
): ExportPackage {
  const now = new Date().toISOString();
  const currentVersion = (project.exportPackage?.version || 0) + 1;

  // Generate interior preview files based on layout style
  const interiorPreview: ExportFile[] = [];
  for (let i = 1; i <= 6; i++) {
    const spreadIndex = (i - 1) % DEMO_SPREADS.length;
    interiorPreview.push({
      filename: `interior-page-${i}.png`,
      type: "png",
      category: "interior",
      previewUrl: DEMO_SPREADS[spreadIndex],
      sizeEstimate: `${(0.8 + Math.random() * 0.4).toFixed(1)} MB`,
    });
  }

  // Build manuscript content estimate
  const chaptersArtifact = (project.artifacts.chapters as TextArtifact | undefined)?.content as Array<{ wordCount?: number }> | undefined;
  const totalWords = chaptersArtifact?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 500;
  const manuscriptSize = (totalWords * 0.005).toFixed(1); // ~5KB per 1000 words

  const coverIndex = Math.floor(Math.random() * DEMO_COVERS.length);
  const backCoverIndex = (coverIndex + 1) % DEMO_COVERS.length;

  const exportPackage: ExportPackage = {
    generatedAt: now,
    version: currentVersion,
    layoutStyle: project.layoutStyle,
    trimSize: project.trimSize,
    ageRange: project.ageRange,
    exportTargets: project.exportTargets,
    characterNames,
    kbName,
    files: {
      coverFront: {
        filename: `${project.title.replace(/\s+/g, "-").toLowerCase()}-cover-front.png`,
        type: "png",
        category: "cover",
        previewUrl: DEMO_COVERS[coverIndex],
        sizeEstimate: "2.4 MB",
      },
      coverBack: {
        filename: `${project.title.replace(/\s+/g, "-").toLowerCase()}-cover-back.png`,
        type: "png",
        category: "cover",
        previewUrl: DEMO_COVERS[backCoverIndex],
        sizeEstimate: "1.8 MB",
      },
      interiorPreview,
      manuscript: {
        filename: `${project.title.replace(/\s+/g, "-").toLowerCase()}-manuscript.md`,
        type: "md",
        category: "manuscript",
        sizeEstimate: `${manuscriptSize} KB`,
      },
      metadata: {
        filename: "book-metadata.json",
        type: "json",
        category: "metadata",
        sizeEstimate: "2.1 KB",
      },
      license: {
        filename: "LICENSE.txt",
        type: "txt",
        category: "metadata",
        sizeEstimate: "1.2 KB",
      },
    },
  };

  return exportPackage;
}

export function saveExportPackage(
  projectId: string,
  exportPackage: ExportPackage
): StoredProject | null {
  const project = getProject(projectId);
  if (!project) return null;

  // Add to history
  const history: ExportHistory = {
    version: exportPackage.version,
    generatedAt: exportPackage.generatedAt,
    exportTargets: exportPackage.exportTargets,
  };

  const existingHistory = project.exportHistory || [];

  return updateProject(projectId, {
    exportPackage,
    exportHistory: [...existingHistory, history],
  });
}

export function markProjectChanged(
  projectId: string,
  changeType: "character" | "kb"
): StoredProject | null {
  const project = getProject(projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const tracker: ProjectChangeTracker = project.changeTracker || {};

  if (changeType === "character") {
    tracker.lastCharacterChangeAt = now;
  } else if (changeType === "kb") {
    tracker.lastKBChangeAt = now;
  }

  return updateProject(projectId, { changeTracker: tracker });
}

export function getExportSummary(project: StoredProject): {
  totalFiles: number;
  totalSize: string;
  formats: string[];
} | null {
  if (!project.exportPackage) return null;

  const pkg = project.exportPackage;
  const files = pkg.files;

  const totalFiles =
    2 + // covers
    files.interiorPreview.length +
    3; // manuscript, metadata, license

  // Estimate total size (simplified)
  const totalSizeMB = 2.4 + 1.8 + files.interiorPreview.length * 1.0 + 0.01;

  return {
    totalFiles,
    totalSize: `${totalSizeMB.toFixed(1)} MB`,
    formats: pkg.exportTargets.map((t) => t.toUpperCase()),
  };
}
