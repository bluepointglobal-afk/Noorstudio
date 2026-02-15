// Asset Model
// Maps to assets table in database

export type AssetType = 'character' | 'illustration' | 'cover' | 'background' | 'prop' | 'other';

export interface Asset {
  id: string;
  account_id: string;
  universe_id?: string | null;
  type: AssetType;
  name: string;
  description?: string | null;
  data: Record<string, any>;
  thumbnail_url?: string | null;
  file_urls: string[];
  metadata: Record<string, any>;
  tags: string[];
  usage_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateAssetInput {
  account_id: string;
  universe_id?: string | null;
  type: AssetType;
  name: string;
  description?: string;
  data: Record<string, any>;
  thumbnail_url?: string;
  file_urls?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateAssetInput {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  thumbnail_url?: string;
  file_urls?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
  universe_id?: string | null;
}

export interface AssetFilters {
  account_id: string;
  universe_id?: string;
  type?: AssetType;
  tags?: string[];
  include_deleted?: boolean;
  min_usage_count?: number;
}

// Character-specific data structure (when type = 'character')
export interface CharacterAssetData {
  role?: string;
  ageRange?: string;
  traits?: string[];
  speechStyle?: string;
  appearance?: string;
  modestyRules?: string;
  colorPalette?: string[];
  visualDNA?: Record<string, any>;
  poses?: PoseData[];
  poseSheetUrl?: string;
  poseCount?: number;
}

export interface PoseData {
  id: number;
  name: string;
  poseKey: string;
  imageUrl?: string;
  status: 'draft' | 'approved' | 'locked';
}

// Helper functions for asset operations
export const AssetHelpers = {
  /**
   * Check if asset is active (not soft-deleted)
   */
  isActive(asset: Asset): boolean {
    return asset.deleted_at === null || asset.deleted_at === undefined;
  },

  /**
   * Check if asset is a character
   */
  isCharacter(asset: Asset): boolean {
    return asset.type === 'character';
  },

  /**
   * Get character data with type safety
   */
  getCharacterData(asset: Asset): CharacterAssetData | null {
    if (!AssetHelpers.isCharacter(asset)) {
      return null;
    }
    return asset.data as CharacterAssetData;
  },

  /**
   * Increment usage count (called from trigger, but can be used manually)
   */
  incrementUsage(asset: Asset): Asset {
    return {
      ...asset,
      usage_count: asset.usage_count + 1,
    };
  },

  /**
   * Format asset for API response
   */
  toApiResponse(asset: Asset) {
    return {
      id: asset.id,
      accountId: asset.account_id,
      universeId: asset.universe_id,
      type: asset.type,
      name: asset.name,
      description: asset.description,
      data: asset.data,
      thumbnailUrl: asset.thumbnail_url,
      fileUrls: asset.file_urls,
      metadata: asset.metadata,
      tags: asset.tags,
      usageCount: asset.usage_count,
      createdAt: asset.created_at.toISOString(),
      updatedAt: asset.updated_at.toISOString(),
      deletedAt: asset.deleted_at?.toISOString() || null,
    };
  },

  /**
   * Migrate old Character type to new Asset
   */
  fromLegacyCharacter(character: any, accountId: string, universeId?: string): CreateAssetInput {
    return {
      account_id: accountId,
      universe_id: universeId || null,
      type: 'character',
      name: character.name,
      description: `${character.role} - ${character.ageRange}`,
      data: {
        role: character.role,
        ageRange: character.ageRange,
        traits: character.traits || [],
        speechStyle: character.speechStyle,
        appearance: character.appearance,
        modestyRules: character.modestyRules,
        colorPalette: character.colorPalette || [],
        visualDNA: character.visualDNA || {},
        poses: character.poses || [],
        poseSheetUrl: character.poseSheetUrl,
        poseCount: character.poseCount || 12,
      },
      thumbnail_url: character.imageUrl,
      file_urls: character.poseSheetUrl ? [character.poseSheetUrl] : [],
      metadata: {
        version: character.version || 1,
        status: character.status || 'draft',
        knowledgeLevel: character.knowledgeLevel,
        migratedFrom: 'legacy_character',
      },
      tags: [],
    };
  },
};
