import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Columns2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  LayoutArtifactContent,
  SpreadLayoutItem,
  PageLayoutItem,
  PageType,
} from "@/lib/types/artifacts";

interface LayoutPreviewProps {
  layout: LayoutArtifactContent;
  className?: string;
}

// Page type icons and colors
const pageTypeConfig: Record<PageType, { icon: React.ElementType; color: string; label: string }> = {
  text: { icon: FileText, color: "bg-blue-100 border-blue-300 text-blue-700", label: "Text" },
  image: { icon: ImageIcon, color: "bg-purple-100 border-purple-300 text-purple-700", label: "Image" },
  mixed: { icon: Columns2, color: "bg-teal-100 border-teal-300 text-teal-700", label: "Mixed" },
  blank: { icon: BookOpen, color: "bg-gray-100 border-gray-300 text-gray-500", label: "Blank" },
  title: { icon: BookOpen, color: "bg-gold-100 border-gold-300 text-gold-700", label: "Title" },
  copyright: { icon: FileText, color: "bg-gray-100 border-gray-300 text-gray-600", label: "Copyright" },
};

function PageThumbnail({ page, isSelected }: { page: PageLayoutItem; isSelected: boolean }) {
  const config = pageTypeConfig[page.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
        config.color,
        isSelected && "ring-2 ring-primary ring-offset-2",
        page.position === "left" ? "rounded-r-none border-r" : "rounded-l-none border-l-0"
      )}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Page content preview */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {page.type === "image" && page.blocks[0]?.imageUrl ? (
          <img
            src={page.blocks[0].imageUrl}
            alt={`Page ${page.pageNumber}`}
            className="max-w-full max-h-full object-contain rounded"
          />
        ) : (
          <>
            <Icon className="w-6 h-6 mb-1 opacity-70" />
            {page.chapterTitle && (
              <span className="text-[10px] font-medium text-center line-clamp-2 px-1">
                {page.chapterTitle}
              </span>
            )}
          </>
        )}
      </div>

      {/* Page number badge */}
      <Badge
        variant="outline"
        className={cn(
          "absolute bottom-1 text-[10px] px-1.5 py-0",
          page.position === "left" ? "left-1" : "right-1"
        )}
      >
        {page.pageNumber}
      </Badge>

      {/* Chapter indicator */}
      {page.chapterNumber && (
        <Badge
          className="absolute top-1 left-1 text-[10px] px-1.5 py-0 bg-primary"
        >
          Ch {page.chapterNumber}
        </Badge>
      )}
    </div>
  );
}

function SpreadThumbnail({
  spread,
  isSelected,
  onClick,
}: {
  spread: SpreadLayoutItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full aspect-[2/1.4] rounded-lg overflow-hidden border-2 transition-all hover:shadow-md cursor-pointer",
        isSelected ? "border-primary shadow-lg" : "border-muted-foreground/30 hover:border-muted-foreground/50"
      )}
    >
      <div className="w-1/2 h-full">
        <PageThumbnail page={spread.leftPage} isSelected={isSelected} />
      </div>
      <div className="w-1/2 h-full">
        <PageThumbnail page={spread.rightPage} isSelected={isSelected} />
      </div>
    </button>
  );
}

