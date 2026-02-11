import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  OutlineArtifactContent,
  ChaptersArtifactContent,
  HumanizeArtifactContent,
  IllustrationArtifactContent,
  LayoutArtifactContent,
  CoverArtifactContent,
  ExportArtifactContent
} from "@/lib/types/artifacts";
import {
  ArrowLeft,
  Play,
  Check,
  CheckCircle2,
  Loader2,
  FileText,
  Image as ImageIcon,
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
  Share2,
  Copy,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Lock,
  Trash2,
  ChevronRight,
  ChevronLeft,
  History,
  Heart,
  Palette,
  Eraser,
  MessageSquareText,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { LayoutPreview } from "@/components/shared/LayoutPreview";
import { ShareProjectModal } from "@/components/shared/ShareProjectModal";
import { useToast } from "@/hooks/use-toast";
import { generateImage, ImageGenerationRequest } from "@/lib/ai/providers/imageProvider";
import { mockJobRunner, JobProgressEvent } from "@/lib/jobs/mockJobRunner";
import {
  isAIStage,
  runOutlineStage,
  runChaptersStage,
  runHumanizeStage,
  runIllustrationsStage,
  runCoverStage,
  runLayoutStage,
  getProjectAIUsage,
  AIUsageStats,
  StageRunnerProgress,
  CancelToken,
  OutlineOutput,
  ChapterOutput,
} from "@/lib/ai";
import { IllustrationArtifactItem, IllustrationVariant, ChapterArtifactItem } from "@/lib/types/artifacts";
import { ProjectStage, PIPELINE_STAGES } from "@/lib/models";
import {
  updateProject,
  getProject,
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
  getArtifactContent,
  getChapterHistory,
  restoreChapterVersion,
  saveChapterVersion,
  ChapterVersion,
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
import { generateEPUB, downloadEPUB, downloadPDF } from "@/lib/export";

// Demo artifact generators
const DEMO_SPREADS = [
  "/demo/spreads/spread-1.png",
  "/demo/spreads/spread-2.png",
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
      imageUrl: DEMO_SPREADS[0], // Alternate back to first image
      status: "approved",
    },
    {
      id: "ill-4",
      chapterNumber: 4,
      scene: "Evening reflection under the stars",
      characterIds: project.characterIds,
      imageUrl: DEMO_SPREADS[1], // Use second image
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

// Parse Error Banner Component
function ParseErrorBanner({
  onRetry,
  onShowRaw,
  onRegenerate,
  stageLabel
}: {
  onRetry: () => void;
  onShowRaw: () => void;
  onRegenerate: () => void;
  stageLabel: string;
}) {
  return (
    <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
            Generation succeeded but output could not be parsed
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            The AI generated content, but it wasn't in the expected format. You can try to repair it without spending more credits, or check the raw output.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onRetry} className="bg-orange-500 hover:bg-orange-600 text-white border-none">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Parse
            </Button>
            <Button size="sm" variant="outline" onClick={onShowRaw}>
              <FileJson className="w-4 h-4 mr-2" />
              Open Raw Output
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onRegenerate}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate Stage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M19.11 17.17c-.29-.14-1.71-.84-1.98-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.16.19-.33.21-.62.07-.29-.14-1.21-.45-2.31-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-1  .98-1 2.39 0 1.41 1.03 2.77 1.17 2.96.14.19 2.03 3.1 4.93 4.34.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.12.56-.08 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.12-.26-.19-.55-.33z" />
      <path d="M16.01 3.2C8.94 3.2 3.2 8.94 3.2 16.01c0 2.25.59 4.44 1.71 6.38L3 29l6.79-1.78c1.87 1.02 3.98 1.56 6.22 1.56h.01c7.07 0 12.81-5.74 12.81-12.81S23.08 3.2 16.01 3.2zm0 23.25h-.01c-2.03 0-4.02-.55-5.75-1.6l-.41-.24-4.03 1.06 1.08-3.93-.27-.43a10.42 10.42 0 0 1-1.62-5.61c0-5.75 4.68-10.43 10.43-10.43S26.44 9.95 26.44 15.7c0 5.75-4.68 10.75-10.43 10.75z" />
    </svg>
  );
}

// Helper function to get disable reason for a stage
function getDisabledReason(
  stageId: string,
  project: StoredProject | null,
  canRun: boolean,
  stageStatus: string
): string | null {
  if (!project) return null;

  // If running, no reason needed (different UI)
  if (stageStatus === "running") return null;

  // If completed or can run, no reason
  if (stageStatus === "completed" || canRun) return null;

  // Get the stage info
  const stageInfo = PIPELINE_STAGES.find((s) => s.id === stageId);

  // Determine dependency based on stage
  switch (stageId) {
    case "outline":
      return "Complete project setup to generate outline";

    case "chapters":
      return "Complete Outline stage first";

    case "humanize":
      return "Complete Chapters stage first before humanizing";

    case "illustrations":
      return "Generate chapters before creating illustrations";

    case "cover":
      return "Generate chapters or outline first before creating cover";

    case "layout":
      return "Generate chapters and illustrations before creating layout";

    case "export":
      return "Complete all required stages before exporting";

    default:
      return "This stage cannot run yet. Complete previous stages first";
  }
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
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelToken, setCancelToken] = useState<CancelToken | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageStats | null>(null);
  const [stageSubProgress, setStageSubProgress] = useState<StageRunnerProgress["subProgress"] | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedIllustration, setSelectedIllustration] = useState<IllustrationArtifactItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Illustration approval workflow
  const [isIllustrationUpdating, setIsIllustrationUpdating] = useState(false);
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState<string>("");

  // Chapter history modal state
  const [showChapterHistoryModal, setShowChapterHistoryModal] = useState(false);
  const [selectedChapterForHistory, setSelectedChapterForHistory] = useState<number | null>(null);
  const [chapterVersions, setChapterVersions] = useState<ChapterVersion[]>([]);

  const artifactsRef = useRef<HTMLDivElement>(null);

  // Load project and characters
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const loadedProject = getProject(id);
    setProject(loadedProject);
    setProject(loadedProject);

    if (loadedProject) {
      // Load characters for this project
      const loadedChars = loadedProject.characterIds
        .map((charId) => getCharacter(charId))
        .filter((c): c is StoredCharacter => c !== null);
      setCharacters(loadedChars);

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

    console.log(`[ProjectWorkspace] Confirming run stage: ${stageId}, Cost: ${creditCost}`);

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

    console.log(`[ProjectWorkspace] Attempting to run stage: ${stageId} for project: ${project.id}`);

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

    // START TOP-LEVEL TRY CATCH to ensure no silent failures
    try {
      let success = false;
      let errorMessage: string | undefined;
      let artifactData: unknown = null;

      console.log(`[ProjectWorkspace] Executing stage logic for: ${stageId}`);

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
            const outlineContent = getArtifactContent<{ _structured?: OutlineOutput }>(project, "outline");
            const outline = outlineContent?._structured;

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
                if (result.needsReview && result.rawText) {
                  artifactData = { _rawText: result.rawText, _needsReview: true };
                }
              }
            }
          } else if (stageId === "humanize") {
            // Get chapters from previous stage
            const chaptersContent = getArtifactContent<Array<{ _structured?: ChapterOutput }>>(project, "chapters");
            const chapters = chaptersContent?.map(ch => ch._structured).filter((ch): ch is ChapterOutput => !!ch);

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
                if (result.needsReview && result.rawText) {
                  artifactData = { _rawText: result.rawText, _needsReview: true };
                }
              }
            }
          } else if (stageId === "illustrations") {
            // Get chapters from previous stage
            const chaptersContent = getArtifactContent<Array<{ _structured?: ChapterOutput }>>(project, "chapters");
            const chapters = chaptersContent?.map(ch => ch._structured).filter((ch): ch is ChapterOutput => !!ch);

            // Get outline for key_scene data (AI-suggested illustration moments)
            const outlineContent = getArtifactContent<{ _structured?: OutlineOutput }>(project, "outline");
            const outline = outlineContent?._structured;

            if (!chapters || chapters.length === 0) {
              errorMessage = "Chapters must be generated first";
            } else {
              const result = await runIllustrationsStage(project, chapters, characters, kbRules, onAIProgress, token, outline);
              if (result.success && result.data) {
                success = true;
                artifactData = result.data.illustrations;
              } else {
                errorMessage = result.error;
              }
            }
          } else if (stageId === "cover") {
            // Cover generation uses the real image provider
            const result = await runCoverStage(project, characters, kbRules, onAIProgress, token);
            if (result.success && result.data) {
              success = true;
              artifactData = {
                frontCoverUrl: result.data.frontCoverUrl,
                backCoverUrl: result.data.backCoverUrl,
              };
            } else {
              errorMessage = result.error;
            }
          } else if (stageId === "layout") {
            // Layout stage composes pages from chapters and illustrations
            const chaptersArtifact = getArtifactContent<ChapterArtifactItem[]>(project, "chapters");
            const illustrationsArtifact = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");

            if (!chaptersArtifact || chaptersArtifact.length === 0) {
              errorMessage = "Chapters must be generated first";
            } else {
              const result = await runLayoutStage(
                project,
                chaptersArtifact,
                illustrationsArtifact || [],
                onAIProgress,
                token
              );
              if (result.success && result.data) {
                success = true;
                artifactData = result.data.layout;
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
            throw err; // Re-throw to be caught by top-level catch
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
            case "export": {
              const characterNames = characters.map((c) => c.name);
              const kbName = kbRules?.kbName || project.knowledgeBaseName || "Unknown KB";
              const exportPkg = generateExportPackage(project, characterNames, kbName);
              saveExportPackage(project.id, exportPkg);
              artifactData = generateDemoExport(project);
              break;
            }
            default:
              artifactData = result.data;
          }
        } else {
          console.error(`[ProjectWorkspace] Stage failed: ${result.error}`);
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
        }

        // Store the artifact
        addArtifact(project.id, stageId, {
          type: stageId as "outline" | "chapters",
          content: artifactData,
          generatedAt: new Date().toISOString(),
        });

        // Save chapter versions (P2-3) if this is a chapters stage
        if (stageId === "chapters" && Array.isArray(artifactData)) {
          for (const chapter of artifactData) {
            if (chapter.chapterNumber && chapter.content && chapter.title) {
              saveChapterVersion(project.id, {
                chapterNumber: chapter.chapterNumber,
                content: chapter.content,
                title: chapter.title,
                wordCount: chapter.wordCount || 0,
                author: "generated",
                vocabularyNotes: chapter.vocabularyNotes,
                islamicAdabChecks: chapter.islamicAdabChecks,
              });
            }
          }
        }

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

        setStageSubProgress(null);
        // Wait for React to update state before switching tab
        setTimeout(() => {
          setActiveArtifactTab(stageId);
        }, 0);
      } else {
        // IMPORTANT: No credits consumed on failure

        // Keep artifact if we have it (e.g. raw text for review)
        if (artifactData) {
          addArtifact(project.id, stageId, {
            type: stageId as "outline" | "chapters" | "humanize",
            content: artifactData,
            generatedAt: new Date().toISOString(),
          });

          // Auto-switch to tab to show error banner
          setTimeout(() => {
            setActiveArtifactTab(stageId);
          }, 0);
        }

        // Mark stage as error
        updatePipelineStage(project.id, stageId, {
          status: "error",
          message: errorMessage,
        });
        refreshProject();

      }
    } catch (error) {
      console.error(`[ProjectWorkspace] CRITICAL STAGE FAILURE:`, error);
      const msg = error instanceof Error ? error.message : "Unknown critical error";

      updatePipelineStage(project.id, stageId, {
        status: "error",
        progress: 0,
        message: msg,
      });
      refreshProject();

      toast({
        title: "Stage Execution Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      // Ensure specific cleanup happens
      if (runningStage === stageId) {
        setRunningStage(null);
        setCancelToken(null);
      }
    }
  };

  const handleRetryParse = async (stageId: string, rawText: string) => {
    // Basic client-side retry for now - in a real app this might use a lighter AI model
    // or just re-run the parser with different parameters.
    // For this implementation, we'll just try to parse the JSON again.

    try {
      // Import here to avoid circular dependencies if moved
      const { parseJSONResponse } = await import("@/lib/ai/providers/textProvider");
      const { OUTLINE_SCHEMA, CHAPTER_SCHEMA, HUMANIZE_SCHEMA } = await import("@/lib/ai/prompts");

      // Determine expected schema/format based on stage
      let parsedData: OutlineOutput | ChapterOutput | ChapterOutput[] | null = null;
      let success = false;

      const result = parseJSONResponse(rawText);

      if (result.success) {
        success = true;
        parsedData = result.data as OutlineOutput | ChapterOutput | ChapterOutput[];
      } else {
        toast({
          title: "Parse Failed",
          description: "Could not parse the raw output. You may need to regenerate.",
          variant: "destructive"
        });
        return;
      }

      if (success && parsedData) {
        // Transform based on stage (duplicating logic from confirmRunStage - could be refactored)
        let artifactData: OutlineArtifactContent | ChaptersArtifactContent | null = null;

        if (stageId === "outline") {
          const outline = parsedData as OutlineOutput;
          artifactData = {
            chapters: outline.chapters.map((ch, idx: number) =>
              `Chapter ${idx + 1}: ${ch.title} - ${ch.goal}`
            ),
            synopsis: outline.one_liner,
            kbApplied: kbRules?.kbName || null,
            _structured: parsedData,
          };
        } else if (stageId === "chapters") {
          // Verify it's a chapter or chapters
          // Handle both single chapter and array
          const chaptersArr = Array.isArray(parsedData) ? parsedData : [parsedData as ChapterOutput];
          artifactData = chaptersArr.map((ch) => ({
            chapterNumber: ch.chapter_number,
            title: ch.chapter_title,
            content: ch.text,
            wordCount: ch.text.split(/\s+/).length,
            vocabularyNotes: ch.vocabulary_notes,
            islamicAdabChecks: ch.islamic_adab_checks,
            _structured: ch,
          }));
        }

        // Update project with fixed artifact
        addArtifact(project.id, stageId, {
          type: stageId as "outline" | "chapters",
          content: artifactData,
          generatedAt: new Date().toISOString(),
        });

        // Save chapter versions (P2-3) if this is a chapters stage
        if (stageId === "chapters" && Array.isArray(artifactData)) {
          for (const chapter of artifactData) {
            if (chapter.chapterNumber && chapter.content && chapter.title) {
              saveChapterVersion(project.id, {
                chapterNumber: chapter.chapterNumber,
                content: chapter.content,
                title: chapter.title,
                wordCount: chapter.wordCount || 0,
                author: "recovered",
                vocabularyNotes: chapter.vocabularyNotes,
                islamicAdabChecks: chapter.islamicAdabChecks,
              });
            }
          }
        }

        // Mark as completed
        updatePipelineStage(project.id, stageId as ProjectStage, {
          status: "completed",
          progress: 100,
          completedAt: new Date().toISOString(),
          message: "Completed (after retry)"
        });

        // Consume credits now that it succeeded? 
        // Logic says "Ensure this is consistent... credits not deducted unless stage completes successfully"
        // Since we are recovering a failed stage that didn't charge, we SHOULD charge now.
        const creditCost = STAGE_CREDIT_COSTS[stageId as ProjectStage] || 3;
        consumeCredits({
          type: "book",
          amount: creditCost,
          reason: `Pipeline stage (Retry): ${stageId}`,
          entityType: "project",
          entityId: project.id,
          meta: { stage: stageId, projectTitle: project.title },
        });

        refreshProject();
        toast({
          title: "Recovery Successful",
          description: "Output parsed and saved successfully.",
        });
      }
    } catch (e) {
      console.error("Retry parse error", e);
      toast({
        title: "Error",
        description: "An unexpected error occurred during retry.",
        variant: "destructive"
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

  const handleSelectVariant = (illustrationId: string, variantId: string) => {
    if (!project) return;

    // Get current illustrations artifact
    const illustrationsContent = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");
    if (!illustrationsContent) return;

    // Update the illustrations with new selection
    const updatedIllustrations = illustrationsContent.map((ill) => {
      if (ill.id === illustrationId) {
        // Update variants to mark the selected one
        const updatedVariants = ill.variants?.map((v) => ({
          ...v,
          selected: v.id === variantId,
        }));
        // Find the selected variant's image URL
        const selectedVariant = updatedVariants?.find((v) => v.id === variantId);
        return {
          ...ill,
          variants: updatedVariants,
          selectedVariantId: variantId,
          imageUrl: selectedVariant?.imageUrl || ill.imageUrl,
          // Selecting a variant is NOT approval. Keep as draft until explicitly approved.
          status: "draft" as const,
          approvedVariantId: undefined,
          approvedImageUrl: undefined,
        };
      }
      return ill;
    });

    // Save the updated artifact
    addArtifact(project.id, "illustrations", {
      type: "illustrations" as const,
      content: updatedIllustrations,
      generatedAt: new Date().toISOString(),
    });

    refreshProject();
    setSelectedIllustration(null);

    toast({
      title: "Variant selected",
      description: "Variant selected (not yet approved).",
    });
  };

  const handleApproveIllustration = (illustrationId: string) => {
    if (!project) return;

    const illustrationsContent = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");
    if (!illustrationsContent) return;

    const now = new Date().toISOString();

    const updatedIllustrations = illustrationsContent.map((ill) => {
      if (ill.id !== illustrationId) return ill;

      const selectedVariantId = ill.selectedVariantId || ill.variants?.find((v) => v.selected)?.id;
      const selectedVariant = ill.variants?.find((v) => v.id === selectedVariantId);

      return {
        ...ill,
        status: "approved" as const,
        approvedVariantId: selectedVariantId,
        approvedImageUrl: selectedVariant?.imageUrl || ill.imageUrl,
        history: [
          ...(ill.history || []),
          {
            at: now,
            action: "approved" as const,
            variantId: selectedVariantId,
            seed: selectedVariant?.seed,
            prompt: ill.promptOverride || ill.prompt,
          },
        ],
      };
    });

    addArtifact(project.id, "illustrations", {
      type: "illustrations" as const,
      content: updatedIllustrations,
      generatedAt: now,
    });

    refreshProject();

    toast({
      title: "Illustration approved",
      description: "This illustration is now locked as approved.",
    });
  };

  const handleOpenEditPrompt = (ill: IllustrationArtifactItem) => {
    setPromptDraft(ill.promptOverride || ill.prompt || "");
    setPromptEditorOpen(true);
  };

  const handleSavePromptOverride = (illustrationId: string) => {
    if (!project) return;

    const illustrationsContent = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");
    if (!illustrationsContent) return;

    const now = new Date().toISOString();

    const updatedIllustrations = illustrationsContent.map((ill) => {
      if (ill.id !== illustrationId) return ill;
      return {
        ...ill,
        promptOverride: promptDraft,
        history: [
          ...(ill.history || []),
          { at: now, action: "prompt_edited" as const, prompt: promptDraft },
        ],
      };
    });

    addArtifact(project.id, "illustrations", {
      type: "illustrations" as const,
      content: updatedIllustrations,
      generatedAt: now,
    });

    refreshProject();
    setPromptEditorOpen(false);

    toast({
      title: "Prompt updated",
      description: "Your prompt edits will be used for regenerations.",
    });
  };

  const handleRegenerateIllustration = async (illustrationId: string) => {
    if (!project) return;

    const illustrationsContent = getArtifactContent<IllustrationArtifactItem[]>(project, "illustrations");
    if (!illustrationsContent) return;

    const target = illustrationsContent.find((i) => i.id === illustrationId);
    if (!target) return;

    const promptToUse = target.promptOverride || target.prompt;
    if (!promptToUse) {
      toast({
        title: "Missing prompt",
        description: "No prompt found to regenerate this illustration.",
        variant: "destructive",
      });
      return;
    }

    setIsIllustrationUpdating(true);

    try {
      const attemptId = `regen-${Date.now()}`;
      const illustrationWidth = project.illustrationDimensions?.width || 1536;
      const illustrationHeight = project.illustrationDimensions?.height || 1024;

      const request: ImageGenerationRequest = {
        prompt: promptToUse,
        references: target.references,
        style: target.style,
        width: illustrationWidth,
        height: illustrationHeight,
        stage: "illustrations",
        attemptId,
        count: 1,
        referenceStrength: 0.9,
      };

      const response = await generateImage(request);
      const now = new Date().toISOString();
      const newVariantId = `${illustrationId}-regen-${(target.regenerationCount || 0) + 1}`;

      const updatedIllustrations = illustrationsContent.map((ill) => {
        if (ill.id !== illustrationId) return ill;

        const newVariant = {
          id: newVariantId,
          imageUrl: response.imageUrl,
          selected: true,
          generatedAt: now,
          seed: typeof response.providerMeta?.seed === "number" ? response.providerMeta.seed : undefined,
          prompt: promptToUse,
        };

        const updatedVariants = [
          ...(ill.variants || []).map((v) => ({ ...v, selected: false })),
          newVariant,
        ];

        return {
          ...ill,
          status: "draft" as const,
          variants: updatedVariants,
          selectedVariantId: newVariantId,
          imageUrl: response.imageUrl,
          regenerationCount: (ill.regenerationCount || 0) + 1,
          // Regenerating invalidates previous approval until re-approved.
          approvedVariantId: undefined,
          approvedImageUrl: undefined,
          history: [
            ...(ill.history || []),
            {
              at: now,
              action: "regenerated" as const,
              variantId: newVariantId,
              seed: newVariant.seed,
              prompt: promptToUse,
            },
          ],
        };
      });

      addArtifact(project.id, "illustrations", {
        type: "illustrations" as const,
        content: updatedIllustrations,
        generatedAt: now,
      });

      refreshProject();

      toast({
        title: "Regenerated",
        description: "A new variant was generated. Review and approve when ready.",
      });
    } catch (err) {
      console.error("Failed to regenerate illustration:", err);
      toast({
        title: "Regeneration failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIllustrationUpdating(false);
    }
  };

  const handleGenerateAllChapters = () => {
    setActiveArtifactTab("chapters");
    handleRunStage("chapters");
  };

  // Chapter history handlers
  const handleOpenChapterHistory = (chapterNumber: number) => {
    if (!project) return;
    
    const versions = getChapterHistory(project.id, chapterNumber);
    setChapterVersions(versions);
    setSelectedChapterForHistory(chapterNumber);
    setShowChapterHistoryModal(true);
  };

  const handleRestoreChapterVersion = (versionId: string) => {
    if (!project) return;

    const restoredProject = restoreChapterVersion(project.id, versionId);
    if (restoredProject) {
      refreshProject();
      toast({
        title: "Chapter Restored",
        description: "The chapter has been restored to the selected version.",
      });
      setShowChapterHistoryModal(false);
    } else {
      toast({
        title: "Restore Failed",
        description: "Could not restore the chapter version.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateChapter = async (chapterNumber: number) => {
    if (!project) return;

    const outlineContent = getArtifactContent<{ _structured?: OutlineOutput }>(project, "outline");
    const outline = outlineContent?._structured;

    if (!outline) {
      toast({
        title: "Missing outline",
        description: "Generate the outline first.",
        variant: "destructive",
      });
      return;
    }

    if (runningStage) return;

    setRunningStage("chapters");
    setStageSubProgress(null);

    const token = new CancelToken();
    setCancelToken(token);

    updatePipelineStage(project.id, "chapters", {
      status: "running",
      progress: 0,
      message: `Regenerating Chapter ${chapterNumber}/${outline.chapters.length}...`,
    });
    refreshProject();

    const onAIProgress = (progress: StageRunnerProgress) => {
      updatePipelineStage(project.id, "chapters", {
        status: progress.status as PipelineStageState["status"],
        progress: progress.progress,
        message: progress.message,
      });
      setStageSubProgress(progress.subProgress || null);
      refreshProject();
    };

    try {
      const result = await runChaptersStage(
        project,
        outline,
        characters,
        kbRules,
        onAIProgress,
        token,
        { chapterNumbers: [chapterNumber] }
      );

      if (result.success && result.data?.chapters?.length) {
        const existing = getArtifactContent<ChapterArtifactItem[]>(project, "chapters") || [];
        const byNumber = new Map(existing.map((c) => [c.chapterNumber, c] as const));

        for (const ch of result.data.chapters) {
          const updatedItem: ChapterArtifactItem = {
            chapterNumber: ch.chapter_number,
            title: ch.chapter_title,
            content: ch.text,
            wordCount: ch.text.split(/\s+/).length,
            vocabularyNotes: ch.vocabulary_notes,
            islamicAdabChecks: ch.islamic_adab_checks,
            _structured: ch,
          };
          byNumber.set(updatedItem.chapterNumber, updatedItem);

          // Save chapter version (P2-3)
          saveChapterVersion(project.id, {
            chapterNumber: ch.chapter_number,
            content: ch.text,
            title: ch.chapter_title,
            wordCount: updatedItem.wordCount,
            author: "regenerated",
            vocabularyNotes: ch.vocabulary_notes,
            islamicAdabChecks: ch.islamic_adab_checks,
          });
        }

        const merged = Array.from(byNumber.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);

        addArtifact(project.id, "chapters", {
          type: "chapters" as const,
          content: merged,
          generatedAt: new Date().toISOString(),
        });

        updatePipelineStage(project.id, "chapters", {
          status: "completed",
          progress: 100,
          message: `Chapter ${chapterNumber} regenerated`,
        });

        refreshProject();

        toast({
          title: "Chapter regenerated",
          description: `Chapter ${chapterNumber} was regenerated.`,
        });
      } else {
        throw new Error(result.error || "Failed to regenerate chapter");
      }
    } catch (err) {
      console.error("Failed to regenerate chapter:", err);
      updatePipelineStage(project.id, "chapters", {
        status: "error",
        progress: 0,
        message: err instanceof Error ? err.message : "Failed to regenerate chapter",
      });
      refreshProject();

      toast({
        title: "Regeneration failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRunningStage(null);
      setCancelToken(null);
      setStageSubProgress(null);
    }
  };


  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case "outline":
      case "chapters":
      case "humanize":
        return FileText;
      case "illustrations":
        return ImageIcon;
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
  const hasOutline = !!getArtifactContent(project, "outline");
  const hasChapters = !!getArtifactContent(project, "chapters");
  const hasIllustrations = !!getArtifactContent(project, "illustrations");
  const hasHumanize = !!getArtifactContent(project, "humanize");
  const hasLayout = !!getArtifactContent(project, "layout");
  const hasCover = !!getArtifactContent(project, "cover");
  // Export doesn't use content property
  const hasExport = !!getArtifactContent(project, "export");

  // Check for parse errors
  const outlineContent = getArtifactContent<OutlineArtifactContent>(project, "outline");
  const outlineNeedsReview = outlineContent?._needsReview;

  const chaptersContent = getArtifactContent<ChaptersArtifactContent>(project, "chapters");
  const chaptersNeedsReview = chaptersContent?._needsReview;

  const humanizeContent = getArtifactContent<HumanizeArtifactContent>(project, "humanize");
  const humanizeNeedsReview = humanizeContent?._needsReview;


  // Type-safe artifact extraction with fallbacks
  const outlineArtifact = hasOutline && !outlineNeedsReview
    ? outlineContent!
    : undefined;
  const outlineRaw = outlineNeedsReview ? outlineContent?._rawText : null;

  const chaptersArtifact = hasChapters && !chaptersNeedsReview
    ? chaptersContent!
    : undefined;
  const chaptersRaw = chaptersNeedsReview ? chaptersContent?._rawText : null;

  const illustrationsArtifact = hasIllustrations
    ? getArtifactContent<Array<{ id: string; chapterNumber: number; scene: string; imageUrl?: string; status: string }>>(project, "illustrations")
    : undefined;

  const humanizeArtifact = hasHumanize && !humanizeNeedsReview
    ? humanizeContent!
    : undefined;
  const humanizeRaw = humanizeNeedsReview ? humanizeContent?._rawText : null;

  const layoutArtifact = hasLayout
    ? getArtifactContent<LayoutArtifactContent>(project, "layout")
    : undefined;
  const coverArtifact = hasCover
    ? getArtifactContent<{ frontCoverUrl?: string; backCoverUrl?: string }>(project, "cover")
    : undefined;
  const exportArtifact = hasExport
    ? getArtifactContent<Array<{ format: string; fileUrl: string; fileSize: number }>>(project, "export")
    : undefined;

  // No-op for now


  // Helper to scroll to artifacts section and switch tab
  const viewArtifact = (stageName: string) => {
    setActiveArtifactTab(stageName);
    // Scroll to artifacts section after a short delay to allow tab switch
    setTimeout(() => {
      artifactsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDownloadExport = async (format: string) => {
    if (!project) return;

    setIsDownloading(format);
    try {
      if (format.toLowerCase() === "epub") {
        // Get chapters and layout for EPUB generation
        const chaptersContent = getArtifactContent<ChapterArtifactItem[]>(project, "chapters");
        const layoutContent = getArtifactContent<LayoutArtifactContent>(project, "layout");
        const coverContent = getArtifactContent<CoverArtifactContent>(project, "cover");
        const illustrationsContent = getArtifactContent<IllustrationArtifactContent>(project, "illustrations");

        if (!chaptersContent || !layoutContent) {
          toast({
            title: "Missing Content",
            description: "Chapters and layout are required for EPUB export.",
            variant: "destructive",
          });
          return;
        }

        // Generate EPUB
        const result = await generateEPUB({
          chapters: chaptersContent,
          layout: layoutContent,
          cover: coverContent || { frontCoverUrl: "", backCoverUrl: "" },
          illustrations: illustrationsContent,
          projectTitle: project.title,
          authorName: "NoorStudio",
          language: "en",
          publisher: "NoorStudio",
        });

        // Download EPUB
        downloadEPUB(result.blob, project.title);

        toast({
          title: "EPUB Downloaded",
          description: `${project.title}.epub has been downloaded successfully.`,
        });
      } else if (format.toLowerCase() === "pdf") {
        // For PDF, show a message that it's ready (actual PDF generation would go here)
        toast({
          title: "PDF Download",
          description: `Your ${project.title}.pdf is ready to download. (Demo mode)`,
        });
      }
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "An error occurred during download.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
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
      toast({
        title: "Share Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareOnWhatsApp = () => {
    const shareText = "Check out my children's book created with NoorStudio!";

    // WhatsApp universal deep link. On desktop it opens WhatsApp Web; on mobile it opens the app.
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback if popups are blocked.
      window.location.href = url;
    }
  };

  return (
    <AppLayout
      title={project.title}
      subtitle={`${project.templateType} • Ages ${project.ageRange}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Project
          </Button>
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
                        <div className="space-y-2 mt-3">
                          {/* Main progress bar */}
                          <Progress value={stage.progress} className="h-2" />
                          
                          {/* Sub-progress information */}
                          {runningStage === stage.name && stageSubProgress && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">
                                {stageSubProgress.label}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {stageSubProgress.current} / {stageSubProgress.total}
                              </span>
                            </div>
                          )}
                          
                          {/* Overall progress percentage */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Overall Progress
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {Math.round(stage.progress)}%
                            </span>
                          </div>
                        </div>
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
                      {(() => {
                        const isDisabled =
                          (!canRun && stage.status !== "completed") ||
                          stage.status === "running";
                        const disabledReason = getDisabledReason(
                          stage.name,
                          project,
                          canRun,
                          stage.status
                        );

                        const button = (
                          <Button
                            variant={stage.status === "completed" ? "outline" : "hero"}
                            size="sm"
                            disabled={isDisabled}
                            onClick={() =>
                              (stage.status === "completed" || stage.status === "error")
                                ? viewArtifact(stage.name)
                                : handleRunStage(stage.name)
                            }
                          >
                            {stage.status === "completed" ? (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </>
                            ) : stage.status === "error" && project.artifacts[stage.name as ProjectStage]?.content ? (
                              <>
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Review
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
                        );

                        // Wrap with tooltip if disabled and has a reason
                        if (isDisabled && disabledReason) {
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {button}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-center">
                                {disabledReason}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return button;
                      })()}
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


      {/* Raw Output Dialog */}
      < Dialog open={!!rawOutput
      } onOpenChange={(open) => !open && setRawOutput(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Raw AI Output</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden relative border rounded-md bg-muted/30">
            <ScrollArea className="h-[60vh] p-4 font-mono text-sm whitespace-pre-wrap">
              {rawOutput}
            </ScrollArea>
            <Button
              size="icon"
              variant="outline"
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={() => {
                if (rawOutput) {
                  navigator.clipboard.writeText(rawOutput);
                  toast({ title: "Copied to clipboard" });
                }
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog >


      {/* Generated Content Preview */}
      {/* Filter out internal artifacts like _aiUsage */}
      {
        Object.keys(project.artifacts).filter(k => !k.startsWith("_")).length > 0 && (
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
                {outlineNeedsReview && (
                  <ParseErrorBanner
                    onRetry={() => handleRetryParse("outline", outlineRaw)}
                    onShowRaw={() => setRawOutput(outlineRaw)}
                    onRegenerate={() => handleRunStage("outline")}
                    stageLabel="Outline"
                  />
                )}
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
                {chaptersNeedsReview && (
                  <ParseErrorBanner
                    onRetry={() => handleRetryParse("chapters", chaptersRaw)}
                    onShowRaw={() => setRawOutput(chaptersRaw)}
                    onRegenerate={() => handleRunStage("chapters")}
                    stageLabel="Chapters"
                  />
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Chapter Preview</h3>
                  {!chaptersArtifact && (
                    <Button onClick={handleGenerateAllChapters} disabled={!hasOutline || runningStage === "chapters"} variant="hero" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate All Chapters
                    </Button>
                  )}
                </div>
                {chaptersArtifact && (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-6">
                      {chaptersArtifact.map((chapter) => (
                        <div key={chapter.chapterNumber} className="pb-6 border-b last:border-0">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">
                              Chapter {chapter.chapterNumber}: {chapter.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {chapter.wordCount} words
                              </Badge>
                              <Button
                                onClick={() => handleOpenChapterHistory(chapter.chapterNumber)}
                                variant="outline"
                                size="xs"
                                className="text-xs"
                                title="View chapter version history"
                              >
                                <History className="w-3 h-3 mr-1" />
                                History
                              </Button>
                              <Button
                                onClick={() => handleRegenerateChapter(chapter.chapterNumber)}
                                disabled={runningStage === "chapters"}
                                variant="outline"
                                size="xs"
                                className="text-xs"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Regen
                              </Button>
                            </div>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Illustration Scenes</h3>
                  {illustrationsArtifact && (
                    <Badge variant="secondary">
                      {illustrationsArtifact.length} illustrations • 3 variants each
                    </Badge>
                  )}
                </div>
                {illustrationsArtifact && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(illustrationsArtifact as IllustrationArtifactItem[]).map((ill) => (
                      <div
                        key={ill.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                          ill.status === "approved"
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/50 border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedIllustration(ill)}
                      >
                        <div className="aspect-video bg-gradient-subtle rounded-lg mb-3 flex items-center justify-center overflow-hidden relative group">
                          {ill.imageUrl ? (
                            <>
                              <img
                                src={ill.imageUrl}
                                alt={ill.scene}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  View {ill.variants?.length || 0} variants
                                </span>
                              </div>
                            </>
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm font-medium mb-2 line-clamp-2">{ill.scene}</p>
                        <div className="flex items-center justify-between">
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
                          {ill.variants && ill.variants.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {ill.variants.length} variants
                            </span>
                          )}
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
                {layoutArtifact && layoutArtifact.spreads ? (
                  <LayoutPreview layout={layoutArtifact} />
                ) : layoutArtifact ? (
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No layout generated yet</p>
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
                            onClick={handleShareOnWhatsApp}
                            title="Share on WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4 mr-1 text-green-600" />
                            Share on WhatsApp
                          </Button>
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
                              disabled={isExportStale(project) || isDownloading !== null}
                              onClick={() => handleDownloadExport(format)}
                              title={format === "epub" ? "Download book as EPUB format" : "Download book as PDF"}
                            >
                              {isDownloading === format ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download {format.toUpperCase()}
                                </>
                              )}
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
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={handleShareOnWhatsApp}>
                        <WhatsAppIcon className="w-4 h-4 mr-2 text-green-600" />
                        Share on WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )
      }

      <CreditConfirmModal
        open={!!showCreditModal}
        onOpenChange={(open) => !open && setShowCreditModal(null)}
        title="Run Pipeline Stage"
        description={`Running the ${PIPELINE_STAGES.find((s) => s.id === showCreditModal)?.label
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

      {/* Illustration Variant Selection Modal */}
      <Dialog open={!!selectedIllustration} onOpenChange={(open) => !open && setSelectedIllustration(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Select Illustration Variant
            </DialogTitle>
          </DialogHeader>
          {selectedIllustration && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Chapter {selectedIllustration.chapterNumber}</p>
                <p className="text-sm text-muted-foreground">{selectedIllustration.scene}</p>
              </div>

              {selectedIllustration.variants && selectedIllustration.variants.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {selectedIllustration.variants.map((variant, idx) => (
                    <div
                      key={variant.id}
                      className={cn(
                        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg",
                        variant.selected || selectedIllustration.selectedVariantId === variant.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleSelectVariant(selectedIllustration.id, variant.id)}
                    >
                      <div className="aspect-video bg-gradient-subtle">
                        <img
                          src={variant.imageUrl}
                          alt={`Variant ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/f1f5f9/64748b?text=Variant+" + (idx + 1);
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm font-medium">Variant {idx + 1}</span>
                          {(variant.selected || selectedIllustration.selectedVariantId === variant.id) && (
                            <Badge className="bg-primary text-white border-none">
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No variants available for this illustration.</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  {selectedIllustration.status === "approved" ? (
                    <span>Approved variant locked.</span>
                  ) : (
                    <span>Select a variant, then approve.</span>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedIllustration && handleOpenEditPrompt(selectedIllustration)}
                    disabled={isIllustrationUpdating}
                  >
                    ✏️ Edit Prompt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => selectedIllustration && handleRegenerateIllustration(selectedIllustration.id)}
                    disabled={isIllustrationUpdating}
                  >
                    ↻ Regenerate
                  </Button>
                  <Button
                    onClick={() => selectedIllustration && handleApproveIllustration(selectedIllustration.id)}
                    disabled={isIllustrationUpdating}
                  >
                    ✓ Approve
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedIllustration(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Modal */}
      <Dialog open={promptEditorOpen} onOpenChange={(open) => !open && setPromptEditorOpen(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit illustration prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Edit the prompt for this illustration. Your changes will be used for regenerations.
            </p>
            <Textarea
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              className="min-h-[220px]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPromptEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedIllustration && handleSavePromptOverride(selectedIllustration.id)}
                disabled={!selectedIllustration}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chapter History Modal */}
      <Dialog open={showChapterHistoryModal} onOpenChange={setShowChapterHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedChapterForHistory ? `Chapter ${selectedChapterForHistory} History` : "Chapter History"}
            </DialogTitle>
          </DialogHeader>
          {chapterVersions.length > 0 ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {chapterVersions.map((version, index) => (
                  <div
                    key={version.versionId}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                            {index === 0 ? "Current" : `v${chapterVersions.length - index}`}
                          </Badge>
                          <span className="text-sm font-medium">{version.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(version.timestamp).toLocaleString()}
                          {version.author && (
                            <>
                              <span>•</span>
                              <span>{version.author}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {version.wordCount} words
                      </div>
                    </div>

                    {version.vocabularyNotes && (
                      <div className="mb-2 p-2 bg-muted/50 rounded text-xs">
                        <p className="font-medium mb-1">Vocabulary Notes:</p>
                        <p className="text-muted-foreground line-clamp-2">{version.vocabularyNotes}</p>
                      </div>
                    )}

                    {version.islamicAdabChecks && (
                      <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                        <p className="font-medium mb-1">Islamic Adab Checks:</p>
                        <p className="text-muted-foreground line-clamp-2">{version.islamicAdabChecks}</p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {version.content}
                    </p>

                    {index > 0 && (
                      <Button
                        onClick={() => handleRestoreChapterVersion(version.versionId)}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <RotateCcw className="w-3 h-3 mr-2" />
                        Restore This Version
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No version history available for this chapter yet.</p>
            </div>
          )}
          <Button variant="outline" onClick={() => setShowChapterHistoryModal(false)} className="w-full mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {project && (
        <ShareProjectModal
          isOpen={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          projectId={project.id}
          projectTitle={project.title}
        />
      )}
    </AppLayout >
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
