/**
 * Billing Success Page
 * Displayed after successful Stripe checkout
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, CreditCard, Users, BookOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBalances, getPlanLimits, CreditBalances } from "@/lib/storage/creditsStore";

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [credits, setCredits] = useState<CreditBalances | null>(null);

  useEffect(() => {
    // Refresh credit data on mount
    // In production, this would sync from Supabase after webhook processes
    setCredits(getBalances());
  }, []);

  const limits = credits ? getPlanLimits(credits.plan) : null;

  return (
    <AppLayout
      title="Payment Successful"
      subtitle="Thank you for your subscription"
    >
      <div className="max-w-2xl mx-auto">
        <div className="card-glow p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Your subscription has been activated. Your credits will be available shortly.
          </p>

          {credits && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">
                  {credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)} Plan
                </span>
                <Badge className="bg-green-500/10 text-green-500">Active</Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    Character Credits
                  </div>
                  <p className="text-2xl font-bold">
                    {credits.characterCredits}
                    {limits && <span className="text-sm text-muted-foreground">/{limits.characterCredits}</span>}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    Book Credits
                  </div>
                  <p className="text-2xl font-bold">
                    {credits.bookCredits}
                    {limits && <span className="text-sm text-muted-foreground">/{limits.bookCredits}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {sessionId && (
            <p className="text-xs text-muted-foreground mb-6">
              Session ID: {sessionId}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/app/billing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Billing
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact support at support@noorstudio.ai
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
