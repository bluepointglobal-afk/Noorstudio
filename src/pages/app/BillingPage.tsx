import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Users, BookOpen, TrendingUp, Zap, Calendar, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getBalances,
  getLedger,
  addCredits,
  changePlan,
  getFilteredLedger,
  getCreditStats,
  getPlanLimits,
  resetCredits,
  CreditBalances,
  CreditLedgerEntry,
  LedgerFilters,
} from "@/lib/storage/creditsStore";
import { PlanTier, CreditType } from "@/lib/models";
import {
  PLANS,
  setCurrentPlan as setEntitlementPlan,
  getCurrentPlan as getEntitlementPlan,
  PlanType,
} from "@/lib/entitlements";
import { Check, X } from "lucide-react";

const planDetails: Record<PlanTier, { name: string; price: string; description: string }> = {
  creator: { name: "Creator", price: "$19/mo", description: "For individual creators" },
  author: { name: "Author", price: "$49/mo", description: "For serious authors" },
  studio: { name: "Studio", price: "$149/mo", description: "For teams and studios" },
};

export default function BillingPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const needCreditType = searchParams.get("need") as CreditType | null;
  const [credits, setCredits] = useState<CreditBalances>(getBalances());
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [stats, setStats] = useState(getCreditStats());

  const refreshData = () => {
    setCredits(getBalances());
    setLedger(filters.type || filters.entityType ? getFilteredLedger(filters) : getLedger());
    setStats(getCreditStats());
  };

  useEffect(() => {
    refreshData();
  }, [filters]);

  const plan = planDetails[credits.plan];
  const limits = getPlanLimits(credits.plan);

  const characterPercentage = limits.characterCredits > 0
    ? (credits.characterCredits / limits.characterCredits) * 100
    : 0;
  const bookPercentage = limits.bookCredits > 0
    ? (credits.bookCredits / limits.bookCredits) * 100
    : 0;

  const handleAddCredits = (type: CreditType, amount: number) => {
    addCredits({
      type,
      amount,
      reason: `Demo: Added ${amount} ${type} credits`,
    });
    refreshData();
    toast({
      title: "Credits added",
      description: `+${amount} ${type} credits added to your account.`,
    });
  };

  const handleChangePlan = (newPlan: PlanTier) => {
    changePlan(newPlan);
    // Sync entitlement plan with credits plan
    setEntitlementPlan(newPlan as PlanType);
    refreshData();
    toast({
      title: "Plan changed",
      description: `You are now on the ${planDetails[newPlan].name} plan.`,
    });
  };

  const handleResetCredits = () => {
    resetCredits();
    refreshData();
    toast({
      title: "Credits reset",
      description: "All credits and ledger entries have been reset.",
    });
  };

  const formatDate = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
                <p className="text-2xl font-bold">{limits.characterCredits}/mo</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Book Credits</p>
                <p className="text-2xl font-bold">{limits.bookCredits}/mo</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Select value={credits.plan} onValueChange={(v) => handleChangePlan(v as PlanTier)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleResetCredits}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All (Demo)
              </Button>
            </div>
          </div>

          {/* Credit Usage */}
          <div className="card-glow p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Credit Balances</h2>
                <p className="text-muted-foreground">Current available credits</p>
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
                    {credits.characterCredits}/{limits.characterCredits}
                  </span>
                </div>
                <Progress
                  value={characterPercentage}
                  className={cn("h-3", characterPercentage < 30 && "[&>div]:bg-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  {stats.totalCharacterCreditsUsed} credits used total
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-medium">Book Credits</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {credits.bookCredits}/{limits.bookCredits}
                  </span>
                </div>
                <Progress
                  value={bookPercentage}
                  className={cn("h-3", bookPercentage < 30 && "[&>div]:bg-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  {stats.totalBookCreditsUsed} credits used total
                </p>
              </div>
            </div>
          </div>

          {/* Credit Ledger */}
          <div className="card-glow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Credit History</h2>
              <div className="flex gap-2">
                <Select
                  value={filters.type || "all"}
                  onValueChange={(v) => setFilters({ ...filters, type: v === "all" ? undefined : v as CreditType })}
                >
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ledger.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.slice(0, 20).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(entry.ts)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.entityType || "-"}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        entry.amount > 0 ? "text-destructive" : "text-primary"
                      )}>
                        {entry.amount > 0 ? `-${entry.amount}` : `+${Math.abs(entry.amount)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No credit transactions yet.</p>
                <p className="text-sm">Generate poses or run book pipelines to see activity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Buy Credits - Demo */}
          <div className="card-glow p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Add Credits (Demo)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              For demo purposes, add credits directly without payment.
            </p>
            <div className="space-y-4">
              {/* Character Credits - for pose generation */}
              <div className={cn(
                "space-y-2 p-3 rounded-lg -mx-3 transition-colors",
                needCreditType === "character" && "bg-blue-500/10 ring-2 ring-blue-500/50"
              )}>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>For Characters & Poses</span>
                  {needCreditType === "character" && (
                    <Badge className="bg-blue-500 text-white text-xs">Needed</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-between border-blue-500/30 hover:border-blue-500/50"
                  onClick={() => handleAddCredits("character", 10)}
                >
                  <span>+10 Character Credits</span>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Demo</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between border-blue-500/30 hover:border-blue-500/50"
                  onClick={() => handleAddCredits("character", 25)}
                >
                  <span>+25 Character Credits</span>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Demo</Badge>
                </Button>
              </div>

              {/* Book Credits - for pipeline stages */}
              <div className={cn(
                "space-y-2 p-3 rounded-lg -mx-3 transition-colors",
                needCreditType === "book" && "bg-amber-500/10 ring-2 ring-amber-500/50"
              )}>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>For Book Pipeline</span>
                  {needCreditType === "book" && (
                    <Badge className="bg-amber-500 text-white text-xs">Needed</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-between border-amber-500/30 hover:border-amber-500/50"
                  onClick={() => handleAddCredits("book", 25)}
                >
                  <span>+25 Book Credits</span>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Demo</Badge>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between border-amber-500/30 hover:border-amber-500/50"
                  onClick={() => handleAddCredits("book", 50)}
                >
                  <span>+50 Book Credits</span>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Demo</Badge>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card-glow p-6">
            <h3 className="font-semibold mb-4">Usage Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Character Credits Used</span>
                <span className="font-medium">{stats.totalCharacterCreditsUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Book Credits Used</span>
                <span className="font-medium">{stats.totalBookCreditsUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Transactions</span>
                <span className="font-medium">{stats.transactionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credits Added</span>
                <span className="font-medium text-primary">
                  +{stats.totalCharacterCreditsAdded + stats.totalBookCreditsAdded}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Comparison with Features */}
          <div className="card-glow p-6">
            <h3 className="font-semibold mb-4">Plan Benefits</h3>
            <div className="space-y-4">
              {PLANS.map((planInfo) => {
                const isCurrentPlan = credits.plan === planInfo.id;
                const tierLimits = getPlanLimits(planInfo.id as PlanTier);

                return (
                  <div
                    key={planInfo.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isCurrentPlan
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{planInfo.name}</span>
                        {planInfo.recommended && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <span className="text-sm font-semibold">{planInfo.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{planInfo.description}</p>

                    {/* Feature highlights */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{planInfo.limits.maxCharacters} characters</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{planInfo.limits.maxProjects} projects</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Check className="w-3 h-3 text-primary" />
                        <span>{planInfo.limits.maxKBItemsPerKB} KB items</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {planInfo.limits.exportEnabled ? (
                          <>
                            <Check className="w-3 h-3 text-primary" />
                            <span>Full export</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">No export</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Credit allocation */}
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {tierLimits.characterCredits} char + {tierLimits.bookCredits} book credits/mo
                      </p>
                    </div>

                    {!isCurrentPlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleChangePlan(planInfo.id as PlanTier)}
                      >
                        {planInfo.price === "Free" ? "Downgrade" : "Upgrade"} to {planInfo.name}
                      </Button>
                    )}
                    {isCurrentPlan && (
                      <div className="mt-3 text-center">
                        <Badge className="bg-primary/20 text-primary">Current Plan</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
