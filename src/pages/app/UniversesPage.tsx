import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoUniverses } from "@/lib/demo-data";
import { Plus, Search, Globe, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function UniversesPage() {
  const [search, setSearch] = useState("");

  const filteredUniverses = demoUniverses.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Universes"
      subtitle="Manage your story universes and series"
      actions={
        <Button variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          New Universe
        </Button>
      }
    >
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search universes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Universe Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniverses.map((universe) => (
          <Link
            key={universe.id}
            to={`/app/universes/${universe.id}`}
            className="card-glow p-6 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{universe.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {universe.description}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{universe.characterCount} characters</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>{universe.bookCount} books</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredUniverses.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No universes found.</p>
          <Button variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Universe
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
