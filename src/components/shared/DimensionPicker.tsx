// DimensionPicker Component
// Allows users to select image dimensions for illustrations and covers

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Settings2,
} from "lucide-react";

// ============================================
// Types
// ============================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DimensionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  icon: typeof Square;
}

// ============================================
// Presets
// ============================================

export const DIMENSION_PRESETS: DimensionPreset[] = [
  {
    id: "square",
    name: "Square",
    width: 1024,
    height: 1024,
    description: "Perfect for profile images",
    icon: Square,
  },
  {
    id: "landscape",
    name: "Landscape",
    width: 1536,
    height: 1024,
    description: "Ideal for book spreads",
    icon: RectangleHorizontal,
  },
  {
    id: "portrait",
    name: "Portrait",
    width: 1024,
    height: 1536,
    description: "Best for covers",
    icon: RectangleVertical,
  },
];

// ============================================
// Constants
// ============================================

const MIN_DIMENSION = 512;
const MAX_DIMENSION = 2048;
const DIMENSION_STEP = 64;

// ============================================
// Component
// ============================================

interface DimensionPickerProps {
  value: ImageDimensions;
  onChange: (dimensions: ImageDimensions) => void;
  showCustom?: boolean;
  className?: string;
}

export function DimensionPicker({
  value,
  onChange,
  showCustom = true,
  className,
}: DimensionPickerProps) {
  const [isCustom, setIsCustom] = useState(() => {
    // Check if current value matches any preset
    return !DIMENSION_PRESETS.some(
      (p) => p.width === value.width && p.height === value.height
    );
  });

  const [customWidth, setCustomWidth] = useState(value.width);
  const [customHeight, setCustomHeight] = useState(value.height);

  const handlePresetChange = (presetId: string) => {
    if (presetId === "custom") {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    const preset = DIMENSION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({ width: preset.width, height: preset.height });
    }
  };

  const handleCustomChange = (dimension: "width" | "height", value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    // Clamp to valid range
    const clampedValue = Math.min(
      MAX_DIMENSION,
      Math.max(MIN_DIMENSION, numValue)
    );

    // Round to nearest step
    const roundedValue = Math.round(clampedValue / DIMENSION_STEP) * DIMENSION_STEP;

    if (dimension === "width") {
      setCustomWidth(roundedValue);
      onChange({ width: roundedValue, height: customHeight });
    } else {
      setCustomHeight(roundedValue);
      onChange({ width: customWidth, height: roundedValue });
    }
  };

  const currentPresetId = isCustom
    ? "custom"
    : DIMENSION_PRESETS.find(
        (p) => p.width === value.width && p.height === value.height
      )?.id || "custom";

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup
        value={currentPresetId}
        onValueChange={handlePresetChange}
        className="grid grid-cols-3 gap-3"
      >
        {DIMENSION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <div key={preset.id}>
              <RadioGroupItem
                value={preset.id}
                id={`dimension-${preset.id}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`dimension-${preset.id}`}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                  "hover:bg-muted/50 hover:border-primary/50",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <Icon className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="font-medium text-sm">{preset.name}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {preset.width} x {preset.height}
                </span>
              </Label>
            </div>
          );
        })}

        {showCustom && (
          <div>
            <RadioGroupItem
              value="custom"
              id="dimension-custom"
              className="peer sr-only"
            />
            <Label
              htmlFor="dimension-custom"
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                "hover:bg-muted/50 hover:border-primary/50",
                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              )}
            >
              <Settings2 className="w-8 h-8 mb-2 text-muted-foreground" />
              <span className="font-medium text-sm">Custom</span>
              <span className="text-xs text-muted-foreground mt-1">
                Set your own
              </span>
            </Label>
          </div>
        )}
      </RadioGroup>

      {/* Custom dimension inputs */}
      {isCustom && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Min: {MIN_DIMENSION}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Max: {MAX_DIMENSION}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Step: {DIMENSION_STEP}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-width" className="text-sm">
                Width (px)
              </Label>
              <Input
                id="custom-width"
                type="number"
                min={MIN_DIMENSION}
                max={MAX_DIMENSION}
                step={DIMENSION_STEP}
                value={customWidth}
                onChange={(e) => handleCustomChange("width", e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-height" className="text-sm">
                Height (px)
              </Label>
              <Input
                id="custom-height"
                type="number"
                min={MIN_DIMENSION}
                max={MAX_DIMENSION}
                step={DIMENSION_STEP}
                value={customHeight}
                onChange={(e) => handleCustomChange("height", e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Quick presets for custom */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground mr-2">Quick set:</span>
            {[
              { w: 512, h: 512 },
              { w: 768, h: 768 },
              { w: 1024, h: 1024 },
              { w: 1536, h: 1024 },
              { w: 1024, h: 1536 },
              { w: 2048, h: 1536 },
            ].map(({ w, h }) => (
              <Button
                key={`${w}x${h}`}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setCustomWidth(w);
                  setCustomHeight(h);
                  onChange({ width: w, height: h });
                }}
              >
                {w}x{h}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Current selection display */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Selected dimensions:</span>
        <Badge variant="secondary" className="font-mono">
          {value.width} x {value.height}
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// Compact Version for Inline Use
// ============================================

interface DimensionPickerCompactProps {
  value: ImageDimensions;
  onChange: (dimensions: ImageDimensions) => void;
}

export function DimensionPickerCompact({
  value,
  onChange,
}: DimensionPickerCompactProps) {
  return (
    <div className="flex items-center gap-2">
      {DIMENSION_PRESETS.map((preset) => {
        const Icon = preset.icon;
        const isSelected =
          preset.width === value.width && preset.height === value.height;

        return (
          <Button
            key={preset.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => onChange({ width: preset.width, height: preset.height })}
            title={`${preset.name} (${preset.width}x${preset.height})`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{preset.name}</span>
          </Button>
        );
      })}
    </div>
  );
}

// ============================================
// Export Default Dimensions
// ============================================

export const DEFAULT_ILLUSTRATION_DIMENSIONS: ImageDimensions = {
  width: 1536,
  height: 1024,
};

export const DEFAULT_COVER_DIMENSIONS: ImageDimensions = {
  width: 1024,
  height: 1536,
};

export const DEFAULT_CHARACTER_DIMENSIONS: ImageDimensions = {
  width: 1024,
  height: 1024,
};
