import { cn } from "@/lib/utils";
import { RefreshCw, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Pose {
  id: number;
  name: string;
  status: "draft" | "approved" | "locked";
}

interface PoseGridProps {
  characterName: string;
  poses?: Pose[];
  className?: string;
}

const defaultPoses: Pose[] = [
  { id: 1, name: "Front Neutral", status: "approved" },
  { id: 2, name: "Front Happy", status: "approved" },
  { id: 3, name: "Front Thinking", status: "approved" },
  { id: 4, name: "Side Left", status: "draft" },
  { id: 5, name: "Side Right", status: "approved" },
  { id: 6, name: "Back View", status: "draft" },
  { id: 7, name: "Sitting", status: "approved" },
  { id: 8, name: "Walking", status: "approved" },
  { id: 9, name: "Praying", status: "locked" },
  { id: 10, name: "Reading", status: "approved" },
  { id: 11, name: "Pointing", status: "draft" },
  { id: 12, name: "Waving", status: "approved" },
];

const statusIcons = {
  draft: RefreshCw,
  approved: Check,
  locked: Lock,
};

const statusColors = {
  draft: "border-gold-400 bg-gold-50",
  approved: "border-teal-500 bg-teal-50",
  locked: "border-muted bg-muted",
};

export function PoseGrid({
  characterName,
  poses = defaultPoses,
  className,
}: PoseGridProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          12-Pose Sheet: {characterName}
        </h3>
        <Button variant="soft" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate All
        </Button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {poses.map((pose) => {
          const StatusIcon = statusIcons[pose.status];
          return (
            <div
              key={pose.id}
              className={cn(
                "aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all hover:shadow-md cursor-pointer group",
                statusColors[pose.status]
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-primary">
                  {characterName.charAt(0)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground text-center line-clamp-1">
                {pose.name}
              </span>
              <StatusIcon className="w-3 h-3 mt-1 text-muted-foreground" />
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        Pose sheets ensure your character looks consistent across all book illustrations.
      </p>
    </div>
  );
}
