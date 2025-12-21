import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { demoUniverses, demoCharacters, bookTemplates, ageRanges, layoutStyles } from "@/lib/demo-data";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Globe, BookOpen, Type, Users, Layout, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Universe", icon: Globe },
  { id: 2, title: "Template", icon: BookOpen },
  { id: 3, title: "Details", icon: Type },
  { id: 4, title: "Characters", icon: Users },
  { id: 5, title: "Layout", icon: Layout },
];

export default function BookBuilderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    universeId: "",
    templateId: "",
    ageRange: "",
    title: "",
    synopsis: "",
    learningObjective: "",
    characterIds: [] as string[],
    layoutStyle: "",
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCharacter = (charId: string) => {
    setFormData((prev) => ({
      ...prev,
      characterIds: prev.characterIds.includes(charId)
        ? prev.characterIds.filter((id) => id !== charId)
        : [...prev.characterIds, charId],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.universeId;
      case 2:
        return formData.templateId && formData.ageRange;
      case 3:
        return formData.title && formData.synopsis;
      case 4:
        return formData.characterIds.length > 0;
      case 5:
        return formData.layoutStyle;
      default:
        return false;
    }
  };

  const handleCreate = () => {
    toast({
      title: "Project created!",
      description: `"${formData.title}" has been created and is ready for generation.`,
    });
    navigate("/app/projects/project-new");
  };

  const progress = (currentStep / steps.length) * 100;
  const selectedUniverse = demoUniverses.find((u) => u.id === formData.universeId);
  const selectedTemplate = bookTemplates.find((t) => t.id === formData.templateId);
  const lockedCharacters = demoCharacters.filter((c) => c.status === "locked" || c.status === "approved");

  return (
    <AppLayout
      title="Book Builder"
      subtitle="Create a new book project"
      actions={
        <Button variant="outline" onClick={() => navigate("/app/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      }
    >
      {/* Progress */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 text-sm cursor-pointer",
                currentStep >= step.id ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
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
              <span className="hidden sm:inline font-medium">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glow p-8 max-w-3xl mx-auto">
        {/* Step 1: Universe */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Select Universe</h2>
                <p className="text-muted-foreground">Choose the story universe for this book</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {demoUniverses.map((universe) => (
                <div
                  key={universe.id}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.universeId === universe.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => updateForm("universeId", universe.id)}
                >
                  <h3 className="font-semibold mb-1">{universe.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{universe.description}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{universe.characterCount} characters</span>
                    <span>{universe.bookCount} books</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Template & Age */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Book Template</h2>
                <p className="text-muted-foreground">Select the type and target age range</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Template Type</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {bookTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      formData.templateId === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => updateForm("templateId", template.id)}
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

            <div className="space-y-2">
              <Label>Age Range</Label>
              <Select value={formData.ageRange} onValueChange={(v) => updateForm("ageRange", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target age range" />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      Ages {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Type className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Book Details</h2>
                <p className="text-muted-foreground">Enter the title and description</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Book Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Enter the book title"
              />
            </div>

            <div className="space-y-2">
              <Label>Synopsis *</Label>
              <Textarea
                value={formData.synopsis}
                onChange={(e) => updateForm("synopsis", e.target.value)}
                placeholder="Brief description of the story..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Learning Objective (optional)</Label>
              <Input
                value={formData.learningObjective}
                onChange={(e) => updateForm("learningObjective", e.target.value)}
                placeholder="What should children learn from this book?"
              />
            </div>
          </div>
        )}

        {/* Step 4: Characters */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Select Characters</h2>
                <p className="text-muted-foreground">Choose characters for this book (locked or approved only)</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedCharacters.map((char) => (
                <div
                  key={char.id}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.characterIds.includes(char.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => toggleCharacter(char.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-subtle">
                      <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{char.name}</h4>
                        {char.status === "locked" && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{char.role}</p>
                    </div>
                    <Checkbox checked={formData.characterIds.includes(char.id)} />
                  </div>
                </div>
              ))}
            </div>

            {lockedCharacters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No approved or locked characters available.</p>
                <p className="text-sm">Create and approve characters in the Character Studio first.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Layout */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layout className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Layout Style</h2>
                <p className="text-muted-foreground">Choose how pages will be formatted</p>
              </div>
            </div>

            <div className="grid gap-4">
              {layoutStyles.map((style) => (
                <div
                  key={style.id}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.layoutStyle === style.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => updateForm("layoutStyle", style.id)}
                >
                  <h4 className="font-semibold mb-1">{style.name}</h4>
                  <p className="text-sm text-muted-foreground">{style.description}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
              <h3 className="font-semibold mb-3">Project Summary</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Universe: </span>
                  <span className="font-medium">{selectedUniverse?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Template: </span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age Range: </span>
                  <span className="font-medium">{formData.ageRange}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Characters: </span>
                  <span className="font-medium">{formData.characterIds.length} selected</span>
                </div>
              </div>
            </div>
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
          {currentStep < 5 ? (
            <Button variant="hero" onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handleCreate} disabled={!canProceed()}>
              Create Project
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
