// Book Asset Link Model
// Maps to book_assets table (many-to-many relationship)

export type BookAssetRole = 'character' | 'illustration' | 'cover' | 'background' | 'other';

export interface BookAsset {
  id: string;
  book_id: string;
  asset_id: string;
  role: BookAssetRole;
  usage_context: Record<string, any>;
  order_index: number;
  created_at: Date;
}

export interface CreateBookAssetInput {
  book_id: string;
  asset_id: string;
  role: BookAssetRole;
  usage_context?: Record<string, any>;
  order_index?: number;
}

export interface UpdateBookAssetInput {
  role?: BookAssetRole;
  usage_context?: Record<string, any>;
  order_index?: number;
}

export interface BookAssetFilters {
  book_id?: string;
  asset_id?: string;
  role?: BookAssetRole;
}

// Usage context structures for different roles
export interface CharacterUsageContext {
  scenes?: number[]; // Which scenes/chapters this character appears in
  is_main_character?: boolean;
  first_appearance?: number;
  character_arc?: string;
}

export interface IllustrationUsageContext {
  chapter_number?: number;
  scene_number?: number;
  page_number?: number;
  description?: string;
  approved?: boolean;
}

export interface CoverUsageContext {
  position: 'front' | 'back' | 'spine';
  approved?: boolean;
  final?: boolean;
}

// Helper functions for book asset operations
export const BookAssetHelpers = {
  /**
   * Get character usage context with type safety
   */
  getCharacterContext(bookAsset: BookAsset): CharacterUsageContext | null {
    if (bookAsset.role !== 'character') {
      return null;
    }
    return bookAsset.usage_context as CharacterUsageContext;
  },

  /**
   * Get illustration usage context with type safety
   */
  getIllustrationContext(bookAsset: BookAsset): IllustrationUsageContext | null {
    if (bookAsset.role !== 'illustration') {
      return null;
    }
    return bookAsset.usage_context as IllustrationUsageContext;
  },

  /**
   * Get cover usage context with type safety
   */
  getCoverContext(bookAsset: BookAsset): CoverUsageContext | null {
    if (bookAsset.role !== 'cover') {
      return null;
    }
    return bookAsset.usage_context as CoverUsageContext;
  },

  /**
   * Format book asset for API response
   */
  toApiResponse(bookAsset: BookAsset) {
    return {
      id: bookAsset.id,
      bookId: bookAsset.book_id,
      assetId: bookAsset.asset_id,
      role: bookAsset.role,
      usageContext: bookAsset.usage_context,
      orderIndex: bookAsset.order_index,
      createdAt: bookAsset.created_at.toISOString(),
    };
  },

  /**
   * Sort book assets by order_index
   */
  sortByOrder(bookAssets: BookAsset[]): BookAsset[] {
    return [...bookAssets].sort((a, b) => a.order_index - b.order_index);
  },

  /**
   * Group book assets by role
   */
  groupByRole(bookAssets: BookAsset[]): Record<BookAssetRole, BookAsset[]> {
    const grouped: Record<string, BookAsset[]> = {
      character: [],
      illustration: [],
      cover: [],
      background: [],
      other: [],
    };

    for (const bookAsset of bookAssets) {
      grouped[bookAsset.role].push(bookAsset);
    }

    return grouped as Record<BookAssetRole, BookAsset[]>;
  },

  /**
   * Get main characters (is_main_character = true)
   */
  getMainCharacters(bookAssets: BookAsset[]): BookAsset[] {
    return bookAssets.filter((ba) => {
      if (ba.role !== 'character') return false;
      const context = ba.usage_context as CharacterUsageContext;
      return context.is_main_character === true;
    });
  },
};
