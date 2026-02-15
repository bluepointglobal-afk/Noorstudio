import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  History,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  listOutlineVersions,
  getCurrentOutline,
  setCurrentVersion,
  updateLockedSections,
  OutlineVersion,
} from "@/lib/api/outlineVersionApi";

interface OutlineVersionHistoryProps {
  bookId: string;
  onVersionChange?: (version: OutlineVersion) => void;
}

export function OutlineVersionHistory({
  bookId,
  onVersionChange,
}: OutlineVersionHistoryProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<OutlineVersion[]>([]);
  const [currentVersion, setCurrentVersionState] = useState<OutlineVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [lockChanges, setLockChanges] = useState<Map<string, string[]>>(new Map());

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, [bookId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const [allVersions, current] = await Promise.all([
        listOutlineVersions(bookId),
        getCurrentOutline(bookId),
      ]);
      setVersions(allVersions);
      setCurrentVersionState(current);
    } catch (error) {
      toast({
        title: "Failed to load versions",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    try {
      const updated = await setCurrentVersion(versionId);
      setCurrentVersionState(updated);
      await loadVersions();

      toast({
        title: "Version Restored",
        description: `Version ${versionNumber} is now the current outline.`,
      });

      if (onVersionChange) {
        onVersionChange(updated);
      }
    } catch (error) {
      toast({
        title: "Failed to restore version",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleToggleSectionLock = (versionId: string, sectionIndex: string) => {
    setLockChanges((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(versionId) || [];
      const updated = current.includes(sectionIndex)
        ? current.filter((i) => i !== sectionIndex)
        : [...current, sectionIndex];
      newMap.set(versionId, updated);
      return newMap;
    });
  };

  const handleSaveLocks = async (versionId: string) => {
    const locked = lockChanges.get(versionId);
    if (!locked) return;

    try {
      await updateLockedSections(versionId, locked);
      await loadVersions();
      setLockChanges((prev) => {
        const newMap = new Map(prev);
        newMap.delete(versionId);
        return newMap;
      });

      toast({
        title: "Locks Saved",
        description: "Section locks updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to save locks",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getOutlineChapters = (version: OutlineVersion): string[] => {
    try {
      const data = version.data as { chapters?: string[] };
      return data.chapters || [];
    } catch {
      return [];
    }
  };

  const getCurrentLocks = (versionId: string, version: OutlineVersion): string[] => {
    return lockChanges.get(versionId) || version.lockedSections || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Clock className="w-5 h-5 mr-2 animate-pulse" />
        <span>Loading version history...</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No version history available</p>
        <p className="text-sm">Versions will appear here after outline changes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Outline Version History</h3>
          <Badge variant="outline">{versions.length} versions</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {versions.map((version) => {
          const isCurrent = version.isCurrent;
          const isExpanded = expandedVersion === version.id;
          const chapters = getOutlineChapters(version);
          const currentLocks = getCurrentLocks(version.id, version);
          const hasUnsavedLocks = lockChanges.has(version.id);

          return (
            <div
              key={version.id}
              className={cn(
                "rounded-lg border-2 transition-all",
                isCurrent
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              {/* Version Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() =>
                        setExpandedVersion(isExpanded ? null : version.id)
                      }
                      className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          Version {version.versionNumber}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>

                      {version.changeSummary && (
                        <p className="text-sm">{version.changeSummary}</p>
                      )}

                      {chapters.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {chapters.length} chapters
                          {currentLocks.length > 0 &&
                            ` • ${currentLocks.length} locked`}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleRestoreVersion(version.id, version.versionNumber)
                      }
                      className="flex-shrink-0"
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && chapters.length > 0 && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">
                        Chapter Locks
                      </Label>
                      {hasUnsavedLocks && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveLocks(version.id)}
                        >
                          Save Locks
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {chapters.map((chapter, idx) => {
                        const sectionId = String(idx);
                        const isLocked = currentLocks.includes(sectionId);

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md transition-colors",
                              isLocked
                                ? "bg-primary/10"
                                : "bg-background hover:bg-muted"
                            )}
                          >
                            <Checkbox
                              id={`${version.id}-lock-${idx}`}
                              checked={isLocked}
                              onCheckedChange={() =>
                                handleToggleSectionLock(version.id, sectionId)
                              }
                            />
                            <label
                              htmlFor={`${version.id}-lock-${idx}`}
                              className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                            >
                              {isLocked ? (
                                <Lock className="w-3 h-3 text-primary" />
                              ) : (
                                <Unlock className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className="font-medium">
                                Chapter {idx + 1}:
                              </span>
                              <span className="text-muted-foreground truncate">
                                {chapter}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <Lock className="w-3 h-3 inline mr-1" />
                        Locked chapters won't be regenerated when you update the outline
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
