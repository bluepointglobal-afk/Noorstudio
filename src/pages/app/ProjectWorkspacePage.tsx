import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pipelineStages, demoProjects, demoCharacters } from "@/lib/demo-data";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Play, Check, Loader2, FileText, Image, Layout, BookOpen, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";

type StageStatus = "pending" | "running" | "completed";

interface StageState {
  status: StageStatus;
  progress: number;
}

export default function ProjectWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const project = demoProjects.find((p) => p.id === id) || {
    id: "project-new",
    title: "New Book Project",
    universeId: "universe-1",
    template: "Values",
    ageRange: "5-8",
    status: "outline",
    characters: ["char-1", "char-2"],
    createdAt: new Date().toISOString().split("T")[0],
  };

  const projectCharacters = demoCharacters.filter((c) => project.characters.includes(c.id));

  const [stages, setStages] = useState<Record<string, StageState>>(() => {
    const initial: Record<string, StageState> = {};
    pipelineStages.forEach((stage, idx) => {
      const stageIdx = pipelineStages.findIndex((s) => s.id === project.status);
      initial[stage.id] = {
        status: idx < stageIdx ? "completed" : idx === stageIdx ? "pending" : "pending",
        progress: idx < stageIdx ? 100 : 0,
      };
    });
    return initial;
  });

  const [runningStage, setRunningStage] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState<string | null>(null);

  // Simulated progress
  useEffect(() => {
    if (!runningStage) return;
    
    const interval = setInterval(() => {
      setStages((prev) => {
        const current = prev[runningStage];
        if (current.progress >= 100) {
          clearInterval(interval);
          setRunningStage(null);
          toast({
            title: "Stage completed",
            description: `${pipelineStages.find((s) => s.id === runningStage)?.label} has been completed.`,
          });
          return { ...prev, [runningStage]: { status: "completed", progress: 100 } };
        }
        return { ...prev, [runningStage]: { ...current, progress: current.progress + 10 } };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [runningStage, toast]);

  const handleRunStage = (stageId: string) => {
    setShowCreditModal(stageId);
  };

  const confirmRunStage = () => {
    if (!showCreditModal) return;
    setStages((prev) => ({
      ...prev,
      [showCreditModal]: { status: "running", progress: 0 },
    }));
    setRunningStage(showCreditModal);
    setShowCreditModal(null);
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

  const canRunStage = (stageId: string, idx: number) => {
    if (idx === 0) return stages[stageId].status === "pending";
    const prevStage = pipelineStages[idx - 1];
    return stages[prevStage.id].status === "completed" && stages[stageId].status === "pending";
  };

  // Mock generated content
  const generatedContent = {
    outline: [
      "Chapter 1: The Morning Prayer - Amira learns about Fajr",
      "Chapter 2: Kindness at School - Helping a new friend",
      "Chapter 3: The Ramadan Gift - Sharing with neighbors",
      "Chapter 4: Gratitude Under the Stars - Saying Alhamdulillah",
    ],
    chapters: "Amira woke up to the gentle sound of her mother's voice calling her for Fajr prayer. The sky outside was still dark, but a soft pink glow was beginning to appear on the horizon...",
    illustrations: [
      { id: 1, scene: "Amira waking up at dawn", characters: ["Amira"] },
      { id: 2, scene: "Family praying together", characters: ["Amira", "Mother", "Father"] },
      { id: 3, scene: "Amira at school playground", characters: ["Amira", "New Friend"] },
    ],
  };

  return (
    <AppLayout
      title={project.title}
      subtitle={`${project.template} • Ages ${project.ageRange}`}
      actions={
        <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pipeline Stages */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Pipeline Stages</h2>
          <div className="space-y-3">
            {pipelineStages.map((stage, idx) => {
              const Icon = getStageIcon(stage.id);
              const state = stages[stage.id];
              const canRun = canRunStage(stage.id, idx);

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "card-glow p-4",
                    state.status === "completed" && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        state.status === "completed"
                          ? "bg-primary text-primary-foreground"
                          : state.status === "running"
                          ? "bg-gold-100 text-gold-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {state.status === "running" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : state.status === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{stage.label}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            state.status === "completed" && "bg-primary/10 text-primary border-primary/30",
                            state.status === "running" && "bg-gold-100 text-gold-600 border-gold-200"
                          )}
                        >
                          {state.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                      {state.status === "running" && (
                        <Progress value={state.progress} className="h-1.5 mt-2" />
                      )}
                    </div>
                    <Button
                      variant={state.status === "completed" ? "outline" : "hero"}
                      size="sm"
                      disabled={!canRun && state.status !== "completed"}
                      onClick={() => state.status !== "completed" && handleRunStage(stage.id)}
                    >
                      {state.status === "completed" ? (
                        "View"
                      ) : state.status === "running" ? (
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
                <span className="font-medium">{project.template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age Range</span>
                <span className="font-medium">{project.ageRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{project.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Characters */}
          <div className="card-glow p-5">
            <h3 className="font-semibold mb-4">Characters</h3>
            <div className="space-y-3">
              {projectCharacters.map((char) => (
                <div key={char.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-subtle">
                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{char.name}</p>
                    <p className="text-xs text-muted-foreground">{char.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Content Preview */}
      {stages.outline.status === "completed" && (
        <div className="mt-8">
          <Tabs defaultValue="outline">
            <TabsList>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              {stages.chapters.status === "completed" && <TabsTrigger value="chapters">Chapters</TabsTrigger>}
              {stages.illustrations.status === "completed" && <TabsTrigger value="illustrations">Illustrations</TabsTrigger>}
            </TabsList>
            <TabsContent value="outline" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Book Outline</h3>
              <ul className="space-y-2">
                {generatedContent.outline.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="chapters" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Chapter Preview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{generatedContent.chapters}</p>
            </TabsContent>
            <TabsContent value="illustrations" className="card-glow p-6 mt-4">
              <h3 className="font-semibold mb-4">Illustration Scenes</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {generatedContent.illustrations.map((ill) => (
                  <div key={ill.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="aspect-video bg-gradient-subtle rounded-lg mb-3 flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">{ill.scene}</p>
                    <div className="flex flex-wrap gap-1">
                      {ill.characters.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <CreditConfirmModal
        open={!!showCreditModal}
        onOpenChange={(open) => !open && setShowCreditModal(null)}
        title="Run Pipeline Stage"
        description={`Running the ${pipelineStages.find((s) => s.id === showCreditModal)?.label} stage will consume book credits.`}
        creditCost={showCreditModal === "illustrations" ? 8 : showCreditModal === "chapters" ? 10 : 3}
        creditType="book"
        onConfirm={confirmRunStage}
      />
    </AppLayout>
  );
}
