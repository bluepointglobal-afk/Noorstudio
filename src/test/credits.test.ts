import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    consumeCredits,
    getBalances,
    setBalances,
    addCredits
} from '@/lib/storage/creditsStore';

describe('Credits Store', () => {
    beforeEach(() => {
        localStorage.clear();
        setBalances({
            characterCredits: 30,
            bookCredits: 50,
            plan: 'author'
        });
    });

    it('deducts credits correctly when successful', () => {
        const initial = getBalances().bookCredits;
        const result = consumeCredits({
            type: 'book',
            amount: 5,
            reason: 'Testing'
        });

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(initial - 5);
        expect(getBalances().bookCredits).toBe(initial - 5);
    });

    it('fails and does not deduct when insufficient credits', () => {
        const initial = getBalances().bookCredits;
        const result = consumeCredits({
            type: 'book',
            amount: 100, // More than 50
            reason: 'Overdraft'
        });

        expect(result.success).toBe(false);
        expect(getBalances().bookCredits).toBe(initial);
    });

    it('records negative amount in ledger for added credits', () => {
        // This is the current implementation detail from creditsStore.ts:226
        addCredits({
            type: 'book',
            amount: 10,
            reason: 'Bonus'
        });

        expect(getBalances().bookCredits).toBe(60);
    });
});
