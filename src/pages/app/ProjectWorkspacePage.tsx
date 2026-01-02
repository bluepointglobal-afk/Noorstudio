import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Play,
  Check,
  Loader2,
  FileText,
  Image,
  Layout,
  BookOpen,
  Download,
  RotateCcw,
  Eye,
  Plus,
  CreditCard,
  Package,
  File,
  FileJson,
  FileImage,
  AlertTriangle,
  Clock,
  X,
  Zap,
  Share2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";
import { mockJobRunner, JobProgressEvent } from "@/lib/jobs/mockJobRunner";
import {
  isAIStage,
  runOutlineStage,
  runChaptersStage,
  runHumanizeStage,
  getProjectAIUsage,
  AIUsageStats,
  StageRunnerProgress,
  CancelToken,
  OutlineOutput,
  ChapterOutput,
} from "@/lib/ai";
import { ProjectStage, PIPELINE_STAGES } from "@/lib/models";
import {
  getProject,
  updateProject,
  addArtifact,
  updatePipelineStage,
  StoredProject,
  PipelineStageState,
  STAGE_CREDIT_COSTS,
  getCompletedStagesCount,
  canRunStage as checkCanRunStage,
  validateExportReadiness,
  generateExportPackage,
  saveExportPackage,
  isExportStale,
  ExportPackage,
  ExportFile,
} from "@/lib/storage/projectsStore";
import {
  getCharacter,
  StoredCharacter,
} from "@/lib/storage/charactersStore";
import {
  consumeCredits,
  hasEnoughCredits,
} from "@/lib/storage/creditsStore";
import {
  getKBRulesSummary,
  KBRulesSummary,
} from "@/lib/storage/knowledgeBaseStore";
import { canExport, getPlanInfo } from "@/lib/entitlements";
import { UpgradeBanner } from "@/components/shared/UpgradeModal";
import { copyShareUrl } from "@/lib/demo/demoStore";

// Demo artifact generators
const DEMO_SPREADS = [
  "/demo/spreads/spread-1.png",
  "/demo/spreads/spread-2.png",
  "/demo/spreads/spread-3.png",
];

const DEMO_COVERS = [
  "/demo/covers/generous-traveler.png",
  "/demo/covers/ramadan-amira.png",
  "/demo/covers/mountain-patience.png",
];

function generateDemoOutline(project: StoredProject, kbRulesSummary?: KBRulesSummary | null) {
  const kbContext = kbRulesSummary
    ? `[KB Applied: ${kbRulesSummary.kbName}] `
    : "";
  return {
    chapters: [
      `Chapter 1: The Beginning - ${project.title} starts with an exciting discovery`,
      `Chapter 2: The Challenge - Our characters face their first obstacle`,
      `Chapter 3: Learning Together - ${project.learningObjective || "An important lesson unfolds"}`,
      `Chapter 4: The Resolution - Everything comes together beautifully`,
    ],
    synopsis: kbContext + project.synopsis,
    kbApplied: kbRulesSummary?.kbName || null,
  };
}

function generateDemoChapters(project: StoredProject) {
  return [
    {
      chapterNumber: 1,
      title: "The Beginning",
      content: `Once upon a time, in a cozy home filled with love and the gentle glow of lanterns, our story begins. ${project.setting || "The setting was peaceful and inviting."}\n\nThe characters were excited about what the day would bring. Little did they know, an adventure was about to unfold that would teach them something beautiful about ${project.learningObjective || "kindness and faith"}.`,
      wordCount: 52,
    },
    {
      chapterNumber: 2,
      title: "The Challenge",
      content: `As the sun rose higher in the sky, our friends encountered their first challenge. It wasn't easy, but they remembered what they had learned about patience and perseverance.\n\n"We can do this together," they said, holding hands and making du'a for guidance.`,
      wordCount: 48,
    },
    {
      chapterNumber: 3,
      title: "Learning Together",
      content: `Through their journey, the children discovered that ${project.learningObjective || "the best things in life come when we help others"}. They shared their food with a neighbor, helped an elderly person cross the street, and never forgot to say "Bismillah" before starting anything new.\n\nEach act of kindness made their hearts feel lighter and their smiles grow wider.`,
      wordCount: 62,
    },
    {
      chapterNumber: 4,
      title: "The Resolution",
      content: `As the stars began to twinkle in the evening sky, our friends gathered together to reflect on their day. They had learned so much and grown closer as a family.\n\n"Alhamdulillah," they said together, grateful for the blessings they had received. And from that day forward, they always remembered the lessons they had learned.\n\nThe End.`,
      wordCount: 58,
    },
  ];
}

