import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runOutlineStage, runChaptersStage } from '@/lib/ai/stageRunner';
import { StoredProject } from '@/lib/storage/projectsStore';
import { StoredCharacter } from '@/lib/storage/charactersStore';
import * as TextProvider from '@/lib/ai/providers/textProvider';

// Mock the text provider
vi.mock('@/lib/ai/providers/textProvider', () => ({
    generateTextWithJSONRetry: vi.fn(),
    generateText: vi.fn(),
    CancelToken: class {
        cancelled = false;
        cancel() { this.cancelled = true; }
    }
}));

// Mock config
vi.mock('@/lib/ai/config', () => ({
    isTextMockMode: () => false,
    getAIConfig: () => ({ textProxyUrl: 'http://mock' })
}));

// Mock budget
vi.mock('@/lib/ai/budget', () => ({
    enforceBudget: () => ({ adjustedInput: '', warnings: [], maxOutputTokens: 1000 }),
    planChapterBatches: (count: number) => [[...Array(count).keys()]],
    estimateTokens: () => 100
}));

// Mock prompts to avoid dependencies
vi.mock('@/lib/ai/prompts', () => ({
    buildOutlinePrompt: () => ({ system: 'sys', prompt: 'prompt' }),
    buildChapterPrompt: () => ({ system: 'sys', prompt: 'prompt' }),
    buildJsonRepairPrompt: () => ({ system: 'sys', prompt: 'prompt' }),
    buildHumanizePrompt: () => ({ system: 'sys', prompt: 'prompt' }),
    OUTLINE_SCHEMA: {},
    CHAPTER_SCHEMA: {},
    HUMANIZE_SCHEMA: {}
}));

describe('AI Parse Error Recovery', () => {
    const mockProject = { id: 'p1', title: 'Test Project', artifacts: {} } as StoredProject;
    const mockCharacters = [] as StoredCharacter[];
    const mockKbRules = null;
    const onProgress = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runOutlineStage returns rawText on parse failure', async () => {
        const rawText = "This is not JSON";
        const error = { message: "JSON parse error", rawText };

        // Mock the implementation to throw the specific error structure expected
        vi.mocked(TextProvider.generateTextWithJSONRetry).mockRejectedValue(error);

        const result = await runOutlineStage(mockProject, mockCharacters, mockKbRules, onProgress);

        expect(result.success).toBe(false);
        expect(result.needsReview).toBe(true);
        expect(result.rawText).toBe(rawText);
        expect(result.error).toBe("JSON parse error");
    });

    it('runChaptersStage returns rawText on parse failure', async () => {
        const rawText = "Chapter 1 text but not JSON";
        const error = { message: "JSON parse error", rawText };

        // Mock outline artifact for input
        // Mock outline artifact for input
        const outline = { chapters: [{ title: 'C1', goal: 'G1' }] } as unknown as { chapters: unknown[] };

        vi.mocked(TextProvider.generateTextWithJSONRetry).mockRejectedValue(error);

        const result = await runChaptersStage(mockProject, outline, mockCharacters, mockKbRules, onProgress);

        expect(result.success).toBe(false);
        expect(result.needsReview).toBe(true);
        expect(result.rawText).toBe(rawText);
        expect(result.error).toBe("JSON parse error");
    });
});
