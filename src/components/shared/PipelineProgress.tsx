import { cn } from "@/lib/utils";
import { Check, Circle, Loader2 } from "lucide-react";

type StageStatus = "completed" | "in_progress" | "pending";

interface Stage {
  name: string;
  status: StageStatus;
}

interface PipelineProgressProps {
  stages?: Stage[];
  compact?: boolean;
  className?: string;
}

const defaultStages: Stage[] = [
  { name: "Outline", status: "completed" },
  { name: "Chapters", status: "completed" },
  { name: "Illustrations", status: "in_progress" },
  { name: "Export", status: "pending" },
];

export function PipelineProgress({
  stages = defaultStages,
  compact = false,
  className,
}: PipelineProgressProps) {
  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-3", className)}>
      {stages.map((stage, index) => (
        <div key={stage.name} className="flex items-center">
          {/* Stage indicator */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all",
                compact ? "w-6 h-6" : "w-8 h-8",
                stage.status === "completed" && "bg-primary text-primary-foreground",
                stage.status === "in_progress" && "bg-gold-400 text-foreground",
                stage.status === "pending" && "bg-muted text-muted-foreground"
              )}
            >
              {stage.status === "completed" && (
                <Check className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
              )}
              {stage.status === "in_progress" && (
                <Loader2
                  className={cn(
                    "animate-spin",
                    compact ? "w-3 h-3" : "w-4 h-4"
                  )}
                />
              )}
              {stage.status === "pending" && (
                <Circle className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
              )}
            </div>
            {!compact && (
              <span
                className={cn(
                  "text-xs mt-1 whitespace-nowrap",
                  stage.status === "completed" && "text-primary font-medium",
                  stage.status === "in_progress" && "text-gold-600 font-medium",
                  stage.status === "pending" && "text-muted-foreground"
                )}
              >
                {stage.name}
              </span>
            )}
          </div>
          {/* Connector line */}
          {index < stages.length - 1 && (
            <div
              className={cn(
                "h-0.5 mx-1",
                compact ? "w-4" : "w-8",
                stage.status === "completed" ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