function generateDemoIllustrations(project: StoredProject) {
  return [
    {
      id: "ill-1",
      chapterNumber: 1,
      scene: "Characters gathered in a warm, sunlit room",
      characterIds: project.characterIds,
      imageUrl: DEMO_SPREADS[0],
      status: "approved",
    },
    {
      id: "ill-2",
      chapterNumber: 2,
      scene: "Facing a challenge with determination",
      characterIds: project.characterIds,
      imageUrl: DEMO_SPREADS[1],
      status: "approved",
    },
    {
      id: "ill-3",
      chapterNumber: 3,
      scene: "Acts of kindness and sharing",
      characterIds: project.characterIds,
      imageUrl: DEMO_SPREADS[2],
      status: "approved",
    },
    {
      id: "ill-4",
      chapterNumber: 4,
      scene: "Evening reflection under the stars",
      characterIds: project.characterIds,
      imageUrl: DEMO_SPREADS[0],
      status: "draft",
    },
  ];
}

function generateDemoLayout(project: StoredProject) {
  return {
    pageCount: 24,
    layoutStyle: project.layoutStyle,
    trimSize: project.trimSize,
  };
}

function generateDemoCover() {
  return {
    frontCoverUrl: DEMO_COVERS[Math.floor(Math.random() * DEMO_COVERS.length)],
    backCoverUrl: DEMO_COVERS[Math.floor(Math.random() * DEMO_COVERS.length)],
  };
}

function generateDemoExport(project: StoredProject) {
  return project.exportTargets.map((format) => ({
    format,
    fileUrl: `/exports/${project.id}.${format}`,
    fileSize: format === "pdf" ? 15728640 : 8388608, // 15MB PDF, 8MB EPUB
  }));
}

