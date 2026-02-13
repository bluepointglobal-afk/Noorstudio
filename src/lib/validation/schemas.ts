import { z } from "zod";

// ============================================
// Enums & Shared Schemas
// ============================================

export const AssetStatusSchema = z.enum(["draft", "approved", "locked"]);

export const ProjectStageSchema = z.enum([
    "outline",
    "chapters",
    "illustrations",
    "humanize",
    "layout",
    "cover",
    "export",
    "completed",
]);

export const CreditTypeSchema = z.enum(["character", "book"]);

export const KnowledgeCategorySchema = z.enum([
    "faith_rules",
    "vocabulary_rules",
    "characters",
    "settings",
    "series_bible",
    "illustration_rules",
]);

export const KnowledgeLevelSchema = z.enum(["basic", "intermediate", "advanced"]);

export const PlanTierSchema = z.enum(["creator", "author", "studio"]);

export const LayoutStyleSchema = z.enum(["text-under-image", "split-page", "full-bleed-caption"]);

export const TrimSizeSchema = z.enum(["8.5x8.5", "8x10", "A4"]);

export const ExportTargetSchema = z.enum(["pdf", "epub"]);

export const TemplateTypeSchema = z.enum(["adventure", "values", "educational", "seerah"]);

export const PipelineStageStatusSchema = z.enum(["pending", "running", "completed", "error"]);

// ============================================
// Characters
// ============================================

export const PoseAlternativeSchema = z.object({
    id: z.number(),
    imageUrl: z.string(),
    selected: z.boolean(),
    createdAt: z.string(),
});

export const CharacterPoseSchema = z.object({
    id: z.number(),
    name: z.string(),
    status: AssetStatusSchema,
    imageUrl: z.string().optional(),
    alternatives: z.array(PoseAlternativeSchema),
    selectedAlternative: z.number(),
    updatedAt: z.string(),
});

export const VisualDNASchema = z.object({
    gender: z.enum(["boy", "girl"]),
    skinTone: z.string(),
    hairOrHijab: z.string(),
    outfitRules: z.string(),
    accessories: z.string(),
    paletteNotes: z.string(),
});

export const ModestyRulesSchema = z.object({
    hijabAlways: z.boolean(),
    longSleeves: z.boolean(),
    looseClothing: z.boolean(),
    notes: z.string(),
});

export const CharacterVersionSchema = z.object({
    version: z.number(),
    createdAt: z.string(),
    note: z.string(),
    snapshotPoseSheetImageUrl: z.string().optional(),
});

export const CharacterSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    ageRange: z.string(),
    status: AssetStatusSchema,
    version: z.number(),
    imageUrl: z.string(),
    traits: z.array(z.string()),
    speakingStyle: z.string(),
    visualDNA: VisualDNASchema,
    modestyRules: ModestyRulesSchema,
    colorPalette: z.array(z.string()),
    poses: z.array(CharacterPoseSchema),
    poseSheetGenerated: z.boolean(),
    poseSheetUrl: z.string().optional(),
    versions: z.array(CharacterVersionSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
    universeId: z.string().optional(),
});

// ============================================
// Knowledge Base
// ============================================

export const KnowledgeBaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const KnowledgeBaseItemSchema = z.object({
    id: z.string(),
    kbId: z.string(),
    title: z.string(),
    category: KnowledgeCategorySchema,
    body: z.string(),
    tags: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// ============================================
// Projects
// ============================================

export const PipelineStageStateSchema = z.object({
    name: ProjectStageSchema,
    status: PipelineStageStatusSchema,
    progress: z.number(),
    message: z.string().optional(),
    completedAt: z.string().optional(),
});

export const ProjectArtifactSchema = z.object({
    type: z.string(),
    content: z.unknown(),
    generatedAt: z.string(),
});

export const ExportFileSchema = z.object({
    filename: z.string(),
    type: z.string(),
    category: z.enum(["cover", "interior", "manuscript", "metadata"]),
    previewUrl: z.string().optional(),
    sizeEstimate: z.string(),
});

export const ExportPackageSchema = z.object({
    generatedAt: z.string(),
    version: z.number(),
    layoutStyle: LayoutStyleSchema,
    trimSize: TrimSizeSchema,
    ageRange: z.string(),
    exportTargets: z.array(ExportTargetSchema),
    characterNames: z.array(z.string()),
    kbName: z.string(),
    files: z.object({
        coverFront: ExportFileSchema,
        coverBack: ExportFileSchema,
        interiorPreview: z.array(ExportFileSchema),
        manuscript: ExportFileSchema,
        metadata: ExportFileSchema,
        license: ExportFileSchema,
    }),
});

export const ExportHistorySchema = z.object({
    version: z.number(),
    generatedAt: z.string(),
    exportTargets: z.array(ExportTargetSchema),
});

export const ProjectChangeTrackerSchema = z.object({
    lastCharacterChangeAt: z.string().optional(),
    lastKBChangeAt: z.string().optional(),
});

export const ProjectSchema = z.object({
    id: z.string(),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    universeId: z.string(),
    universeName: z.string(),
    knowledgeBaseId: z.string(),
    knowledgeBaseName: z.string(),
    ageRange: z.string(),
    templateType: TemplateTypeSchema,
    synopsis: z.string(),
    learningObjective: z.string(),
    setting: z.string(),
    characterIds: z.array(z.string()),
    layoutStyle: LayoutStyleSchema,
    trimSize: TrimSizeSchema,
    exportTargets: z.array(ExportTargetSchema),
    pipeline: z.array(PipelineStageStateSchema),
    currentStage: ProjectStageSchema,
    artifacts: z.record(ProjectArtifactSchema),
    exportPackage: ExportPackageSchema.optional(),
    exportHistory: z.array(ExportHistorySchema).optional(),
    changeTracker: ProjectChangeTrackerSchema.optional(),
});

// ============================================
// Credits
// ============================================

export const CreditBalancesSchema = z.object({
    characterCredits: z.number(),
    bookCredits: z.number(),
    plan: PlanTierSchema,
});

export const CreditLedgerEntrySchema = z.object({
    id: z.string(),
    ts: z.string(),
    type: CreditTypeSchema,
    amount: z.number(),
    reason: z.string(),
    entityType: z.enum(["character", "pose", "book", "project", "system"]).optional(),
    entityId: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
});
