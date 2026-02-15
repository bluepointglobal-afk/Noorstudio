import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Image as ImageIcon,
  FileText,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUniverse, deleteUniverse, type Universe } from "@/lib/api/universeApi";
import { IllustrationStudio } from "@/components/illustration/IllustrationStudio";
import { CoverStudio } from "@/components/cover/CoverStudio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UniverseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUniverse = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getUniverse(id);
      setUniverse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load universe");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUniverse();
  }, [loadUniverse]);

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteUniverse(id);
      toast({
        title: "Universe Deleted",
        description: `"${universe?.name}" has been deleted.`,
      });
      navigate("/app/universes");
    } catch (err) {
      toast({
        title: "Failed to delete universe",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !universe) {
    return (
      <AppLayout title="Error" subtitle="">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || "Universe not found"}</p>
          <Button onClick={() => navigate("/app/universes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Universes
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={universe.name}
      subtitle={universe.description || "Universe details and asset management"}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/app/universes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/app/universes/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      {/* Universe Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-glow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{universe.bookCount}</p>
              <p className="text-sm text-muted-foreground">Books</p>
            </div>
          </div>
        </div>

        <div className="card-glow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{universe.characterCount}</p>
              <p className="text-sm text-muted-foreground">Characters</p>
            </div>
          </div>
        </div>

        <div className="card-glow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Illustrations</p>
            </div>
          </div>
        </div>

        <div className="card-glow p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Covers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Series Bible */}
      {universe.seriesBible && (
        <div className="card-glow p-6 mb-8">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Series Bible
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {universe.seriesBible}
          </p>
        </div>
      )}

      {/* Tags */}
      {universe.tags && universe.tags.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {universe.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Asset Management Tabs */}
      <Tabs defaultValue="illustrations" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="illustrations" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Illustrations</span>
          </TabsTrigger>
          <TabsTrigger value="covers" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Covers</span>
          </TabsTrigger>
          <TabsTrigger value="characters" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Characters</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="illustrations" className="mt-6">
          <IllustrationStudio universeId={universe.id} />
        </TabsContent>

        <TabsContent value="covers" className="mt-6">
          <CoverStudio universeId={universe.id} />
        </TabsContent>

        <TabsContent value="characters" className="mt-6">
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Character management coming soon
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/app/characters")}
            >
              Go to Character Studio
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Universe?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{universe.name}"? This action cannot
              be undone. All books, characters, and assets in this universe will
              remain but will no longer be associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
