// Outline Version Model
// Maps to outline_versions table for versioning support

export interface OutlineVersion {
  id: string;
  book_id: string;
  version_number: number;
  data: Record<string, any>;
  locked_sections: string[];
  change_summary?: string | null;
  is_current: boolean;
  created_by?: string | null;
  created_at: Date;
}

export interface CreateOutlineVersionInput {
  book_id: string;
  version_number?: number; // Auto-increments if not provided
  data: Record<string, any>;
  locked_sections?: string[];
  change_summary?: string;
  is_current?: boolean;
  created_by?: string;
}

export interface UpdateOutlineVersionInput {
  data?: Record<string, any>;
  locked_sections?: string[];
  change_summary?: string;
  is_current?: boolean;
}

export interface OutlineVersionFilters {
  book_id: string;
  is_current?: boolean;
  min_version?: number;
  max_version?: number;
}

// Outline data structure
export interface OutlineData {
  title?: string;
  synopsis?: string;
  chapters: ChapterOutline[];
  metadata?: Record<string, any>;
}

export interface ChapterOutline {
  id: string; // Unique ID for section locking
  chapter_number: number;
  title: string;
  summary: string;
  key_events?: string[];
  characters?: string[]; // Character asset IDs
  scenes?: SceneOutline[];
  word_count_target?: number;
  locked?: boolean; // Frontend convenience (derived from locked_sections)
}

export interface SceneOutline {
  id: string; // Unique ID for scene-level locking
  scene_number: number;
  description: string;
  setting?: string;
  characters?: string[];
  illustration_needed?: boolean;
}

// Helper functions for outline version operations
export const OutlineVersionHelpers = {
  /**
   * Check if this is the current version
   */
  isCurrent(version: OutlineVersion): boolean {
    return version.is_current === true;
  },

  /**
   * Get outline data with type safety
   */
  getOutlineData(version: OutlineVersion): OutlineData {
    return version.data as OutlineData;
  },

  /**
   * Check if a section is locked
   */
  isSectionLocked(version: OutlineVersion, sectionId: string): boolean {
    return version.locked_sections.includes(sectionId);
  },

  /**
   * Check if a chapter is locked
   */
  isChapterLocked(version: OutlineVersion, chapterId: string): boolean {
    return version.locked_sections.includes(chapterId);
  },

  /**
   * Get locked chapter IDs
   */
  getLockedChapterIds(version: OutlineVersion): string[] {
    const outlineData = OutlineVersionHelpers.getOutlineData(version);
    return outlineData.chapters
      .filter((ch) => version.locked_sections.includes(ch.id))
      .map((ch) => ch.id);
  },

  /**
   * Get unlocked chapters for regeneration
   */
  getUnlockedChapters(version: OutlineVersion): ChapterOutline[] {
    const outlineData = OutlineVersionHelpers.getOutlineData(version);
    return outlineData.chapters.filter(
      (ch) => !version.locked_sections.includes(ch.id)
    );
  },

  /**
   * Count locked vs unlocked sections
   */
  getLockStats(version: OutlineVersion): { locked: number; unlocked: number; total: number } {
    const outlineData = OutlineVersionHelpers.getOutlineData(version);
    const total = outlineData.chapters.length;
    const locked = version.locked_sections.length;
    return {
      locked,
      unlocked: total - locked,
      total,
    };
  },

  /**
   * Format outline version for API response
   */
  toApiResponse(version: OutlineVersion) {
    return {
      id: version.id,
      bookId: version.book_id,
      versionNumber: version.version_number,
      data: version.data,
      lockedSections: version.locked_sections,
      changeSummary: version.change_summary,
      isCurrent: version.is_current,
      createdBy: version.created_by,
      createdAt: version.created_at.toISOString(),
    };
  },

  /**
   * Create version diff summary
   */
  createDiffSummary(oldVersion: OutlineVersion, newVersion: OutlineVersion): string {
    const oldData = OutlineVersionHelpers.getOutlineData(oldVersion);
    const newData = OutlineVersionHelpers.getOutlineData(newVersion);

    const changes: string[] = [];

    // Check chapter count change
    if (oldData.chapters.length !== newData.chapters.length) {
      changes.push(
        `Chapter count: ${oldData.chapters.length} → ${newData.chapters.length}`
      );
    }

    // Check locked sections change
    if (oldVersion.locked_sections.length !== newVersion.locked_sections.length) {
      changes.push(
        `Locked sections: ${oldVersion.locked_sections.length} → ${newVersion.locked_sections.length}`
      );
    }

    // Check title change
    if (oldData.title !== newData.title) {
      changes.push(`Title changed`);
    }

    // Check synopsis change
    if (oldData.synopsis !== newData.synopsis) {
      changes.push(`Synopsis updated`);
    }

    return changes.length > 0 ? changes.join(', ') : 'No major changes';
  },

  /**
   * Merge locked sections from old version to new version
   */
  mergeLocked(oldVersion: OutlineVersion, newData: OutlineData): OutlineData {
    // Mark chapters as locked based on old version's locked_sections
    return {
      ...newData,
      chapters: newData.chapters.map((chapter) => ({
        ...chapter,
        locked: oldVersion.locked_sections.includes(chapter.id),
      })),
    };
  },
};
