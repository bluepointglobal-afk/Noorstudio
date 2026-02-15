// Universe Creation/Edit Form
// Create or edit a universe with DNA configuration

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUniverse } from "@/hooks/useUniverses";
import { createUniverse, updateUniverse } from "@/lib/api";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function UniverseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { universe, loading: loadingUniverse } = useUniverse(id);

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    seriesBible: "",
    tags: [] as string[],
  });

  // Populate form when editing
  useEffect(() => {
    if (universe) {
      setFormData({
        name: universe.name,
        description: universe.description || "",
        seriesBible: universe.seriesBible || "",
        tags: universe.tags || [],
      });
    }
  }, [universe]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Universe name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateUniverse(id, {
          name: formData.name,
          description: formData.description || undefined,
          seriesBible: formData.seriesBible || undefined,
          tags: formData.tags,
        });
        toast.success("Universe updated successfully");
      } else {
        const created = await createUniverse({
          name: formData.name,
          description: formData.description || undefined,
          seriesBible: formData.seriesBible || undefined,
          tags: formData.tags,
        });
        toast.success("Universe created successfully");
        navigate(`/app/universes/${created.id}`);
        return;
      }

      navigate("/app/universes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save universe");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUniverse) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? "Edit Universe" : "Create Universe"}
      subtitle={isEditing ? "Update your universe settings" : "Create a new story universe"}
      actions={
        <Button variant="outline" onClick={() => navigate("/app/universes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your universe a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Universe Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Adventures of Noor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of your universe..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Series Bible */}
        <Card>
          <CardHeader>
            <CardTitle>Series Bible</CardTitle>
            <CardDescription>
              Document the rules, lore, and consistency guidelines for your universe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="seriesBible"
              placeholder="Universe rules, world lore, character relationships, recurring themes..."
              value={formData.seriesBible}
              onChange={(e) => setFormData({ ...formData, seriesBible: e.target.value })}
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/app/universes")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update" : "Create"} Universe
              </>
            )}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
