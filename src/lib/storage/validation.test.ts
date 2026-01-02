import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { validateAndRepair, validateArrayAndRepair } from "./validation";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn(),
    },
}));

describe("storage/validation", () => {
    const schema = z.object({ id: z.string(), val: z.number() });
    const defaultValue = { id: "default", val: 0 };
    const key = "test.key";

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe("validateAndRepair", () => {
        it("returns data if valid", () => {
            const data = { id: "1", val: 10 };
            const result = validateAndRepair(key, data, schema, defaultValue);
            expect(result).toEqual(data);
        });

        it("returns defaultValue and quarantines if invalid", () => {
            const corruptData = { id: "1", val: "not-a-number" };
            const result = validateAndRepair(key, corruptData, schema, defaultValue);

            expect(result).toEqual(defaultValue);
            expect(toast.error).toHaveBeenCalled();

            // Check if quarantined
            const keys = Object.keys(localStorage);
            const quarantineKey = keys.find(k => k.startsWith(`noorstudio.corrupt.${key}`));
            expect(quarantineKey).toBeDefined();
            expect(JSON.parse(localStorage.getItem(quarantineKey!)!)).toEqual(corruptData);
        });

        it("returns defaultValue if data is null", () => {
            const result = validateAndRepair(key, null, schema, defaultValue);
            expect(result).toEqual(defaultValue);
        });
    });

    describe("validateArrayAndRepair", () => {
        it("returns array if all items valid", () => {
            const data = [{ id: "1", val: 10 }, { id: "2", val: 20 }];
            const result = validateArrayAndRepair(key, data, schema);
            expect(result).toEqual(data);
        });

        it("filters out corrupt items", () => {
            const data = [
                { id: "1", val: 10 },
                { id: "2", val: "corrupt" },
                { id: "3", val: 30 }
            ];
            const result = validateArrayAndRepair(key, data, schema);

            expect(result).toHaveLength(2);
            expect(result).toEqual([{ id: "1", val: 10 }, { id: "3", val: 30 }]);
            expect(toast.warning).toHaveBeenCalled();
        });

        it("repairs entire structure if not an array", () => {
            const data = { not: "an-array" };
            const result = validateArrayAndRepair(key, data, schema, []);
            expect(result).toEqual([]);
            expect(toast.error).toHaveBeenCalled();
        });
    });
});
