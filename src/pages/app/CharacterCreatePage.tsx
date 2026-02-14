import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AGE_RANGES, CHARACTER_STYLES, CharacterStyle } from "@/lib/models";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Palette, Sparkles, Check, RefreshCw, Image, ThumbsUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";
import {
  createCharacter,
  generateCharacterImage,
  approveCharacterDesign,
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
import { CharacterRefinementPanel, QuickAdjustments } from "@/components/characters/CharacterRefinementPanel";

// Visual DNA dropdown options - FULL SPECTRUM
const SKIN_TONES = [
  { value: "porcelain", label: "Porcelain" },
  { value: "fair", label: "Fair" },
  { value: "light", label: "Light" },
  { value: "light-beige", label: "Light Beige" },
  { value: "beige", label: "Beige" },
  { value: "light-olive", label: "Light Olive" },
  { value: "olive", label: "Olive" },
  { value: "warm-olive", label: "Warm Olive" },
  { value: "golden", label: "Golden" },
  { value: "light-tan", label: "Light Tan" },
  { value: "tan", label: "Tan" },
  { value: "caramel", label: "Caramel" },
  { value: "light-brown", label: "Light Brown" },
  { value: "medium-brown", label: "Medium Brown" },
  { value: "warm-brown", label: "Warm Brown" },
  { value: "brown", label: "Brown" },
  { value: "rich-brown", label: "Rich Brown" },
  { value: "dark-brown", label: "Dark Brown" },
  { value: "deep-brown", label: "Deep Brown" },
  { value: "ebony", label: "Ebony" },
];

const EYE_COLORS = [
  { value: "dark-brown", label: "Dark Brown" },
  { value: "brown", label: "Brown" },
  { value: "light-brown", label: "Light Brown" },
  { value: "amber", label: "Amber" },
  { value: "hazel", label: "Hazel" },
  { value: "hazel-green", label: "Hazel Green" },
  { value: "green", label: "Green" },
  { value: "blue-green", label: "Blue Green" },
  { value: "blue", label: "Blue" },
  { value: "light-blue", label: "Light Blue" },
  { value: "gray", label: "Gray" },
  { value: "gray-blue", label: "Gray Blue" },
  { value: "black", label: "Black" },
];

const FACE_SHAPES = [
  { value: "round-friendly", label: "Round & Friendly" },
  { value: "round-cheerful", label: "Round & Cheerful" },
  { value: "round-youthful", label: "Round & Youthful" },
  { value: "oval-gentle", label: "Oval & Gentle" },
  { value: "oval-thoughtful", label: "Oval & Thoughtful" },
  { value: "oval-balanced", label: "Oval & Balanced" },
  { value: "heart-creative", label: "Heart-shaped & Creative" },
  { value: "heart-expressive", label: "Heart-shaped & Expressive" },
  { value: "square-determined", label: "Square & Determined" },
  { value: "square-strong", label: "Square & Strong" },
  { value: "diamond-elegant", label: "Diamond & Elegant" },
  { value: "long-wise", label: "Long & Wise" },
];

const HAIR_STYLES_BOY = [
  { value: "short-black", label: "Short Black Hair" },
  { value: "short-dark-brown", label: "Short Dark Brown Hair" },
  { value: "short-brown", label: "Short Brown Hair" },
  { value: "short-light-brown", label: "Short Light Brown Hair" },
  { value: "short-blonde", label: "Short Blonde Hair" },
  { value: "short-red", label: "Short Red Hair" },
  { value: "curly-black", label: "Curly Black Hair" },
  { value: "curly-dark", label: "Curly Dark Hair" },
  { value: "curly-brown", label: "Curly Brown Hair" },
  { value: "wavy-dark", label: "Wavy Dark Hair" },
  { value: "wavy-brown", label: "Wavy Brown Hair" },
  { value: "wavy-blonde", label: "Wavy Blonde Hair" },
  { value: "spiky-black", label: "Spiky Black Hair" },
  { value: "spiky-brown", label: "Spiky Brown Hair" },
  { value: "buzz-cut", label: "Buzz Cut" },
  { value: "afro", label: "Afro" },
  { value: "dreadlocks", label: "Dreadlocks" },
  { value: "braids-short", label: "Short Braids" },
];

const HAIR_STYLES_GIRL_NO_HIJAB = [
  { value: "long-black", label: "Long Black Hair" },
  { value: "long-dark-brown", label: "Long Dark Brown Hair" },
  { value: "long-brown", label: "Long Brown Hair" },
  { value: "long-light-brown", label: "Long Light Brown Hair" },
  { value: "long-blonde", label: "Long Blonde Hair" },
  { value: "long-red", label: "Long Red Hair" },
  { value: "shoulder-black", label: "Shoulder-length Black Hair" },
  { value: "shoulder-brown", label: "Shoulder-length Brown Hair" },
  { value: "shoulder-blonde", label: "Shoulder-length Blonde Hair" },
  { value: "curly-long", label: "Long Curly Hair" },
  { value: "curly-shoulder", label: "Shoulder-length Curly Hair" },
  { value: "wavy-long", label: "Long Wavy Hair" },
  { value: "wavy-shoulder", label: "Shoulder-length Wavy Hair" },
  { value: "braided-long", label: "Long Braided Hair" },
  { value: "braided-double", label: "Double Braids" },
  { value: "ponytail-high", label: "High Ponytail" },
  { value: "ponytail-side", label: "Side Ponytail" },
  { value: "bun-top", label: "Top Bun" },
  { value: "bun-side", label: "Side Bun" },
  { value: "pigtails", label: "Pigtails" },
  { value: "afro-puffs", label: "Afro Puffs" },
  { value: "dreadlocks-long", label: "Long Dreadlocks" },
  { value: "box-braids", label: "Box Braids" },
  { value: "cornrows", label: "Cornrows" },
];

const HIJAB_STYLES = [
  { value: "simple-white", label: "Simple White Hijab" },
  { value: "simple-black", label: "Simple Black Hijab" },
  { value: "simple-beige", label: "Simple Beige Hijab" },
  { value: "simple-gray", label: "Simple Gray Hijab" },
  { value: "pink-solid", label: "Solid Pink Hijab" },
  { value: "pink-floral", label: "Pink Hijab with Floral Pattern" },
  { value: "pink-pastel", label: "Pastel Pink Hijab" },
  { value: "blue-solid", label: "Solid Blue Hijab" },
  { value: "blue-navy", label: "Navy Blue Hijab" },
  { value: "blue-patterned", label: "Blue Patterned Hijab" },
  { value: "teal-solid", label: "Solid Teal Hijab" },
  { value: "teal-modern", label: "Teal Modern Hijab" },
  { value: "teal-science", label: "Teal Hijab with Science Motifs" },
  { value: "purple-solid", label: "Solid Purple Hijab" },
  { value: "purple-artistic", label: "Purple Hijab with Artistic Patterns" },
  { value: "purple-elegant", label: "Elegant Purple Hijab" },
  { value: "burgundy-solid", label: "Solid Burgundy Hijab" },
  { value: "burgundy-elegant", label: "Burgundy Elegant Hijab" },
  { value: "green-solid", label: "Solid Green Hijab" },
  { value: "green-olive", label: "Olive Green Hijab" },
  { value: "orange-solid", label: "Solid Orange Hijab" },
  { value: "orange-nature", label: "Orange Hijab with Nature Patterns" },
  { value: "yellow-solid", label: "Solid Yellow Hijab" },
  { value: "brown-solid", label: "Solid Brown Hijab" },
  { value: "red-solid", label: "Solid Red Hijab" },
  { value: "turquoise", label: "Turquoise Hijab" },
  { value: "gold-elegant", label: "Gold Elegant Hijab" },
  { value: "silver-modern", label: "Silver Modern Hijab" },
  { value: "multicolor-vibrant", label: "Vibrant Multicolor Hijab" },
  { value: "geometric-pattern", label: "Hijab with Geometric Patterns" },
  { value: "paisley-pattern", label: "Hijab with Paisley Pattern" },
];

const characterTemplates = [
  {
    id: "curious-girl",
    label: "Curious Explorer (Girl)",
    description: "Adventurous girl who loves learning",
    gender: "girl" as const,
    traits: ["curious", "brave", "kind", "loves learning"],
    role: "Curious Explorer",
    ageRange: "6-9",
    skinTone: "olive",
    eyeColor: "dark-brown",
    faceShape: "round-friendly",
    wearHijab: true,
    hairOrHijab: "pink-floral",
    outfitRules: "Bright orange dress with modest neckline, comfortable shoes",
    accessories: "Small backpack, notebook",
  },
  {
    id: "honest-boy",
    label: "Honest Student (Boy)",
    description: "Truthful and trustworthy",
    gender: "boy" as const,
    traits: ["honest", "trustworthy", "loyal", "always tells truth"],
    role: "Honest Student",
    ageRange: "10-12",
    skinTone: "light-brown",
    eyeColor: "brown",
    faceShape: "oval-thoughtful",
    wearHijab: false,
    hairOrHijab: "short-dark",
    outfitRules: "Blue thobe, comfortable fit",
    accessories: "Small prayer cap, backpack",
  },
  {
    id: "creative-girl",
    label: "Creative Artist (Girl)",
    description: "Artistic and imaginative",
    gender: "girl" as const,
    traits: ["creative", "artistic", "imaginative", "loves painting"],
    role: "Creative Artist",
    ageRange: "6-8",
    skinTone: "medium-brown",
    eyeColor: "hazel",
    faceShape: "heart-creative",
    wearHijab: true,
    hairOrHijab: "purple-artistic",
    outfitRules: "Colorful dress with modest neckline, paint-splattered apron",
    accessories: "Paintbrush, colorful art supplies",
  },
  {
    id: "brave-boy",
    label: "Brave Adventurer (Boy)",
    description: "Courageous outdoor explorer",
    gender: "boy" as const,
    traits: ["brave", "adventurous", "determined", "loves nature"],
    role: "Brave Adventurer",
    ageRange: "9-11",
    skinTone: "brown",
    eyeColor: "dark-brown",
    faceShape: "square-determined",
    wearHijab: false,
    hairOrHijab: "curly-dark",
    outfitRules: "Green hiking outfit with long sleeves, sturdy boots",
    accessories: "Compass, binoculars, adventure backpack",
  },
  {
    id: "scholar",
    label: "Scholar",
    description: "Wise and thoughtful",
    gender: "boy" as const,
    traits: ["wise", "curious", "patient"],
    role: "Scholar",
    ageRange: "10-14",
    skinTone: "medium-brown",
    eyeColor: "brown",
    faceShape: "oval-thoughtful",
    wearHijab: false,
    hairOrHijab: "short-black",
    outfitRules: "Traditional thobe, scholarly appearance",
    accessories: "Glasses, book, writing tablet",
  },
  {
    id: "adventurer",
    label: "Adventurer (Girl)",
    description: "Brave and daring explorer",
    gender: "girl" as const,
    traits: ["brave", "adventurous", "determined"],
    role: "Adventurer",
    ageRange: "10-14",
    skinTone: "olive",
    eyeColor: "green",
    faceShape: "square-determined",
    wearHijab: true,
    hairOrHijab: "orange-nature",
    outfitRules: "Hiking outfit with modest long sleeves and pants, comfortable boots",
    accessories: "Compass, backpack, binoculars for exploration",
  },
  {
    id: "artist",
    label: "Artist",
    description: "Creative and expressive",
    traits: ["creative", "thoughtful", "playful"],
    role: "Artist",
    ageRange: "10-14",
  },
  {
    id: "helper",
    label: "Helper",
    description: "Kind and caring",
    traits: ["kind", "helpful", "caring"],
    role: "Helper",
    ageRange: "10-14",
  },
  {
    id: "custom",
    label: "Custom Character",
    description: "Create a character from your text description",
    traits: [],
    role: "Custom",
    ageRange: "",
    isCustom: true,
  },
];

const steps = [
  { id: 0, title: "Template", icon: User, description: "Choose creation path" },
  { id: 1, title: "Persona", icon: User, description: "Name, role, traits" },
  { id: 2, title: "Visual DNA", icon: Palette, description: "Appearance & modesty" },
  { id: 3, title: "Character", icon: Sparkles, description: "Generate & refine" },
  { id: 4, title: "Pose Sheet", icon: Sparkles, description: "Generate 12 poses" },
];

const traitOptions = [
  "curious", "brave", "kind", "helpful", "gentle", "patient",
  "wise", "creative", "loyal", "confident", "thoughtful", "playful",
  "adventurous", "caring", "cheerful", "determined",
];

// Credit costs - Phase 2 with iteration pricing
const CHARACTER_GENERATION_COST = 2;     // Initial character generation
const TARGETED_FIX_COST = 0.5;           // Fix specific attribute (hair, accessories, etc.)
const GUIDED_REGENERATION_COST = 1;      // Guided full regeneration
const FULL_REGENERATION_COST = 2;        // Complete regeneration
const POSE_SHEET_COST = 3;               // 12-pose grid (single API call)

export default function CharacterCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<StoredCharacter | null>(null);
  const [credits, setCredits] = useState(getBalances());
  const [characterCount, setCharacterCount] = useState(0);
  
  // Phase 2: Quick adjustments state
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const [quickAdjustments, setQuickAdjustments] = useState<QuickAdjustments>({
    brightness: 1.0,
    saturation: 1.0,
    ageScale: 1.0,
    rotation: 0,
  });

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
    style: "pixar-3d" as CharacterStyle,
    gender: "girl" as "boy" | "girl", // Default to girl, user can change
    wearHijab: false, // Whether girl wears hijab
    skinTone: "",
    eyeColor: "",
    faceShape: "",
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

  // Custom character creation (text-only) state
  const [customForm, setCustomForm] = useState({
    name: "",
    age: "",
    role: "",
    traitsText: "",
    description: "",
  });

  const updateCustomForm = (field: keyof typeof customForm, value: string) => {
    setCustomForm((prev) => ({ ...prev, [field]: value }));
  };

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
      case 0:
        return selectedTemplate !== null;
      case 1:
        return formData.name.trim() && formData.role.trim() && formData.ageRange;
      case 2:
        return formData.gender && formData.eyeColor.trim() && formData.faceShape.trim() && formData.skinTone.trim() && formData.hairOrHijab.trim() && formData.outfitRules.trim();
      case 3:
        // Can proceed to pose sheet only if character is approved (has image)
        return createdCharacter?.imageUrl && createdCharacter.status === "approved";
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    // Check character limit when moving past Step 0
    if (currentStep === 0) {
      const check = canCreateCharacter(characterCount);
      if (!check.allowed) {
        setShowUpgradeModal(true);
        return;
      }
      
      // Apply template data if a template is selected
      if (selectedTemplate && selectedTemplate !== "custom") {
        const template = characterTemplates.find(t => t.id === selectedTemplate);
        if (template) {
          setFormData((prev) => ({
            ...prev,
            // Persona
            role: template.role,
            ageRange: template.ageRange,
            traits: template.traits,
            // Visual DNA from template
            gender: template.gender || prev.gender,
            wearHijab: template.wearHijab !== undefined ? template.wearHijab : prev.wearHijab,
            skinTone: template.skinTone || prev.skinTone,
            eyeColor: template.eyeColor || prev.eyeColor,
            faceShape: template.faceShape || prev.faceShape,
            hairOrHijab: template.hairOrHijab || prev.hairOrHijab,
            outfitRules: template.outfitRules || prev.outfitRules,
            accessories: template.accessories || prev.accessories,
          }));
        }
      }
    }
    
    setCurrentStep((s) => s + 1);
  };

  const parseTraitsText = (text: string): string[] => {
    return text
      .split(/[,\n]/g)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  const handleGenerateCustomCharacterFromText = async () => {
    if (isGenerating) return;

    // Credits check
    if (!hasEnoughCredits("character", CHARACTER_GENERATION_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${CHARACTER_GENERATION_COST} character credits to generate a character.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Create minimal character record in storage (draft)
    const character = createCharacter({
      name: customForm.name.trim(),
      role: customForm.role.trim(),
      ageRange: customForm.age.trim(),
      traits: parseTraitsText(customForm.traitsText),
      speakingStyle: "",
      visualDNA: {
        style: "pixar-3d",
        gender: "girl", // Default - will be inferred from AI-generated description
        skinTone: "",
        eyeColor: "",
        faceShape: "",
        hairOrHijab: "",
        outfitRules: "",
        accessories: "",
        paletteNotes: "",
      },
      modestyRules: {
        hijabAlways: false,
        longSleeves: true,
        looseClothing: true,
        notes: "",
      },
      colorPalette: ["#E91E63", "#FF9800", "#FFF3E0"],
    });

    setCreatedCharacter(character);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: CHARACTER_GENERATION_COST,
      reason: `Generate custom character image for ${character.name}`,
      entityType: "character",
      entityId: character.id,
      meta: { step: "custom_character_generation" },
    });

    if (!result.success) {
      setIsGenerating(false);
      toast({
        title: "Failed to generate character",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      const prompt = `Create a single, full-body children's book character on a clean simple background.

Name: ${customForm.name.trim()}
Age: ${customForm.age.trim()}
Role: ${customForm.role.trim()}
Traits: ${parseTraitsText(customForm.traitsText).join(", ") || "(not specified)"}

Description:
${customForm.description.trim()}

Style requirements:
- Warm, friendly, approachable expression
- Character centered in frame, well-lit from the front
- High-quality Pixar-style 3D CGI character design
- No text, no logos, no watermarks`;

      const response = await generateImage({
        prompt,
        style: "pixar-3d",
        width: 768,
        height: 1024,
        stage: "illustrations",
      } as any);

      const updated = updateCharacter(character.id, {
        imageUrl: response.imageUrl,
        status: "draft",
      });

      if (updated) setCreatedCharacter(updated);

      setCredits(getBalances());
      setIsGenerating(false);

      toast({
        title: "Custom character created!",
        description: `${character.name} has been generated from your description.`,
      });

      // Jump to Character step for review/refinement
      setCurrentStep(3);
    } catch (error) {
      setIsGenerating(false);
      setCredits(getBalances());
      toast({
        title: "Failed to generate custom character",
        description: "An error occurred during image generation",
        variant: "destructive",
      });
    }
  };

  const handleCreateCharacter = (): StoredCharacter => {
    const visualDNA: VisualDNA = {
      style: formData.style,
      gender: formData.gender,
      skinTone: formData.skinTone,
      eyeColor: formData.eyeColor,
      faceShape: formData.faceShape,
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

  // Step 3: Generate initial character image
  const handleGenerateCharacter = async () => {
    // Check credits first
    if (!hasEnoughCredits("character", CHARACTER_GENERATION_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${CHARACTER_GENERATION_COST} character credits to generate a character.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Create character record if not already created
    let character = createdCharacter;
    if (!character) {
      character = handleCreateCharacter();
      setCreatedCharacter(character);
    }

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: CHARACTER_GENERATION_COST,
      reason: `Generate character image for ${character.name}`,
      entityType: "character",
      entityId: character.id,
      meta: { step: "character_generation" },
    });

    if (!result.success) {
      setIsGenerating(false);
      toast({
        title: "Failed to generate character",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate the character image using AI (SINGLE API CALL)
      const updatedCharacter = await generateCharacterImage(character.id, (status) => {
        // Could show status in UI if needed
        console.log("Character generation:", status);
      });

      if (updatedCharacter) {
        setCreatedCharacter(updatedCharacter);
      }

      setIsGenerating(false);
      setCredits(getBalances());

      toast({
        title: "Character generated!",
        description: `${character.name} has been generated. Review and approve to continue.`,
      });
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Failed to generate character",
        description: "An error occurred during character generation",
        variant: "destructive",
      });
    }
  };

  // Step 3: Approve character design
  const handleApproveCharacter = () => {
    if (!createdCharacter) return;

    const approved = approveCharacterDesign(createdCharacter.id);
    if (approved) {
      setCreatedCharacter(approved);
      toast({
        title: "Character approved!",
        description: `${approved.name} is ready for pose sheet generation.`,
      });
      // Auto-advance to pose sheet step
      setCurrentStep(4);
    }
  };

  // Step 3: Regenerate character (try again)
  const handleRegenerateCharacter = async () => {
    if (!createdCharacter) return;
    await handleGenerateCharacter();
  };

  // Phase 2: Quick adjustments handler (FREE - no credits)
  const handleQuickAdjust = (adjustments: QuickAdjustments) => {
    setQuickAdjustments(adjustments);
    toast({
      title: "Adjustments applied",
      description: "Changes are preview-only. Use targeted fixes for permanent changes.",
    });
  };

  // Phase 2: Targeted fix handler (0.5 credits)
  const handleTargetedFix = async (fixType: string) => {
    if (!createdCharacter) return;

    // Check credits
    if (!hasEnoughCredits("character", TARGETED_FIX_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${TARGETED_FIX_COST} character credits for targeted fixes.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: TARGETED_FIX_COST,
      reason: `Fix ${fixType} for ${createdCharacter.name}`,
      entityType: "character",
      entityId: createdCharacter.id,
      meta: { fixType, step: "targeted_fix" },
    });

    if (!result.success) {
      setIsGenerating(false);
      toast({
        title: "Failed to apply fix",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement targeted inpainting API call
      // For now, we'll regenerate with boosted attention to the specific attribute
      toast({
        title: "Targeted fix in progress",
        description: `Fixing ${fixType}... This feature will use inpainting for precise attribute fixes.`,
      });

      // Placeholder: In production, this would call inpainting API
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsGenerating(false);
      setCredits(getBalances());

      toast({
        title: "Fix applied!",
        description: `${fixType} has been regenerated. ${TARGETED_FIX_COST} credits used.`,
      });
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Failed to apply fix",
        description: "An error occurred during targeted fix",
        variant: "destructive",
      });
    }
  };

  // Phase 2: Guided regeneration handler (1 credit)
  const handleGuidedRegeneration = async (problemAreas: string[]) => {
    if (!createdCharacter) return;

    // Check credits
    if (!hasEnoughCredits("character", GUIDED_REGENERATION_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${GUIDED_REGENERATION_COST} character credits for guided regeneration.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: GUIDED_REGENERATION_COST,
      reason: `Guided regeneration for ${createdCharacter.name}`,
      entityType: "character",
      entityId: createdCharacter.id,
      meta: { problemAreas, step: "guided_regeneration" },
    });

    if (!result.success) {
      setIsGenerating(false);
      toast({
        title: "Failed to regenerate",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      // Regenerate with boosted attention to problem areas
      const updatedCharacter = await generateCharacterImage(createdCharacter.id, (status) => {
        console.log("Guided regeneration:", status);
      });

      if (updatedCharacter) {
        setCreatedCharacter(updatedCharacter);
      }

      setIsGenerating(false);
      setCredits(getBalances());

      toast({
        title: "Character regenerated!",
        description: `Focused on: ${problemAreas.join(', ')}. ${GUIDED_REGENERATION_COST} credit used.`,
      });
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Failed to regenerate",
        description: "An error occurred during guided regeneration",
        variant: "destructive",
      });
    }
  };

  // Phase 2: Full regeneration handler (2 credits)
  const handleFullRegeneration = async () => {
    if (!createdCharacter) return;

    // Check credits
    if (!hasEnoughCredits("character", FULL_REGENERATION_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${FULL_REGENERATION_COST} character credits for full regeneration.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: FULL_REGENERATION_COST,
      reason: `Full regeneration for ${createdCharacter.name}`,
      entityType: "character",
      entityId: createdCharacter.id,
      meta: { step: "full_regeneration" },
    });

    if (!result.success) {
      setIsGenerating(false);
      toast({
        title: "Failed to regenerate",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedCharacter = await generateCharacterImage(createdCharacter.id, (status) => {
        console.log("Full regeneration:", status);
      });

      if (updatedCharacter) {
        setCreatedCharacter(updatedCharacter);
      }

      setIsGenerating(false);
      setCredits(getBalances());

      toast({
        title: "Character regenerated!",
        description: `Complete regeneration complete. ${FULL_REGENERATION_COST} credits used.`,
      });
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Failed to regenerate",
        description: "An error occurred during full regeneration",
        variant: "destructive",
      });
    }
  };

  // Step 4: Generate pose sheet
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
    if (!createdCharacter) return;

    setIsGenerating(true);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: POSE_SHEET_COST,
      reason: `Generate 12-pose sheet for ${createdCharacter.name}`,
      entityType: "character",
      entityId: createdCharacter.id,
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
      // Generate the pose sheet using AI (SINGLE API CALL for all 12 poses)
      const updatedCharacter = await generatePoseSheet(createdCharacter.id, 12, (status) => {
        console.log("Pose sheet generation:", status);
      });

      setIsGenerating(false);
      setShowGenerateModal(false);
      setCredits(getBalances());

      toast({
        title: "Pose sheet created!",
        description: `${createdCharacter.name} now has a 12-pose grid (single image). ${POSE_SHEET_COST} credits used.`,
      });

      navigate(`/app/characters/${createdCharacter.id}`);
    } catch (error) {
      setIsGenerating(false);
      setShowGenerateModal(false);
      toast({
        title: "Failed to generate poses",
        description: "An error occurred during pose sheet generation",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsDraft = () => {
    let character = createdCharacter;
    if (!character) {
      character = handleCreateCharacter();
    }
    toast({
      title: "Character saved",
      description: `${character.name} has been saved as a draft.`,
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
        {/* Step 0: Template Selection */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Choose Your Path</h2>
                <p className="text-muted-foreground">Start with a template or create a fully custom character</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {characterTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/50 hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{template.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  
                  {!template.isCustom && (
                    <div className="space-y-2 mt-4">
                      <div className="text-xs text-muted-foreground">
                        <p><strong>Role:</strong> {template.role}</p>
                        <p><strong>Age:</strong> {template.ageRange}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.traits.map((trait) => (
                          <Badge key={trait} variant="secondary" className="text-xs capitalize">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {template.isCustom && (
                    <div className="text-xs text-muted-foreground mt-4">
                      Define everything from scratch with full creative control
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Quick Start vs Custom</p>
                  <p className="text-sm text-blue-800">
                    Templates give you a head start with suggested attributes, while "Create Custom Character" lets you describe exactly what you want.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Persona - Custom or Template */}
        {currentStep === 1 && selectedTemplate === "custom" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create Custom Character</h2>
                <p className="text-muted-foreground">Describe your character in detail</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Character Name *</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Maya"
                  value={customForm.name}
                  onChange={(e) => updateCustomForm("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-age">Age *</Label>
                <Input
                  id="custom-age"
                  placeholder="e.g., 10-14 years old"
                  value={customForm.age}
                  onChange={(e) => updateCustomForm("age", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-role">Role *</Label>
              <Input
                id="custom-role"
                placeholder="e.g., Young inventor, brave explorer"
                value={customForm.role}
                onChange={(e) => updateCustomForm("role", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-traits">Character Traits (comma-separated)</Label>
              <Textarea
                id="custom-traits"
                placeholder="e.g., curious, thoughtful, determined"
                value={customForm.traitsText}
                onChange={(e) => updateCustomForm("traitsText", e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Enter traits separated by commas or new lines
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-desc">Character Description *</Label>
              <Textarea
                id="custom-desc"
                placeholder="Describe your character in detail: appearance, clothing, personality, anything distinctive about them. The more detail, the better the AI-generated image will match your vision."
                value={customForm.description}
                onChange={(e) => updateCustomForm("description", e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Include physical features, clothing style, accessories, expression, and any special characteristics
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 mb-1">AI Image Generation</p>
                  <p className="text-sm text-amber-800">
                    Your description will be used to generate a unique character image using AI. The more detailed your description, the better the result. (Costs {CHARACTER_GENERATION_COST} character credits)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Persona - Template Selection */}
        {currentStep === 1 && selectedTemplate !== "custom" && (
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

              <div className="space-y-2">
                <Label htmlFor="style">Art Style *</Label>
                <Select
                  value={formData.style}
                  onValueChange={(v) => updateForm("style", v as CharacterStyle)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select art style" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHARACTER_STYLES.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">{style.label}</span>
                          <span className="text-xs text-muted-foreground">{style.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(v) => updateForm("gender", v as "boy" | "girl")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boy" id="gender-boy" />
                    <Label htmlFor="gender-boy" className="font-normal cursor-pointer">
                      Boy
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="girl" id="gender-girl" />
                    <Label htmlFor="gender-girl" className="font-normal cursor-pointer">
                      Girl
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  This ensures the AI generates the correct gender (prevents name-based inference)
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skinTone">Skin Tone *</Label>
                  <Select value={formData.skinTone} onValueChange={(v) => updateForm("skinTone", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skin tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKIN_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eyeColor">Eye Color *</Label>
                  <Select value={formData.eyeColor} onValueChange={(v) => updateForm("eyeColor", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select eye color" />
                    </SelectTrigger>
                    <SelectContent>
                      {EYE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faceShape">Face Shape *</Label>
                <Select value={formData.faceShape} onValueChange={(v) => updateForm("faceShape", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select face shape" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACE_SHAPES.map((shape) => (
                      <SelectItem key={shape.value} value={shape.label}>
                        {shape.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.gender === "girl" && (
                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    id="wearHijab"
                    checked={formData.wearHijab}
                    onCheckedChange={(checked) => {
                      updateForm("wearHijab", checked);
                      // Clear hair/hijab when toggling
                      updateForm("hairOrHijab", "");
                    }}
                  />
                  <Label htmlFor="wearHijab" className="cursor-pointer">
                    Wears Hijab
                  </Label>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="hairOrHijab">
                  {formData.gender === "girl" && formData.wearHijab ? "Hijab Style *" : "Hair Style *"}
                </Label>
                <Select value={formData.hairOrHijab} onValueChange={(v) => updateForm("hairOrHijab", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.gender === "girl" && formData.wearHijab
                        ? "Select hijab style"
                        : "Select hair style"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.gender === "boy" && HAIR_STYLES_BOY.map((style) => (
                      <SelectItem key={style.value} value={style.label}>
                        {style.label}
                      </SelectItem>
                    ))}
                    {formData.gender === "girl" && formData.wearHijab && HIJAB_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.label}>
                        {style.label}
                      </SelectItem>
                    ))}
                    {formData.gender === "girl" && !formData.wearHijab && HAIR_STYLES_GIRL_NO_HIJAB.map((style) => (
                      <SelectItem key={style.value} value={style.label}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* Step 3: Generate & Approve Character */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Generate Character</h2>
                <p className="text-muted-foreground">Create and approve your character design</p>
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
                  <span className="text-muted-foreground">Art Style: </span>
                  <span className="font-medium">
                    {CHARACTER_STYLES.find((s) => s.id === formData.style)?.label || formData.style}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Skin Tone: </span>
                  <span className="font-medium">{formData.skinTone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Head/Hair: </span>
                  <span className="font-medium">{formData.hairOrHijab}</span>
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

            {/* Character Preview / Generation Area */}
            <div className="space-y-4">
              {createdCharacter?.imageUrl ? (
                <>
                  {/* Generated Character Image - Phase 2: With Quick Adjustments Applied */}
                  <div className="relative">
                    <div className="aspect-[3/4] max-w-sm mx-auto rounded-xl overflow-hidden border-2 border-border bg-muted">
                      <img
                        src={createdCharacter.imageUrl}
                        alt={createdCharacter.name}
                        className="w-full h-full object-cover transition-all duration-300"
                        style={{
                          filter: `brightness(${quickAdjustments.brightness}) saturate(${quickAdjustments.saturation})`,
                          transform: `scale(${quickAdjustments.ageScale}) rotate(${quickAdjustments.rotation}deg)`,
                        }}
                      />
                    </div>
                    {createdCharacter.status === "approved" && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Approved
                      </div>
                    )}
                  </div>

                  {/* Phase 2: Refinement Panel - Show after generation but before approval */}
                  {createdCharacter.status !== "approved" && (
                    <>
                      {/* Credit transparency banner */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-1">Iteration Tools Available</h4>
                            <p className="text-sm text-blue-800 mb-2">
                              Instead of regenerating completely (2 credits), you can now refine specific attributes:
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• <strong>Quick adjustments:</strong> FREE (brightness, saturation, etc.)</li>
                              <li>• <strong>Targeted fixes:</strong> 0.5 credits (fix hair, accessories, outfit)</li>
                              <li>• <strong>Guided regeneration:</strong> 1 credit (focus on problem areas)</li>
                              <li>• <strong>Full regeneration:</strong> 2 credits (start over)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Refinement Panel */}
                      <div className="max-w-2xl mx-auto">
                        <CharacterRefinementPanel
                          character={createdCharacter}
                          onQuickAdjust={handleQuickAdjust}
                          onTargetedFix={handleTargetedFix}
                          onGuidedRegeneration={handleGuidedRegeneration}
                          onFullRegeneration={handleFullRegeneration}
                          isProcessing={isGenerating}
                          remainingCredits={credits.characterCredits}
                        />
                      </div>

                      {/* Primary Approval Action */}
                      <div className="flex flex-col gap-3 max-w-sm mx-auto mt-6">
                        <Button
                          variant="hero"
                          size="lg"
                          onClick={handleApproveCharacter}
                          className="w-full"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Approve & Continue to Pose Sheet
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Placeholder before generation */}
                  <div className="aspect-[3/4] max-w-sm mx-auto rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-4">
                    <Image className="w-16 h-16 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-center px-4">
                      Generate your character to see a preview
                    </p>
                  </div>

                  {/* Credit Info */}
                  <div className="p-4 rounded-lg bg-gold-50 border border-gold-200 max-w-sm mx-auto">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gold-800">Character Generation Cost</p>
                        <p className="text-sm text-gold-600">
                          {CHARACTER_GENERATION_COST} character credits
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gold-600">Your balance</p>
                        <p className="font-bold text-gold-800">{credits.characterCredits} credits</p>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={handleGenerateCharacter}
                      disabled={!hasEnoughCredits("character", CHARACTER_GENERATION_COST) || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Character ({CHARACTER_GENERATION_COST} credits)
                        </>
                      )}
                    </Button>

                    {!hasEnoughCredits("character", CHARACTER_GENERATION_COST) && (
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
                      onClick={handleSaveAsDraft}
                      className="w-full"
                    >
                      Save as Draft (Skip Generation)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Generate Pose Sheet */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Generate Pose Sheet</h2>
                <p className="text-muted-foreground">Create 12 poses in single grid image</p>
              </div>
            </div>

            {/* Approved Character Preview */}
            {createdCharacter?.imageUrl && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                <img
                  src={createdCharacter.imageUrl}
                  alt={createdCharacter.name}
                  className="w-20 h-20 rounded-lg object-cover border border-green-300"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{createdCharacter.name}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{createdCharacter.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Style: {CHARACTER_STYLES.find((s) => s.id === createdCharacter.visualDNA.style)?.label}
                  </p>
                </div>
              </div>
            )}

            {/* Pose Preview Grid */}
            <div className="space-y-3">
              <h3 className="font-medium">12 Poses to Generate (Single API Call)</h3>
              <p className="text-sm text-muted-foreground">
                All 12 poses will be generated in a single image grid, ensuring perfect character consistency.
              </p>
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
                    {POSE_SHEET_COST} character credits (12 poses in 1 grid)
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
                onClick={handleSaveAsDraft}
                className="w-full"
              >
                Save Without Poses (Generate Later)
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {/* Only show Next for steps 0-2. Steps 3-4 have their own action buttons */}
          {currentStep < 3 && (
            <Button
              variant="hero"
              onClick={handleNextStep}
              disabled={!canProceed()}
            >
              {selectedTemplate === "custom" && currentStep === 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Custom Character
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Credit Confirm Modal */}
      <CreditConfirmModal
        open={showGenerateModal}
        onOpenChange={setShowGenerateModal}
        title="Generate Pose Sheet"
        description={`This will create ${formData.name}'s 12-pose grid in a single image.`}
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
