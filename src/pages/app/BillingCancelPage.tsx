/**
 * Billing Cancel Page
 * Displayed when user cancels Stripe checkout
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function BillingCancelPage() {
  return (
    <AppLayout
      title="Payment Canceled"
      subtitle="Your checkout session was canceled"
    >
      <div className="max-w-2xl mx-auto">
        <div className="card-glow p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Payment Canceled</h1>
          <p className="text-muted-foreground mb-8">
            No worries! Your checkout session was canceled and you haven't been charged.
            You can try again whenever you're ready.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h3 className="font-medium mb-3 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Common reasons for canceling:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
              <li>• Wanted to review the pricing again</li>
              <li>• Need to check with team members</li>
              <li>• Want to explore the free tier first</li>
              <li>• Had a question before subscribing</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/app/billing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Billing
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions? Contact support at support@noorstudio.ai
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
