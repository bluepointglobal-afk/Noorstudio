import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoCharacters, defaultPoses, Pose } from "@/lib/demo-data";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Lock, RefreshCw, Check, History, Palette, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreditConfirmModal } from "@/components/shared/CreditConfirmModal";
import { useCredits } from "@/hooks/use-credits";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  draft: "bg-gold-100 text-gold-600",
  approved: "bg-teal-100 text-teal-600",
  locked: "bg-muted text-muted-foreground",
};

export default function CharacterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { consumeCharacterCredits, hasCharacterCredits } = useCredits();
  
  const character = demoCharacters.find((c) => c.id === id);
  const [poses, setPoses] = useState<Pose[]>(defaultPoses);
  const [showRegenerateAll, setShowRegenerateAll] = useState(false);
  const [showRegenerateSingle, setShowRegenerateSingle] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const approvedCount = poses.filter((p) => p.status === "approved" || p.status === "locked").length;
  const canLock = approvedCount >= 10;

  const handleApprovePose = (poseId: number) => {
    setPoses((prev) =>
      prev.map((p) => (p.id === poseId ? { ...p, status: "approved" } : p))
    );
    toast({ title: "Pose approved", description: `Pose ${poseId} has been approved.` });
  };

  const handleRegeneratePose = (poseId: number) => {
    setIsGenerating(true);
    setTimeout(() => {
      setPoses((prev) =>
        prev.map((p) => (p.id === poseId ? { ...p, status: "draft" } : p))
      );
      setIsGenerating(false);
      setShowRegenerateSingle(null);
      toast({ title: "Pose regenerated", description: `Pose ${poseId} has been regenerated.` });
    }, 1500);
  };

  const handleRegenerateAll = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setPoses(defaultPoses.map((p) => ({ ...p, status: "draft" })));
      setIsGenerating(false);
      setShowRegenerateAll(false);
      toast({ title: "All poses regenerated", description: "The entire pose sheet has been regenerated." });
    }, 2500);
  };

  const handleLockCharacter = () => {
    setPoses((prev) => prev.map((p) => ({ ...p, status: "locked" })));
    toast({ title: "Character locked", description: `${character.name} is now locked for production use.` });
  };

  const versionHistory = [
    { version: character.version, date: character.createdAt, changes: "Current version" },
    { version: character.version - 1, date: "2024-01-10", changes: "Updated color palette" },
    { version: 1, date: "2024-01-05", changes: "Initial creation" },
  ].filter((v) => v.version > 0);

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
          {canLock && character.status !== "locked" && (
            <Button variant="hero" onClick={handleLockCharacter}>
              <Lock className="w-4 h-4 mr-2" />
              Lock Character
            </Button>
          )}
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Character Preview */}
        <div className="lg:col-span-1">
          <div className="card-glow p-6 sticky top-6">
            <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-subtle">
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[character.status]}>{character.status}</Badge>
                <span className="text-sm text-muted-foreground">v{character.version}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {character.traits.map((trait) => (
                  <Badge key={trait} variant="outline" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Age Range</p>
                <p className="font-medium">{character.ageRange}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Knowledge Level</p>
                <p className="font-medium capitalize">{character.knowledgeLevel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="poses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="poses">Pose Sheet</TabsTrigger>
              <TabsTrigger value="persona">Persona</TabsTrigger>
              <TabsTrigger value="visual">Visual DNA</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Pose Sheet Tab */}
            <TabsContent value="poses" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">12-Pose Grid</h3>
                  <p className="text-sm text-muted-foreground">
                    {approvedCount}/12 poses approved • Need 10+ to lock
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateAll(true)}
                  disabled={character.status === "locked"}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate All
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {poses.map((pose) => (
                  <div
                    key={pose.id}
                    className={cn(
                      "card-glow p-3 space-y-2",
                      pose.status === "locked" && "opacity-75"
                    )}
                  >
                    <div className="aspect-square bg-gradient-subtle rounded-lg flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate">{pose.name}</p>
                      <Badge className={cn("text-xs mt-1", statusColors[pose.status])}>
                        {pose.status}
                      </Badge>
                    </div>
                    {character.status !== "locked" && (
                      <div className="flex gap-1">
                        {pose.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1 h-7 text-xs"
                            onClick={() => handleApprovePose(pose.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-7 text-xs"
                          onClick={() => setShowRegenerateSingle(pose.id)}
                          disabled={pose.status === "locked"}
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Persona Tab */}
            <TabsContent value="persona" className="space-y-6">
              <div className="card-glow p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Character Persona</h3>
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
                    <p className="text-sm text-muted-foreground mb-1">Speech Style</p>
                    <p className="font-medium">{character.speechStyle}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {character.traits.map((trait) => (
                      <Badge key={trait} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Visual DNA Tab */}
            <TabsContent value="visual" className="space-y-6">
              <div className="card-glow p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Visual DNA</h3>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Appearance</p>
                  <p className="font-medium">{character.appearance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Modesty Rules</p>
                  <p className="font-medium">{character.modestyRules}</p>
                </div>
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
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <div className="card-glow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Version History</h3>
                </div>
                <div className="space-y-4">
                  {versionHistory.map((v, idx) => (
                    <div
                      key={v.version}
                      className={cn(
                        "flex items-start gap-4 p-3 rounded-lg",
                        idx === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        v{v.version}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{v.changes}</p>
                        <p className="text-sm text-muted-foreground">{v.date}</p>
                      </div>
                      {idx === 0 && (
                        <Badge className="bg-primary text-primary-foreground">Current</Badge>
                      )}
                    </div>
                  ))}
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
        description="This will regenerate all 12 poses and consume 5 character credits. Any approved poses will need to be re-approved."
        creditCost={5}
        creditType="character"
        onConfirm={handleRegenerateAll}
        isLoading={isGenerating}
      />

      <CreditConfirmModal
        open={showRegenerateSingle !== null}
        onOpenChange={(open) => !open && setShowRegenerateSingle(null)}
        title="Regenerate Pose"
        description="This will regenerate this pose and consume 1 character credit."
        creditCost={1}
        creditType="character"
        onConfirm={() => showRegenerateSingle && handleRegeneratePose(showRegenerateSingle)}
        isLoading={isGenerating}
      />
    </AppLayout>
  );
}
