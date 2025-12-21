import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoUserCredits, demoCreditLedger } from "@/lib/demo-data";
import { useCredits } from "@/hooks/use-credits";
import { CreditCard, Users, BookOpen, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const planDetails = {
  creator: { name: "Creator", price: "$19/mo", characterCredits: 10, bookCredits: 15 },
  author: { name: "Author", price: "$49/mo", characterCredits: 30, bookCredits: 50 },
  studio: { name: "Studio", price: "$149/mo", characterCredits: 100, bookCredits: 200 },
};

export default function BillingPage() {
  const { credits } = useCredits();
  const plan = planDetails[credits.plan];

  const characterPercentage = (credits.characterCredits / credits.characterCreditsMax) * 100;
  const bookPercentage = (credits.bookCredits / credits.bookCreditsMax) * 100;

  return (
    <AppLayout
      title="Billing & Credits"
      subtitle="Manage your subscription and credit usage"
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan */}
          <div className="card-glow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Current Plan</h2>
                  <p className="text-muted-foreground">Your subscription details</p>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                {plan.name}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Monthly Price</p>
                <p className="text-2xl font-bold">{plan.price}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Character Credits</p>
                <p className="text-2xl font-bold">{plan.characterCredits}/mo</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Book Credits</p>
                <p className="text-2xl font-bold">{plan.bookCredits}/mo</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">Manage Billing</Button>
            </div>
          </div>

          {/* Credit Usage */}
          <div className="card-glow p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Credit Usage</h2>
                <p className="text-muted-foreground">This billing cycle</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">Character Credits</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {credits.characterCredits}/{credits.characterCreditsMax}
                  </span>
                </div>
                <Progress
                  value={characterPercentage}
                  className={cn("h-3", characterPercentage < 30 && "[&>div]:bg-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  {credits.characterCreditsMax - credits.characterCredits} credits used this month
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-medium">Book Credits</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {credits.bookCredits}/{credits.bookCreditsMax}
                  </span>
                </div>
                <Progress
                  value={bookPercentage}
                  className={cn("h-3", bookPercentage < 30 && "[&>div]:bg-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  {credits.bookCreditsMax - credits.bookCredits} credits used this month
                </p>
              </div>
            </div>
          </div>

          {/* Credit Ledger */}
          <div className="card-glow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Credit History</h2>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoCreditLedger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">-{entry.creditsUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buy Credits */}
          <div className="card-glow p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Need More Credits?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Top up your credits anytime without changing your plan.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>10 Character Credits</span>
                <span className="font-medium">$9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>25 Book Credits</span>
                <span className="font-medium">$19</span>
              </div>
            </div>
            <Button variant="hero" className="w-full">
              Buy Credits
            </Button>
          </div>

          {/* Upgrade CTA */}
          {credits.plan !== "studio" && (
            <div className="card-glow p-6">
              <h3 className="font-semibold mb-2">Upgrade to {credits.plan === "creator" ? "Author" : "Studio"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get more credits and unlock team features.
              </p>
              <Button variant="outline" className="w-full">
                View Plans
              </Button>
            </div>
          )}

          {/* Quick Stats */}
          <div className="card-glow p-6">
            <h3 className="font-semibold mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Characters Created</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Poses Generated</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Books Started</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pages Exported</span>
                <span className="font-medium">48</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
