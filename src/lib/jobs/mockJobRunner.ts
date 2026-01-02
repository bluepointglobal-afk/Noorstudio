// Mock Job Runner for NoorStudio Pipeline
// Simulates async AI pipeline stages without real AI calls

import { ProjectStage, PIPELINE_STAGES } from "@/lib/models";

// ============================================
// Types
// ============================================

export interface JobProgressEvent {
  stage: ProjectStage;
  progress: number; // 0-100
  status: "pending" | "running" | "completed" | "error";
  message?: string;
}

export interface JobResult<T = unknown> {
  stage: ProjectStage;
  success: boolean;
  data?: T;
  error?: string;
  duration: number; // ms
}

export type ProgressCallback = (event: JobProgressEvent) => void;

// ============================================
// Mock Artifact Generators
// ============================================

const generateMockOutline = () => ({
  chapters: [
    "Chapter 1: The Morning Prayer - Amira learns about Fajr",
    "Chapter 2: Kindness at School - Helping a new friend",
    "Chapter 3: The Ramadan Gift - Sharing with neighbors",
    "Chapter 4: Gratitude Under the Stars - Saying Alhamdulillah",
  ],
  synopsis: "A heartwarming story about a young Muslim girl who discovers the beauty of Islamic values through everyday adventures.",
  generatedAt: new Date().toISOString(),
});

const generateMockChapters = () => [
  {
    chapterNumber: 1,
    title: "The Morning Prayer",
    content: `Amira woke up to the gentle sound of her mother's voice calling her for Fajr prayer. The sky outside was still dark, but a soft pink glow was beginning to appear on the horizon.

"Amira, habibti, it's time for Fajr," her mother whispered softly.

Amira rubbed her eyes and smiled. She loved this quiet time of the morning when the world was still and peaceful. She made wudu carefully, just like Baba had taught her, and joined her family in the living room.

As they prayed together, Amira felt a warm feeling in her heart. This was her favorite time of day.`,
    wordCount: 96,
    generatedAt: new Date().toISOString(),
  },
  {
    chapterNumber: 2,
    title: "Kindness at School",
    content: `At school, Amira noticed a new girl sitting alone during lunch. Her name was Maryam, and she had just moved from another city.

"Assalamu alaikum!" Amira said with a bright smile. "Would you like to sit with us?"

Maryam's eyes lit up. "Wa alaikum assalam! Yes, please!"

That day, Amira learned that a small act of kindness can make someone's whole day better. Her teacher, Ustadha Fatima, always said that the Prophet ﷺ taught us that even a smile is charity.`,
    wordCount: 82,
    generatedAt: new Date().toISOString(),
  },
  {
    chapterNumber: 3,
    title: "The Ramadan Gift",
    content: `Ramadan had arrived, and Amira was excited to help her mother prepare gift baskets for their neighbors.

"Baba, why do we give gifts during Ramadan?" Amira asked as she carefully arranged dates and sweets in a basket.

"In Islam, we believe that giving brings us closer to Allah," her father explained. "When we share with others, our blessings multiply."

Together, they delivered baskets to every neighbor on their street—Muslim and non-Muslim alike. Each smile and "thank you" made Amira's heart grow fuller.`,
    wordCount: 87,
    generatedAt: new Date().toISOString(),
  },
  {
    chapterNumber: 4,
    title: "Gratitude Under the Stars",
    content: `That night, after taraweeh prayers, Amira and her family sat on their balcony looking at the stars.

"SubhanAllah," Amira whispered, amazed at the beautiful night sky. "Allah created all of this!"

"Yes, habibti," her grandmother said, wrapping an arm around her. "And when we say 'Alhamdulillah,' we thank Allah for all His blessings—big and small."

Amira closed her eyes and thought of all the good things in her life: her loving family, her new friend Maryam, the joy of giving, and the peace of prayer.

"Alhamdulillah," she said softly. "Alhamdulillah for everything."

THE END`,
    wordCount: 105,
    generatedAt: new Date().toISOString(),
  },
];

const generateMockIllustrations = () => [
  {
    id: "ill-1",
    chapterNumber: 1,
    scene: "Amira waking up at dawn with soft pink light through window",
    characterIds: ["char-1"],
    imageUrl: "/demo/spreads/spread-1.png",
    status: "approved" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "ill-2",
    chapterNumber: 1,
    scene: "Family praying together in the living room",
    characterIds: ["char-1"],
    imageUrl: "/demo/spreads/spread-2.png",
    status: "approved" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "ill-3",
    chapterNumber: 2,
    scene: "Amira greeting Maryam at the school cafeteria",
    characterIds: ["char-1"],
    status: "draft" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "ill-4",
    chapterNumber: 3,
    scene: "Amira and family preparing gift baskets",
    characterIds: ["char-1"],
    status: "draft" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "ill-5",
    chapterNumber: 4,
    scene: "Family sitting under starry night sky",
    characterIds: ["char-1"],
    status: "draft" as const,
    generatedAt: new Date().toISOString(),
  },
];

const generateMockLayout = () => ({
  pageCount: 24,
  spreads: [
    {
      spreadNumber: 1,
      leftPage: { type: "text" as const, content: "Title Page" },
      rightPage: { type: "image" as const, imageUrl: "/demo/spreads/spread-1.png" },
    },
    {
      spreadNumber: 2,
      leftPage: { type: "mixed" as const, content: "Chapter 1", imageUrl: "/demo/spreads/spread-1.png" },
      rightPage: { type: "text" as const, content: "Chapter 1 continues..." },
    },
  ],
  generatedAt: new Date().toISOString(),
});

