import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoCharacters } from "@/lib/demo-data";
import { Plus, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const statusColors = {
  draft: "bg-gold-100 text-gold-600",
  approved: "bg-teal-100 text-teal-600",
  locked: "bg-muted text-muted-foreground",
};

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredCharacters = demoCharacters.filter((char) => {
    const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase()) ||
      char.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || char.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      title="Character Studio"
      subtitle="Create and manage your characters with consistent visual DNA"
      actions={
        <Link to="/app/characters/new">
          <Button variant="hero" size="default">
            <Plus className="w-4 h-4 mr-2" />
            Create Character
          </Button>
        </Link>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "draft", "approved", "locked"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status || (status === "all" && !statusFilter) ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status === "all" ? null : status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCharacters.map((char) => (
          <Link
            key={char.id}
            to={`/app/characters/${char.id}`}
            className="card-glow overflow-hidden group cursor-pointer"
          >
            <div className="aspect-square bg-gradient-subtle relative overflow-hidden">
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <Badge className={cn("absolute top-3 right-3", statusColors[char.status])}>
                {char.status}
              </Badge>
              <div className="absolute bottom-2 left-2">
                <span className="text-xs px-2 py-0.5 rounded bg-black/50 text-white">
                  v{char.version}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-1">{char.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{char.role}</p>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {char.ageRange}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No characters found matching your criteria.</p>
        </div>
      )}
    </AppLayout>
  );
}
