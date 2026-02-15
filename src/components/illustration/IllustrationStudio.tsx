import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Image as ImageIcon,
  Plus,
  Check,
  X,
  RefreshCw,
  Download,
  Link as LinkIcon,
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

interface IllustrationStudioProps {
  universeId: string;
  onSelectIllustration?: (illustrationId: string) => void;
}

export function IllustrationStudio({
  universeId,
  onSelectIllustration,
}: IllustrationStudioProps) {
  const { toast } = useToast();
  const { assets: illustrations, loading, error, create, update, remove } = useAssets(universeId, "illustration");
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newIllustration, setNewIllustration] = useState({
    name: "",
    description: "",
    prompt: "",
    scene: "",
    characterIds: [] as string[],
  });

  const filteredIllustrations = illustrations.filter(
    (ill) =>
      ill.name.toLowerCase().includes(search.toLowerCase()) ||
      (ill.description?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const handleCreateIllustration = async () => {
    if (!newIllustration.name || !newIllustration.prompt) {
      toast({
        title: "Missing Information",
        description: "Please provide a name and prompt for the illustration.",
        variant: "destructive",
      });
      return;
    }

    try {
      await create({
        universeId,
        type: "illustration",
        name: newIllustration.name,
        description: newIllustration.description,
        data: {
          prompt: newIllustration.prompt,
          scene: newIllustration.scene,
          characterIds: newIllustration.characterIds,
          status: "pending",
          variants: [],
        },
        tags: ["illustration"],
      });

      toast({
        title: "Illustration Created",
        description: `"${newIllustration.name}" has been created.`,
      });

      setShowNewDialog(false);
      setNewIllustration({
        name: "",
        description: "",
        prompt: "",
        scene: "",
        characterIds: [],
      });
    } catch (error) {
      toast({
        title: "Failed to create illustration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleApproveIllustration = async (illustrationId: string) => {
    try {
      const illustration = illustrations.find((i) => i.id === illustrationId);
      if (!illustration) return;

      await update(illustrationId, {
        data: {
          ...illustration.data,
          status: "approved",
        },
        metadata: {
          ...illustration.metadata,
          approvedAt: new Date().toISOString(),
        },
      });

      toast({
        title: "Illustration Approved",
        description: "This illustration is now available for use in books.",
      });
    } catch (error) {
      toast({
        title: "Failed to approve illustration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleRejectIllustration = async (illustrationId: string) => {
    try {
      const illustration = illustrations.find((i) => i.id === illustrationId);
      if (!illustration) return;

      await update(illustrationId, {
        data: {
          ...illustration.data,
          status: "draft",
        },
      });

      toast({
        title: "Illustration Rejected",
        description: "Illustration moved back to draft status.",
      });
    } catch (error) {
      toast({
        title: "Failed to reject illustration",
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
          <ImageIcon className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Illustration Studio</h2>
            <p className="text-sm text-muted-foreground">
              Manage reusable illustrations for your universe
            </p>
          </div>
        </div>

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              New Illustration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Illustration</DialogTitle>
              <DialogDescription>
                Generate a new illustration asset for this universe
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newIllustration.name}
                  onChange={(e) =>
                    setNewIllustration({ ...newIllustration, name: e.target.value })
                  }
                  placeholder="e.g., Desert Sunset Landscape"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={newIllustration.description}
                  onChange={(e) =>
                    setNewIllustration({
                      ...newIllustration,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of this illustration"
                />
              </div>

              <div>
                <Label>Scene Context</Label>
                <Input
                  value={newIllustration.scene}
                  onChange={(e) =>
                    setNewIllustration({ ...newIllustration, scene: e.target.value })
                  }
                  placeholder="e.g., Chapter 3 - Journey through the desert"
                />
              </div>

              <div>
                <Label>Generation Prompt *</Label>
                <Textarea
                  value={newIllustration.prompt}
                  onChange={(e) =>
                    setNewIllustration({ ...newIllustration, prompt: e.target.value })
                  }
                  placeholder="Detailed prompt for illustration generation..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateIllustration}>Create & Generate</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search illustrations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Illustration Grid */}
      {filteredIllustrations.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            {search
              ? "No illustrations match your search."
              : "No illustrations in this universe yet."}
          </p>
          {!search && (
            <Button variant="hero" onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Illustration
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIllustrations.map((illustration) => {
            const status = illustration.data?.status || "draft";
            const thumbnailUrl =
              illustration.thumbnailUrl || illustration.fileUrls[0];
            const usageCount = illustration.usageCount || 0;

            return (
              <div
                key={illustration.id}
                className="card-glow group hover:border-primary/30 transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden relative">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={illustration.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className={cn("capitalize", getStatusColor(status))}>
                      {status}
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
                      {illustration.name}
                    </h3>
                    {illustration.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {illustration.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {status === "draft" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleApproveIllustration(illustration.id)}
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
                          onClick={() => handleRejectIllustration(illustration.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Unapprove
                        </Button>
                        {onSelectIllustration && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1"
                            onClick={() => onSelectIllustration(illustration.id)}
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
