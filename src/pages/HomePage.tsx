import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { CharacterCard } from "@/components/shared/CharacterCard";
import { BookCoverCard } from "@/components/shared/BookCoverCard";
import { PipelineProgress } from "@/components/shared/PipelineProgress";
import {
  ArrowRight,
  Sparkles,
  Users,
  BookOpen,
  Download,
  Shield,
  Heart,
  BookMarked,
  GraduationCap,
  Star,
  Check,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";

// Mock data
const mockCharacters = [
  { name: "Amira", role: "Curious Explorer", ageRange: "6-9" },
  { name: "Yusuf", role: "Kind Helper", ageRange: "5-7" },
  { name: "Fatima", role: "Wise Teacher", ageRange: "8-12" },
  { name: "Omar", role: "Brave Friend", ageRange: "6-9" },
  { name: "Layla", role: "Creative Artist", ageRange: "7-10" },
  { name: "Zaid", role: "Thoughtful Student", ageRange: "9-12" },
];

const mockBooks = [
  { title: "The Generous Traveler", author: "Sara Ahmad", ageRange: "5-8", category: "Values" },
  { title: "Ramadan with Amira", author: "Yusuf Khan", ageRange: "4-7", category: "Islamic" },
  { title: "The Mountain of Patience", author: "Aisha Malik", ageRange: "7-10", category: "Adventure" },
  { title: "Learning Wudu with Omar", author: "Fatima Ali", ageRange: "4-6", category: "Educational" },
  { title: "Kindness in the Souk", author: "Zahra Ibrahim", ageRange: "6-9", category: "Values" },
  { title: "The Prophet's Garden", author: "Hassan Omar", ageRange: "8-12", category: "Seerah" },
];

const howItWorks = [
  {
    icon: Users,
    title: "Create Characters",
    description: "Define persona, visual DNA, and generate 12-pose sheets for consistent illustrations across all scenes.",
  },
  {
    icon: BookOpen,
    title: "Build Books",
    description: "Choose templates, set age range, connect to Islamic knowledge base, and generate complete illustrated stories.",
  },
  {
    icon: Download,
    title: "Export & Publish",
    description: "Download print-ready PDFs, EPUBs, or formatted files ready for Amazon KDP or traditional publishing.",
  },
];

const templates = [
  {
    icon: Star,
    title: "Middle-Grade Adventure",
    description: "Epic journeys with moral lessons for ages 8-12",
    cta: "Try this template",
  },
  {
    icon: Heart,
    title: "Junior Values Story",
    description: "Gentle tales about honesty, kindness, and sharing for ages 4-7",
    cta: "Try this template",
  },
  {
    icon: GraduationCap,
    title: "Educational (Salah/Quran)",
    description: "Learn Islamic practices through engaging illustrated stories",
    cta: "Try this template",
  },
  {
    icon: BookMarked,
    title: "Seerah-Inspired",
    description: "Stories from the Prophet's life adapted for young readers",
    cta: "Try this template",
  },
];

const trustFeatures = [
  {
    icon: Shield,
    title: "Age-Appropriate Language",
    description: "AI-guided vocabulary and complexity levels matched to your target age group.",
  },
  {
    icon: Heart,
    title: "Islamic Adab Constraints",
    description: "Built-in rules ensure content respects Islamic values and etiquette.",
  },
  {
    icon: BookMarked,
    title: "Knowledge Base Rules",
    description: "Connect verified Islamic sources to ensure accuracy in religious content.",
  },
  {
    icon: Users,
    title: "Scholar Review (Optional)",
    description: "Flag content for optional review by qualified scholars before publishing.",
  },
];

const pricingTiers = [
  {
    name: "Creator",
    price: "$29",
    period: "/month",
    description: "For individual authors getting started",
    features: ["3 characters", "1 pose sheet/month", "2 books/month", "PDF export", "Email support"],
  },
  {
    name: "Author",
    price: "$79",
    period: "/month",
    description: "For serious authors and small publishers",
    features: ["10 characters", "5 pose sheets/month", "10 books/month", "PDF + EPUB export", "Priority support"],
    popular: true,
  },
  {
    name: "Studio",
    price: "$199",
    period: "/month",
    description: "For publishing teams and organizations",
    features: ["Unlimited characters", "Unlimited pose sheets", "Unlimited books", "Print-ready exports", "Team collaboration", "Dedicated support"],
  },
];

const faqs = [
  {
    question: "How does character consistency work?",
    answer: "Each character has a unique 'Visual DNA' profile and 12-pose sheet. When generating illustrations, the AI references these poses to maintain consistent appearance across all scenes in your book.",
  },
  {
    question: "What are pose sheets?",
    answer: "Pose sheets are grids of 12 standard poses (front, side, back, sitting, walking, etc.) that serve as visual references. They ensure your character looks the same whether they're reading, praying, or running.",
  },
  {
    question: "What export formats are available?",
    answer: "You can export as PDF (screen or print-ready), EPUB for e-readers, or print-ready files formatted for services like Amazon KDP, IngramSpark, or traditional offset printing.",
  },
  {
    question: "Do I own the rights to my books?",
    answer: "Yes, you retain full copyright and ownership of all content you create. We're a tool provider, not a publisher—your stories and characters belong to you.",
  },
  {
    question: "How does the knowledge base work?",
    answer: "The knowledge base contains verified Islamic content, age-appropriate vocabulary lists, and modesty guidelines. It guides the AI to generate content that's accurate and appropriate for Muslim children.",
  },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background patterns */}
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-50/50 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-gold-100 text-gold-600 text-sm font-medium mb-6 animate-fade-in">
              ✨ Trusted by 500+ Muslim authors and educators
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 animate-fade-in-up leading-tight">
              Create consistent characters.{" "}
              <span className="text-gradient-primary">Publish beautiful Islamic kids books.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up delay-100 max-w-2xl mx-auto">
              End-to-end publishing: Character Studio → Book Builder → Print-Ready Export.
              Pixar-quality characters that stay consistent across every page.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
              <Link to="/app/dashboard">
                <Button variant="hero" size="xl">
                  Get started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/examples">
                <Button variant="heroSecondary" size="xl">
                  View examples
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual - Studio Preview */}
          <div className="max-w-6xl mx-auto animate-fade-in-up delay-300">
            <div className="card-premium p-6 lg:p-8">
              {/* Character Carousel */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Character Studio</h3>
                  <PipelineProgress compact />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {mockCharacters.map((char, i) => (
                    <div
                      key={char.name}
                      className="aspect-square rounded-xl bg-gradient-subtle border border-border/50 flex items-center justify-center hover:shadow-lg transition-all cursor-pointer group"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <span className="text-xl font-bold text-primary">
                            {char.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-foreground">{char.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Covers Carousel */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Recent Books</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {mockBooks.map((book, i) => (
                    <div
                      key={book.title}
                      className="aspect-[3/4] rounded-xl bg-gradient-teal relative overflow-hidden group cursor-pointer"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white">
                        <BookOpen className="w-6 h-6 mb-2 opacity-80" />
                        <span className="text-[10px] font-medium text-center leading-tight line-clamp-3">
                          {book.title}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">12,500+</p>
              <p className="text-sm text-muted-foreground">Books Generated</p>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">3,200+</p>
              <p className="text-sm text-muted-foreground">Characters Created</p>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">50,000+</p>
              <p className="text-sm text-muted-foreground">Hours Saved</p>
            </div>
            <div className="h-12 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["Schools", "Authors", "Publishers"].map((type, i) => (
                  <div
                    key={type}
                    className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-medium text-primary"
                  >
                    {type.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Trusted by schools, authors & publishers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="How it works"
            title="Three steps to published"
            description="From character concept to print-ready book in a streamlined creative pipeline."
          />
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {howItWorks.map((step, i) => (
              <div
                key={step.title}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <FeatureCard
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  className="pt-8"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof / Examples */}
      <section className="py-20 lg:py-32 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="See it in action"
            title="Beautiful books, consistent characters"
            description="Every character stays perfectly on-model across every illustration."
          />

          {/* Character Examples */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground mb-6">Featured Characters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mockCharacters.map((char, i) => (
                <CharacterCard
                  key={char.name}
                  {...char}
                  status={i % 3 === 0 ? "approved" : i % 3 === 1 ? "draft" : "locked"}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Book Examples */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground mb-6">Published Books</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {mockBooks.map((book, i) => (
                <BookCoverCard
                  key={book.title}
                  {...book}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground mb-6">Consistency Comparison</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card-premium p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="font-medium text-destructive">Without Pose Sheets</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-muted flex items-center justify-center"
                    >
                      <div
                        className="w-8 h-8 rounded-full bg-muted-foreground/20"
                        style={{ transform: `rotate(${i * 15}deg) scale(${0.8 + i * 0.1})` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Characters look different in every scene. Hair, proportions, and features vary.
                </p>
              </div>
              <div className="card-premium p-6 border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium text-primary">With Noor Studio</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-teal-50 flex items-center justify-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/30" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  12-pose reference sheets ensure perfect consistency across all illustrations.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/examples">
              <Button variant="teal" size="lg">
                View all examples
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Templates"
            title="Start with proven story structures"
            description="Choose from age-appropriate templates designed for Islamic children's literature."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {templates.map((template, i) => (
              <div
                key={template.title}
                className="card-glow p-6 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center mb-4">
                  <template.icon className="w-6 h-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{template.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">{template.description}</p>
                <Link to="/app/book-builder">
                  <Button variant="soft" size="sm" className="w-full">
                    {template.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 lg:py-32 bg-teal-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-gold-400 text-sm font-medium mb-4">
              Trust & Faith Safety
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built with Islamic values in mind
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Our knowledge base and content guidelines ensure every story respects Islamic adab and is appropriate for young readers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gold-400 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-teal-800" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Pricing"
            title="Simple, transparent pricing"
            description="Choose the plan that fits your publishing goals. Upgrade or downgrade anytime."
          />
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <div
                key={tier.name}
                className={`card-premium p-8 relative animate-fade-in-up ${
                  tier.popular ? "border-primary shadow-glow" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/pricing">
                  <Button
                    variant={tier.popular ? "hero" : "outline"}
                    className="w-full"
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              All plans include <strong>Character Credits</strong> for pose sheets and{" "}
              <strong>Book Credits</strong> for generation.{" "}
              <Link to="/pricing" className="text-primary hover:underline">
                Learn more →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <SectionHeader
            badge="FAQs"
            title="Frequently asked questions"
            description="Everything you need to know about creating Islamic children's books with Noor Studio."
          />
          <div className="mt-12 space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="card-premium overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  {openFaq === i ? (
                    <Minus className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-gradient-teal text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Sparkles className="w-12 h-12 mx-auto mb-6 text-gold-400" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to create your first character?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of Muslim authors and educators publishing beautiful, consistent Islamic children's books.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/app/dashboard">
              <Button variant="gold" size="xl">
                Start creating free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/examples">
              <Button
                variant="outline"
                size="xl"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                Browse examples
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
