import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CharacterCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  role: string;
  ageRange: string;
  imageUrl?: string;
  status?: "draft" | "approved" | "locked";
}

const statusColors = {
  draft: "bg-gold-100 text-gold-600",
  approved: "bg-teal-100 text-teal-600",
  locked: "bg-muted text-muted-foreground",
};

export function CharacterCard({
  name,
  role,
  ageRange,
  imageUrl,
  status = "draft",
  className,
}: CharacterCardProps) {
  return (
    <div className={cn("card-glow overflow-hidden group", className)}>
      {/* Image placeholder - Pixar-style character */}
      <div className="aspect-square bg-gradient-subtle relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {name.charAt(0)}
              </span>
            </div>
          </div>
        )}
        <Badge className={cn("absolute top-3 right-3", statusColors[status])}>
          {status}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{role}</p>
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {ageRange}
        </span>
      </div>
    </div>
  );
}
