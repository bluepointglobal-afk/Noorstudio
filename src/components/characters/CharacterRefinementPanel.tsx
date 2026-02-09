// Character Refinement Panel - Phase 2 Iteration Tools
// Provides UI for refining generated characters without full regeneration

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  Palette,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoredCharacter } from "@/lib/storage/charactersStore";

// ============================================
// Types
// ============================================

export interface QuickAdjustments {
  brightness: number;    // 0.8 - 1.2
  saturation: number;    // 0.8 - 1.2
  ageScale: number;      // 0.95 - 1.05
  rotation: number;      // -5 to +5 degrees
}

export interface TargetedFixOption {
  id: string;
  label: string;
  description: string;
  cost: number;
}

export interface RefinementPanelProps {
  character: StoredCharacter;
  onQuickAdjust: (adjustments: QuickAdjustments) => void;
  onTargetedFix: (fixType: string) => Promise<void>;
  onGuidedRegeneration: (problemAreas: string[]) => Promise<void>;
  onFullRegeneration: () => Promise<void>;
  isProcessing?: boolean;
  remainingCredits: number;
}

// ============================================
// Targeted Fix Options
// ============================================

const TARGETED_FIX_OPTIONS: TargetedFixOption[] = [
  {
    id: 'hair',
    label: 'Fix Hair/Hijab',
    description: 'Regenerate only the hair region with boosted hair spec',
    cost: 0.5,
  },
  {
    id: 'accessories',
    label: 'Fix Accessories',
    description: 'Add/correct accessories with emphasis',
    cost: 0.5,
  },
  {
    id: 'outfit',
    label: 'Fix Outfit',
    description: 'Regenerate clothing with boosted outfit spec',
    cost: 0.5,
  },
  {
    id: 'age',
    label: 'Fix Age Appearance',
    description: 'Adjust facial features to match age specification',
    cost: 0.5,
  },
];

// ============================================
// Problem Areas for Guided Regeneration
// ============================================

const PROBLEM_AREAS = [
  { id: 'hair', label: 'Hair/Hijab didn\'t match' },
  { id: 'accessories', label: 'Accessories missing or wrong' },
  { id: 'outfit', label: 'Outfit incorrect' },
  { id: 'age', label: 'Age appearance off' },
  { id: 'skinTone', label: 'Skin tone wrong' },
  { id: 'style', label: 'Overall style wrong' },
];

// ============================================
// Component
// ============================================

