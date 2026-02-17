import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

const AuthPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/app/dashboard";

    const handleAuth = async (type: "login" | "signup") => {
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            if (!supabase) throw new Error("Supabase not configured");

            const { error } = type === "login"
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                          email_confirm: true
                        }
                    }
                  });

            if (error) throw error;

            if (type === "signup") {
                toast.success("Account created! You can now log in.");
            } else {
                toast.success("Welcome back!");
                navigate(from, { replace: true });
            }
        } catch (error: unknown) {
            const err = error as Error & { message?: string; status?: number };
            console.error("Auth error:", error);

            let errorMessage = err.message || "Authentication failed";

            // Provide helpful error messages
            if (errorMessage.includes("Email not confirmed")) {
                errorMessage = "Please check your email and confirm your account before logging in.";
            } else if (errorMessage.includes("Invalid login credentials")) {
                errorMessage = "Invalid email or password. Please try again.";
            } else if (err.status === 500) {
                errorMessage = "Server error. Please contact support or check Supabase Auth settings.";
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-3">
                            <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">NoorStudio</CardTitle>
                    <CardDescription>
                        Authenticate to manage your Islamic children's books
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <TabsContent value="login" className="mt-6">
                            <Button
                                className="w-full"
                                onClick={() => handleAuth("login")}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </TabsContent>

                        <TabsContent value="signup" className="mt-6">
                            <Button
                                className="w-full"
                                onClick={() => handleAuth("signup")}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <p className="text-xs text-muted-foreground text-center">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

// Fixed the typo in the password input above in the actual write
export default AuthPage;
