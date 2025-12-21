import { cn } from "@/lib/utils";
import { Users, BookOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreditBadgeProps {
  type: "character" | "book";
  current: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function CreditBadge({ type, current, max, className, showLabel = false }: CreditBadgeProps) {
  const percentage = (current / max) * 100;
  const isLow = percentage < 30;
  const Icon = type === "character" ? Users : BookOpen;
  const label = type === "character" ? "Character Credits" : "Book Credits";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
            isLow
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-muted border-border text-muted-foreground",
            className
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {current}/{max}
          </span>
          {showLabel && <span className="text-xs hidden sm:inline">{label}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {label}: {current} of {max} remaining
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
