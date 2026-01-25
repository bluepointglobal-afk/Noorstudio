/**
 * Cover Text Overlay Utility
 * Overlays title, author, and other text on book cover images
 */

export interface CoverTextConfig {
  title: string;
  authorName?: string;
  subtitle?: string;
  ageRange?: string;

  // Styling options
  titleFont?: string;
  titleColor?: string;
  titleSize?: number;
  authorFont?: string;
  authorColor?: string;
  authorSize?: number;

  // Layout options
  titlePosition?: "top" | "center" | "bottom";
  titlePadding?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
}

export interface BackCoverTextConfig {
  synopsis?: string;
  authorBio?: string;
  credits?: string;

  // Styling
  textFont?: string;
  textColor?: string;
  textSize?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
}

export interface CoverOverlayResult {
  dataUrl: string;
  width: number;
  height: number;
  blob?: Blob;
}

const DEFAULT_FRONT_CONFIG: Partial<CoverTextConfig> = {
  titleFont: "bold 72px Georgia, serif",
  titleColor: "#FFFFFF",
  titleSize: 72,
  authorFont: "32px Georgia, serif",
  authorColor: "#FFFFFF",
  authorSize: 32,
  titlePosition: "top",
  titlePadding: 80,
  shadowEnabled: true,
  shadowColor: "rgba(0, 0, 0, 0.7)",
};

const DEFAULT_BACK_CONFIG: Partial<BackCoverTextConfig> = {
  textFont: "24px Georgia, serif",
  textColor: "#333333",
  textSize: 24,
  backgroundColor: "#FFFFFF",
  backgroundOpacity: 0.85,
};

/**
 * Load an image from URL and return as HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Draw text with optional shadow for better visibility
 */
function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  shadowEnabled: boolean,
  shadowColor: string
): void {
  if (shadowEnabled) {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillText(text, x, y);

  if (shadowEnabled) {
    ctx.restore();
  }
}

/**
 * Create front cover with text overlay
 *
 * @param imageUrl - Base cover image URL
 * @param config - Text configuration
 * @returns Promise resolving to overlay result
 */
export async function createFrontCoverWithText(
  imageUrl: string,
  config: CoverTextConfig
): Promise<CoverOverlayResult> {
  const mergedConfig = { ...DEFAULT_FRONT_CONFIG, ...config };
  const {
    title,
    authorName,
    subtitle,
    ageRange,
    titleFont,
    titleColor,
    titleSize,
    authorFont,
    authorColor,
    authorSize,
    titlePosition,
    titlePadding,
    shadowEnabled,
    shadowColor,
  } = mergedConfig;

  // Load the base image
  const img = await loadImage(imageUrl);
  const { width, height } = img;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  // Draw base image
  ctx.drawImage(img, 0, 0, width, height);

  // Configure text rendering
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Calculate content area (with padding)
  const contentWidth = width - (titlePadding! * 2);
  const contentX = width / 2;

  // Draw title
  ctx.font = titleFont!;
  ctx.fillStyle = titleColor!;

  const titleLines = wrapText(ctx, title, contentWidth);
  const lineHeight = titleSize! * 1.3;

  let titleY: number;
  switch (titlePosition) {
    case "center":
      titleY = (height - titleLines.length * lineHeight) / 2 - 50;
      break;
    case "bottom":
      titleY = height - titlePadding! - (titleLines.length * lineHeight) - 100;
      break;
    case "top":
    default:
      titleY = titlePadding!;
  }

  for (let i = 0; i < titleLines.length; i++) {
    drawTextWithShadow(
      ctx,
      titleLines[i],
      contentX,
      titleY + i * lineHeight,
      shadowEnabled!,
      shadowColor!
    );
  }

  // Draw subtitle if present
  let currentY = titleY + titleLines.length * lineHeight + 20;
  if (subtitle) {
    ctx.font = `italic ${authorSize}px Georgia, serif`;
    ctx.fillStyle = titleColor!;
    const subtitleLines = wrapText(ctx, subtitle, contentWidth);
    for (const line of subtitleLines) {
      drawTextWithShadow(ctx, line, contentX, currentY, shadowEnabled!, shadowColor!);
      currentY += authorSize! * 1.3;
    }
    currentY += 10;
  }

  // Draw author name at bottom
  if (authorName) {
    ctx.font = authorFont!;
    ctx.fillStyle = authorColor!;
    ctx.textBaseline = "bottom";

    const authorY = height - titlePadding! - 20;
    drawTextWithShadow(
      ctx,
      `by ${authorName}`,
      contentX,
      authorY,
      shadowEnabled!,
      shadowColor!
    );
  }

  // Draw age range badge if present
  if (ageRange) {
    const badgeText = `Ages ${ageRange}`;
    ctx.font = "bold 18px Arial, sans-serif";
    const badgeWidth = ctx.measureText(badgeText).width + 24;
    const badgeHeight = 32;
    const badgeX = width - badgeWidth - 20;
    const badgeY = 20;

    // Badge background
    ctx.fillStyle = "rgba(255, 215, 0, 0.95)"; // Gold
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
    ctx.fill();

    // Badge text
    ctx.fillStyle = "#333333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  }

  // Convert to data URL
  const dataUrl = canvas.toDataURL("image/png");

  // Create blob
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((b) => resolve(b || undefined), "image/png");
  });

  return {
    dataUrl,
    width,
    height,
    blob,
  };
}

