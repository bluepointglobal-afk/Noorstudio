import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { demoKnowledgeBase, demoUniverses, KnowledgeBaseItem } from "@/lib/demo-data";
import { Plus, Search, Edit, Trash2, BookOpen, Users, Shield, Type, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const categoryIcons = {
  characters: Users,
  settings: BookOpen,
  faith_rules: Shield,
  vocabulary: Type,
  series_bible: FileText,
};

const categoryColors = {
  characters: "bg-blue-100 text-blue-600",
  settings: "bg-green-100 text-green-600",
  faith_rules: "bg-purple-100 text-purple-600",
  vocabulary: "bg-orange-100 text-orange-600",
  series_bible: "bg-pink-100 text-pink-600",
};

const categoryLabels = {
  characters: "Characters",
  settings: "Settings",
  faith_rules: "Faith Rules",
  vocabulary: "Vocabulary",
  series_bible: "Series Bible",
};

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [universeFilter, setUniverseFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [items, setItems] = useState<KnowledgeBaseItem[]>(demoKnowledgeBase);
  const [editItem, setEditItem] = useState<KnowledgeBaseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    body: "",
    category: "characters" as KnowledgeBaseItem["category"],
    universeId: demoUniverses[0]?.id || "",
    tags: "",
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesUniverse = universeFilter === "all" || item.universeId === universeFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesUniverse && matchesCategory;
  });

  const handleCreate = () => {
    const item: KnowledgeBaseItem = {
      id: `kb-${Date.now()}`,
      universeId: newItem.universeId,
      category: newItem.category,
      title: newItem.title,
      body: newItem.body,
      tags: newItem.tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setItems((prev) => [item, ...prev]);
    setShowCreateModal(false);
    setNewItem({ title: "", body: "", category: "characters", universeId: demoUniverses[0]?.id || "", tags: "" });
    toast({ title: "Item created", description: `"${item.title}" has been added to the knowledge base.` });
  };

  const handleUpdate = () => {
    if (!editItem) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editItem.id
          ? { ...editItem, updatedAt: new Date().toISOString().split("T")[0] }
          : item
      )
    );
    setEditItem(null);
    toast({ title: "Item updated", description: `"${editItem.title}" has been updated.` });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Item deleted", description: "The knowledge base item has been removed." });
  };

  return (
    <AppLayout
      title="Knowledge Base"
      subtitle="Manage content rules and references for your universes"
      actions={
        <Button variant="hero" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={universeFilter} onValueChange={setUniverseFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Universes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universes</SelectItem>
            {demoUniverses.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="characters">Characters</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="faith_rules">Faith Rules</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
            <SelectItem value="series_bible">Series Bible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const Icon = categoryIcons[item.category];
          return (
            <div key={item.id} className="card-glow p-5 group">
              <div className="flex items-start justify-between mb-3">
                <Badge className={cn("text-xs", categoryColors[item.category])}>
                  <Icon className="w-3 h-3 mr-1" />
                  {categoryLabels[item.category]}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditItem(item)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{item.body}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No knowledge base items found.</p>
          <Button variant="hero" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Knowledge Base Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Universe</Label>
                <Select value={newItem.universeId} onValueChange={(v) => setNewItem((p) => ({ ...p, universeId: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {demoUniverses.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={(v: KnowledgeBaseItem["category"]) => setNewItem((p) => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="characters">Characters</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="faith_rules">Faith Rules</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="series_bible">Series Bible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                placeholder="Item title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newItem.body}
                onChange={(e) => setNewItem((p) => ({ ...p, body: e.target.value }))}
                placeholder="Knowledge base content..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={newItem.tags}
                onChange={(e) => setNewItem((p) => ({ ...p, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreate} disabled={!newItem.title || !newItem.body}>
              Create Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editItem.body}
                  onChange={(e) => setEditItem({ ...editItem, body: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editItem.tags.join(", ")}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
