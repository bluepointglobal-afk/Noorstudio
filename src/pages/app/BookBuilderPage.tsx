import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe, BookOpen, Type, Users, Layout, Check, Lock, Database, FileText, Download, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getCharacters,
  StoredCharacter,
  seedDemoCharactersIfEmpty,
} from "@/lib/storage/charactersStore";
import {
  createProject,
  MOCK_UNIVERSES,
  LayoutStyle,
  TrimSize,
  ExportTarget,
  TemplateType,
} from "@/lib/storage/projectsStore";
import {
  listKnowledgeBases,
  seedDefaultKBIfEmpty,
  KnowledgeBase,
} from "@/lib/storage/knowledgeBaseStore";
import { listProjects } from "@/lib/storage/projectsStore";
import { canCreateProject } from "@/lib/entitlements";
import { UpgradeModal } from "@/components/shared/UpgradeModal";

const steps = [
  { id: 1, title: "Universe", icon: Globe, description: "Universe & KB" },
  { id: 2, title: "Basics", icon: BookOpen, description: "Template & Age" },
  { id: 3, title: "Characters", icon: Users, description: "Select locked" },
  { id: 4, title: "Formatting", icon: Layout, description: "Layout & Export" },
  { id: 5, title: "Review", icon: FileText, description: "Create project" },
];

const BOOK_TEMPLATES: { id: TemplateType; name: string; description: string; ageRange: string }[] = [
  { id: "adventure", name: "Middle-Grade Adventure", description: "Epic journeys with moral lessons for ages 8-12", ageRange: "8-12" },
  { id: "values", name: "Junior Values Story", description: "Gentle tales about honesty, kindness, and sharing for ages 4-7", ageRange: "4-7" },
  { id: "educational", name: "Educational (Salah/Quran)", description: "Learn Islamic practices through engaging illustrated stories", ageRange: "4-8" },
  { id: "seerah", name: "Seerah-Inspired", description: "Stories from the Prophet's life adapted for young readers", ageRange: "6-12" },
];

const AGE_RANGES = ["4-7", "5-8", "8-12"];

// Autosave storage key
const AUTOSAVE_KEY = "noorstudio.book_builder.autosave.v1";

interface AutosaveData {
  formData: {
    universeId: string;
    universeName: string;
    knowledgeBaseId: string;
    knowledgeBaseName: string;
    templateType: TemplateType | "";
    ageRange: string;
    title: string;
    synopsis: string;
    learningObjective: string;
    setting: string;
    characterIds: string[];
    layoutStyle: LayoutStyle | "";
    trimSize: TrimSize | "";
    exportTargets: ExportTarget[];
  };
  currentStep: number;
  savedAt: string;
}

function loadAutosave(): AutosaveData | null {
  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AutosaveData;
  } catch {
    return null;
  }
}

function saveAutosave(data: AutosaveData): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to save autosave:", error);
    }
  }
}

function clearAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}

const LAYOUT_STYLES: { id: LayoutStyle; name: string; description: string }[] = [
  { id: "text-under-image", name: "Text Under Image", description: "Full-width image with text below - classic picture book style" },
  { id: "split-page", name: "Split Page", description: "Text on left, illustration on right - great for longer text" },
  { id: "full-bleed-caption", name: "Full Bleed + Caption", description: "Full-page illustration with caption overlay - immersive visuals" },
];

const TRIM_SIZES: { id: TrimSize; name: string; description: string }[] = [
  { id: "8.5x8.5", name: "8.5\" × 8.5\"", description: "Square format - popular for picture books" },
  { id: "8x10", name: "8\" × 10\"", description: "Portrait format - traditional children's book" },
  { id: "A4", name: "A4", description: "Standard international format" },
];

