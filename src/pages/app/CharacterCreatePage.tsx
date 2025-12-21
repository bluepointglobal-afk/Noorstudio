import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ageRanges, demoUniverses } from "@/lib/demo-data";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Palette, BookOpen, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Persona", icon: User, description: "Name, role, traits" },
  { id: 2, title: "Visual DNA", icon: Palette, description: "Appearance & style" },
  { id: 3, title: "Knowledge", icon: BookOpen, description: "Binding & level" },
  { id: 4, title: "Pose Sheet", icon: Sparkles, description: "Generate poses" },
];

const traitOptions = ["curious", "brave", "kind", "helpful", "gentle", "patient", "wise", "creative", "loyal", "confident", "thoughtful", "playful"];

export default function CharacterCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    ageRange: "",
    traits: [] as string[],
    speechStyle: "",
    appearance: "",
    modestyRules: "",
    colorPalette: ["#E91E63", "#FF9800", "#FFF3E0"],
    universeId: "",
    knowledgeLevel: "basic" as "basic" | "intermediate" | "advanced",
  });

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTrait = (trait: string) => {
    setFormData((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait].slice(0, 5),
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.role && formData.ageRange;
      case 2:
        return formData.appearance && formData.modestyRules;
      case 3:
        return formData.universeId && formData.knowledgeLevel;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleGeneratePoses = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowGenerateModal(false);
      toast({
        title: "Character created!",
        description: `${formData.name} has been created with a 12-pose sheet.`,
      });
      navigate("/app/characters");
    }, 2500);
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <AppLayout
      title="Create Character"
      subtitle="Build a new character with consistent visual DNA"
      actions={
        <Button variant="outline" onClick={() => navigate("/app/characters")}>
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
                "flex items-center gap-2 text-sm",
                currentStep >= step.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <div className="hidden sm:block">
                <p className="font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card-glow p-8 max-w-2xl mx-auto">
        {/* Step 1: Persona */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Character Persona</h2>
                <p className="text-muted-foreground">Define who this character is</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Character Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Amira"
                  value={formData.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  placeholder="e.g., Curious Explorer"
                  value={formData.role}
                  onChange={(e) => updateForm("role", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Age Range *</Label>
              <Select value={formData.ageRange} onValueChange={(v) => updateForm("ageRange", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
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

            <div className="space-y-2">
              <Label>Character Traits (select up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {traitOptions.map((trait) => (
                  <Badge
                    key={trait}
                    variant={formData.traits.includes(trait) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleTrait(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speech">Speech Style</Label>
              <Input
                id="speech"
                placeholder="e.g., Enthusiastic and questioning"
                value={formData.speechStyle}
                onChange={(e) => updateForm("speechStyle", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Visual DNA */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Visual DNA</h2>
                <p className="text-muted-foreground">Define the character's visual appearance</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appearance">Appearance Description *</Label>
              <Textarea
                id="appearance"
                placeholder="Describe the character's physical appearance, clothing, and distinctive features..."
                value={formData.appearance}
                onChange={(e) => updateForm("appearance", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modesty">Modesty Rules *</Label>
              <Textarea
                id="modesty"
                placeholder="Describe Islamic modesty requirements for this character..."
                value={formData.modestyRules}
                onChange={(e) => updateForm("modestyRules", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color Palette</Label>
              <div className="flex gap-3">
                {formData.colorPalette.map((color, idx) => (
                  <div key={idx} className="space-y-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newPalette = [...formData.colorPalette];
                        newPalette[idx] = e.target.value;
                        updateForm("colorPalette", newPalette);
                      }}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <p className="text-xs text-center text-muted-foreground">{color}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Knowledge Binding */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Knowledge Binding</h2>
                <p className="text-muted-foreground">Connect to a universe knowledge base</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Universe *</Label>
              <Select value={formData.universeId} onValueChange={(v) => updateForm("universeId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a universe" />
                </SelectTrigger>
                <SelectContent>
                  {demoUniverses.map((universe) => (
                    <SelectItem key={universe.id} value={universe.id}>
                      {universe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Knowledge Level *</Label>
              <Select
                value={formData.knowledgeLevel}
                onValueChange={(v: "basic" | "intermediate" | "advanced") =>
                  updateForm("knowledgeLevel", v)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - Simple terms and concepts</SelectItem>
                  <SelectItem value="intermediate">Intermediate - More detailed explanations</SelectItem>
                  <SelectItem value="advanced">Advanced - Complex topics allowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.universeId && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  This character will have access to the knowledge base items from{" "}
                  <strong>
                    {demoUniverses.find((u) => u.id === formData.universeId)?.name}
                  </strong>
                  , filtered by the selected knowledge level.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Generate Poses */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Generate Pose Sheet</h2>
                <p className="text-muted-foreground">Create a 12-pose character sheet</p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-semibold">Character Summary</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Role: </span>
                  <span className="font-medium">{formData.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age Range: </span>
                  <span className="font-medium">{formData.ageRange}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Level: </span>
                  <span className="font-medium capitalize">{formData.knowledgeLevel}</span>
                </div>
              </div>
              {formData.traits.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.traits.map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs capitalize">
                      {trait}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
              <p className="text-muted-foreground mb-4">
                Click below to generate a 12-pose character sheet. This will consume 5 character credits.
              </p>
              <Button variant="hero" size="lg" onClick={() => setShowGenerateModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Pose Sheet
              </Button>
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
          {currentStep < 4 && (
            <Button
              variant="hero"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <CreditConfirmModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        title="Generate Pose Sheet"
        description={`This will create ${formData.name}'s 12-pose character sheet and consume 5 character credits.`}
        creditCost={5}
        creditType="character"
        onConfirm={handleGeneratePoses}
        isLoading={isGenerating}
      />
    </AppLayout>
  );
}
