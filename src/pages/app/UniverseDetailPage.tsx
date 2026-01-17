import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoUniverses } from "@/lib/demo-data";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, Plus, Pencil } from "lucide-react";

export default function UniverseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const universe = demoUniverses.find((u) => u.id === id);

    if (!universe) {
        return (
            <AppLayout title="Universe Not Found">
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">The requested universe could not be found.</p>
                    <Button onClick={() => navigate("/app/universes")}>Back to Universes</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title={universe.name}
            subtitle="Universe Details"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/app/universes")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button variant="outline">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Header Section */}
                <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
                    <h2 className="text-2xl font-semibold mb-2">{universe.name}</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl">{universe.description}</p>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                            <Users className="w-4 h-4" />
                            {universe.characterCount} Characters
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-secondary-foreground text-sm font-medium">
                            <BookOpen className="w-4 h-4" />
                            {universe.bookCount} Books
                        </div>
                    </div>
                </div>

                {/* Content Tabs/Sections (Simplified for now) */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Characters</h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/app/characters/new")}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </div>

                        <div className="p-8 border-2 border-dashed border-border rounded-xl text-center">
                            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Parameters and characters for this universe will appear here.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Books</h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/app/books/new")}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </div>

                        <div className="p-8 border-2 border-dashed border-border rounded-xl text-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Books belonging to this universe will appear here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
