import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, ArrowRight, Check } from "lucide-react";
import { getPlanInfo, PLANS, PlanType } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: string;
  currentLimit?: number;
  limitType?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title = "Upgrade Required",
  description,
  feature,
  currentLimit,
  limitType,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const currentPlan = getPlanInfo();

  // Get upgrade options (plans better than current)
  const upgradeOptions = PLANS.filter(
    (p) => PLANS.indexOf(p) > PLANS.findIndex((cp) => cp.id === currentPlan.id)
  );

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/app/billing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              {currentPlan && (
                <p className="text-sm text-muted-foreground">
                  Current plan: <span className="font-medium">{currentPlan.name}</span>
                </p>
              )}
            </div>
          </div>
          <DialogDescription className="text-base pt-2">
            {description ||
              `You've reached the limit for this feature on your current plan.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Current limit info */}
          {currentLimit !== undefined && limitType && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{limitType}</span>
                <Badge variant="secondary">
                  {currentLimit} / {currentLimit} used
                </Badge>
              </div>
            </div>
          )}

          {/* Feature highlight */}
          {feature && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Unlock {feature}</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to access this feature and more.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade options preview */}
          {upgradeOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Upgrade options
              </p>
              {upgradeOptions.slice(0, 2).map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    plan.recommended
                      ? "border-primary/50 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{plan.name}</span>
                      {plan.recommended && (
                        <Badge variant="default" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold text-primary">{plan.price}</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button variant="hero" className="flex-1" onClick={handleUpgrade}>
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simpler inline banner for locked features
interface UpgradeBannerProps {
  title?: string;
  description?: string;
  className?: string;
}

export function UpgradeBanner({
  title = "Feature Locked",
  description = "Upgrade your plan to unlock this feature.",
  className,
}: UpgradeBannerProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "p-6 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50/50 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-gold-100 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-gold-600" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
      <Button variant="hero" onClick={() => navigate("/app/billing")}>
        <Sparkles className="w-4 h-4 mr-2" />
        Upgrade Plan
      </Button>
    </div>
  );
}