/**
 * Create back cover with text overlay
 *
 * @param imageUrl - Base cover image URL
 * @param config - Text configuration
 * @returns Promise resolving to overlay result
 */
export async function createBackCoverWithText(
  imageUrl: string,
  config: BackCoverTextConfig
): Promise<CoverOverlayResult> {
  const mergedConfig = { ...DEFAULT_BACK_CONFIG, ...config };
  const {
    synopsis,
    authorBio,
    credits,
    textFont,
    textColor,
    textSize,
    backgroundColor,
    backgroundOpacity,
  } = mergedConfig;

  // Load the base image
  const img = await loadImage(imageUrl);
  const { width, height } = img;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  // Draw base image
  ctx.drawImage(img, 0, 0, width, height);

  // If there's text content, draw a semi-transparent text box
  const hasContent = synopsis || authorBio || credits;
  if (hasContent) {
    const boxPadding = 60;
    const boxWidth = width - boxPadding * 2;
    const boxX = boxPadding;
    const boxY = height * 0.25;
    const boxHeight = height * 0.5;

    // Draw text box background
    ctx.fillStyle = backgroundColor!;
    ctx.globalAlpha = backgroundOpacity!;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Configure text
    ctx.font = textFont!;
    ctx.fillStyle = textColor!;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const textContentWidth = boxWidth - 40;
    const textX = width / 2;
    let currentY = boxY + 30;
    const lineHeight = textSize! * 1.5;

    // Draw synopsis
    if (synopsis) {
      ctx.font = `italic ${textSize}px Georgia, serif`;
      const synopsisLines = wrapText(ctx, synopsis, textContentWidth);
      for (const line of synopsisLines) {
        if (currentY + lineHeight > boxY + boxHeight - 30) break;
        ctx.fillText(line, textX, currentY);
        currentY += lineHeight;
      }
      currentY += 20;
    }

    // Draw author bio
    if (authorBio) {
      ctx.font = textFont!;
      const bioLines = wrapText(ctx, authorBio, textContentWidth);
      for (const line of bioLines) {
        if (currentY + lineHeight > boxY + boxHeight - 30) break;
        ctx.fillText(line, textX, currentY);
        currentY += lineHeight;
      }
      currentY += 20;
    }

    // Draw credits at bottom of box
    if (credits) {
      ctx.font = `14px Arial, sans-serif`;
      ctx.fillStyle = "#666666";
      ctx.textBaseline = "bottom";
      const creditsY = boxY + boxHeight - 20;
      ctx.fillText(credits, textX, creditsY);
    }
  }

  // Convert to data URL
  const dataUrl = canvas.toDataURL("image/png");

  // Create blob
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((b) => resolve(b || undefined), "image/png");
  });

  return {
    dataUrl,
    width,
    height,
    blob,
  };
}

/**
 * Convenience function to create both covers with text
 */
export async function createCoversWithText(
  frontImageUrl: string,
  backImageUrl: string,
  frontConfig: CoverTextConfig,
  backConfig?: BackCoverTextConfig
): Promise<{
  front: CoverOverlayResult;
  back: CoverOverlayResult;
}> {
  const [front, back] = await Promise.all([
    createFrontCoverWithText(frontImageUrl, frontConfig),
    createBackCoverWithText(backImageUrl, backConfig || {}),
  ]);

  return { front, back };
}
