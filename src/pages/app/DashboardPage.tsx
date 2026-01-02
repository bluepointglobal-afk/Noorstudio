import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users, BookOpen, FolderKanban, Clock, Sparkles, Trash2, RefreshCw, Bug } from "lucide-react";
import { useState, useEffect } from "react";
import { listProjects, StoredProject, getCompletedStagesCount, clearAllProjects } from "@/lib/storage/projectsStore";
import { getCharacters, clearAllCharacters } from "@/lib/storage/charactersStore";
import { clearAllKnowledgeBases } from "@/lib/storage/knowledgeBaseStore";
import { resetCredits } from "@/lib/storage/creditsStore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getProjectStatus(project: StoredProject): string {
  const completed = getCompletedStagesCount(project);
  const total = project.pipeline.length;
  if (completed === 0) return "Draft";
  if (completed === total) return "Completed";
  return "In Progress";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [showDevTools, setShowDevTools] = useState(false);

  const loadData = () => {
    // Load real projects from localStorage
    const loadedProjects = listProjects();
    // Sort by updatedAt descending (most recent first)
    loadedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setProjects(loadedProjects);

    // Load character count
    const chars = getCharacters();
    setCharacterCount(chars.length);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearAll = () => {
    if (!confirm("This will clear ALL data (projects, characters, KBs, credits). Are you sure?")) {
      return;
    }
    clearAllProjects();
    clearAllCharacters();
    clearAllKnowledgeBases();
    resetCredits();
    // Clear autosave too
    localStorage.removeItem("noorstudio.book_builder.autosave.v1");
    loadData();
    toast({
      title: "All data cleared",
      description: "Your workspace has been reset. Refresh the page to re-seed demo data.",
    });
  };

  const handleRefresh = () => {
    loadData();
    toast({
      title: "Data refreshed",
      description: `Loaded ${projects.length} projects and ${characterCount} characters.`,
    });
  };

  const handleDebugProjects = () => {
    const allProjects = listProjects();
    if (import.meta.env.DEV) {
      console.log("[DEBUG] All projects in localStorage:", allProjects);
      console.log("[DEBUG] Project IDs:", allProjects.map(p => p.id));
      allProjects.forEach(p => {
        console.log(`[DEBUG] Project "${p.title}" - ID: ${p.id} - URL: /app/projects/${p.id}`);
      });
    }
    toast({
      title: "Debug info logged",
      description: `Found ${allProjects.length} projects. Check browser console (F12).`,
    });
  };

  const stats = [
    { label: "Characters", value: characterCount.toString(), icon: Users, color: "bg-teal-100 text-primary" },
    { label: "Books", value: projects.length.toString(), icon: BookOpen, color: "bg-gold-100 text-gold-600" },
    { label: "Projects", value: projects.length.toString(), icon: FolderKanban, color: "bg-coral-100 text-coral-500" },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, Author</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/characters/new">
              <Button variant="soft">
                <Plus className="w-4 h-4 mr-2" />
                New Character
              </Button>
            </Link>
            <Link to="/app/books/new">
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                New Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="card-premium p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dev Tools (only in development) */}
        {import.meta.env.DEV && (
          <div className="card-premium p-4 mb-8 border-dashed border-2 border-orange-300 bg-orange-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Dev Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDebugProjects}
                  className="h-8 text-xs"
                >
                  <Bug className="w-3 h-3 mr-1" />
                  Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Recent Projects</h2>
            {projects.length > 5 && (
              <Link to="/app/projects" className="text-sm text-primary hover:underline">
                View all
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create your first book project to start generating Islamic children's stories.
              </p>
              <Link to="/app/books/new">
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Book
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => {
                const status = getProjectStatus(project);
                const completedStages = getCompletedStagesCount(project);
                const totalStages = project.pipeline.length;
                const progress = Math.round((completedStages / totalStages) * 100);

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center text-white">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{project.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(project.updatedAt)}
                          <span className="text-muted-foreground/50">•</span>
                          <span>{project.ageRange}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              progress === 100 ? "bg-primary" : "bg-gold-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          status === "Completed" && "bg-primary/10 text-primary border-primary/30",
                          status === "In Progress" && "bg-gold-100 text-gold-600 border-gold-200",
                          status === "Draft" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
