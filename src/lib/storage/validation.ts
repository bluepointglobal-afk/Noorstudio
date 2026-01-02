import { z } from "zod";
import { toast } from "sonner";

/**
 * Validates data against a Zod schema and repairs it if necessary.
 * If validation fails, it moves the corrupt data to a quarantine key and returns the default value.
 * 
 * @param key The localStorage key being validated
 * @param data The data to validate
 * @param schema The Zod schema to validate against
 * @param defaultValue The default value to return if validation fails
 * @returns Validated data or defaultValue
 */
export function validateAndRepair<T>(
    key: string,
    data: unknown,
    schema: z.ZodSchema<T>,
    defaultValue: T
): T {
    if (data === null || data === undefined) {
        return defaultValue;
    }

    const result = schema.safeParse(data);

    if (result.success) {
        return result.data;
    }

    // Handle corruption
    console.warn(`Data validation failed for key "${key}". Quarantining corrupt data.`, result.error);

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const quarantineKey = `noorstudio.corrupt.${key}.${timestamp}`;

        // Attempt to store the corrupt payload for future debugging
        localStorage.setItem(quarantineKey, JSON.stringify(data));

        // Notify the user
        toast.error("We repaired corrupted local data.", {
            description: "A backup of the corrupt data was saved to internal storage.",
        });
    } catch (e) {
        console.error("Failed to quarantine corrupt data", e);
    }

    return defaultValue;
}

/**
 * Special validator for arrays of items.
 * If individual items are corrupt, it filters them out.
 * If the entire structure is corrupt, it returns the defaultValue.
 */
export function validateArrayAndRepair<T>(
    key: string,
    data: unknown,
    itemSchema: z.ZodSchema<T>,
    defaultValue: T[] = []
): T[] {
    if (!Array.isArray(data)) {
        return validateAndRepair(key, data, z.array(itemSchema), defaultValue);
    }

    let hasCorruption = false;
    const validatedItems = data.filter((item) => {
        const result = itemSchema.safeParse(item);
        if (!result.success) {
            hasCorruption = true;
            return false;
        }
        return true;
    });

    if (hasCorruption) {
        console.warn(`Some items in "${key}" were corrupt and have been removed.`);

        // Save the filtered version back to localStorage to prevent repeated toasts
        // This is optional and depends on whether we want to auto-persist the repair
        // For now, we just return the cleaned up array.

        toast.warning("We repaired some corrupted items in your storage.");
    }

    return validatedItems;
}
