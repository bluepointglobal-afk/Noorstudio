import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { setStorageUserId } from "@/lib/storage/keys";
import { syncCreditsWithServer } from "@/lib/storage/creditsStore";
import { Loader2 } from "lucide-react";

export interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) {
                // No Supabase configured - allow demo mode
                setAuthenticated(true);
                setLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setAuthenticated(false);
                setStorageUserId(null);
                // Redirect to auth page with return path
                navigate("/auth", { state: { from: location } });
            } else {
                setAuthenticated(true);
                setStorageUserId(session.user.id);
                syncCreditsWithServer();
            }
            setLoading(false);
        };

        checkAuth();

        // Set up listener for auth changes
        const { data: { subscription } } = supabase?.auth.onAuthStateChange(
            (_event, session) => {
                if (!session) {
                    setAuthenticated(false);
                    setStorageUserId(null);
                    navigate("/auth", { state: { from: location } });
                } else {
                    setAuthenticated(true);
                    setStorageUserId(session.user.id);
                }
            }
        ) ?? { data: { subscription: null } };

        return () => {
            subscription?.unsubscribe();
        };
    }, [navigate, location]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return null;
    }

    return <>{children}</>;
};
