import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Star,
  Heart,
  GraduationCap,
  BookMarked,
  Users,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { BOOK_TEMPLATES } from "@/lib/models";

const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  adventure: Star,
  values: Heart,
  educational: GraduationCap,
  seerah: BookMarked,
};

const templateDetails = [
  {
    id: "adventure",
    features: ["4-6 chapters", "Action-packed scenes", "Character growth arc", "Moral resolution"],
    sampleBooks: ["The Mountain of Patience", "The Generous Traveler"],
    estimatedTime: "2-3 hours",
    creditCost: 25,
  },
  {
    id: "values",
    features: ["3-4 short chapters", "Simple vocabulary", "Repetitive phrases", "Clear moral lesson"],
    sampleBooks: ["Kindness in the Souk", "Sharing with Friends"],
    estimatedTime: "1-2 hours",
    creditCost: 15,
  },
  {
    id: "educational",
    features: ["Step-by-step instructions", "Visual guides", "Practice activities", "Review sections"],
    sampleBooks: ["Learning Wudu with Omar", "My First Quran Words"],
    estimatedTime: "2-3 hours",
    creditCost: 20,
  },
  {
    id: "seerah",
    features: ["Historical accuracy", "Age-appropriate adaptation", "Character focus", "Lessons from history"],
    sampleBooks: ["The Prophet's Garden", "Stories of the Companions"],
    estimatedTime: "3-4 hours",
    creditCost: 30,
  },
];

export default function TemplatesPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-50/50 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-gold-50 text-gold-600 border-gold-200">
              <Sparkles className="w-3 h-3 mr-1" />
              4 Story Templates
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Choose Your Story Template
            </h1>
            <p className="text-xl text-muted-foreground">
              Each template is designed for specific age groups and story types,
              with built-in Islamic values and age-appropriate content guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {BOOK_TEMPLATES.map((template) => {
              const Icon = templateIcons[template.id] || BookOpen;
              const details = templateDetails.find((d) => d.id === template.id);

              return (
                <div
                  key={template.id}
                  className="card-premium p-6 lg:p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {template.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Ages {template.ageRange}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    {template.description}
                  </p>

                  {details && (
                    <>
                      <div className="space-y-3 mb-6">
                        <h4 className="text-sm font-semibold text-foreground">Features:</h4>
                        <ul className="grid grid-cols-2 gap-2">
                          {details.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-6 mb-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {details.estimatedTime}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Sparkles className="w-4 h-4" />
                          ~{details.creditCost} credits
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mb-6">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Sample Books:</h4>
                        <div className="flex flex-wrap gap-2">
                          {details.sampleBooks.map((book, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {book}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Link to="/app/books/new">
                    <Button variant="hero" className="w-full">
                      Use This Template
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Templates Work */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="How Templates Work"
            subtitle="Each template guides the AI through a proven story structure"
            centered
          />

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Story Structure</h3>
              <p className="text-sm text-muted-foreground">
                Pre-defined chapter flow and pacing optimized for each age group
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gold-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Character Guidance</h3>
              <p className="text-sm text-muted-foreground">
                Role suggestions and interaction patterns for your characters
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-coral-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-coral-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Islamic Values</h3>
              <p className="text-sm text-muted-foreground">
                Built-in prompts to weave faith-based lessons naturally into stories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-teal-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Create Your First Book?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Start with any template and customize it to tell your unique Islamic story.
          </p>
          <Link to="/app/books/new">
            <Button variant="secondary" size="xl">
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
