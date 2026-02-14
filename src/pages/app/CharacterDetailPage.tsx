import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  Unlock,
  RefreshCw,
  Check,
  History,
  Palette,
  User,
  Sparkles,
  Trash2,
  AlertTriangle,
  Plus,
  ThumbsUp,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useToast } from "@/hooks/use-toast";
import {
  getCharacter,
  StoredCharacter,
  approvePose,
  unappprovePose,
  regeneratePose,
  lockCharacter,
  unlockCharacter,
  createNewVersion,
  generatePoseSheet,
  generateCharacterImage,
  approveCharacterDesign,
  deleteCharacter,
  getApprovedPoseCount,
  canLockCharacter,
  selectPoseAlternative,
} from "@/lib/storage/charactersStore";
import {
  consumeCredits,
  hasEnoughCredits,
  getBalances,
} from "@/lib/storage/creditsStore";
import { AssetStatus } from "@/lib/models";

const statusColors: Record<AssetStatus, string> = {
  draft: "bg-gold-100 text-gold-600",
  approved: "bg-teal-100 text-teal-600",
  locked: "bg-muted text-muted-foreground",
};

const CHARACTER_GENERATION_COST = 2;
const REGENERATE_SINGLE_COST = 1;
const REGENERATE_ALL_COST = 8;
const POSE_SHEET_COST = 8;