export default function BookBuilderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [characters, setCharacters] = useState<StoredCharacter[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [hasRestoredAutosave, setHasRestoredAutosave] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Universe & Knowledge Base
    universeId: "",
    universeName: "",
    knowledgeBaseId: "",
    knowledgeBaseName: "",

    // Step 2: Book Basics
    templateType: "" as TemplateType | "",
    ageRange: "",
    title: "",
    synopsis: "",
    learningObjective: "",
    setting: "",

    // Step 3: Characters
    characterIds: [] as string[],

    // Step 4: Formatting
    layoutStyle: "" as LayoutStyle | "",
    trimSize: "" as TrimSize | "",
    exportTargets: ["pdf"] as ExportTarget[],
  });

  // Load characters, knowledge bases, and project count on mount
  useEffect(() => {
    seedDemoCharactersIfEmpty();
    setCharacters(getCharacters());

    // Seed and load real KBs
    seedDefaultKBIfEmpty();
    setKnowledgeBases(listKnowledgeBases());

    // Get current project count for entitlement check
    setProjectCount(listProjects().length);

    // Check for autosaved data
    const autosaved = loadAutosave();
    if (autosaved && !hasRestoredAutosave) {
      setFormData(autosaved.formData);
      setCurrentStep(autosaved.currentStep);
      setLastSaved(autosaved.savedAt);
      setHasRestoredAutosave(true);
      toast({
        title: "Draft Restored",
        description: `Your previous progress has been restored from ${new Date(autosaved.savedAt).toLocaleTimeString()}.`,
      });
    }
  }, [hasRestoredAutosave, toast]);

  // Autosave whenever form data or step changes
  useEffect(() => {
    // Don't save empty forms
    if (!formData.title && !formData.universeId && !formData.templateType) {
      return;
    }

    const autosaveData: AutosaveData = {
      formData,
      currentStep,
      savedAt: new Date().toISOString(),
    };
    saveAutosave(autosaveData);
    setLastSaved(autosaveData.savedAt);
  }, [formData, currentStep]);

  const updateForm = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUniverseSelect = (universeId: string) => {
    const universe = MOCK_UNIVERSES.find((u) => u.id === universeId);
    if (universe) {
      updateForm("universeId", universe.id);
      updateForm("universeName", universe.name);
    }
  };

  const handleKnowledgeBaseSelect = (kbId: string) => {
    const kb = knowledgeBases.find((k) => k.id === kbId);
    if (kb) {
      updateForm("knowledgeBaseId", kb.id);
      updateForm("knowledgeBaseName", kb.name);
    }
  };

  const handleCharacterToggle = (charId: string, character: StoredCharacter) => {
    // Only allow locked characters
    if (character.status !== "locked") {
      toast({
        title: "Character not locked",
        description: "Lock the pose sheet first to ensure visual consistency across the book.",
        variant: "destructive",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(charId)
        ? prev.characterIds.filter((id) => id !== charId)
        : [...prev.characterIds, charId],
    }));
  };

  const toggleExportTarget = (target: ExportTarget) => {
    setFormData((prev) => ({
      ...prev,
      exportTargets: prev.exportTargets.includes(target)
        ? prev.exportTargets.filter((t) => t !== target)
        : [...prev.exportTargets, target],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.universeId && formData.knowledgeBaseId;
      case 2:
        return formData.templateType && formData.ageRange && formData.title.trim() && formData.synopsis.trim();
      case 3:
        return formData.characterIds.length > 0;
      case 4:
        return formData.layoutStyle && formData.trimSize && formData.exportTargets.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;

    // Check project limit
    const check = canCreateProject(projectCount);
    if (!check.allowed) {
      setShowUpgradeModal(true);
      return;
    }

    setIsCreating(true);

    try {
      const project = createProject({
        title: formData.title,
        universeId: formData.universeId,
        universeName: formData.universeName,
        knowledgeBaseId: formData.knowledgeBaseId,
        knowledgeBaseName: formData.knowledgeBaseName,
        ageRange: formData.ageRange,
        templateType: formData.templateType as TemplateType,
        synopsis: formData.synopsis,
        learningObjective: formData.learningObjective,
        setting: formData.setting,
        characterIds: formData.characterIds,
        layoutStyle: formData.layoutStyle as LayoutStyle,
        trimSize: formData.trimSize as TrimSize,
        exportTargets: formData.exportTargets,
      });

      // Clear autosave on successful creation
      clearAutosave();

      toast({
        title: "Project created!",
        description: `"${formData.title}" has been created and is ready for generation.`,
      });

      navigate(`/app/projects/${project.id}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to create project:", error);
      }
      toast({
        title: "Failed to create project",
        description: "An error occurred while creating the project. Your draft has been saved.",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  const handleClearDraft = () => {
    clearAutosave();
    setFormData({
      universeId: "",
      universeName: "",
      knowledgeBaseId: "",
      knowledgeBaseName: "",
      templateType: "",
      ageRange: "",
      title: "",
      synopsis: "",
      learningObjective: "",
      setting: "",
      characterIds: [],
      layoutStyle: "",
      trimSize: "",
      exportTargets: ["pdf"],
    });
    setCurrentStep(1);
    setLastSaved(null);
    toast({
      title: "Draft cleared",
      description: "Your draft has been cleared. Start fresh!",
    });
  };

  const progress = (currentStep / steps.length) * 100;
  const lockedCharacters = characters.filter((c) => c.status === "locked");
  const selectedUniverse = MOCK_UNIVERSES.find((u) => u.id === formData.universeId);
  const selectedKB = knowledgeBases.find((k) => k.id === formData.knowledgeBaseId);
  const selectedTemplate = BOOK_TEMPLATES.find((t) => t.id === formData.templateType);
  const selectedCharacters = characters.filter((c) => formData.characterIds.includes(c.id));

  return (
    <AppLayout
      title="Book Builder"
      subtitle="Create a new book project"
      actions={
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="w-3 h-3" />
              <span>Draft saved {new Date(lastSaved).toLocaleTimeString()}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleClearDraft}
              >
                Clear
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      }
    >
      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "flex items-center gap-2 text-sm transition-colors",
                currentStep >= step.id ? "text-primary" : "text-muted-foreground",
                step.id < currentStep && "cursor-pointer hover:text-primary/80"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card-glow p-8 max-w-3xl mx-auto">
        {/* Step 1: Universe & Knowledge Base */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Universe & Knowledge Base</h2>
                <p className="text-muted-foreground">Select the story universe and knowledge base</p>
              </div>
            </div>

            {/* Universe Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Story Universe *</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                {MOCK_UNIVERSES.map((universe) => (
                  <div
                    key={universe.id}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      formData.universeId === universe.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleUniverseSelect(universe.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{universe.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{universe.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Base Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Knowledge Base *</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => navigate("/app/knowledge-base")}
                >
                  Manage KBs
                </Button>
              </div>
              {knowledgeBases.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {knowledgeBases.map((kb) => (
                    <div
                      key={kb.id}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        formData.knowledgeBaseId === kb.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleKnowledgeBaseSelect(kb.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">{kb.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{kb.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border-2 border-dashed border-border text-center">
                  <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-2">No knowledge bases found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/app/knowledge-base")}
                  >
                    Create Knowledge Base
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Book Basics */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Book Basics</h2>
                <p className="text-muted-foreground">Define the template, audience, and story details</p>
              </div>
            </div>

            {/* Template Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Template Type *</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {BOOK_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      formData.templateType === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateForm("templateType", template.id)}
                  >
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Ages {template.ageRange}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label>Target Age Range *</Label>
              <Select value={formData.ageRange} onValueChange={(v) => updateForm("ageRange", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target age range" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      Ages {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Book Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Enter the book title"
              />
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <Label>Synopsis *</Label>
              <Textarea
                value={formData.synopsis}
                onChange={(e) => updateForm("synopsis", e.target.value)}
                placeholder="Brief description of the story (2-3 sentences)..."
                rows={3}
              />
            </div>

            {/* Learning Objective */}
            <div className="space-y-2">
              <Label>Learning Objective</Label>
              <Input
                value={formData.learningObjective}
                onChange={(e) => updateForm("learningObjective", e.target.value)}
                placeholder="What should children learn from this book?"
              />
            </div>

            {/* Setting */}
            <div className="space-y-2">
              <Label>Setting</Label>
              <Input
                value={formData.setting}
                onChange={(e) => updateForm("setting", e.target.value)}
                placeholder="Where does this story take place?"
              />
            </div>
          </div>
        )}

        {/* Step 3: Characters */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Select Characters</h2>
                <p className="text-muted-foreground">
                  Choose locked characters for visual consistency
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-gold-50 border border-gold-200 text-sm">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gold-800">Only locked characters can be used</p>
                  <p className="text-gold-600">
                    Characters must have their pose sheet locked to ensure visual consistency across book illustrations.
                  </p>
                </div>
              </div>
            </div>

            {/* Character Grid */}
            {characters.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((char) => {
                  const isSelected = formData.characterIds.includes(char.id);
                  const isLocked = char.status === "locked";

                  return (
                    <div
                      key={char.id}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : isLocked
                            ? "border-border hover:border-primary/50"
                            : "border-border/50 opacity-60"
                      )}
                      onClick={() => handleCharacterToggle(char.id, char)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-subtle flex-shrink-0">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{char.name}</h4>
                            {isLocked && <Lock className="w-3 h-3 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{char.role}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs mt-1 capitalize",
                              isLocked && "bg-primary/10 text-primary border-primary/30"
                            )}
                          >
                            {char.status}
                          </Badge>
                        </div>
                        <Checkbox checked={isSelected} disabled={!isLocked} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No characters available.</p>
                <p className="text-sm">Create characters in the Character Studio first.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/app/characters")}
                >
                  Go to Character Studio
                </Button>
              </div>
            )}

            {/* Selection Count */}
            {formData.characterIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {formData.characterIds.length} character{formData.characterIds.length > 1 ? "s" : ""} selected
              </div>
            )}

            {/* Warning if no locked characters */}
            {lockedCharacters.length === 0 && characters.length > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                <p className="font-medium text-destructive">No locked characters available</p>
                <p className="text-destructive/80">
                  You need to lock at least one character's pose sheet before creating a book.{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-destructive underline"
                    onClick={() => navigate("/app/characters")}
                  >
                    Go to Character Studio
                  </Button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Formatting */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Formatting Options</h2>
                <p className="text-muted-foreground">Choose layout, size, and export formats</p>
              </div>
            </div>

            {/* Layout Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Layout Style *</Label>
              <RadioGroup
                value={formData.layoutStyle}
                onValueChange={(v) => updateForm("layoutStyle", v)}
                className="space-y-3"
              >
                {LAYOUT_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      formData.layoutStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateForm("layoutStyle", style.id)}
                  >
                    <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                    <div>
                      <label htmlFor={style.id} className="font-semibold cursor-pointer">
                        {style.name}
                      </label>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Trim Size */}
            <div className="space-y-2">
              <Label>Trim Size *</Label>
              <Select value={formData.trimSize} onValueChange={(v) => updateForm("trimSize", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select book size" />
                </SelectTrigger>
                <SelectContent>
                  {TRIM_SIZES.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} - {size.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Targets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Formats *</Label>
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1",
                    formData.exportTargets.includes("pdf")
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleExportTarget("pdf")}
                >
                  <Checkbox checked={formData.exportTargets.includes("pdf")} />
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">PDF</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1",
                    formData.exportTargets.includes("epub")
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleExportTarget("epub")}
                >
                  <Checkbox checked={formData.exportTargets.includes("epub")} />
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">EPUB</span>
                  </div>
                </div>
              </div>
              {formData.exportTargets.length === 0 && (
                <p className="text-sm text-destructive">Select at least one export format</p>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Create */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Review & Create</h2>
                <p className="text-muted-foreground">Confirm your project settings</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-4">
              <h3 className="font-semibold text-lg">{formData.title}</h3>

              {/* Synopsis */}
              <p className="text-sm text-muted-foreground">{formData.synopsis}</p>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Universe</p>
                  <p className="font-medium">{selectedUniverse?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Knowledge Base</p>
                  <p className="font-medium">{selectedKB?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Template</p>
                  <p className="font-medium">{selectedTemplate?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Age Range</p>
                  <p className="font-medium">{formData.ageRange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Layout Style</p>
                  <p className="font-medium">
                    {LAYOUT_STYLES.find((l) => l.id === formData.layoutStyle)?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Trim Size</p>
                  <p className="font-medium">
                    {TRIM_SIZES.find((t) => t.id === formData.trimSize)?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Characters */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Characters ({selectedCharacters.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedCharacters.map((char) => (
                    <div key={char.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-subtle">
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/50x50/e2e8f0/64748b?text=" + char.name.charAt(0);
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{char.name}</span>
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Formats */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Export Formats</p>
                <div className="flex gap-2">
                  {formData.exportTargets.map((target) => (
                    <Badge key={target} variant="secondary" className="uppercase">
                      {target}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Learning Objective */}
              {formData.learningObjective && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Learning Objective</p>
                  <p className="text-sm">{formData.learningObjective}</p>
                </div>
              )}

              {/* Setting */}
              {formData.setting && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Setting</p>
                  <p className="text-sm">{formData.setting}</p>
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <>Creating Project...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep < 5 && (
            <Button variant="hero" onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Project Limit Reached"
        description="You've reached the maximum number of book projects on your current plan."
        feature="more projects"
        currentLimit={projectCount}
        limitType="Projects"
      />
    </AppLayout>
  );
}
