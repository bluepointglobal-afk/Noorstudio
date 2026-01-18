// Artifact Content Types

export interface OutlineArtifactContent {
    chapters: string[];
    synopsis: string;
    kbApplied?: string | null;
    _structured?: unknown;
    _needsReview?: boolean;
    _rawText?: string | null;
}

export interface ChapterArtifactItem {
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
    vocabularyNotes?: string[];
    islamicAdabChecks?: string[];
    _structured?: unknown;
}

export type ChaptersArtifactContent = ChapterArtifactItem[] & {
    _needsReview?: boolean;
    _rawText?: string | null;
};

export interface HumanizeArtifactContent {
    chapters: unknown[];
    _needsReview?: boolean;
    _rawText?: string | null;
}

export interface IllustrationVariant {
    id: string;
    imageUrl: string;
    selected: boolean;
    generatedAt: string;
}

export interface IllustrationArtifactItem {
    id: string;
    chapterNumber: number;
    scene: string;
    imageUrl?: string;
    status: "pending" | "generating" | "draft" | "approved";
    variants?: IllustrationVariant[];
    selectedVariantId?: string;
    characterIds?: string[];
    prompt?: string;
    style?: string;
    generatedAt?: string;
}

export type IllustrationArtifactContent = IllustrationArtifactItem[];

// ============================================
// Layout Types
// ============================================

export type PagePosition = "left" | "right";
export type PageType = "text" | "image" | "mixed" | "blank" | "title" | "copyright";

export interface ContentBlock {
    type: "text" | "image";
    content?: string;         // For text blocks
    imageUrl?: string;        // For image blocks
    position?: "full" | "top" | "bottom" | "left" | "right" | "center";
    caption?: string;
}

export interface PageLayoutItem {
    pageNumber: number;
    position: PagePosition;
    type: PageType;
    blocks: ContentBlock[];
    chapterNumber?: number;
    chapterTitle?: string;
}

export interface SpreadLayoutItem {
    spreadNumber: number;
    leftPage: PageLayoutItem;
    rightPage: PageLayoutItem;
}

export interface LayoutSettings {
    trimSize: string;           // e.g., "6x9", "7x10", "8.5x11"
    marginTop: number;          // in points (72 points = 1 inch)
    marginBottom: number;
    marginInner: number;        // Gutter margin
    marginOuter: number;
    fontSize: number;
    lineHeight: number;
    wordsPerPage: number;       // Estimated based on trim size
}

export interface LayoutArtifactContent {
    pageCount: number;
    spreads: SpreadLayoutItem[];
    settings: LayoutSettings;
    generatedAt: string;
}

export interface CoverArtifactContent {
    frontCoverUrl?: string;
    backCoverUrl?: string;
}

export interface ExportArtifactItem {
    format: string;
    fileUrl: string;
    fileSize: number;
}

export type ExportArtifactContent = ExportArtifactItem[];