export default function CharacterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [character, setCharacter] = useState<StoredCharacter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegenerateAll, setShowRegenerateAll] = useState(false);
  const [showRegenerateSingle, setShowRegenerateSingle] = useState<number | null>(null);
  const [showGeneratePoses, setShowGeneratePoses] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(getBalances());
  const [expandedPoseId, setExpandedPoseId] = useState<number | null>(null); // For viewing alternatives

  // Load character
  useEffect(() => {
    if (id) {
      const char = getCharacter(id);
      setCharacter(char);
    }
    setIsLoading(false);
    setCredits(getBalances());
  }, [id]);

  const refreshCharacter = () => {
    if (id) {
      const char = getCharacter(id);
      setCharacter(char);
      setCredits(getBalances());
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      </AppLayout>
    );
  }

  if (!character) {
    return (
      <AppLayout title="Character Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This character doesn't exist.</p>
          <Button onClick={() => navigate("/app/characters")}>Back to Characters</Button>
        </div>
      </AppLayout>
    );
  }

  const approvedCount = getApprovedPoseCount(character);
  const canLock = canLockCharacter(character);
  const isLocked = character.status === "locked";
  const hasCharacterImage = character.imageUrl && character.imageUrl.length > 0;

  // Handlers
  const handleGenerateCharacter = async () => {
    if (!hasEnoughCredits("character", CHARACTER_GENERATION_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${CHARACTER_GENERATION_COST} character credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

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
      toast({ title: "Failed", description: result.error, variant: "destructive" });
      return;
    }

    try {
      const updated = await generateCharacterImage(character.id);
      if (updated) {
        setCharacter(updated);
        setCredits(getBalances());
        toast({
          title: "Character generated!",
          description: `${character.name} image has been created. Review and approve it.`,
        });
      }
    } catch (error) {
      toast({ title: "Failed", description: "Failed to generate character", variant: "destructive" });
    }
    setIsGenerating(false);
  };

  const handleApproveCharacterDesign = () => {
    const updated = approveCharacterDesign(character.id);
    if (updated) {
      setCharacter(updated);
      toast({
        title: "Character approved!",
        description: `${character.name} is ready for pose sheet generation.`,
      });
    }
  };

  const handleApprovePose = (poseId: number) => {
    const updated = approvePose(character.id, poseId);
    if (updated) {
      setCharacter(updated);
      toast({ title: "Pose approved", description: `Pose has been approved.` });
    }
  };

  const handleUnapprovePose = (poseId: number) => {
    const updated = unappprovePose(character.id, poseId);
    if (updated) {
      setCharacter(updated);
      toast({ title: "Pose unapproved", description: `Pose reverted to draft.` });
    }
  };

  const handleSelectAlternative = (poseId: number, alternativeIndex: number) => {
    const updated = selectPoseAlternative(character.id, poseId, alternativeIndex);
    if (updated) {
      setCharacter(updated);
      toast({ title: "Alternative selected", description: `Pose updated with selected alternative.` });
    }
  };

  const handleRegenerateSingle = async () => {
    if (!showRegenerateSingle) return;

    if (!hasEnoughCredits("character", REGENERATE_SINGLE_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${REGENERATE_SINGLE_COST} character credit.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Consume credits
    const result = consumeCredits({
      type: "character",
      amount: REGENERATE_SINGLE_COST,
      reason: `Regenerate pose for ${character.name}`,
      entityType: "pose",
      entityId: character.id,
      meta: { poseId: showRegenerateSingle },
    });

    if (!result.success) {
      setIsGenerating(false);
      setShowRegenerateSingle(null);
      toast({ title: "Failed", description: result.error, variant: "destructive" });
      return;
    }

    try {
      const updated = await regeneratePose(character.id, showRegenerateSingle);
      if (updated) {
        setCharacter(updated);
        setCredits(getBalances());
        toast({ title: "Pose regenerated", description: `1 credit used.` });
      }
    } catch (error) {
      toast({ title: "Failed", description: "Failed to regenerate pose", variant: "destructive" });
    }
    setIsGenerating(false);
    setShowRegenerateSingle(null);
  };

  const handleRegenerateAll = async () => {
    if (!hasEnoughCredits("character", REGENERATE_ALL_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${REGENERATE_ALL_COST} character credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    const result = consumeCredits({
      type: "character",
      amount: REGENERATE_ALL_COST,
      reason: `Regenerate all poses for ${character.name}`,
      entityType: "character",
      entityId: character.id,
      meta: { action: "regenerate_all" },
    });

    if (!result.success) {
      setIsGenerating(false);
      setShowRegenerateAll(false);
      toast({ title: "Failed", description: result.error, variant: "destructive" });
      return;
    }

    try {
      // Use generatePoseSheet instead of regenerateAllPoses for single API call
      // Default to 12 poses for "Regenerate All" action
      const poseCount = (character as any).poseCount || 12;
      const updated = await generatePoseSheet(character.id, poseCount as 4 | 8 | 12);
      if (updated) {
        setCharacter(updated);
        setCredits(getBalances());
        toast({
          title: "All poses regenerated",
          description: `New version v${updated.version} created. ${REGENERATE_ALL_COST} credits used.`,
        });
      }
    } catch (error) {
      toast({ title: "Failed", description: "Failed to regenerate poses", variant: "destructive" });
    }
    setIsGenerating(false);
    setShowRegenerateAll(false);
  };

  const handleGeneratePoseSheet = async () => {
    if (!hasEnoughCredits("character", POSE_SHEET_COST)) {
      toast({
        title: "Insufficient credits",
        description: `You need ${POSE_SHEET_COST} character credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    const result = consumeCredits({
      type: "character",
      amount: POSE_SHEET_COST,
      reason: `Generate 12-pose sheet for ${character.name}`,
      entityType: "character",
      entityId: character.id,
      meta: { poseCount: 12 },
    });

    if (!result.success) {
      setIsGenerating(false);
      setShowGeneratePoses(false);
      toast({ title: "Failed", description: result.error, variant: "destructive" });
      return;
    }

    try {
      const updated = await generatePoseSheet(character.id, 12);
      if (updated) {
        setCharacter(updated);
        setCredits(getBalances());
        toast({
          title: "Pose sheet generated",
          description: `12 poses created in single grid. ${POSE_SHEET_COST} credits used.`,
        });
      }
    } catch (error) {
      toast({ title: "Failed", description: "Failed to generate pose sheet", variant: "destructive" });
    }
    setIsGenerating(false);
    setShowGeneratePoses(false);
  };

  const handleLockCharacter = () => {
    const updated = lockCharacter(character.id);
    if (updated) {
      setCharacter(updated);
      toast({
        title: "Character locked",
        description: `${character.name} is now locked for production use.`,
      });
    }
  };

  const handleUnlockCharacter = () => {
    const updated = unlockCharacter(character.id);
    if (updated) {
      setCharacter(updated);
      setShowUnlockModal(false);
      toast({
        title: "Character unlocked",
        description: `${character.name} can now be edited.`,
      });
    }
  };

  const handleCreateNewVersion = () => {
    const updated = createNewVersion(character.id);
    if (updated) {
      setCharacter(updated);
      setShowUnlockModal(false);
      toast({
        title: "New version created",
        description: `${character.name} v${updated.version} is ready for editing.`,
      });
    }
  };

  const handleDeleteCharacter = () => {
    const success = deleteCharacter(character.id);
    if (success) {
      toast({
        title: "Character deleted",
        description: `${character.name} has been deleted.`,
      });
      navigate("/app/characters");
    }
  };

  return (
    <AppLayout
      title={character.name}
      subtitle={character.role}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/app/characters")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {canLock && (
            <Button variant="hero" onClick={handleLockCharacter}>
              <Lock className="w-4 h-4 mr-2" />
              Lock Character
            </Button>
          )}
          {isLocked && (
            <Button variant="outline" onClick={() => setShowUnlockModal(true)}>
              <Unlock className="w-4 h-4 mr-2" />
              Unlock / New Version
            </Button>
          )}
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Character Preview */}
        <div className="lg:col-span-1">
          <div className="card-glow p-6 sticky top-6">
            {/* Character Image or Placeholder */}
            <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-subtle relative">
              {hasCharacterImage ? (
                <>
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400/e2e8f0/64748b?text=" + character.name.charAt(0);
                    }}
                  />
                  {character.status === "approved" && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Approved
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                  <Image className="w-16 h-16 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    No image generated yet
                  </p>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleGenerateCharacter}
                    disabled={isGenerating || !hasEnoughCredits("character", CHARACTER_GENERATION_COST)}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate ({CHARACTER_GENERATION_COST} credits)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Approve/Regenerate buttons when image exists but not approved */}
            {hasCharacterImage && character.status === "draft" && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1"
                  onClick={handleApproveCharacterDesign}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCharacter}
                  disabled={isGenerating || !hasEnoughCredits("character", CHARACTER_GENERATION_COST)}
                >
                  <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[character.status]}>{character.status}</Badge>
                <span className="text-sm text-muted-foreground">v{character.version}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {character.traits.map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs capitalize">
                    {trait}
                  </Badge>
                ))}
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Age Range</span>
                  <span className="font-medium">{character.ageRange}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Poses Approved</span>
                  <span className="font-medium">{approvedCount}/12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versions</span>
                  <span className="font-medium">{character.versions.length + 1}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Character
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="poses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="poses">Pose Sheet</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Persona */}
              <div className="card-glow p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Persona</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{character.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Role</p>
                    <p className="font-medium">{character.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Age Range</p>
                    <p className="font-medium">{character.ageRange}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Speaking Style</p>
                    <p className="font-medium">{character.speakingStyle || "Not specified"}</p>
                  </div>
                </div>
                {character.traits.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Traits</p>
                    <div className="flex flex-wrap gap-2">
                      {character.traits.map((trait) => (
                        <Badge key={trait} variant="secondary" className="capitalize">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Visual DNA */}
              <div className="card-glow p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Visual DNA</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Skin Tone</p>
                    <p className="font-medium">{character.visualDNA.skinTone || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hair / Hijab</p>
                    <p className="font-medium">{character.visualDNA.hairOrHijab || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Outfit Rules</p>
                  <p className="font-medium">{character.visualDNA.outfitRules || "Not specified"}</p>
                </div>
                {character.visualDNA.accessories && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Accessories</p>
                    <p className="font-medium">{character.visualDNA.accessories}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Color Palette</p>
                  <div className="flex gap-2">
                    {character.colorPalette.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-lg shadow-inner border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modesty Rules */}
              <div className="card-glow p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Modesty Rules</h3>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                      character.modestyRules.hijabAlways ? "bg-primary text-white" : "bg-muted"
                    )}>
                      {character.modestyRules.hijabAlways && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm">Hijab Always</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                      character.modestyRules.longSleeves ? "bg-primary text-white" : "bg-muted"
                    )}>
                      {character.modestyRules.longSleeves && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm">Long Sleeves</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                      character.modestyRules.looseClothing ? "bg-primary text-white" : "bg-muted"
                    )}>
                      {character.modestyRules.looseClothing && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm">Loose Clothing</span>
                  </div>
                </div>
                {character.modestyRules.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
                    <p className="font-medium">{character.modestyRules.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pose Sheet Tab */}
            <TabsContent value="poses" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">12-Pose Grid</h3>
                  <p className="text-sm text-muted-foreground">
                    {approvedCount}/4 poses approved {approvedCount >= 4 ? "• Ready to lock" : "• Need all 4 to lock"}
                  </p>
                </div>
                {character.poseSheetGenerated ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenerateAll(true)}
                    disabled={isLocked || isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate All ({REGENERATE_ALL_COST} credits)
                  </Button>
                ) : (
                  <Button
                    variant="hero"
                    onClick={() => setShowGeneratePoses(true)}
                    disabled={isGenerating}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Poses ({POSE_SHEET_COST} credits)
                  </Button>
                )}
              </div>

              {!character.poseSheetGenerated ? (
                <div className="text-center py-12 card-glow">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Pose Sheet Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Generate a 12-pose grid (single image) to create consistent character illustrations.
                  </p>
                  <Button variant="hero" onClick={() => setShowGeneratePoses(true)} disabled={isGenerating}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate 12-Pose Sheet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Single Pose Sheet Image */}
                  <div className="card-glow p-4">
                    <div className="relative">
                      {character.poseSheetUrl ? (
                        <img
                          src={character.poseSheetUrl}
                          alt={`${character.name} 12-Pose Sheet`}
                          className="w-full rounded-lg border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-muted-foreground">Pose sheet not generated yet</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pose Sheet Info */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">12-Pose Grid (4×3 Layout)</h4>
                        <Badge variant="outline">Single Image</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        This pose sheet contains all 12 character poses in a single grid image.
                        It is used as a reference for generating consistent illustrations.
                      </p>

                      {/* Pose Names Grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {character.poses.map((pose, idx) => (
                          <div
                            key={pose.id}
                            className={cn(
                              "p-2 rounded text-center border",
                              pose.status === "approved"
                                ? "bg-teal-50 border-teal-200 text-teal-700"
                                : pose.status === "locked"
                                  ? "bg-muted border-border text-muted-foreground"
                                  : "bg-gold-50 border-gold-200 text-gold-700"
                            )}
                          >
                            <span className="font-medium">{idx + 1}.</span> {pose.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegenerateAll(true)}
                      disabled={isLocked || isGenerating}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Pose Sheet
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value="versions" className="space-y-6">
              <div className="card-glow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Version History</h3>
                </div>
                <div className="space-y-4">
                  {/* Current version */}
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      v{character.version}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Current Version</p>
                      <p className="text-sm text-muted-foreground">
                        {approvedCount}/4 poses • {character.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated: {new Date(character.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">Current</Badge>
                  </div>

                  {/* Previous versions */}
                  {character.versions.length > 0 ? (
                    character.versions
                      .slice()
                      .reverse()
                      .map((v) => (
                        <div
                          key={v.version}
                          className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                            v{v.version}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{v.note}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(v.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No previous versions. Lock the character to create a version snapshot.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <CreditConfirmModal
        open={showRegenerateAll}
        onOpenChange={setShowRegenerateAll}
        title="Regenerate All Poses"
        description={`This will regenerate all 12 poses in a single grid and create a new version (v${character.version + 1}). Any approved poses will need to be re-approved.`}
        creditCost={REGENERATE_ALL_COST}
        creditType="character"
        onConfirm={handleRegenerateAll}
        isLoading={isGenerating}
      />

      <CreditConfirmModal
        open={showRegenerateSingle !== null}
        onOpenChange={(open) => !open && setShowRegenerateSingle(null)}
        title="Regenerate Pose"
        description="This will regenerate this pose. The pose will need to be re-approved."
        creditCost={REGENERATE_SINGLE_COST}
        creditType="character"
        onConfirm={handleRegenerateSingle}
        isLoading={isGenerating}
      />

      <CreditConfirmModal
        open={showGeneratePoses}
        onOpenChange={setShowGeneratePoses}
        title="Generate Pose Sheet"
        description={`Generate a 12-pose grid (single image) for ${character.name}.`}
        creditCost={POSE_SHEET_COST}
        creditType="character"
        onConfirm={handleGeneratePoseSheet}
        isLoading={isGenerating}
      />

      {/* Unlock Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gold-500" />
              Unlock or Create New Version?
            </DialogTitle>
            <DialogDescription>
              This character is locked for production. Choose how to proceed:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleUnlockCharacter}>
              <Unlock className="w-4 h-4 mr-2" />
              Unlock Character
              <span className="ml-auto text-xs text-muted-foreground">Edit existing v{character.version}</span>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleCreateNewVersion}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Version
              <span className="ml-auto text-xs text-muted-foreground">Start fresh as v{character.version + 1}</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUnlockModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Character?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {character.name} and all associated poses. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCharacter}>
              Delete Character
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