function SpreadDetail({ spread }: { spread: SpreadLayoutItem }) {
  return (
    <div className="flex w-full aspect-[2/1.2] rounded-xl overflow-hidden border-2 border-muted shadow-lg bg-white">
      {/* Left Page */}
      <div className="w-1/2 h-full border-r border-dashed border-muted-foreground/20 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Page {spread.leftPage.pageNumber}
          </Badge>
          <Badge className={cn("text-xs", pageTypeConfig[spread.leftPage.type].color)}>
            {pageTypeConfig[spread.leftPage.type].label}
          </Badge>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-lg p-4">
          {spread.leftPage.type === "image" && spread.leftPage.blocks[0]?.imageUrl ? (
            <img
              src={spread.leftPage.blocks[0].imageUrl}
              alt={`Page ${spread.leftPage.pageNumber}`}
              className="max-w-full max-h-full object-contain rounded shadow"
            />
          ) : spread.leftPage.type === "text" || spread.leftPage.type === "mixed" ? (
            <div className="text-sm text-muted-foreground text-center">
              {spread.leftPage.chapterTitle && (
                <h4 className="font-bold mb-2 text-foreground">{spread.leftPage.chapterTitle}</h4>
              )}
              <p className="line-clamp-6 text-left">
                {spread.leftPage.blocks[0]?.content || "Text content"}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              {pageTypeConfig[spread.leftPage.type].label} Page
            </span>
          )}
        </div>
      </div>

      {/* Right Page */}
      <div className="w-1/2 h-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Page {spread.rightPage.pageNumber}
          </Badge>
          <Badge className={cn("text-xs", pageTypeConfig[spread.rightPage.type].color)}>
            {pageTypeConfig[spread.rightPage.type].label}
          </Badge>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-lg p-4">
          {spread.rightPage.type === "image" && spread.rightPage.blocks[0]?.imageUrl ? (
            <img
              src={spread.rightPage.blocks[0].imageUrl}
              alt={`Page ${spread.rightPage.pageNumber}`}
              className="max-w-full max-h-full object-contain rounded shadow"
            />
          ) : spread.rightPage.type === "text" || spread.rightPage.type === "mixed" ? (
            <div className="text-sm text-muted-foreground text-center">
              {spread.rightPage.chapterTitle && (
                <h4 className="font-bold mb-2 text-foreground">{spread.rightPage.chapterTitle}</h4>
              )}
              <p className="line-clamp-6 text-left">
                {spread.rightPage.blocks[0]?.content || "Text content"}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              {pageTypeConfig[spread.rightPage.type].label} Page
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LayoutPreview({ layout, className }: LayoutPreviewProps) {
  const [selectedSpread, setSelectedSpread] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "detail">("detail");

  const spreads = layout.spreads;
  const totalSpreads = spreads.length;

  const goToPrevious = () => {
    setSelectedSpread((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setSelectedSpread((prev) => Math.min(totalSpreads - 1, prev + 1));
  };

  // Count page types for summary
  const pageTypeCounts = spreads.reduce(
    (acc, spread) => {
      acc[spread.leftPage.type] = (acc[spread.leftPage.type] || 0) + 1;
      acc[spread.rightPage.type] = (acc[spread.rightPage.type] || 0) + 1;
      return acc;
    },
    {} as Record<PageType, number>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">Book Layout Preview</h3>
          <p className="text-sm text-muted-foreground">
            {layout.pageCount} pages across {totalSpreads} spreads ({layout.settings.trimSize} format)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <ZoomOut className="w-4 h-4 mr-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === "detail" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("detail")}
          >
            <ZoomIn className="w-4 h-4 mr-1" />
            Detail
          </Button>
        </div>
      </div>

      {/* Page type legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(pageTypeCounts) as PageType[]).map((type) => {
          const config = pageTypeConfig[type];
          const Icon = config.icon;
          return (
            <Badge key={type} variant="outline" className={cn("gap-1", config.color)}>
              <Icon className="w-3 h-3" />
              {config.label}: {pageTypeCounts[type]}
            </Badge>
          );
        })}
      </div>

      {viewMode === "detail" ? (
        <>
          {/* Navigation controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={selectedSpread === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Spread {selectedSpread + 1} of {totalSpreads}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={selectedSpread === totalSpreads - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected spread detail view */}
          <SpreadDetail spread={spreads[selectedSpread]} />

          {/* Thumbnail strip */}
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {spreads.map((spread, index) => (
                <div key={spread.spreadNumber} className="w-32 flex-shrink-0">
                  <SpreadThumbnail
                    spread={spread}
                    isSelected={index === selectedSpread}
                    onClick={() => setSelectedSpread(index)}
                  />
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Spread {spread.spreadNumber}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {spreads.map((spread, index) => (
            <div key={spread.spreadNumber}>
              <SpreadThumbnail
                spread={spread}
                isSelected={index === selectedSpread}
                onClick={() => {
                  setSelectedSpread(index);
                  setViewMode("detail");
                }}
              />
              <p className="text-xs text-center text-muted-foreground mt-1">
                Spread {spread.spreadNumber}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
