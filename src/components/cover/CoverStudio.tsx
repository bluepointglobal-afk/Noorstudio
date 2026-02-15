import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Plus,
  Check,
  X,
  RefreshCw,
  Download,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAssets } from "@/hooks/useAssets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoverStudioProps {
  universeId: string;
  onSelectCover?: (coverId: string) => void;
}

type CoverType = "front" | "back" | "full" | "spine";
type CoverTemplate = "classic" | "modern" | "minimalist" | "ornate" | "custom";

export function CoverStudio({
  universeId,
  onSelectCover,
}: CoverStudioProps) {
  const { toast } = useToast();
  const { assets: covers, loading, error, create, update, remove } = useAssets(universeId, "cover");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CoverType | "all">("all");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newCover, setNewCover] = useState({
    name: "",
    description: "",
    coverType: "front" as CoverType,
    template: "classic" as CoverTemplate,
    title: "",
    subtitle: "",
    authorName: "",
    prompt: "",
  });

  const filteredCovers = covers.filter(
    (cover) => {
      const matchesSearch =
        cover.name.toLowerCase().includes(search.toLowerCase()) ||
        (cover.description?.toLowerCase() || "").includes(search.toLowerCase());

      const matchesType = filterType === "all" ||
        (cover.data as any)?.coverType === filterType;

      return matchesSearch && matchesType;
    }
  );

  const handleCreateCover = async () => {
    if (!newCover.name || !newCover.title) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and title for the cover.",
        variant: "destructive",
      });
      return;
    }

    try {
      await create({
        universeId,
        type: "cover",
        name: newCover.name,
        description: newCover.description,
        data: {
          coverType: newCover.coverType,
          template: newCover.template,
          title: newCover.title,
          subtitle: newCover.subtitle,
          authorName: newCover.authorName,
          prompt: newCover.prompt,
          status: "pending",
          variants: [],
        },
        tags: ["cover", newCover.coverType, newCover.template],
      });

      toast({
        title: "Cover Created",
        description: `"${newCover.name}" has been created and is generating.`,
      });

      setShowNewDialog(false);
      setNewCover({
        name: "",
        description: "",
        coverType: "front",
        template: "classic",
        title: "",
        subtitle: "",
        authorName: "",
        prompt: "",
      });
    } catch (error) {
      toast({
        title: "Failed to create cover",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleApproveCover = async (coverId: string) => {
    try {
      const cover = covers.find((c) => c.id === coverId);
      if (!cover) return;

      await update(coverId, {
        data: {
          ...cover.data,
          status: "approved",
        },
        metadata: {
          ...cover.metadata,
          approvedAt: new Date().toISOString(),
        },
      });

      toast({
        title: "Cover Approved",
        description: "This cover is now available for use in books.",
      });
    } catch (error) {
      toast({
        title: "Failed to approve cover",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleRejectCover = async (coverId: string) => {
    try {
      const cover = covers.find((c) => c.id === coverId);
      if (!cover) return;

      await update(coverId, {
        data: {
          ...cover.data,
          status: "draft",
        },
      });

      toast({
        title: "Cover Rejected",
        description: "Cover moved back to draft status.",
      });
    } catch (error) {
      toast({
        title: "Failed to reject cover",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30";
      case "draft":
        return "bg-blue-500/10 text-blue-700 border-blue-500/30";
      case "approved":
        return "bg-green-500/10 text-green-700 border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/30";
    }
  };

  const getCoverTypeIcon = (type: CoverType) => {
    switch (type) {
      case "front":
        return <BookOpen className="w-3 h-3" />;
      case "back":
        return <BookOpen className="w-3 h-3 rotate-180" />;
      case "full":
        return <BookOpen className="w-3 h-3" />;
      case "spine":
        return <div className="w-3 h-3 border-l-2 border-current" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Cover Studio</h2>
            <p className="text-sm text-muted-foreground">
              Design and manage book covers for your universe
            </p>
          </div>
        </div>

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              New Cover
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Cover</DialogTitle>
              <DialogDescription>
                Design a new cover asset for this universe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newCover.name}
                    onChange={(e) =>
                      setNewCover({ ...newCover, name: e.target.value })
                    }
                    placeholder="e.g., Adventure Series Cover"
                  />
                </div>

                <div>
                  <Label>Cover Type *</Label>
                  <Select
                    value={newCover.coverType}
                    onValueChange={(v) =>
                      setNewCover({ ...newCover, coverType: v as CoverType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front Cover</SelectItem>
                      <SelectItem value="back">Back Cover</SelectItem>
                      <SelectItem value="full">Full Cover (Front + Back + Spine)</SelectItem>
                      <SelectItem value="spine">Spine Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Template Style *</Label>
                <Select
                  value={newCover.template}
                  onValueChange={(v) =>
                    setNewCover({ ...newCover, template: v as CoverTemplate })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic (Traditional book design)</SelectItem>
                    <SelectItem value="modern">Modern (Clean, contemporary)</SelectItem>
                    <SelectItem value="minimalist">Minimalist (Simple, elegant)</SelectItem>
                    <SelectItem value="ornate">Ornate (Decorative, detailed)</SelectItem>
                    <SelectItem value="custom">Custom (AI-generated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Book Title *</Label>
                <Input
                  value={newCover.title}
                  onChange={(e) =>
                    setNewCover({ ...newCover, title: e.target.value })
                  }
                  placeholder="The title that will appear on the cover"
                />
              </div>

              <div>
                <Label>Subtitle (Optional)</Label>
                <Input
                  value={newCover.subtitle}
                  onChange={(e) =>
                    setNewCover({ ...newCover, subtitle: e.target.value })
                  }
                  placeholder="Optional subtitle or series info"
                />
              </div>

              <div>
                <Label>Author Name</Label>
                <Input
                  value={newCover.authorName}
                  onChange={(e) =>
                    setNewCover({ ...newCover, authorName: e.target.value })
                  }
                  placeholder="Author name to display"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newCover.description}
                  onChange={(e) =>
                    setNewCover({
                      ...newCover,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of this cover design"
                />
              </div>

              <div>
                <Label>Custom Prompt (Optional)</Label>
                <Textarea
                  value={newCover.prompt}
                  onChange={(e) =>
                    setNewCover({ ...newCover, prompt: e.target.value })
                  }
                  placeholder="Additional styling instructions for AI generation..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCover}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create & Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search covers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as CoverType | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="front">Front Cover</SelectItem>
            <SelectItem value="back">Back Cover</SelectItem>
            <SelectItem value="full">Full Cover</SelectItem>
            <SelectItem value="spine">Spine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cover Grid */}
      {filteredCovers.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            {search || filterType !== "all"
              ? "No covers match your filters."
              : "No covers in this universe yet."}
          </p>
          {!search && filterType === "all" && (
            <Button variant="hero" onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Cover
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCovers.map((cover) => {
            const status = (cover.data as any)?.status || "draft";
            const coverType = (cover.data as any)?.coverType || "front";
            const template = (cover.data as any)?.template || "classic";
            const title = (cover.data as any)?.title || "Untitled";
            const thumbnailUrl = cover.thumbnailUrl || cover.fileUrls[0];
            const usageCount = cover.usageCount || 0;

            return (
              <div
                key={cover.id}
                className="card-glow group hover:border-primary/30 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-[2/3] bg-muted rounded-t-lg overflow-hidden relative">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={cover.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                      <BookOpen className="w-16 h-16 text-muted-foreground opacity-30" />
                      <div className="text-center">
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {template} • {coverType}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className={cn("capitalize", getStatusColor(status))}>
                      {status}
                    </Badge>
                  </div>

                  {/* Cover Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {getCoverTypeIcon(coverType)}
                      <span className="ml-1">{coverType}</span>
                    </Badge>
                  </div>

                  {/* Usage Count */}
                  {usageCount > 0 && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        {usageCount} {usageCount === 1 ? "use" : "uses"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {cover.name}
                    </h3>
                    {cover.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {cover.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {template}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {status === "draft" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleApproveCover(cover.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    )}

                    {status === "approved" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRejectCover(cover.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Unapprove
                        </Button>
                        {onSelectCover && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => onSelectCover(cover.id)}
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        )}
                      </>
                    )}

                    {status === "pending" && (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
