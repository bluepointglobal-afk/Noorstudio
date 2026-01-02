import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Shield,
  Type,
  FileText,
  Database,
  Palette,
  Settings,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  listKnowledgeBases,
  getKnowledgeBase,
  createKnowledgeBase,
  renameKnowledgeBase,
  deleteKnowledgeBase,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  seedDefaultKBIfEmpty,
  KnowledgeBase,
  KnowledgeBaseItem,
  KBCategory,
  KB_CATEGORIES,
} from "@/lib/storage/knowledgeBaseStore";
import { canCreateKBItem } from "@/lib/entitlements";
import { UpgradeModal } from "@/components/shared/UpgradeModal";

const categoryIcons: Record<KBCategory, React.ElementType> = {
  characters: Users,
  settings: Settings,
  faith_rules: Shield,
  vocabulary_rules: Type,
  series_bible: FileText,
  illustration_rules: Palette,
};

const categoryColors: Record<KBCategory, string> = {
  characters: "bg-blue-100 text-blue-600",
  settings: "bg-green-100 text-green-600",
  faith_rules: "bg-purple-100 text-purple-600",
  vocabulary_rules: "bg-orange-100 text-orange-600",
  series_bible: "bg-pink-100 text-pink-600",
  illustration_rules: "bg-teal-100 text-teal-600",
};

const categoryLabels: Record<KBCategory, string> = {
  characters: "Characters",
  settings: "Settings",
  faith_rules: "Faith Rules",
  vocabulary_rules: "Vocabulary",
  series_bible: "Series Bible",
  illustration_rules: "Illustration Rules",
};

