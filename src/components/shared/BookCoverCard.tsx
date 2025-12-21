import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface BookCoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  author?: string;
  ageRange: string;
  category: string;
  imageUrl?: string;
  coverUrl?: string;
}

export function BookCoverCard({
  title,
  author,
  ageRange,
  category,
  imageUrl,
  coverUrl,
  className,
}: BookCoverCardProps) {
  const imgSrc = imageUrl || coverUrl;
  return (
    <div className={cn("card-glow overflow-hidden group", className)}>
      {/* Cover placeholder */}
      <div className="aspect-[3/4] bg-gradient-teal relative overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white">
            <BookOpen className="w-12 h-12 mb-4 opacity-80" />
            <h4 className="text-lg font-bold text-center leading-tight">{title}</h4>
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-gold-400 text-foreground">
          {category}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{title}</h3>
        {author && (
          <p className="text-sm text-muted-foreground mb-2">by {author}</p>
        )}
        <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-primary">
          Ages {ageRange}
        </span>
      </div>
    </div>
  );
}
