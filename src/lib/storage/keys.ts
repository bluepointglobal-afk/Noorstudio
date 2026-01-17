import { supabase } from "@/lib/supabase/client";

/**
 * Global variable to hold the current user ID for synchronous storage key generation.
 * This is populated by the AuthGuard or at app initialization.
 */
let currentUserId: string | null = null;

/**
 * Set the current user ID for storage namespace.
 */
export function setStorageUserId(userId: string | null): void {
    currentUserId = userId;
}

/**
 * Get a namespaced storage key.
 * If a user is authenticated, the key is suffixed with their user ID.
 * Example: 'noorstudio.projects.v1' -> 'noorstudio.projects.v1:u123'
 */
export function getNamespacedKey(baseKey: string): string {
    if (currentUserId) {
        return `${baseKey}:${currentUserId}`;
    }

    // Hardening: If we are in an app route but user not found, 
    // we could return a 'temp' key or the base key.
    // We prefer returning the base key for transition/legacy support
    // but for a fresh "Hardened" state, we want users to login first.
    return baseKey;
}