export function CharacterRefinementPanel({
  character,
  onQuickAdjust,
  onTargetedFix,
  onGuidedRegeneration,
  onFullRegeneration,
  isProcessing = false,
  remainingCredits,
}: RefinementPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("quick");
  const [quickAdjustments, setQuickAdjustments] = useState<QuickAdjustments>({
    brightness: 1.0,
    saturation: 1.0,
    ageScale: 1.0,
    rotation: 0,
  });
  const [selectedProblemAreas, setSelectedProblemAreas] = useState<string[]>([]);
  const [hasAppliedAdjustments, setHasAppliedAdjustments] = useState(false);

  const handleSliderChange = (field: keyof QuickAdjustments, value: number[]) => {
    const newAdjustments = { ...quickAdjustments, [field]: value[0] };
    setQuickAdjustments(newAdjustments);
    setHasAppliedAdjustments(false);
  };

  const handleApplyAdjustments = () => {
    onQuickAdjust(quickAdjustments);
    setHasAppliedAdjustments(true);
  };

  const handleResetAdjustments = () => {
    const defaultAdjustments = {
      brightness: 1.0,
      saturation: 1.0,
      ageScale: 1.0,
      rotation: 0,
    };
    setQuickAdjustments(defaultAdjustments);
    onQuickAdjust(defaultAdjustments);
    setHasAppliedAdjustments(false);
  };

  const toggleProblemArea = (areaId: string) => {
    setSelectedProblemAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const hasAdjustmentChanges = 
    quickAdjustments.brightness !== 1.0 ||
    quickAdjustments.saturation !== 1.0 ||
    quickAdjustments.ageScale !== 1.0 ||
    quickAdjustments.rotation !== 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Refine Character
            </CardTitle>
            <CardDescription>
              Adjust or regenerate specific attributes without starting over
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              {remainingCredits} credits
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick" className="gap-2">
              <Sliders className="w-4 h-4" />
              Quick (Free)
            </TabsTrigger>
            <TabsTrigger value="targeted" className="gap-2">
              <Palette className="w-4 h-4" />
              Targeted (0.5)
            </TabsTrigger>
            <TabsTrigger value="guided" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Guided (1)
            </TabsTrigger>
          </TabsList>

          {/* Quick Adjustments Tab */}
          <TabsContent value="quick" className="space-y-6">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  <strong>Free adjustments</strong> - Minor tweaks using CSS filters. No credits used.
                </p>
              </div>

              {/* Brightness Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brightness">Brightness</Label>
                  <span className="text-sm text-muted-foreground">
                    {(quickAdjustments.brightness * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  id="brightness"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={[quickAdjustments.brightness]}
                  onValueChange={(value) => handleSliderChange('brightness', value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Lighten or darken the overall image
                </p>
              </div>

              {/* Saturation Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="saturation">Saturation</Label>
                  <span className="text-sm text-muted-foreground">
                    {(quickAdjustments.saturation * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  id="saturation"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={[quickAdjustments.saturation]}
                  onValueChange={(value) => handleSliderChange('saturation', value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Make colors more or less vibrant
                </p>
              </div>

              {/* Age Scale Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ageScale">Age Appearance</Label>
                  <span className="text-sm text-muted-foreground">
                    {(quickAdjustments.ageScale * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  id="ageScale"
                  min={0.95}
                  max={1.05}
                  step={0.01}
                  value={[quickAdjustments.ageScale]}
                  onValueChange={(value) => handleSliderChange('ageScale', value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Slightly adjust perceived age (visual scaling)
                </p>
              </div>

              {/* Rotation Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rotation">Rotation</Label>
                  <span className="text-sm text-muted-foreground">
                    {quickAdjustments.rotation.toFixed(0)}°
                  </span>
                </div>
                <Slider
                  id="rotation"
                  min={-5}
                  max={5}
                  step={1}
                  value={[quickAdjustments.rotation]}
                  onValueChange={(value) => handleSliderChange('rotation', value)}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Slight angle adjustment
                </p>
              </div>

              {/* Apply/Reset Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleApplyAdjustments}
                  disabled={isProcessing || !hasAdjustmentChanges || hasAppliedAdjustments}
                  className="flex-1"
                >
                  {hasAppliedAdjustments ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Applied
                    </>
                  ) : (
                    'Apply Changes'
                  )}
                </Button>
                <Button
                  onClick={handleResetAdjustments}
                  variant="outline"
                  disabled={isProcessing || !hasAdjustmentChanges}
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Targeted Fixes Tab */}
          <TabsContent value="targeted" className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-900">
                <strong>Targeted regeneration</strong> - Fixes specific attributes using inpainting. 0.5 credits each.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {TARGETED_FIX_OPTIONS.map((option) => (
                <Card key={option.id} className="cursor-pointer hover:border-purple-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{option.label}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {option.cost} credits
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onTargetedFix(option.id)}
                        disabled={isProcessing || remainingCredits < option.cost}
                      >
                        Fix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {remainingCredits < 0.5 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-900">
                  Insufficient credits for targeted fixes. Please add more credits.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Guided Regeneration Tab */}
          <TabsContent value="guided" className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-900">
                <strong>Guided regeneration</strong> - Full regeneration with boosted attention to problem areas. 1 credit.
              </p>
            </div>

            <div>
              <Label className="mb-3 block">What needs fixing? (Check all that apply)</Label>
              <div className="space-y-2">
                {PROBLEM_AREAS.map((area) => (
                  <div
                    key={area.id}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedProblemAreas.includes(area.id)
                        ? "bg-purple-50 border-purple-300"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleProblemArea(area.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProblemAreas.includes(area.id)}
                      onChange={() => toggleProblemArea(area.id)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm font-medium">{area.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedProblemAreas.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Priority boost:</strong> {selectedProblemAreas.map(id => 
                    PROBLEM_AREAS.find(a => a.id === id)?.label
                  ).join(', ')}
                </p>
                <p className="text-xs text-blue-700">
                  These specifications will be emphasized 2x in the regeneration prompt.
                </p>
              </div>
            )}

            <Button
              onClick={() => onGuidedRegeneration(selectedProblemAreas)}
              disabled={isProcessing || selectedProblemAreas.length === 0 || remainingCredits < 1}
              className="w-full"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isProcessing && "animate-spin")} />
              Regenerate with Guidance (1 credit)
            </Button>

            {remainingCredits < 1 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-900">
                  Insufficient credits. Please add more credits.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Full Regeneration Option (always visible) */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-sm">Complete Regeneration</h4>
              <p className="text-xs text-muted-foreground">Start over from scratch</p>
            </div>
            <Badge variant="outline">2 credits</Badge>
          </div>
          <Button
            onClick={onFullRegeneration}
            variant="outline"
            disabled={isProcessing || remainingCredits < 2}
            className="w-full"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isProcessing && "animate-spin")} />
            Full Regeneration (2 credits)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
