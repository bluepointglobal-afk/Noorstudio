import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  iconClassName?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
}: FeatureCardProps) {
  return (
    <div className={cn("card-premium p-6", className)}>
      <div
        className={cn(
          "w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4",
          iconClassName
        )}
      >
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
