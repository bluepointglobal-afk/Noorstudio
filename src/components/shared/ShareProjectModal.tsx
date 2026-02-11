import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  shareProject,
  copyShareLink,
  removeShareAccess,
  updateSharePermission,
  getProjectCollaborators,
  ProjectPermission,
} from "@/lib/sharing/shareStore";
import {
  Copy,
  Trash2,
  Loader2,
  Mail,
  Lock,
  Eye,
  Check,
} from "lucide-react";
import { ProjectShare } from "@/lib/storage/projectsStore";

interface ShareProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function ShareProjectModal({
  isOpen,
  onOpenChange,
  projectId,
  projectTitle,
}: ShareProjectModalProps) {
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<ProjectShare[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<ProjectPermission>("view");
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState<string | null>(null);
  const [tab, setTab] = useState<"share" | "collaborators">("share");

  // Load collaborators when modal opens
  const loadCollaborators = () => {
    const collab = getProjectCollaborators(projectId);
    setCollaborators(collab);
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      const result = await shareProject(projectId, email, permission);

      if (result.success) {
        toast({
          title: "Project shared!",
          description: `Shared with ${email} (${permission} access)`,
        });

        // Load updated collaborators
        loadCollaborators();

        // Show the share URL
        if (result.shareUrl) {
          setShareUrl(result.shareUrl);
          setTab("share");
        }

        setEmail("");
        setPermission("view");
      } else {
        toast({
          title: "Share failed",
          description: result.error || "Could not share project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    const copied = await copyShareLink(shareUrl);
    if (copied) {
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    setIsRemoving(collaboratorEmail);

    try {
      const result = removeShareAccess(projectId, collaboratorEmail);

      if (result.success) {
        toast({
          title: "Removed",
          description: `${collaboratorEmail} no longer has access`,
        });
        loadCollaborators();
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not remove access",
          variant: "destructive",
        });
      }
    } finally {
      setIsRemoving(null);
    }
  };

  const handleUpdatePermission = async (
    collaboratorEmail: string,
    newPermission: ProjectPermission
  ) => {
    setIsUpdatingPermission(collaboratorEmail);

    try {
      const result = updateSharePermission(projectId, collaboratorEmail, newPermission);

      if (result.success) {
        toast({
          title: "Updated",
          description: `${collaboratorEmail} now has ${newPermission} access`,
        });
        loadCollaborators();
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not update permission",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdatingPermission(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      loadCollaborators();
      setShareUrl(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{projectTitle}"</DialogTitle>
          <DialogDescription>
            Invite collaborators to work on this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tab-like navigation */}
          <div className="flex gap-2 border-b">
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === "share"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab("share")}
            >
              Share
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === "collaborators"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTab("collaborators")}
            >
              Collaborators ({collaborators.length})
            </button>
          </div>

          {tab === "share" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="collaborator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSharing) {
                        handleShare();
                      }
                    }}
                    disabled={isSharing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Permission Level</label>
                <Select value={permission} onValueChange={(v) => setPermission(v as ProjectPermission)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Only
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Can Edit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {permission === "view"
                    ? "Collaborators can view the project but cannot make changes"
                    : "Collaborators can view and edit the project"}
                </p>
              </div>

              <Button
                onClick={handleShare}
                disabled={isSharing || !email.trim()}
                className="w-full"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>

              {shareUrl && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground">
                    Share this link:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="text-xs bg-background border rounded px-2 py-1 flex-1 truncate"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This link expires in 1 year
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-64 pr-4">
              {collaborators.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No collaborators yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share the project to add collaborators
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.email}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{collab.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Shared {new Date(collab.sharedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Select
                        value={collab.permission}
                        onValueChange={(v) =>
                          handleUpdatePermission(collab.email, v as ProjectPermission)
                        }
                        disabled={isUpdatingPermission === collab.email}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCollaborator(collab.email)}
                        disabled={isRemoving === collab.email}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isRemoving === collab.email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