export default function KnowledgeBasePage() {
  const { toast } = useToast();

  // Knowledge bases state
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKBId, setSelectedKBId] = useState<string | null>(null);
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);

  // UI state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateKBModal, setShowCreateKBModal] = useState(false);
  const [showRenameKBModal, setShowRenameKBModal] = useState(false);
  const [showDeleteKBModal, setShowDeleteKBModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeBaseItem | null>(null);

  // Form state
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");
  const [itemForm, setItemForm] = useState({
    title: "",
    category: "faith_rules" as KBCategory,
    body: "",
    tags: "",
  });

  // Load knowledge bases on mount
  useEffect(() => {
    seedDefaultKBIfEmpty();
    loadKnowledgeBases();
  }, []);

  // Load items when KB changes
  useEffect(() => {
    if (selectedKBId) {
      setItems(listItems(selectedKBId));
    } else {
      setItems([]);
    }
  }, [selectedKBId]);

  const loadKnowledgeBases = () => {
    const kbs = listKnowledgeBases();
    setKnowledgeBases(kbs);
    if (kbs.length > 0 && !selectedKBId) {
      setSelectedKBId(kbs[0].id);
    }
  };

  const refreshItems = () => {
    if (selectedKBId) {
      setItems(listItems(selectedKBId));
    }
  };

  const selectedKB = selectedKBId ? getKnowledgeBase(selectedKBId) : null;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // KB CRUD handlers
  const handleCreateKB = () => {
    if (!newKBName.trim()) return;
    const kb = createKnowledgeBase(newKBName.trim(), newKBDescription.trim());
    setKnowledgeBases(listKnowledgeBases());
    setSelectedKBId(kb.id);
    setShowCreateKBModal(false);
    setNewKBName("");
    setNewKBDescription("");
    toast({ title: "Knowledge Base created", description: `"${kb.name}" has been created.` });
  };

  const handleRenameKB = () => {
    if (!selectedKBId || !newKBName.trim()) return;
    renameKnowledgeBase(selectedKBId, newKBName.trim(), newKBDescription.trim());
    setKnowledgeBases(listKnowledgeBases());
    setShowRenameKBModal(false);
    setNewKBName("");
    setNewKBDescription("");
    toast({ title: "Knowledge Base renamed", description: "The knowledge base has been updated." });
  };

  const handleDeleteKB = () => {
    if (!selectedKBId) return;
    const kbName = selectedKB?.name;
    deleteKnowledgeBase(selectedKBId);
    const kbs = listKnowledgeBases();
    setKnowledgeBases(kbs);
    setSelectedKBId(kbs.length > 0 ? kbs[0].id : null);
    setShowDeleteKBModal(false);
    toast({ title: "Knowledge Base deleted", description: `"${kbName}" has been removed.` });
  };

  // Item CRUD handlers
  const openItemModal = (item?: KnowledgeBaseItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        title: item.title,
        category: item.category,
        body: item.body,
        tags: item.tags.join(", "),
      });
    } else {
      setEditingItem(null);
      setItemForm({ title: "", category: "faith_rules", body: "", tags: "" });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    if (!selectedKBId || !itemForm.title.trim() || !itemForm.body.trim()) return;

    const tags = itemForm.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingItem) {
      updateItem(selectedKBId, editingItem.id, {
        title: itemForm.title.trim(),
        category: itemForm.category,
        body: itemForm.body.trim(),
        tags,
      });
      toast({ title: "Item updated", description: `"${itemForm.title}" has been saved.` });
    } else {
      // Check KB item limit
      const check = canCreateKBItem(items.length);
      if (!check.allowed) {
        setShowItemModal(false);
        setShowUpgradeModal(true);
        return;
      }

      createItem(selectedKBId, {
        title: itemForm.title.trim(),
        category: itemForm.category,
        body: itemForm.body.trim(),
        tags,
      });
      toast({ title: "Item created", description: `"${itemForm.title}" has been added.` });
    }

    refreshItems();
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!selectedKBId || !itemToDelete) return;
    deleteItem(selectedKBId, itemToDelete.id);
    refreshItems();
    setShowDeleteItemModal(false);
    setItemToDelete(null);
    toast({ title: "Item deleted", description: "The item has been removed." });
  };

  const openRenameModal = () => {
    if (selectedKB) {
      setNewKBName(selectedKB.name);
      setNewKBDescription(selectedKB.description);
      setShowRenameKBModal(true);
    }
  };

  return (
    <AppLayout
      title="Knowledge Base"
      subtitle="Manage content rules and references for your books"
    >
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left Sidebar - KB List */}
        <div className="w-64 flex-shrink-0">
          <div className="card-glow p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Knowledge Bases</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setShowCreateKBModal(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 -mx-2">
              <div className="px-2 space-y-1">
                {knowledgeBases.map((kb) => (
                  <button
                    key={kb.id}
                    onClick={() => setSelectedKBId(kb.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                      selectedKBId === kb.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{kb.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate pl-6">
                      {listItems(kb.id).length} items
                    </p>
                  </button>
                ))}
                {knowledgeBases.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No knowledge bases yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedKB ? (
            <>
              {/* KB Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedKB.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedKB.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openRenameModal}>
                    <Edit className="w-4 h-4 mr-1" />
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteKBModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button variant="hero" size="sm" onClick={() => openItemModal()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    onClick={() => setCategoryFilter("all")}
                  >
                    All
                  </Button>
                  {KB_CATEGORIES.map((cat) => {
                    const Icon = categoryIcons[cat.id];
                    const count = items.filter((i) => i.category === cat.id).length;
                    return (
                      <Button
                        key={cat.id}
                        size="sm"
                        variant={categoryFilter === cat.id ? "default" : "outline"}
                        onClick={() => setCategoryFilter(cat.id)}
                        className="gap-1"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{cat.label}</span>
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Items Grid */}
              <ScrollArea className="flex-1">
                {filteredItems.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => openItemModal(item)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setItemToDelete(item);
                                  setShowDeleteItemModal(true);
                                }}
                              >
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
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {items.length === 0
                        ? "No items in this knowledge base yet."
                        : "No items match your search."}
                    </p>
                    {items.length === 0 && (
                      <Button variant="hero" onClick={() => openItemModal()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Knowledge Base Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Create or select a knowledge base to get started.
                </p>
                <Button variant="hero" onClick={() => setShowCreateKBModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Knowledge Base
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create KB Modal */}
      <Dialog open={showCreateKBModal} onOpenChange={setShowCreateKBModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Knowledge Base</DialogTitle>
            <DialogDescription>
              A knowledge base contains rules and references for book generation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="e.g., My Series KB"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newKBDescription}
                onChange={(e) => setNewKBDescription(e.target.value)}
                placeholder="Brief description of this knowledge base..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateKBModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreateKB} disabled={!newKBName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename KB Modal */}
      <Dialog open={showRenameKBModal} onOpenChange={setShowRenameKBModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="Knowledge base name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newKBDescription}
                onChange={(e) => setNewKBDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameKBModal(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleRenameKB} disabled={!newKBName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete KB Modal */}
      <Dialog open={showDeleteKBModal} onOpenChange={setShowDeleteKBModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Knowledge Base</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedKB?.name}"? This will also delete all {items.length} items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteKBModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteKB}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Modal (Create/Edit) */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={itemForm.title}
                onChange={(e) => setItemForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Item title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={itemForm.category}
                onValueChange={(v: KBCategory) => setItemForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={itemForm.body}
                onChange={(e) => setItemForm((p) => ({ ...p, body: e.target.value }))}
                placeholder="Write your knowledge base content here..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={itemForm.tags}
                onChange={(e) => setItemForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSaveItem}
              disabled={!itemForm.title.trim() || !itemForm.body.trim()}
            >
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Modal */}
      <Dialog open={showDeleteItemModal} onOpenChange={setShowDeleteItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteItemModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="KB Item Limit Reached"
        description="You've reached the maximum number of items per knowledge base on your current plan."
        feature="more KB items"
        currentLimit={items.length}
        limitType="Items per KB"
      />
    </AppLayout>
  );
}
