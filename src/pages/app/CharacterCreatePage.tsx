import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AGE_RANGES } from "@/lib/models";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Palette, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";
import {
  createCharacter,
  generatePoseSheet,
  StoredCharacter,
  DEFAULT_POSE_NAMES,
  VisualDNA,
  ModestyRules,
} from "@/lib/storage/charactersStore";
import {
  consumeCredits,
  hasEnoughCredits,
  getBalances,
} from "@/lib/storage/creditsStore";
import { getCharacters } from "@/lib/storage/charactersStore";
import { canCreateCharacter } from "@/lib/entitlements";
import { UpgradeModal } from "@/components/shared/UpgradeModal";

const steps = [
  { id: 1, title: "Persona", icon: User, description: "Name, role, traits" },
  { id: 2, title: "Visual DNA", icon: Palette, description: "Appearance & modesty" },
  { id: 3, title: "Pose Sheet", icon: Sparkles, description: "Generate poses" },
];

const traitOptions = [
  "curious", "brave", "kind", "helpful", "gentle", "patient",
  "wise", "creative", "loyal", "confident", "thoughtful", "playful",
  "adventurous", "caring", "cheerful", "determined",
];

const POSE_SHEET_COST = 10;

export default function CharacterCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<StoredCharacter | null>(null);
  const [credits, setCredits] = useState(getBalances());
  const [characterCount, setCharacterCount] = useState(0);

  // Refresh credits and character count on mount
  useEffect(() => {
    setCredits(getBalances());
    setCharacterCount(getCharacters().length);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    // Persona
    name: "",
    role: "",
    ageRange: "",
    traits: [] as string[],
    speakingStyle: "",

    // Visual DNA
    skinTone: "",
    hairOrHijab: "",
    outfitRules: "",
    accessories: "",
    paletteNotes: "",

    // Modesty Rules
    hijabAlways: false,
    longSleeves: true,
    looseClothing: true,
    modestyNotes: "",

    // Color Palette
    colorPalette: ["#E91E63", "#FF9800", "#FFF3E0"],
  });

  const updateForm = (field: string, value: unknown) => {
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
        return formData.name.trim() && formData.role.trim() && formData.ageRange;
      case 2:
        return formData.skinTone.trim() && formData.hairOrHijab.trim() && formData.outfitRules.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    // Check character limit when moving past Step 1
    if (currentStep === 1) {
      const check = canCreateCharacter(characterCount);
      if (!check.allowed) {
        setShowUpgradeModal(true);
        return;
      }
    }
    setCurrentStep((s) => s + 1);
  };

  const handleCreateCharacter = (): StoredCharacter => {
    const visualDNA: VisualDNA = {
      skinTone: formData.skinTone,
      hairOrHijab: formData.hairOrHijab,
      outfitRules: formData.outfitRules,
      accessories: formData.accessories,
      paletteNotes: formData.paletteNotes,
    };

    const modestyRules: ModestyRules = {
      hijabAlways: formData.hijabAlways,
      longSleeves: formData.longSleeves,
      looseClothing: formData.looseClothing,
      notes: formData.modestyNotes,
    };

    const character = createCharacter({
      name: formData.name,
      role: formData.role,
      ageRange: formData.ageRange,
      traits: formData.traits,
      speakingStyle: formData.speakingStyle,
      visualDNA,
      modestyRules,
      colorPalette: formData.colorPalette,
    });

    return character;
  };

  const handleGeneratePoses = () => {
    // Check credits first
    if (!hasEnoughCredits("character", POSE_SHEET_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${POSE_SHEET_COST} character credits to generate a pose sheet.`,
        variant: "destructive",
      });
      return;
    }

    setShowGenerateModal(true);
  };

  const confirmGeneratePoses = async () => {
    setIsGenerating(true);

    // Create character first if not already created
    let character = createdCharacter;
    if (!character) {
      character = handleCreateCharacter();
      setCreatedCharacter(character);
    }

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: POSE_SHEET_COST,
      reason: `Generate 12-pose sheet for ${character!.name}`,
      entityType: "character",
      entityId: character!.id,
      meta: { poseCount: 12 },
    });

    if (!result.success) {
      setIsGenerating(false);
      setShowGenerateModal(false);
      toast({
        title: "Failed to generate poses",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate the pose sheet using AI
      await generatePoseSheet(character!.id);

      setIsGenerating(false);
      setShowGenerateModal(false);
      setCredits(getBalances());

      toast({
        title: "Character created!",
        description: `${character!.name} has been created with a 12-pose sheet. ${POSE_SHEET_COST} credits used.`,
      });

      navigate(`/app/characters/${character!.id}`);
    } catch (error) {
      setIsGenerating(false);
      setShowGenerateModal(false);
      toast({
        title: "Failed to generate poses",
        description: "An error occurred during pose generation",
        variant: "destructive",
      });
    }
  };

  const handleSaveWithoutPoses = () => {
    const character = handleCreateCharacter();
    toast({
      title: "Character saved",
      description: `${character.name} has been saved as a draft. Generate poses to complete the character.`,
    });
    navigate(`/app/characters/${character.id}`);
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
                  {AGE_RANGES.map((range) => (
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
                    className="cursor-pointer capitalize hover:bg-primary/80 transition-colors"
                    onClick={() => toggleTrait(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.traits.length}/5 traits selected
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speech">Speaking Style</Label>
              <Input
                id="speech"
                placeholder="e.g., Enthusiastic and questioning"
                value={formData.speakingStyle}
                onChange={(e) => updateForm("speakingStyle", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How does this character talk? What words do they use?
              </p>
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
                <p className="text-muted-foreground">Define appearance and modesty rules</p>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Appearance
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skinTone">Skin Tone *</Label>
                  <Input
                    id="skinTone"
                    placeholder="e.g., Warm olive, Light brown"
                    value={formData.skinTone}
                    onChange={(e) => updateForm("skinTone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hairOrHijab">Hair / Hijab *</Label>
                  <Input
                    id="hairOrHijab"
                    placeholder="e.g., Pink hijab with floral pattern"
                    value={formData.hairOrHijab}
                    onChange={(e) => updateForm("hairOrHijab", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outfitRules">Outfit Rules *</Label>
                <Textarea
                  id="outfitRules"
                  placeholder="Describe the character's typical clothing, colors, and style..."
                  value={formData.outfitRules}
                  onChange={(e) => updateForm("outfitRules", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accessories">Accessories</Label>
                  <Input
                    id="accessories"
                    placeholder="e.g., Backpack, glasses, watch"
                    value={formData.accessories}
                    onChange={(e) => updateForm("accessories", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paletteNotes">Palette Notes</Label>
                  <Input
                    id="paletteNotes"
                    placeholder="e.g., Warm pinks and oranges"
                    value={formData.paletteNotes}
                    onChange={(e) => updateForm("paletteNotes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modesty Rules */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Modesty Rules
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="hijabAlways">Hijab Always</Label>
                    <p className="text-xs text-muted-foreground">Character always wears hijab</p>
                  </div>
                  <Switch
                    id="hijabAlways"
                    checked={formData.hijabAlways}
                    onCheckedChange={(checked) => updateForm("hijabAlways", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="longSleeves">Long Sleeves</Label>
                    <p className="text-xs text-muted-foreground">Character wears long sleeves</p>
                  </div>
                  <Switch
                    id="longSleeves"
                    checked={formData.longSleeves}
                    onCheckedChange={(checked) => updateForm("longSleeves", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="looseClothing">Loose Clothing</Label>
                    <p className="text-xs text-muted-foreground">Character wears loose-fitting clothes</p>
                  </div>
                  <Switch
                    id="looseClothing"
                    checked={formData.looseClothing}
                    onCheckedChange={(checked) => updateForm("looseClothing", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modestyNotes">Additional Notes</Label>
                  <Textarea
                    id="modestyNotes"
                    placeholder="Any other modesty guidelines for this character..."
                    value={formData.modestyNotes}
                    onChange={(e) => updateForm("modestyNotes", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Color Palette
              </h3>
              <div className="flex gap-4">
                {formData.colorPalette.map((color, idx) => (
                  <div key={idx} className="space-y-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newPalette = [...formData.colorPalette];
                        newPalette[idx] = e.target.value;
                        updateForm("colorPalette", newPalette);
                      }}
                      className="w-14 h-14 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <p className="text-xs text-center text-muted-foreground">{color}</p>
                  </div>
                ))}
                {formData.colorPalette.length < 5 && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-14 h-14 rounded-lg"
                    onClick={() => updateForm("colorPalette", [...formData.colorPalette, "#CCCCCC"])}
                  >
                    +
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pose Sheet */}
        {currentStep === 3 && (
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

            {/* Character Summary */}
            <div className="space-y-4 p-5 rounded-lg bg-muted/50 border border-border">
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
                  <span className="text-muted-foreground">Skin Tone: </span>
                  <span className="font-medium">{formData.skinTone}</span>
                </div>
              </div>
              {formData.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {formData.traits.map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs capitalize">
                      {trait}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {formData.colorPalette.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Pose Preview Grid */}
            <div className="space-y-3">
              <h3 className="font-medium">12 Poses to Generate</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {DEFAULT_POSE_NAMES.map((pose, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center p-2"
                  >
                    <span className="text-xs text-muted-foreground text-center">{pose}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Info */}
            <div className="p-4 rounded-lg bg-gold-50 border border-gold-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gold-800">Pose Sheet Cost</p>
                  <p className="text-sm text-gold-600">
                    {POSE_SHEET_COST} character credits
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gold-600">Your balance</p>
                  <p className="font-bold text-gold-800">{credits.characterCredits} credits</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                variant="hero"
                size="lg"
                onClick={handleGeneratePoses}
                disabled={!hasEnoughCredits("character", POSE_SHEET_COST) || isGenerating}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 12-Pose Sheet ({POSE_SHEET_COST} credits)
              </Button>

              {!hasEnoughCredits("character", POSE_SHEET_COST) && (
                <p className="text-sm text-destructive text-center">
                  Not enough credits.{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-destructive underline"
                    onClick={() => navigate("/app/billing")}
                  >
                    Get more credits
                  </Button>
                </p>
              )}

              <Button
                variant="outline"
                onClick={handleSaveWithoutPoses}
                className="w-full"
              >
                Save as Draft (Generate Later)
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
          {currentStep < 3 && (
            <Button
              variant="hero"
              onClick={handleNextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Credit Confirm Modal */}
      <CreditConfirmModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        title="Generate Pose Sheet"
        description={`This will create ${formData.name}'s 12-pose character sheet.`}
        creditCost={POSE_SHEET_COST}
        creditType="character"
        onConfirm={confirmGeneratePoses}
        isLoading={isGenerating}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Character Limit Reached"
        description="You've reached the maximum number of characters on your current plan."
        feature="more characters"
        currentLimit={characterCount}
        limitType="Characters"
      />
    </AppLayout>
  );
}
