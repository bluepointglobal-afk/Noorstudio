import { supabase } from "@/lib/supabase/client";

/**
 * Enhanced fetch that automatically adds the Supabase JWT token to the Authorization header
 * if a session exists. Trims token to prevent "invalid header value" errors.
 */
export async function authenticatedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const headers = new Headers(init?.headers || {});

    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            // Trim whitespace/newlines to prevent invalid header errors
            const token = session.access_token.trim().replace(/\s+/g, '');
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    return fetch(input, {
        ...init,
        headers,
    });
}