export default function ProjectWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<StoredProject | null>(null);
  const [characters, setCharacters] = useState<StoredCharacter[]>([]);
  const [kbRules, setKbRules] = useState<KBRulesSummary | null>(null);
  const [runningStage, setRunningStage] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState<string | null>(null);
  const [showReExportModal, setShowReExportModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<ExportFile | null>(null);
  const [activeArtifactTab, setActiveArtifactTab] = useState<string>("outline");
  const [isLoading, setIsLoading] = useState(true);
  const [cancelToken, setCancelToken] = useState<CancelToken | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageStats | null>(null);
  const [stageSubProgress, setStageSubProgress] = useState<StageRunnerProgress["subProgress"] | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const artifactsRef = useRef<HTMLDivElement>(null);

  // Load project and characters
  useEffect(() => {
    console.log("[ProjectWorkspace] useEffect triggered, id from URL:", id);

    if (!id) {
      console.log("[ProjectWorkspace] No project ID provided");
      setIsLoading(false);
      return;
    }

    console.log("[ProjectWorkspace] Loading project with ID:", id);

    // Debug: show all projects
    const allProjects = JSON.parse(localStorage.getItem("noorstudio.projects.v1") || "[]");
    console.log("[ProjectWorkspace] All projects in storage:", allProjects.length);
    console.log("[ProjectWorkspace] Available IDs:", allProjects.map((p: { id: string }) => p.id));

    const loadedProject = getProject(id);
    console.log("[ProjectWorkspace] Loaded project result:", loadedProject ? `Found: ${loadedProject.title}` : "NOT FOUND");
    setProject(loadedProject);

    if (loadedProject) {
      // Load characters for this project
      const loadedChars = loadedProject.characterIds
        .map((charId) => getCharacter(charId))
        .filter((c): c is StoredCharacter => c !== null);
      setCharacters(loadedChars);
      console.log("[ProjectWorkspace] Loaded characters:", loadedChars.length);

      // Load KB rules summary
      if (loadedProject.knowledgeBaseId) {
        const rules = getKBRulesSummary(loadedProject.knowledgeBaseId);
        setKbRules(rules);
      }

      // Set initial active tab to first completed stage
      const firstCompletedStage = loadedProject.pipeline.find((s) => s.status === "completed");
      if (firstCompletedStage) {
        setActiveArtifactTab(firstCompletedStage.name);
      }

      // Load AI usage stats
      const usage = getProjectAIUsage(loadedProject);
      setAiUsage(usage);
    } else {
      console.log("[ProjectWorkspace] Project not found in localStorage");
    }

    setIsLoading(false);
  }, [id]);

  // Refresh project data from localStorage
  const refreshProject = useCallback(() => {
    if (id) {
      const updated = getProject(id);
      setProject(updated);
      if (updated) {
        const usage = getProjectAIUsage(updated);
        setAiUsage(usage);
      }
    }
  }, [id]);

  const handleRunStage = (stageId: string) => {
    // Special validation for export stage
    if (stageId === "export" && project) {
      // Check plan entitlement for export
      const exportCheck = canExport();
      if (!exportCheck.allowed) {
        toast({
          title: "Export Not Available",
          description: "Upgrade to Author or Studio plan to export your books.",
          variant: "destructive",
        });
        return;
      }

      const validation = validateExportReadiness(project);
      if (!validation.valid) {
        toast({
          title: "Cannot Run Export",
          description: validation.errors.join(". "),
          variant: "destructive",
        });
        return;
      }
    }
    setShowCreditModal(stageId);
  };

  const handleReExport = () => {
    if (!project) return;
    setShowReExportModal(false);
    handleRunStage("export");
  };

  const confirmRunStage = async () => {
    if (!showCreditModal || !project) return;

    const stageId = showCreditModal as ProjectStage;
    const creditCost = STAGE_CREDIT_COSTS[stageId] || 3;

    // Check credits BEFORE running (but don't consume yet)
    if (!hasEnoughCredits("book", creditCost)) {
      toast({
        title: "Insufficient Book Credits",
        description: `You need ${creditCost} book credits to run this stage.`,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/app/billing")}>
            <CreditCard className="w-4 h-4 mr-1" />
            Add Credits
          </Button>
        ),
      });
      setShowCreditModal(null);
      return;
    }

    // NOTE: Credits are consumed AFTER successful completion, not before
    // This ensures we don't charge for failed attempts

    setShowCreditModal(null);
    setRunningStage(stageId);
    setStageSubProgress(null);

    // Create cancel token for AI stages
    const token = new CancelToken();
    setCancelToken(token);

    // Update stage to running
    updatePipelineStage(project.id, stageId, {
      status: "running",
      progress: 0,
      message: "Starting...",
    });
    refreshProject();

    // Progress callback for AI stages
    const onAIProgress = (progress: StageRunnerProgress) => {
      updatePipelineStage(project.id, stageId, {
        status: progress.status as PipelineStageState["status"],
        progress: progress.progress,
        message: progress.message,
      });
      setStageSubProgress(progress.subProgress || null);
      refreshProject();
    };

    let success = false;
    let artifactData: unknown = null;
    let errorMessage: string | undefined;

    // Check if this is an AI stage
    if (isAIStage(stageId)) {
      try {
        if (stageId === "outline") {
          const result = await runOutlineStage(project, characters, kbRules, onAIProgress, token);
          if (result.success && result.data) {
            success = true;
            // Transform to display format
            artifactData = {
              chapters: result.data.chapters.map((ch, idx) =>
                `Chapter ${idx + 1}: ${ch.title} - ${ch.goal}`
              ),
              synopsis: result.data.one_liner,
              kbApplied: kbRules?.kbName || null,
              // Store the full structured data for chapters stage
              _structured: result.data,
            };
          } else {
            errorMessage = result.error;
            if (result.needsReview && result.rawText) {
              artifactData = { _rawText: result.rawText, _needsReview: true };
            }
          }
        } else if (stageId === "chapters") {
          // Get outline from previous stage
          const outlineArtifact = project.artifacts.outline?.content as { _structured?: OutlineOutput } | undefined;
          const outline = outlineArtifact?._structured;

          if (!outline) {
            errorMessage = "Outline must be generated first";
          } else {
            const result = await runChaptersStage(project, outline, characters, kbRules, onAIProgress, token);
            if (result.success && result.data) {
              success = true;
              // Transform to display format
              artifactData = result.data.chapters.map((ch) => ({
                chapterNumber: ch.chapter_number,
                title: ch.chapter_title,
                content: ch.text,
                wordCount: ch.text.split(/\s+/).length,
                vocabularyNotes: ch.vocabulary_notes,
                islamicAdabChecks: ch.islamic_adab_checks,
                // Store structured data
                _structured: ch,
              }));
            } else {
              errorMessage = result.error;
            }
          }
        } else if (stageId === "humanize") {
          // Get chapters from previous stage
          const chaptersArtifact = project.artifacts.chapters?.content as Array<{ _structured?: ChapterOutput }> | undefined;
          const chapters = chaptersArtifact?.map(ch => ch._structured).filter((ch): ch is ChapterOutput => !!ch);

          if (!chapters || chapters.length === 0) {
            errorMessage = "Chapters must be generated first";
          } else {
            const result = await runHumanizeStage(project, chapters, kbRules, onAIProgress, token);
            if (result.success && result.data) {
              success = true;
              artifactData = {
                humanized: true,
                reviewedAt: new Date().toISOString(),
                chapters: result.data.chapters.map((ch) => ({
                  chapterNumber: ch.chapter_number,
                  title: ch.chapter_title,
                  editedText: ch.edited_text,
                  changesMade: ch.changes_made,
                })),
              };
            } else {
              errorMessage = result.error;
            }
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string; cancelled?: boolean };
        if (err.cancelled) {
          errorMessage = "Stage cancelled by user";
        } else {
          errorMessage = err.message || "Unknown error during AI generation";
        }
      }
    } else {
      // Non-AI stages: use mock job runner
      const result = await mockJobRunner.runStage(
        stageId,
        (event: JobProgressEvent) => {
          updatePipelineStage(project.id, stageId, {
            status: event.status as PipelineStageState["status"],
            progress: event.progress,
            message: event.message,
          });
          refreshProject();
        }
      );

      if (result.success) {
        success = true;
        switch (stageId) {
          case "illustrations":
            artifactData = generateDemoIllustrations(project);
            break;
          case "layout":
            artifactData = generateDemoLayout(project);
            break;
          case "cover":
            artifactData = generateDemoCover();
            break;
          case "export":
            const characterNames = characters.map((c) => c.name);
            const kbName = kbRules?.kbName || project.knowledgeBaseName || "Unknown KB";
            const exportPkg = generateExportPackage(project, characterNames, kbName);
            saveExportPackage(project.id, exportPkg);
            artifactData = generateDemoExport(project);
            break;
          default:
            artifactData = result.data;
        }
      } else {
        errorMessage = result.error;
      }
    }

    setRunningStage(null);
    setCancelToken(null);
    setStageSubProgress(null);

    if (success && artifactData) {
      // CREDIT CHARGING: Only consume credits AFTER successful completion
      const consumeResult = consumeCredits({
        type: "book",
        amount: creditCost,
        reason: `Pipeline stage: ${PIPELINE_STAGES.find((s) => s.id === stageId)?.label || stageId}`,
        entityType: "project",
        entityId: project.id,
        meta: { stage: stageId, projectTitle: project.title },
      });

      if (!consumeResult.success) {
        // Credit consumption failed after success - log but don't block
        console.error("Failed to consume credits after successful stage:", consumeResult.error);
      }

      // Store the artifact
      addArtifact(project.id, stageId, {
        type: stageId as "outline" | "chapters",
        content: artifactData,
        generatedAt: new Date().toISOString(),
      });

      // Mark stage as completed
      updatePipelineStage(project.id, stageId, {
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
      });

      refreshProject();

      toast({
        title: "Stage completed",
        description: `${PIPELINE_STAGES.find((s) => s.id === stageId)?.label} has been completed successfully.`,
      });

      // Auto-switch to the new artifact tab
      setActiveArtifactTab(stageId);
    } else {
      // IMPORTANT: No credits consumed on failure
      // Mark stage as error
      updatePipelineStage(project.id, stageId, {
        status: "error",
        message: errorMessage,
      });
      refreshProject();

      toast({
        title: "Stage failed",
        description: errorMessage || "An error occurred during processing.",
        variant: "destructive",
      });
    }
  };

  const handleResetStage = (stageId: string) => {
    if (!project) return;

    updatePipelineStage(project.id, stageId as ProjectStage, {
      status: "pending",
      progress: 0,
      message: undefined,
      completedAt: undefined,
    });

    // Remove artifact for this stage
    const updatedArtifacts = { ...project.artifacts };
    delete updatedArtifacts[stageId];
    updateProject(project.id, { artifacts: updatedArtifacts });

    refreshProject();

    toast({
      title: "Stage reset",
      description: `${PIPELINE_STAGES.find((s) => s.id === stageId)?.label} has been reset.`,
    });
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case "outline":
      case "chapters":
      case "humanize":
        return FileText;
      case "illustrations":
        return Image;
      case "layout":
      case "cover":
        return Layout;
      case "export":
        return Download;
      default:
        return BookOpen;
    }
  };

  const canRunStageCheck = (stageId: string) => {
    if (!project) return false;
    return checkCanRunStage(project, stageId as ProjectStage);
  };

  const getCreditCost = (stageId: string): number => {
    return STAGE_CREDIT_COSTS[stageId as ProjectStage] || 3;
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Project not found
  if (!project) {
    return (
      <AppLayout
        title="Project Not Found"
        subtitle="The project you're looking for doesn't exist"
      >
        <div className="text-center py-20 card-glow max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Project Found</h2>
          <p className="text-muted-foreground mb-6">
            This project doesn't exist or may have been deleted.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Link to="/app/books/new">
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Create New Book
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const completedCount = getCompletedStagesCount(project);
  const totalStages = project.pipeline.length;

  // Get artifacts for rendering - with robust type handling
  // Check if artifact exists (has content property)
  const hasOutline = !!project.artifacts.outline?.content;
  const hasChapters = !!project.artifacts.chapters?.content;
  const hasIllustrations = !!project.artifacts.illustrations?.content;
  const hasHumanize = !!project.artifacts.humanize?.content;
  const hasLayout = !!project.artifacts.layout?.content;
  const hasCover = !!project.artifacts.cover?.content;
  const hasExport = !!project.artifacts.export?.content;

  // Type-safe artifact extraction with fallbacks
  const outlineArtifact = hasOutline
    ? project.artifacts.outline!.content as { chapters: string[]; synopsis: string; kbApplied?: string | null }
    : undefined;
  const chaptersArtifact = hasChapters
    ? project.artifacts.chapters!.content as Array<{ chapterNumber: number; title: string; content: string; wordCount: number }>
    : undefined;
  const illustrationsArtifact = hasIllustrations
    ? project.artifacts.illustrations!.content as Array<{ id: string; chapterNumber: number; scene: string; imageUrl?: string; status: string }>
    : undefined;
  const layoutArtifact = hasLayout
    ? project.artifacts.layout!.content as { pageCount: number }
    : undefined;
  const coverArtifact = hasCover
    ? project.artifacts.cover!.content as { frontCoverUrl?: string; backCoverUrl?: string }
    : undefined;
  const exportArtifact = hasExport
    ? project.artifacts.export!.content as Array<{ format: string; fileUrl: string; fileSize: number }>
    : undefined;

  // Debug: log artifact status
  console.log("[Artifacts] Status:", { hasOutline, hasChapters, hasIllustrations, hasHumanize, hasLayout, hasCover, hasExport });
  console.log("[Artifacts] Outline content:", outlineArtifact);

  // Helper to scroll to artifacts section and switch tab
  const viewArtifact = (stageName: string) => {
    setActiveArtifactTab(stageName);
    // Scroll to artifacts section after a short delay to allow tab switch
    setTimeout(() => {
      artifactsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleShareDemo = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const result = await copyShareUrl(project.id, project, characters, kbRules);

      if (result.success) {
        toast({
          title: "Link Copied!",
          description: result.isCloudEnabled
            ? "Shareable link copied to clipboard. Works on any device!"
            : "Demo link copied to clipboard. Note: Works on this device only.",
        });
      } else {
        toast({
          title: "Share Failed",
          description: result.error || "Could not generate share link.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Share error:", err);
      toast({
        title: "Share Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AppLayout
      title={project.title}
      subtitle={`${project.templateType} • Ages ${project.ageRange}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShareDemo} disabled={isSharing}>
            {isSharing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            {isSharing ? "Sharing..." : "Share Demo"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pipeline Stages */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pipeline Stages</h2>
            <Badge variant="outline">
              {completedCount} / {totalStages} completed
            </Badge>
          </div>
          <div className="space-y-3">
            {project.pipeline.map((stage, idx) => {
              const stageInfo = PIPELINE_STAGES.find((s) => s.id === stage.name);
              const Icon = getStageIcon(stage.name);
              const canRun = canRunStageCheck(stage.name);
              const creditCost = getCreditCost(stage.name);

              return (
                <div
                  key={stage.name}
                  className={cn(
                    "card-glow p-4 transition-all duration-300",
                    stage.status === "completed" && "border-primary/30 bg-primary/5",
                    stage.status === "running" && "border-gold-400/50 bg-gold-50/50",
                    stage.status === "error" && "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        stage.status === "completed"
                          ? "bg-primary text-primary-foreground"
                          : stage.status === "running"
                          ? "bg-gold-100 text-gold-600"
                          : stage.status === "error"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {stage.status === "running" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : stage.status === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{stageInfo?.label || stage.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            stage.status === "completed" && "bg-primary/10 text-primary border-primary/30",
                            stage.status === "running" && "bg-gold-100 text-gold-600 border-gold-200",
                            stage.status === "error" && "bg-destructive/10 text-destructive border-destructive/30"
                          )}
                        >
                          {stage.status}
                        </Badge>
                        {stage.status === "pending" && canRun && (
                          <Badge variant="secondary" className="text-xs">
                            {creditCost} credits
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {stage.status === "running" && stage.message
                          ? stage.message
                          : stageInfo?.description}
                      </p>
                      {stage.status === "running" && (
                        <Progress value={stage.progress} className="h-1.5 mt-2" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetStage(stage.name)}
                          title="Reset stage"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant={stage.status === "completed" ? "outline" : "hero"}
                        size="sm"
                        disabled={
                          (!canRun && stage.status !== "completed") ||
                          stage.status === "running"
                        }
                        onClick={() =>
                          stage.status === "completed"
                            ? viewArtifact(stage.name)
                            : handleRunStage(stage.name)
                        }
                      >
                        {stage.status === "completed" ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </>
                        ) : stage.status === "running" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Running
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Run
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card-glow p-5">
            <h3 className="font-semibold mb-4">Project Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium capitalize">{project.templateType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age Range</span>
                <span className="font-medium">{project.ageRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layout</span>
                <span className="font-medium capitalize">{project.layoutStyle.replace(/-/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trim Size</span>
                <span className="font-medium">{project.trimSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Knowledge Base</span>
                <span className="font-medium">{project.knowledgeBaseName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-xs">
                  {new Date(project.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Usage Stats */}
          {aiUsage && (
            <div className="card-glow p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI Usage
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {aiUsage.provider}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Calls</span>
                  <span className="font-medium">{aiUsage.callCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input Tokens</span>
                  <span className="font-medium">{aiUsage.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output Tokens</span>
                  <span className="font-medium">{aiUsage.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Run</span>
                  <span className="font-medium text-xs">
                    {new Date(aiUsage.lastRunAt).toLocaleString()}
                  </span>
                </div>
                {Object.keys(aiUsage.stages).length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Per Stage</p>
                    {Object.entries(aiUsage.stages).map(([stage, stats]) => (
                      <div key={stage} className="flex justify-between text-xs py-1">
                        <span className="capitalize">{stage}</span>
                        <span className="text-muted-foreground">
                          {stats.callCount} calls • {(stats.inputTokens + stats.outputTokens).toLocaleString()} tokens
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KB Rules Applied */}
          {kbRules && (kbRules.faithRules.length > 0 || kbRules.vocabularyRules.length > 0 || kbRules.illustrationRules.length > 0) && (
            <div className="card-glow p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">KB Rules Applied</h3>
                <Badge variant="outline" className="text-xs">{kbRules.kbName}</Badge>
              </div>
              <div className="space-y-4 text-sm">
                {kbRules.faithRules.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Faith Rules</p>
                    <ul className="space-y-1">
                      {kbRules.faithRules.map((rule, idx) => (
                        <li key={idx} className="text-xs text-foreground/80 leading-relaxed">• {rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {kbRules.vocabularyRules.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Vocabulary</p>
                    <ul className="space-y-1">
                      {kbRules.vocabularyRules.map((rule, idx) => (
                        <li key={idx} className="text-xs text-foreground/80 leading-relaxed">• {rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {kbRules.illustrationRules.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Illustration</p>
                    <ul className="space-y-1">
                      {kbRules.illustrationRules.map((rule, idx) => (
                        <li key={idx} className="text-xs text-foreground/80 leading-relaxed">• {rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Characters */}
          <div className="card-glow p-5">
            <h3 className="font-semibold mb-4">Characters</h3>
            {characters.length > 0 ? (
              <div className="space-y-3">
                {characters.map((char) => (
                  <Link
                    key={char.id}
                    to={`/app/characters/${char.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-subtle">
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/100x100/e2e8f0/64748b?text=" + char.name.charAt(0);
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{char.name}</p>
                      <p className="text-xs text-muted-foreground">{char.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No characters assigned</p>
            )}
          </div>

          {/* Export Targets */}
          <div className="card-glow p-5">
            <h3 className="font-semibold mb-4">Export Formats</h3>
            <div className="flex gap-2">
              {project.exportTargets.map((target) => (
                <Badge key={target} variant="secondary" className="uppercase">
                  {target}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Content Preview */}
      {/* Filter out internal artifacts like _aiUsage */}
      {Object.keys(project.artifacts).filter(k => !k.startsWith("_")).length > 0 && (
        <div className="mt-8" ref={artifactsRef}>
          <Tabs value={activeArtifactTab} onValueChange={setActiveArtifactTab}>
            <TabsList>
              {hasOutline && <TabsTrigger value="outline">Outline</TabsTrigger>}
              {hasChapters && <TabsTrigger value="chapters">Chapters</TabsTrigger>}
              {hasIllustrations && <TabsTrigger value="illustrations">Illustrations</TabsTrigger>}
              {hasHumanize && <TabsTrigger value="humanize">Humanize</TabsTrigger>}
              {hasLayout && <TabsTrigger value="layout">Layout</TabsTrigger>}
              {hasCover && <TabsTrigger value="cover">Cover</TabsTrigger>}
              {hasExport && <TabsTrigger value="export">Export</TabsTrigger>}
            </TabsList>

            {/* Outline Tab */}
            <TabsContent value="outline" className="card-glow p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Book Outline</h3>
                {outlineArtifact?.kbApplied && (
                  <Badge variant="secondary" className="text-xs">
                    KB: {outlineArtifact.kbApplied}
                  </Badge>
                )}
              </div>
              {outlineArtifact && (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{outlineArtifact.synopsis}</p>
                  <ul className="space-y-2">
                    {outlineArtifact.chapters.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>

            {/* Chapters Tab */}
            <TabsContent value="chapters" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Chapter Preview</h3>
              {chaptersArtifact && (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-6">
                    {chaptersArtifact.map((chapter) => (
                      <div key={chapter.chapterNumber} className="pb-6 border-b last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">
                            Chapter {chapter.chapterNumber}: {chapter.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {chapter.wordCount} words
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {chapter.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Illustrations Tab */}
            <TabsContent value="illustrations" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Illustration Scenes</h3>
              {illustrationsArtifact && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {illustrationsArtifact.map((ill) => (
                    <div key={ill.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="aspect-video bg-gradient-subtle rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {ill.imageUrl ? (
                          <img
                            src={ill.imageUrl}
                            alt={ill.scene}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">{ill.scene}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Ch. {ill.chapterNumber}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            ill.status === "approved" && "bg-primary/10 text-primary border-primary/30"
                          )}
                        >
                          {ill.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Humanize Tab */}
            <TabsContent value="humanize" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Content Review</h3>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">Content Reviewed</p>
                <p className="text-sm text-muted-foreground">
                  The AI-generated content has been humanized and polished for publication.
                </p>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Book Layout</h3>
              {layoutArtifact && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 mb-4">
                    <Layout className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-2">
                    {layoutArtifact.pageCount} Pages
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Layout generated and ready for review
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Cover Tab */}
            <TabsContent value="cover" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Cover Design</h3>
              {coverArtifact && (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-3">Front Cover</p>
                    <div className="aspect-[3/4] bg-gradient-subtle rounded-lg overflow-hidden">
                      {coverArtifact.frontCoverUrl ? (
                        <img
                          src={coverArtifact.frontCoverUrl}
                          alt="Front Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-3">Back Cover</p>
                    <div className="aspect-[3/4] bg-gradient-subtle rounded-lg overflow-hidden">
                      {coverArtifact.backCoverUrl ? (
                        <img
                          src={coverArtifact.backCoverUrl}
                          alt="Back Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Export Tab - Enhanced */}
            <TabsContent value="export" className="space-y-6 mt-4">
              {project.exportPackage ? (
                <>
                  {/* Header */}
                  <div className="card-glow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Book Package Ready</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(project.exportPackage.generatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{project.exportPackage.version}</Badge>
                        {isExportStale(project) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Stale
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReExportModal(true)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Re-export
                        </Button>
                      </div>
                    </div>

                    {/* Stale Warning */}
                    {isExportStale(project) && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm mb-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                          <div>
                            <p className="font-medium text-destructive">Project changed since last export</p>
                            <p className="text-destructive/80">Re-export to include the latest changes.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Export Summary */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Layout Style</p>
                        <p className="font-medium capitalize text-sm">{project.exportPackage.layoutStyle.replace(/-/g, " ")}</p>
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
                        <p className="text-xs text-muted-foreground mb-1">Knowledge Base</p>
                        <p className="font-medium text-sm truncate">{project.exportPackage.kbName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interior Layout Preview */}
                  <div className="card-glow p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Interior Layout Preview
                      <Badge variant="outline" className="ml-2 text-xs capitalize">
                        {project.exportPackage.layoutStyle.replace(/-/g, " ")}
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {project.exportPackage.files.interiorPreview.map((page, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer"
                          onClick={() => setPreviewFile(page)}
                        >
                          <div className={cn(
                            "aspect-[3/4] rounded-lg overflow-hidden border-2 border-border transition-all",
                            "group-hover:border-primary group-hover:shadow-lg"
                          )}>
                            {page.previewUrl ? (
                              <img
                                src={page.previewUrl}
                                alt={`Page ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/300x400/f1f5f9/64748b?text=Page+" + (idx + 1);
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
                                <FileImage className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-center mt-1 text-muted-foreground">Page {idx + 1}</p>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File List */}
                  <div className="card-glow p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <File className="w-4 h-4" />
                      Package Files
                    </h4>

                    {/* Covers */}
                    <div className="mb-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Covers</p>
                      <div className="space-y-2">
                        {[project.exportPackage.files.coverFront, project.exportPackage.files.coverBack].map((file, idx) => (
                          <ExportFileRow
                            key={idx}
                            file={file}
                            onPreview={() => setPreviewFile(file)}
                            onDownload={() => toast({
                              title: "Download Prepared",
                              description: `${file.filename} is ready. (Demo - no actual file)`,
                            })}
                            disabled={isExportStale(project)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Manuscript & Metadata */}
                    <div className="mb-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Documents</p>
                      <div className="space-y-2">
                        <ExportFileRow
                          file={project.exportPackage.files.manuscript}
                          onPreview={() => setPreviewFile(project.exportPackage!.files.manuscript)}
                          onDownload={() => toast({
                            title: "Download Prepared",
                            description: `Manuscript is ready. (Demo - no actual file)`,
                          })}
                          disabled={isExportStale(project)}
                        />
                        <ExportFileRow
                          file={project.exportPackage.files.metadata}
                          onPreview={() => setPreviewFile(project.exportPackage!.files.metadata)}
                          onDownload={() => toast({
                            title: "Download Prepared",
                            description: `Metadata is ready. (Demo - no actual file)`,
                          })}
                          disabled={isExportStale(project)}
                        />
                        <ExportFileRow
                          file={project.exportPackage.files.license}
                          onPreview={() => setPreviewFile(project.exportPackage!.files.license)}
                          onDownload={() => toast({
                            title: "Download Prepared",
                            description: `License is ready. (Demo - no actual file)`,
                          })}
                          disabled={isExportStale(project)}
                        />
                      </div>
                    </div>

                    {/* Export Formats */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Export Formats</p>
                      <div className="flex gap-3">
                        {project.exportPackage.exportTargets.map((format) => (
                          <Button
                            key={format}
                            variant="outline"
                            className="flex-1"
                            disabled={isExportStale(project)}
                            onClick={() => toast({
                              title: "Download Started",
                              description: `Your ${format.toUpperCase()} file is being prepared. (Demo - no actual file)`,
                            })}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download {format.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export History */}
                  {project.exportHistory && project.exportHistory.length > 1 && (
                    <div className="card-glow p-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Export History
                      </h4>
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
                </>
              ) : !canExport().allowed ? (
                <UpgradeBanner
                  title="Export Locked"
                  description={`Export is available on Author and Studio plans. Upgrade to download your book as PDF or EPUB. You're currently on the ${getPlanInfo().name} plan.`}
                />
              ) : (
                <div className="card-glow p-6 text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No Export Package Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run the Export stage to generate your book package.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <CreditConfirmModal
        open={!!showCreditModal}
        onOpenChange={(open) => !open && setShowCreditModal(null)}
        title="Run Pipeline Stage"
        description={`Running the ${
          PIPELINE_STAGES.find((s) => s.id === showCreditModal)?.label
        } stage will consume book credits.`}
        creditCost={getCreditCost(showCreditModal || "")}
        creditType="book"
        onConfirm={confirmRunStage}
        isLoading={runningStage !== null}
      />

      {/* Re-Export Confirmation Modal */}
      <Dialog open={showReExportModal} onOpenChange={setShowReExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-export Book Package?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create a new version of your book package. The previous version will be kept in history.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReExportModal(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleReExport}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Re-export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <FileText className="w-5 h-5" />
              )}
              {previewFile?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewFile?.previewUrl ? (
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
            ) : previewFile?.type === "md" ? (
              <div className="rounded-lg border bg-muted/50 p-6">
                <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
{`# ${project?.title || "Book Title"}

## Chapter 1: The Beginning
Once upon a time, in a cozy home filled with love and the gentle glow of lanterns...

## Chapter 2: The Challenge
As the sun rose higher in the sky, our friends encountered their first challenge...

## Chapter 3: Learning Together
Through their journey, the children discovered the importance of kindness...

## Chapter 4: The Resolution
As the stars began to twinkle in the evening sky...

---
Generated by NoorStudio
Knowledge Base: ${project?.knowledgeBaseName || "Default KB"}`}
                </pre>
              </div>
            ) : previewFile?.type === "json" ? (
              <div className="rounded-lg border bg-muted/50 p-6">
                <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
{JSON.stringify({
  title: project?.title,
  author: "NoorStudio",
  ageRange: project?.ageRange,
  templateType: project?.templateType,
  layoutStyle: project?.layoutStyle,
  trimSize: project?.trimSize,
  knowledgeBase: project?.knowledgeBaseName,
  characters: characters.map(c => c.name),
  createdAt: project?.createdAt,
  exportedAt: project?.exportPackage?.generatedAt,
  version: project?.exportPackage?.version,
}, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/50 p-6">
                <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
{`NoorStudio License Agreement

This book was created using NoorStudio, an AI-powered
Islamic children's book creation platform.

All content is intended for educational purposes and
follows Islamic guidelines for children's content.

© ${new Date().getFullYear()} NoorStudio. All rights reserved.`}
                </pre>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Type: {previewFile?.type.toUpperCase()}</span>
              <span>Size: {previewFile?.sizeEstimate}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Helper component for file rows
function ExportFileRow({
  file,
  onPreview,
  onDownload,
  disabled,
}: {
  file: ExportFile;
  onPreview: () => void;
  onDownload: () => void;
  disabled?: boolean;
}) {
  const getFileIcon = () => {
    switch (file.type) {
      case "png":
        return <FileImage className="w-5 h-5 text-primary" />;
      case "json":
        return <FileJson className="w-5 h-5 text-primary" />;
      case "md":
        return <FileText className="w-5 h-5 text-primary" />;
      default:
        return <File className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {getFileIcon()}
        </div>
        <div>
          <p className="font-medium text-sm truncate max-w-[200px]">{file.filename}</p>
          <p className="text-xs text-muted-foreground">
            {file.type.toUpperCase()} • {file.sizeEstimate}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload} disabled={disabled}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