const generateMockCover = () => ({
  frontCoverUrl: "/demo/covers/ramadan-amira.png",
  backCoverUrl: "/demo/covers/ramadan-amira.png",
  spineText: "Amira's Ramadan Adventures",
  generatedAt: new Date().toISOString(),
});

const generateMockExport = () => [
  {
    format: "pdf" as const,
    fileUrl: "/demo/exports/book-preview.pdf",
    fileSize: 2500000,
    generatedAt: new Date().toISOString(),
  },
];

// ============================================
// Mock Job Runner
// ============================================

export class MockJobRunner {
  private abortController: AbortController | null = null;

  /**
   * Run a pipeline stage with simulated progress
   */
  async runStage(
    stage: ProjectStage,
    onProgress: ProgressCallback
  ): Promise<JobResult> {
    this.abortController = new AbortController();
    const startTime = Date.now();

    const stageConfig = PIPELINE_STAGES.find((s) => s.id === stage);
    if (!stageConfig) {
      return {
        stage,
        success: false,
        error: `Unknown stage: ${stage}`,
        duration: 0,
      };
    }

    // Initial progress
    onProgress({
      stage,
      progress: 0,
      status: "running",
      message: `Starting ${stageConfig.label}...`,
    });

    try {
      // Simulate progress over time
      const totalSteps = 10;
      const stepDuration = this.getStageDelay(stage) / totalSteps;

      for (let i = 1; i <= totalSteps; i++) {
        if (this.abortController.signal.aborted) {
          throw new Error("Job cancelled");
        }

        await this.delay(stepDuration);

        const progress = Math.min((i / totalSteps) * 100, 99);
        onProgress({
          stage,
          progress,
          status: "running",
          message: this.getProgressMessage(stage, i, totalSteps),
        });
      }

      // Generate mock artifact based on stage
      const artifact = this.generateArtifact(stage);

      // Final completion
      onProgress({
        stage,
        progress: 100,
        status: "completed",
        message: `${stageConfig.label} completed successfully!`,
      });

      return {
        stage,
        success: true,
        data: artifact,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      onProgress({
        stage,
        progress: 0,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        stage,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Cancel a running job
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get the simulated duration for each stage (in ms)
   */
  private getStageDelay(stage: ProjectStage): number {
    const delays: Record<ProjectStage, number> = {
      outline: 3000,
      chapters: 5000,
      illustrations: 6000,
      humanize: 2000,
      layout: 3000,
      cover: 4000,
      export: 2000,
      completed: 0,
    };
    return delays[stage] || 3000;
  }

  /**
   * Generate progress messages for each stage
   */
  private getProgressMessage(stage: ProjectStage, step: number, total: number): string {
    const messages: Record<ProjectStage, string[]> = {
      outline: [
        "Analyzing story structure...",
        "Generating chapter breakdown...",
        "Creating character arcs...",
        "Mapping key scenes...",
        "Adding moral lessons...",
        "Reviewing age appropriateness...",
        "Checking Islamic guidelines...",
        "Finalizing outline...",
        "Generating synopsis...",
        "Completing outline...",
      ],
      chapters: [
        "Writing Chapter 1...",
        "Developing characters...",
        "Adding dialogue...",
        "Writing Chapter 2...",
        "Incorporating Islamic values...",
        "Writing Chapter 3...",
        "Adding descriptive scenes...",
        "Writing Chapter 4...",
        "Polishing language...",
        "Finalizing chapters...",
      ],
      illustrations: [
        "Analyzing scene descriptions...",
        "Loading character poses...",
        "Generating scene 1...",
        "Applying character consistency...",
        "Generating scene 2...",
        "Adding backgrounds...",
        "Generating scene 3...",
        "Color correction...",
        "Final touch-ups...",
        "Completing illustrations...",
      ],
      humanize: [
        "Scanning for AI patterns...",
        "Improving flow...",
        "Enhancing dialogue...",
        "Adding personal touches...",
        "Checking readability...",
        "Adjusting tone...",
        "Polishing sentences...",
        "Final review...",
        "Applying edits...",
        "Completing humanization...",
      ],
      layout: [
        "Calculating page count...",
        "Creating spreads...",
        "Positioning text...",
        "Placing illustrations...",
        "Adjusting margins...",
        "Setting typography...",
        "Creating bleeds...",
        "Optimizing for print...",
        "Final adjustments...",
        "Completing layout...",
      ],
      cover: [
        "Analyzing book theme...",
        "Loading character assets...",
        "Generating front cover...",
        "Adding title typography...",
        "Creating back cover...",
        "Adding synopsis...",
        "Designing spine...",
        "Color matching...",
        "Final polish...",
        "Completing cover...",
      ],
      export: [
        "Preparing files...",
        "Optimizing images...",
        "Generating PDF...",
        "Creating print-ready version...",
        "Checking color profiles...",
        "Validating output...",
        "Compressing files...",
        "Running quality check...",
        "Packaging files...",
        "Completing export...",
      ],
      completed: ["Done!"],
    };

    const stageMessages = messages[stage] || ["Processing..."];
    const index = Math.min(step - 1, stageMessages.length - 1);
    return stageMessages[index];
  }

  /**
   * Generate mock artifact based on stage
   */
  private generateArtifact(stage: ProjectStage): unknown {
    switch (stage) {
      case "outline":
        return generateMockOutline();
      case "chapters":
        return generateMockChapters();
      case "illustrations":
        return generateMockIllustrations();
      case "humanize":
        return { edited: true, improvementCount: 24 };
      case "layout":
        return generateMockLayout();
      case "cover":
        return generateMockCover();
      case "export":
        return generateMockExport();
      default:
        return null;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mockJobRunner = new MockJobRunner();
