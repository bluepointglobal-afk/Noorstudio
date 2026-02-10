// P0-1 Fix: Force rebuild to resolve empty page rendering
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CharacterCard } from "@/components/shared/CharacterCard";
import { BookCoverCard } from "@/components/shared/BookCoverCard";
import { PoseGrid } from "@/components/shared/PoseGrid";
import { ArrowRight, BookOpen, Users, Layout } from "lucide-react";
import { demoCharacters, demoBooks } from "@/lib/demo-data";

const exampleCharacters = demoCharacters.map(c => ({
  name: c.name,
  role: c.role,
  ageRange: c.ageRange,
  status: c.status,
  imageUrl: c.imageUrl,
}));

const exampleBooks = demoBooks.map(b => ({
  title: b.title,
  author: b.author,
  ageRange: b.ageRange,
  category: b.category,
  coverUrl: b.coverUrl,
}));

export default function ExamplesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Examples"
            title="See what's possible"
            description="Explore characters, pose sheets, and published books created with Noor Studio."
          />
        </div>
      </section>

      {/* Character Gallery */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Character Gallery</h2>
              <p className="text-muted-foreground">Pixar-style characters with consistent visual DNA</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {exampleCharacters.map((char, i) => (
              <CharacterCard
                key={char.name}
                name={char.name}
                role={char.role}
                ageRange={char.ageRange}
                status={char.status}
                imageUrl={char.imageUrl}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pose Sheet Example */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center">
              <Layout className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">12-Pose Reference Sheets</h2>
              <p className="text-muted-foreground">The secret to character consistency across all illustrations</p>
            </div>
          </div>
          <div className="card-premium p-6 lg:p-8">
            <PoseGrid characterName="Amira" />
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-3">Why pose sheets matter</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Characters look identical in every scene and page
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  AI references the same visual DNA for consistency
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  Covers all common poses: front, side, sitting, walking, praying
                </li>
              </ul>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-3">Pose sheet workflow</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                  Create character with persona and visual DNA
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                  Generate 12-pose sheet automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-primary text-xs flex items-center justify-center shrink-0">3</span>
                  Approve or regenerate individual poses
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-primary text-xs flex items-center justify-center shrink-0">4</span>
                  Lock sheet once satisfied for book generation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Book Covers */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-coral-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Published Book Covers</h2>
              <p className="text-muted-foreground">Beautiful covers ready for print and digital distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {exampleBooks.map((book, i) => (
              <BookCoverCard
                key={book.title}
                title={book.title}
                author={book.author}
                ageRange={book.ageRange}
                category={book.category}
                coverUrl={book.coverUrl}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Sample Spread */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Sample Book Spread</h2>
            <p className="text-muted-foreground">Preview how your illustrated pages will look</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="card-premium overflow-hidden">
              <div className="grid md:grid-cols-2">
                {/* Left page - illustration */}
                <div className="aspect-[4/5] bg-gradient-teal flex items-center justify-center p-8">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <span className="text-5xl font-bold">A</span>
                    </div>
                    <p className="text-sm opacity-80">Full-page illustration</p>
                  </div>
                </div>
                {/* Right page - text */}
                <div className="aspect-[4/5] bg-white p-8 flex flex-col justify-center">
                  <p className="text-xl leading-relaxed text-foreground mb-6">
                    "Amira looked up at the stars, wondering about the beautiful patterns Allah had created in the night sky."
                  </p>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Her grandmother smiled. "Each star has been placed with purpose, just like each of us has a purpose in this world."
                  </p>
                  <p className="text-sm text-muted-foreground mt-8">Page 12</p>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Multiple layout options available: split-page, full image + caption, text under image
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to create your first character?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start with a free account and see how easy it is to bring your Islamic children's book ideas to life.
          </p>
          <Link to="/app/characters">
            <Button variant="hero" size="xl">
              Create your first character
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
