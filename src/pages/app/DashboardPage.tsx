import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { PipelineProgress } from "@/components/shared/PipelineProgress";
import { Link } from "react-router-dom";
import { Plus, Users, BookOpen, FolderKanban, TrendingUp, Clock, Star } from "lucide-react";

const recentProjects = [
  { id: 1, title: "The Generous Traveler", status: "In Progress", lastEdited: "2 hours ago" },
  { id: 2, title: "Ramadan with Amira", status: "Draft", lastEdited: "Yesterday" },
  { id: 3, title: "Learning Wudu", status: "Completed", lastEdited: "3 days ago" },
];

const stats = [
  { label: "Characters", value: "8", icon: Users, color: "bg-teal-100 text-primary" },
  { label: "Books", value: "5", icon: BookOpen, color: "bg-gold-100 text-gold-600" },
  { label: "Projects", value: "3", icon: FolderKanban, color: "bg-coral-100 text-coral-500" },
];

export default function DashboardPage() {
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
            <Link to="/app/characters">
              <Button variant="soft">
                <Plus className="w-4 h-4" />
                New Character
              </Button>
            </Link>
            <Link to="/app/book-builder">
              <Button variant="hero">
                <Plus className="w-4 h-4" />
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

        {/* Recent Projects */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Recent Projects</h2>
            <Link to="/app/projects" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{project.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {project.lastEdited}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <PipelineProgress compact />
                  <Button variant="ghost" size="sm">Open</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
