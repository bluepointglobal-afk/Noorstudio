// Demo Viewer Page - Public read-only view of a project
// /demo/:id route

import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Users,
  Database,
  FileText,
  Image,
  Package,
  Layout,
  Clock,
  Eye,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileImage,
  FileJson,
  File,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadProjectForDemo,
  getShareTokenFromUrl,
  DemoProjectData,
} from "@/lib/demo/demoStore";
import {
  StoredProject,
  ExportFile,
  isExportStale,
} from "@/lib/storage/projectsStore";

// ============================================
// Demo Header Component
// ============================================

function DemoHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">NoorStudio</span>
        </Link>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs">
            Demo Preview
          </Badge>
          <Link to="/app/dashboard">
            <Button variant="hero" size="sm">
              Create Your Own
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================
// Demo Footer Component
// ============================================

function DemoFooter() {
  return (
    <footer className="border-t border-border py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Made with NoorStudio
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          AI-powered Islamic children's book creation platform
        </p>
      </div>
    </footer>
  );
}

// ============================================
// Empty State Component
// ============================================

function DemoEmptyState({ error, errorType }: { error: string; errorType?: string }) {
  // Determine title based on error type
  const getTitle = () => {
    switch (errorType) {
      case "token_required":
        return "Share Token Required";
      case "token_invalid":
        return "Link Invalid or Expired";
      default:
        return "Demo Not Available";
    }
  };

  // Determine help text based on error type
  const getHelpText = () => {
    switch (errorType) {
      case "token_required":
        return (
          <ul className="space-y-1 text-muted-foreground">
            <li>• The URL is missing a share token (the ?t=... part)</li>
            <li>• Ask the project owner for a complete share link</li>
            <li>• Or if you're the owner, re-share from the project page</li>
          </ul>
        );
      case "token_invalid":
        return (
          <ul className="space-y-1 text-muted-foreground">
            <li>• The share token is invalid or has expired</li>
            <li>• The project may have been deleted</li>
            <li>• Ask the owner for a new share link</li>
          </ul>
        );
      case "not_found":
        return (
          <ul className="space-y-1 text-muted-foreground">
            <li>• The project was not found on this device</li>
            <li>• If shared, the link may be incomplete</li>
            <li>• Check that you have the full URL with token</li>
          </ul>
        );
      default:
        return null;
    }
  };

  const helpText = getHelpText();

  return (
    <div className="min-h-screen flex flex-col">
      <DemoHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{getTitle()}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          {helpText && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border text-left text-sm mb-6">
              <p className="font-medium mb-2">Why am I seeing this?</p>
              {helpText}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link to="/app/dashboard">
              <Button variant="hero">
                <Sparkles className="w-4 h-4 mr-2" />
                Create a Book
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <DemoFooter />
    </div>
  );
}

// ============================================
// Main Demo Viewer Component
// ============================================

export default function DemoViewerPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [demoData, setDemoData] = useState<DemoProjectData | null>(null);
  const [error, setError] = useState<{ message: string; type?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("outline");
  const [previewFile, setPreviewFile] = useState<ExportFile | null>(null);

  useEffect(() => {
    if (!id) {
      setError({ message: "No project ID provided", type: "invalid_id" });
      setIsLoading(false);
      return;
    }

    // Get share token from URL for cross-device access
    const shareToken = getShareTokenFromUrl();

    // Load project (async for Supabase support)
    async function loadDemo() {
      try {
        const result = await loadProjectForDemo(id, shareToken || undefined);
        if (result.success && result.data) {
          setDemoData(result.data);

          // Set initial tab to first available artifact
          const project = result.data.project;
          if (project.artifacts.outline) setActiveTab("outline");
          else if (project.artifacts.chapters) setActiveTab("chapters");
        } else {
          setError({ message: result.error || "Unknown error", type: result.errorType });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Error loading demo:", err);
        }
        setError({ message: "Failed to load demo", type: "parse_error" });
      } finally {
        setIsLoading(false);
      }
    }

    loadDemo();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DemoHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading demo...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !demoData) {
    return <DemoEmptyState error={error?.message || "Project not found"} errorType={error?.type} />;
  }

  const { project, characters, kbSummary } = demoData;

  // Get artifacts
  const outlineArtifact = project.artifacts.outline?.content as {
    chapters: string[];
    synopsis: string;
    kbApplied?: string | null;
    _structured?: { book_title: string; moral: string; chapters: Array<{ title: string; goal: string; key_scene: string }> };
  } | undefined;

  const chaptersArtifact = project.artifacts.chapters?.content as Array<{
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
    vocabularyNotes?: string[];
    islamicAdabChecks?: string[];
  }> | undefined;

  const illustrationsArtifact = project.artifacts.illustrations?.content as Array<{
    id: string;
    chapterNumber: number;
    scene: string;
    imageUrl?: string;
    status: string;
  }> | undefined;

  const coverArtifact = project.artifacts.cover?.content as {
    frontCoverUrl?: string;
    backCoverUrl?: string;
  } | undefined;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <DemoHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Summary */}
        <div className="card-glow p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Preview */}
            {coverArtifact?.frontCoverUrl && (
              <div className="w-full md:w-48 flex-shrink-0">
                <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border shadow-lg">
                  <img
                    src={coverArtifact.frontCoverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x400/f1f5f9/64748b?text=Cover";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Book Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {project.templateType}
                </Badge>
                <Badge variant="outline">Ages {project.ageRange}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground mb-4">
                {outlineArtifact?.synopsis || project.synopsis || "A beautiful Islamic children's story"}
              </p>

              {outlineArtifact?._structured?.moral && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-sm">
                    <span className="font-medium text-primary">Moral:</span>{" "}
                    {outlineArtifact._structured.moral}
                  </p>
                </div>
              )}

              {/* Characters */}
              {characters.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Characters</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border"
                      >
                        {char.thumbnailUrl ? (
                          <img
                            src={char.thumbnailUrl}
                            alt={char.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {char.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm">{char.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {char.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KB Summary */}
              {kbSummary && (
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{kbSummary.kbName}</span>
                    {kbSummary.faithRules.length > 0 && (
                      <span className="text-muted-foreground"> • {kbSummary.faithRules.length} faith rules</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="md:w-48 space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Layout Style</p>
                <p className="font-medium capitalize text-sm">{project.layoutStyle.replace(/-/g, " ")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Trim Size</p>
                <p className="font-medium text-sm">{project.trimSize}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="font-medium text-sm">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            {project.artifacts.outline && (
              <TabsTrigger value="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Outline
              </TabsTrigger>
            )}
            {chaptersArtifact && (
              <TabsTrigger value="chapters" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Chapters
              </TabsTrigger>
            )}
            {illustrationsArtifact && (
              <TabsTrigger value="illustrations" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Illustrations
              </TabsTrigger>
            )}
            {project.exportPackage && (
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Export
              </TabsTrigger>
            )}
          </TabsList>

          {/* Outline Tab */}
          <TabsContent value="outline">
            <div className="card-glow p-6">
              <h2 className="text-xl font-semibold mb-4">Book Outline</h2>
              {outlineArtifact?.chapters && (
                <ul className="space-y-4">
                  {outlineArtifact.chapters.map((chapter, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{chapter}</p>
                        {outlineArtifact._structured?.chapters[idx] && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {outlineArtifact._structured.chapters[idx].key_scene}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters">
            <div className="space-y-6">
              {chaptersArtifact?.map((chapter) => (
                <div key={chapter.chapterNumber} className="card-glow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {chapter.wordCount} words
                    </Badge>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                    {chapter.content}
                  </div>
                  {(chapter.vocabularyNotes?.length || chapter.islamicAdabChecks?.length) && (
                    <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-2 gap-4">
                      {chapter.vocabularyNotes && chapter.vocabularyNotes.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            Vocabulary
                          </p>
                          <ul className="space-y-1">
                            {chapter.vocabularyNotes.map((note, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">
                                • {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {chapter.islamicAdabChecks && chapter.islamicAdabChecks.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            Islamic Adab
                          </p>
                          <ul className="space-y-1">
                            {chapter.islamicAdabChecks.map((check, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">
                                • {check}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Illustrations Tab */}
          <TabsContent value="illustrations">
            <div className="card-glow p-6">
              <h2 className="text-xl font-semibold mb-4">Illustrations</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {illustrationsArtifact?.map((ill) => (
                  <div
                    key={ill.id}
                    className="rounded-xl overflow-hidden border border-border bg-muted/30"
                  >
                    {ill.imageUrl ? (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={ill.imageUrl}
                          alt={ill.scene}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x300/f1f5f9/64748b?text=Illustration";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] flex items-center justify-center bg-muted">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <Badge variant="outline" className="text-xs mb-2">
                        Chapter {ill.chapterNumber}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ill.scene}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            {project.exportPackage && (
              <div className="space-y-6">
                {/* Export Header */}
                <div className="card-glow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">Book Package</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(project.exportPackage.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">v{project.exportPackage.version}</Badge>
                  </div>

                  {/* Export Summary */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Layout Style</p>
                      <p className="font-medium capitalize text-sm">
                        {project.exportPackage.layoutStyle.replace(/-/g, " ")}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Trim Size</p>
                      <p className="font-medium text-sm">{project.exportPackage.trimSize}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Age Range</p>
                      <p className="font-medium text-sm">{project.exportPackage.ageRange}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Export Formats</p>
                      <div className="flex gap-1">
                        {project.exportPackage.exportTargets.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs uppercase">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interior Preview */}
                <div className="card-glow p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Interior Layout Preview
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {project.exportPackage.files.interiorPreview.map((page, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer"
                        onClick={() => setPreviewFile(page)}
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-border transition-all group-hover:border-primary group-hover:shadow-lg">
                          {page.previewUrl ? (
                            <img
                              src={page.previewUrl}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://placehold.co/300x400/f1f5f9/64748b?text=Page+${idx + 1}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
                              <FileImage className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          Page {idx + 1}
                        </p>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Covers */}
                <div className="card-glow p-6">
                  <h3 className="font-semibold mb-4">Cover Art</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {[project.exportPackage.files.coverFront, project.exportPackage.files.coverBack].map(
                      (cover, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer"
                          onClick={() => setPreviewFile(cover)}
                        >
                          <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border transition-all group-hover:border-primary group-hover:shadow-lg">
                            {cover.previewUrl ? (
                              <img
                                src={cover.previewUrl}
                                alt={idx === 0 ? "Front Cover" : "Back Cover"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/300x400/f1f5f9/64748b?text=Cover";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
                                <FileImage className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-center mt-2 font-medium">
                            {idx === 0 ? "Front Cover" : "Back Cover"}
                          </p>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Version History */}
                {project.exportHistory && project.exportHistory.length > 1 && (
                  <div className="card-glow p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Export History
                    </h3>
                    <div className="space-y-2">
                      {[...project.exportHistory].reverse().map((history, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            idx === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={idx === 0 ? "default" : "outline"} className="text-xs">
                              v{history.version}
                            </Badge>
                            <span className="text-sm">
                              {new Date(history.generatedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {history.exportTargets.map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs uppercase">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <DemoFooter />

      {/* File Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile?.type === "png" ? (
                <FileImage className="w-5 h-5" />
              ) : previewFile?.type === "json" ? (
                <FileJson className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
              {previewFile?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewFile?.previewUrl && (
              <div className="rounded-lg overflow-hidden border bg-muted/50">
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.filename}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/600x800/f1f5f9/64748b?text=Preview+Not+Available";
                  }}
                />
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Type: {previewFile?.type.toUpperCase()}</span>
              <span>Size: {previewFile?.sizeEstimate}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
