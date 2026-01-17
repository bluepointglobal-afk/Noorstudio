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

export interface IllustrationArtifactItem {
    id: string;
    chapterNumber: number;
    scene: string;
    imageUrl?: string;
    status: string;
}

export type IllustrationArtifactContent = IllustrationArtifactItem[];

export interface LayoutArtifactContent {
    pageCount: number;
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
