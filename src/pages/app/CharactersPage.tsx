import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Sparkles, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getCharacters,
  seedDemoCharactersIfEmpty,
  StoredCharacter,
  getApprovedPoseCount,
} from "@/lib/storage/charactersStore";
import { AssetStatus } from "@/lib/models";

const statusColors: Record<AssetStatus, string> = {
  draft: "bg-gold-100 text-gold-600",
  approved: "bg-teal-100 text-teal-600",
  locked: "bg-muted text-muted-foreground",
};

export default function CharactersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | null>(null);
  const [characters, setCharacters] = useState<StoredCharacter[]>([]);

  // Load characters on mount
  useEffect(() => {
    const loadCharacters = () => {
      const chars = getCharacters();
      setCharacters(chars);
    };

    loadCharacters();

    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener("storage", loadCharacters);
    return () => window.removeEventListener("storage", loadCharacters);
  }, []);

  const handleImportDemo = () => {
    seedDemoCharactersIfEmpty();
    const chars = getCharacters();
    setCharacters(chars);
    toast({
      title: "Demo characters imported",
      description: `${chars.length} characters are now available.`,
    });
  };

  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(search.toLowerCase()) ||
      char.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || char.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: characters.length,
      draft: characters.filter((c) => c.status === "draft").length,
      approved: characters.filter((c) => c.status === "approved").length,
      locked: characters.filter((c) => c.status === "locked").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <AppLayout
      title="Character Studio"
      subtitle="Create and manage your characters with consistent visual DNA"
      actions={
        <div className="flex gap-2">
          {characters.length === 0 && (
            <Button variant="outline" onClick={handleImportDemo}>
              <Download className="w-4 h-4 mr-2" />
              Import Demo
            </Button>
          )}
          <Link to="/app/characters/new">
            <Button variant="hero" size="default">
              <Plus className="w-4 h-4 mr-2" />
              Create Character
            </Button>
          </Link>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search characters by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "draft", "approved", "locked"] as const).map((status) => (
            <Button
              key={status}
              variant={
                statusFilter === status || (status === "all" && !statusFilter)
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => setStatusFilter(status === "all" ? null : status)}
              className="capitalize"
            >
              {status}
              <span className="ml-1.5 text-xs opacity-70">
                ({status === "all" ? statusCounts.all : statusCounts[status]})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {characters.length === 0 && (
        <div className="text-center py-16 card-glow">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Characters Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first character with consistent visual DNA, or import demo characters to get started.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleImportDemo}>
              <Download className="w-4 h-4 mr-2" />
              Import Demo Characters
            </Button>
            <Link to="/app/characters/new">
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Character Grid */}
      {characters.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCharacters.map((char) => {
            const approvedCount = getApprovedPoseCount(char);
            const hasPoseSheet = char.poseSheetGenerated;

            return (
              <Link
                key={char.id}
                to={`/app/characters/${char.id}`}
                className="card-glow overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-subtle relative overflow-hidden">
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/200x200/e2e8f0/64748b?text=" +
                        char.name.charAt(0);
                    }}
                  />
                  <Badge
                    className={cn(
                      "absolute top-3 right-3",
                      statusColors[char.status]
                    )}
                  >
                    {char.status}
                  </Badge>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-black/50 text-white">
                      v{char.version}
                    </span>
                    {hasPoseSheet && (
                      <span className="text-xs px-2 py-0.5 rounded bg-black/50 text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {approvedCount}/12
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {char.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 truncate">
                    {char.role}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {char.ageRange}
                    </span>
                    {char.traits.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +{char.traits.length} traits
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {characters.length > 0 && filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No characters found matching your criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatusFilter(null);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
