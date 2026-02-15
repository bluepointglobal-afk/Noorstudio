/**
 * Phase 11: Asset Generation Integration Tests
 * Tests the assetGeneration.ts module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateIllustrationsAsAssets,
  generateCoverAsAsset,
  type IllustrationGenerationOptions,
  type CoverGenerationOptions,
} from '@/lib/ai/assetGeneration';
import type { StoredProject } from '@/lib/storage/projectsStore';
import type { StoredCharacter } from '@/lib/storage/charactersStore';
import type { ChapterOutput } from '@/lib/ai/prompts';

// Mock the API modules
vi.mock('@/lib/api/universeApi', () => ({
  getUniverse: vi.fn(),
}));

vi.mock('@/lib/api/assetApi', () => ({
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
  listAssets: vi.fn(),
}));

vi.mock('@/lib/api/bookAssetApi', () => ({
  createBookAsset: vi.fn(),
}));

vi.mock('@/lib/ai/providers/imageProvider', () => ({
  generateImage: vi.fn(),
  cancelImageGeneration: vi.fn(),
}));

vi.mock('@/lib/ai/imagePrompts', () => ({
  buildIllustrationPrompt: vi.fn(),
  buildCoverPrompt: vi.fn(),
  generateSceneDescriptionFromChapter: vi.fn(),
}));

import { getUniverse } from '@/lib/api/universeApi';
import { createAsset, updateAsset, listAssets } from '@/lib/api/assetApi';
import { createBookAsset } from '@/lib/api/bookAssetApi';
import { generateImage } from '@/lib/ai/providers/imageProvider';
import {
  buildIllustrationPrompt,
  buildCoverPrompt,
  generateSceneDescriptionFromChapter,
} from '@/lib/ai/imagePrompts';

describe('Asset Generation Integration Tests', () => {
  // Test data
  const mockProject: StoredProject = {
    id: 'test-project-1',
    userId: 'test-user-1',
    title: 'Test Book',
    universeId: 'test-universe-1',
    ageRange: '8-12',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChapters: ChapterOutput[] = [
    {
      chapter_number: 1,
      chapter_title: 'The Beginning',
      text: 'Once upon a time in a magical forest...',
    },
    {
      chapter_number: 2,
      chapter_title: 'The Journey',
      text: 'The hero embarked on a great adventure...',
    },
  ];

  const mockCharacters: StoredCharacter[] = [
    {
      id: 'char-1',
      userId: 'test-user-1',
      name: 'Hero',
      role: 'protagonist',
      description: 'A brave young adventurer',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUniverse = {
    id: 'test-universe-1',
    name: 'Test Universe',
    description: 'A magical fantasy world',
    visualDNA: {
      style: 'vibrant watercolor',
      colorPalette: ['#FF6B6B', '#4ECDC4'],
    },
    writingDNA: {
      tone: 'adventurous',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (getUniverse as any).mockResolvedValue(mockUniverse);
    (createAsset as any).mockResolvedValue({ id: 'asset-1' });
    (updateAsset as any).mockResolvedValue({ id: 'asset-1' });
    (createBookAsset as any).mockResolvedValue({ id: 'book-asset-1' });
    (listAssets as any).mockResolvedValue([]);
    (generateImage as any).mockResolvedValue({
      imageUrl: 'https://example.com/image.png',
      seed: 12345,
    });
    (buildIllustrationPrompt as any).mockReturnValue('Test illustration prompt');
    (buildCoverPrompt as any).mockReturnValue('Test cover prompt');
    (generateSceneDescriptionFromChapter as any).mockReturnValue('Test scene description');
  });

  describe('generateIllustrationsAsAssets', () => {
    it('should generate illustrations for all chapters', async () => {
      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: mockChapters,
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 2,
        reuseApproved: false,
      };

      const result = await generateIllustrationsAsAssets(options);

      expect(result.success).toBe(true);
      expect(result.assets).toHaveLength(2);
      expect(result.linkedToBook).toBe(true);

      // Verify API calls
      expect(getUniverse).toHaveBeenCalledWith('test-universe-1');
      expect(createAsset).toHaveBeenCalledTimes(2);
      expect(updateAsset).toHaveBeenCalledTimes(2);
      expect(createBookAsset).toHaveBeenCalledTimes(2);
      expect(generateImage).toHaveBeenCalledTimes(4); // 2 chapters × 2 variants
    });

    it('should load universe context for enhanced prompts', async () => {
      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
      };

      await generateIllustrationsAsAssets(options);

      expect(getUniverse).toHaveBeenCalledWith('test-universe-1');
    });

    it('should handle missing universe gracefully', async () => {
      const projectWithoutUniverse = { ...mockProject, universeId: undefined };

      const options: IllustrationGenerationOptions = {
        project: projectWithoutUniverse,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
      };

      const result = await generateIllustrationsAsAssets(options);

      expect(result.success).toBe(true);
      expect(getUniverse).not.toHaveBeenCalled();
    });

    it('should reuse approved assets when enabled', async () => {
      const approvedAsset = {
        id: 'approved-asset-1',
        name: 'Existing Illustration',
        type: 'illustration',
        status: 'approved',
        data: { status: 'approved', scene: 'test scene description' },
        thumbnailUrl: 'https://example.com/thumb.png',
        fileUrls: ['https://example.com/image.png'],
        usageCount: 1,
      };

      (listAssets as any).mockResolvedValue([approvedAsset]);

      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 2,
        reuseApproved: true,
      };

      const result = await generateIllustrationsAsAssets(options);

      expect(result.success).toBe(true);
      expect(listAssets).toHaveBeenCalledWith('test-universe-1', 'illustration');
      expect(createAsset).not.toHaveBeenCalled(); // Should reuse, not create
      expect(createBookAsset).toHaveBeenCalledWith({
        bookId: 'test-project-1',
        assetId: 'approved-asset-1',
        role: 'illustration',
        usageContext: expect.any(Object),
      });
    });

    it('should report progress via callback', async () => {
      const progressCallback = vi.fn();

      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: mockChapters,
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
        onProgress: progressCallback,
      };

      await generateIllustrationsAsAssets(options);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'illustrations',
          status: expect.any(String),
          progress: expect.any(Number),
          message: expect.any(String),
        })
      );
    });

    it('should handle generation errors gracefully', async () => {
      (generateImage as any).mockRejectedValue(new Error('Generation failed'));

      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
      };

      const result = await generateIllustrationsAsAssets(options);

      // Should still succeed but with 0 variants
      expect(result.success).toBe(true);
      expect(updateAsset).toHaveBeenCalledWith(
        'asset-1',
        expect.objectContaining({
          data: expect.objectContaining({
            variants: [],
          }),
        })
      );
    });

    it('should support cancellation', async () => {
      let cancelled = false;
      const cancelToken = {
        get cancelled() {
          return cancelled;
        },
      };

      (generateImage as any).mockImplementation(() => {
        cancelled = true;
        return Promise.reject(new Error('Cancelled'));
      });

      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: mockChapters,
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
        cancelToken,
      };

      const result = await generateIllustrationsAsAssets(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generation cancelled');
    });
  });

  describe('generateCoverAsAsset', () => {
    it('should generate cover asset', async () => {
      const options: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        subtitle: 'A Great Adventure',
        authorName: 'Test Author',
        coverType: 'front',
        template: 'classic',
        variantsPerCover: 2,
        reuseApproved: false,
      };

      const result = await generateCoverAsAsset(options);

      expect(result.success).toBe(true);
      expect(result.assets).toHaveLength(1);
      expect(result.linkedToBook).toBe(true);

      // Verify API calls
      expect(getUniverse).toHaveBeenCalledWith('test-universe-1');
      expect(createAsset).toHaveBeenCalledTimes(1);
      expect(updateAsset).toHaveBeenCalledTimes(1);
      expect(createBookAsset).toHaveBeenCalledTimes(1);
      expect(generateImage).toHaveBeenCalledTimes(2); // 2 variants
    });

    it('should use correct dimensions for cover types', async () => {
      const fullCoverOptions: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        coverType: 'full',
        template: 'modern',
        variantsPerCover: 1,
        reuseApproved: false,
      };

      await generateCoverAsAsset(fullCoverOptions);

      expect(generateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1800,
          height: 900,
        })
      );
    });

    it('should reuse approved covers when enabled', async () => {
      const approvedCover = {
        id: 'approved-cover-1',
        name: 'Existing Cover',
        type: 'cover',
        status: 'approved',
        data: { status: 'approved', coverType: 'front', title: 'Test Book' },
        thumbnailUrl: 'https://example.com/cover-thumb.png',
        fileUrls: ['https://example.com/cover.png'],
        usageCount: 1,
      };

      (listAssets as any).mockResolvedValue([approvedCover]);

      const options: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        coverType: 'front',
        template: 'classic',
        variantsPerCover: 2,
        reuseApproved: true,
      };

      const result = await generateCoverAsAsset(options);

      expect(result.success).toBe(true);
      expect(listAssets).toHaveBeenCalledWith('test-universe-1', 'cover');
      expect(createAsset).not.toHaveBeenCalled(); // Should reuse
      expect(createBookAsset).toHaveBeenCalledWith({
        bookId: 'test-project-1',
        assetId: 'approved-cover-1',
        role: 'cover',
        usageContext: expect.any(Object),
      });
    });

    it('should use custom prompt when provided', async () => {
      const customPrompt = 'Custom cover generation prompt';

      const options: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        coverType: 'front',
        template: 'custom',
        customPrompt,
        variantsPerCover: 1,
        reuseApproved: false,
      };

      await generateCoverAsAsset(options);

      expect(createAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            prompt: expect.stringContaining(customPrompt),
          }),
        })
      );
    });

    it('should report progress via callback', async () => {
      const progressCallback = vi.fn();

      const options: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        coverType: 'front',
        template: 'classic',
        variantsPerCover: 1,
        reuseApproved: false,
        onProgress: progressCallback,
      };

      await generateCoverAsAsset(options);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'cover',
          status: expect.any(String),
          progress: expect.any(Number),
          message: expect.any(String),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (createAsset as any).mockRejectedValue(new Error('API Error'));

      const options: CoverGenerationOptions = {
        project: mockProject,
        title: 'Test Book',
        coverType: 'front',
        template: 'classic',
        variantsPerCover: 1,
        reuseApproved: false,
      };

      const result = await generateCoverAsAsset(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });

  describe('Universe Context Enhancement', () => {
    it('should enhance prompts with universe description', async () => {
      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
      };

      await generateIllustrationsAsAssets(options);

      expect(createAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            prompt: expect.stringContaining(mockUniverse.description),
          }),
        })
      );
    });

    it('should enhance prompts with visual DNA style', async () => {
      const options: IllustrationGenerationOptions = {
        project: mockProject,
        chapters: [mockChapters[0]],
        characters: mockCharacters,
        kbSummary: null,
        variantsPerIllustration: 1,
        reuseApproved: false,
      };

      await generateIllustrationsAsAssets(options);

      expect(createAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            prompt: expect.stringContaining('vibrant watercolor'),
          }),
        })
      );
    });
  });
});
