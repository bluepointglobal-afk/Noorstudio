// Universe Model
// Maps to universes table in database

export interface Universe {
  id: string;
  account_id: string;
  name: string;
  description?: string | null;
  series_bible?: string | null;
  writing_dna: Record<string, any>;
  visual_dna: Record<string, any>;
  default_style_id?: string | null;
  book_presets: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
  book_count: number;
  character_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateUniverseInput {
  account_id: string;
  name: string;
  description?: string;
  series_bible?: string;
  writing_dna?: Record<string, any>;
  visual_dna?: Record<string, any>;
  default_style_id?: string;
  book_presets?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateUniverseInput {
  name?: string;
  description?: string;
  series_bible?: string;
  writing_dna?: Record<string, any>;
  visual_dna?: Record<string, any>;
  default_style_id?: string | null;
  book_presets?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UniverseFilters {
  account_id: string;
  tags?: string[];
  include_deleted?: boolean;
  min_book_count?: number;
}

// Writing DNA structure
export interface WritingDNA {
  tone?: string;
  pacing?: string;
  vocabulary_level?: string;
  sentence_structure?: string;
  themes?: string[];
  moral_lessons?: string[];
  faith_integration?: string;
  narrative_style?: string;
}

// Visual DNA structure
export interface VisualDNA {
  art_style?: string;
  color_palette?: string[];
  mood?: string;
  detail_level?: string;
  composition_style?: string;
  lighting_preference?: string;
}

// Book Presets structure
export interface BookPresets {
  default_age_range?: string;
  default_chapter_count?: number;
  default_illustration_count?: number;
  default_page_layout?: string;
  default_format?: string;
  default_language?: string;
}

// Helper functions for universe operations
export const UniverseHelpers = {
  /**
   * Check if universe is active (not soft-deleted)
   */
  isActive(universe: Universe): boolean {
    return universe.deleted_at === null || universe.deleted_at === undefined;
  },

  /**
   * Get writing DNA with type safety
   */
  getWritingDNA(universe: Universe): WritingDNA {
    return universe.writing_dna as WritingDNA;
  },

  /**
   * Get visual DNA with type safety
   */
  getVisualDNA(universe: Universe): VisualDNA {
    return universe.visual_dna as VisualDNA;
  },

  /**
   * Get book presets with type safety
   */
  getBookPresets(universe: Universe): BookPresets {
    return universe.book_presets as BookPresets;
  },

  /**
   * Check if universe has any books
   */
  hasBooks(universe: Universe): boolean {
    return universe.book_count > 0;
  },

  /**
   * Check if universe has any characters
   */
  hasCharacters(universe: Universe): boolean {
    return universe.character_count > 0;
  },

  /**
   * Format universe for API response
   */
  toApiResponse(universe: Universe) {
    return {
      id: universe.id,
      accountId: universe.account_id,
      name: universe.name,
      description: universe.description,
      seriesBible: universe.series_bible,
      writingDNA: universe.writing_dna,
      visualDNA: universe.visual_dna,
      defaultStyleId: universe.default_style_id,
      bookPresets: universe.book_presets,
      metadata: universe.metadata,
      tags: universe.tags,
      bookCount: universe.book_count,
      characterCount: universe.character_count,
      createdAt: universe.created_at.toISOString(),
      updatedAt: universe.updated_at.toISOString(),
      deletedAt: universe.deleted_at?.toISOString() || null,
    };
  },

  /**
   * Create default writing DNA
   */
  createDefaultWritingDNA(): WritingDNA {
    return {
      tone: 'warm and engaging',
      pacing: 'moderate',
      vocabulary_level: 'age-appropriate',
      sentence_structure: 'simple and clear',
      themes: [],
      moral_lessons: [],
      faith_integration: 'natural and age-appropriate',
      narrative_style: 'third-person storytelling',
    };
  },

  /**
   * Create default visual DNA
   */
  createDefaultVisualDNA(): VisualDNA {
    return {
      art_style: 'pixar-3d',
      color_palette: [],
      mood: 'bright and cheerful',
      detail_level: 'moderate',
      composition_style: 'balanced',
      lighting_preference: 'soft and warm',
    };
  },

  /**
   * Create default book presets
   */
  createDefaultBookPresets(): BookPresets {
    return {
      default_age_range: '6-8',
      default_chapter_count: 8,
      default_illustration_count: 12,
      default_page_layout: 'text-under',
      default_format: 'hardcover',
      default_language: 'en',
    };
  },
};
