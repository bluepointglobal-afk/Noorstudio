/**
 * Image Grid Stitching Utility
 * Creates a composite grid image from multiple individual images
 */

export interface GridConfig {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  gap?: number;
  backgroundColor?: string;
}

export interface GridResult {
  dataUrl: string;
  width: number;
  height: number;
  blob?: Blob;
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS for external images
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Create a grid image from an array of image URLs
 *
 * @param imageUrls - Array of image URLs (up to columns × rows)
 * @param config - Grid configuration
 * @returns Promise resolving to grid result with data URL
 */
export async function createImageGrid(
  imageUrls: string[],
  config: GridConfig
): Promise<GridResult> {
  const {
    columns,
    rows,
    cellWidth,
    cellHeight,
    gap = 4,
    backgroundColor = "#ffffff"
  } = config;

  // Calculate total canvas size
  const totalWidth = columns * cellWidth + (columns - 1) * gap;
  const totalHeight = rows * cellHeight + (rows - 1) * gap;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Load all images in parallel
  const loadPromises = imageUrls.map(url =>
    loadImage(url).catch(() => null) // Return null for failed loads
  );
  const images = await Promise.all(loadPromises);

  // Draw each image in grid position
  for (let i = 0; i < Math.min(images.length, columns * rows); i++) {
    const img = images[i];
    if (!img) continue; // Skip failed images

    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * (cellWidth + gap);
    const y = row * (cellHeight + gap);

    // Draw image scaled to fit cell
    ctx.drawImage(img, x, y, cellWidth, cellHeight);
  }

  // Convert to data URL
  const dataUrl = canvas.toDataURL("image/png");

  // Also create blob for potential upload
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || undefined),
      "image/png"
    );
  });

  return {
    dataUrl,
    width: totalWidth,
    height: totalHeight,
    blob
  };
}

/**
 * Create a 4x3 pose reference sheet grid (12 poses)
 * Standard size: Each cell is 256x341 (768/3 x 1024/3 roughly)
 * Total: 1024 x 1024 (square for reference)
 */
export async function createPoseSheetGrid(
  poseImageUrls: string[]
): Promise<GridResult> {
  // Standard pose sheet: 4 columns × 3 rows
  // Cell size designed for clean scaling from 768x1024 source images
  return createImageGrid(poseImageUrls, {
    columns: 4,
    rows: 3,
    cellWidth: 256,   // 1024 / 4
    cellHeight: 341,  // 1024 / 3 (roughly 3:4 aspect ratio)
    gap: 2,
    backgroundColor: "#f8f9fa"
  });
}

/**
 * Create pose sheet with labels
 * Adds pose names under each image
 */
export async function createLabeledPoseSheetGrid(
  poseImageUrls: string[],
  poseNames: string[]
): Promise<GridResult> {
  const columns = 4;
  const rows = 3;
  const cellWidth = 256;
  const cellHeight = 320; // Leave room for label
  const labelHeight = 24;
  const gap = 4;
  const backgroundColor = "#ffffff";

  const totalWidth = columns * cellWidth + (columns - 1) * gap;
  const totalHeight = rows * (cellHeight + labelHeight) + (rows - 1) * gap;

  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  const loadPromises = poseImageUrls.map(url =>
    loadImage(url).catch(() => null)
  );
  const images = await Promise.all(loadPromises);

  // Set up text style
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#374151";

  for (let i = 0; i < Math.min(images.length, columns * rows); i++) {
    const img = images[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * (cellWidth + gap);
    const y = row * (cellHeight + labelHeight + gap);

    // Draw image
    if (img) {
      ctx.drawImage(img, x, y, cellWidth, cellHeight);
    } else {
      // Draw placeholder for missing image
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.fillStyle = "#374151";
    }

    // Draw label
    const label = poseNames[i] || `Pose ${i + 1}`;
    ctx.fillText(label, x + cellWidth / 2, y + cellHeight + 16);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((b) => resolve(b || undefined), "image/png");
  });

  return {
    dataUrl,
    width: totalWidth,
    height: totalHeight,
    blob
  };
}
