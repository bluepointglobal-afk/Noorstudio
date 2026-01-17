import { describe, it, expect, beforeEach } from 'vitest';
import {
    canExport,
    canCreateKBItem,
    canCreateProject,
    setCurrentPlan,
    setDemoMode
} from '@/lib/entitlements/entitlements';

describe('Entitlements - Creator Plan Limits', () => {
    beforeEach(() => {
        localStorage.clear();
        setCurrentPlan('creator');
        setDemoMode(false); // Explicitly disable demo mode for testing limits
    });

    it('blocks Export stage on Creator plan', () => {
        const result = canExport();
        expect(result.allowed).toBe(false);
        expect(result.upgradeRequired).toBe(true);
        expect(result.reason).toContain('Export is not available on the Creator plan');
    });

    it('blocks > 10 KB items on Creator plan', () => {
        // 10 is allowed (limit is 10)
        expect(canCreateKBItem(9).allowed).toBe(true);
        expect(canCreateKBItem(10).allowed).toBe(false);

        const result = canCreateKBItem(10);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(10);
    });

    it('blocks > 1 project on Creator plan', () => {
        // 1 is allowed (limit is 1)
        expect(canCreateProject(0).allowed).toBe(true);
        expect(canCreateProject(1).allowed).toBe(false);

        const result = canCreateProject(1);
        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(1);
    });
});
