// P0-2 Fix: Force rebuild to resolve empty page rendering
import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pricingTiers = [
  {
    name: "Creator",
    price: "$29",
    period: "/month",
    description: "For individual authors getting started with Islamic children's books.",
    features: [
      { text: "3 characters", info: "Create up to 3 unique characters" },
      { text: "1 pose sheet per month", info: "Generate one 12-pose reference sheet monthly" },
      { text: "2 books per month", info: "Generate up to 2 complete illustrated books" },
      { text: "PDF export", info: "Download high-quality PDF files" },
      { text: "Basic knowledge base", info: "Access to core Islamic content guidelines" },
      { text: "Email support", info: "Response within 48 hours" },
    ],
    credits: {
      character: 10,
      book: 20,
    },
  },
  {
    name: "Author",
    price: "$79",
    period: "/month",
    description: "For serious authors and small publishers building a catalog.",
    features: [
      { text: "10 characters", info: "Create up to 10 unique characters" },
      { text: "5 pose sheets per month", info: "Generate five 12-pose reference sheets monthly" },
      { text: "10 books per month", info: "Generate up to 10 complete illustrated books" },
      { text: "PDF + EPUB export", info: "Export to multiple formats" },
      { text: "Full knowledge base", info: "Complete Islamic content library and guidelines" },
      { text: "Priority support", info: "Response within 24 hours" },
      { text: "Version history", info: "Access previous versions of characters and books" },
    ],
    credits: {
      character: 50,
      book: 100,
    },
    popular: true,
  },
  {
    name: "Studio",
    price: "$199",
    period: "/month",
    description: "For publishing teams, schools, and organizations.",
    features: [
      { text: "Unlimited characters", info: "No limit on character creation" },
      { text: "Unlimited pose sheets", info: "Generate as many pose sheets as needed" },
      { text: "Unlimited books", info: "No monthly book generation limits" },
      { text: "Print-ready exports", info: "Files formatted for KDP, IngramSpark, and offset printing" },
      { text: "Team collaboration", info: "Invite team members with role-based access" },
      { text: "Custom knowledge base", info: "Add your own content guidelines and rules" },
      { text: "Dedicated support", info: "Direct access to our team" },
      { text: "API access", info: "Integrate with your existing workflows" },
    ],
    credits: {
      character: "Unlimited",
      book: "Unlimited",
    },
  },
];

const creditInfo = [
  {
    title: "Character Credits",
    description: "Used for generating and refining characters and pose sheets.",
    usage: [
      "New character generation: 2 credits",
      "Pose sheet generation: 3 credits",
      "Single pose regeneration: 1 credit",
      "Character variant: 2 credits",
    ],
  },
  {
    title: "Book Credits",
    description: "Used for book generation, chapter creation, and illustrations.",
    usage: [
      "Book outline generation: 5 credits",
      "Chapter generation: 3 credits per chapter",
      "Illustration generation: 2 credits per image",
      "Chapter regeneration: 2 credits",
    ],
  },
];

export default function PricingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Pricing"
            title="Simple, transparent pricing"
            description="Choose the plan that fits your publishing goals. All plans include our full-featured platform with no hidden fees."
          />
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <div
                key={tier.name}
                className={`card-premium p-8 relative flex flex-col animate-fade-in-up ${
                  tier.popular ? "border-primary shadow-glow scale-105 z-10" : ""
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tier.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    Most Popular
                  </span>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>

                {/* Credits */}
                <div className="mb-6 p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-medium text-foreground mb-2">Monthly Credits</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Character: </span>
                      <span className="font-semibold text-foreground">{tier.credits.character}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Book: </span>
                      <span className="font-semibold text-foreground">{tier.credits.book}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground flex-1">{feature.text}</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{feature.info}</p>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </ul>

                <Link to="/app/dashboard">
                  <Button
                    variant={tier.popular ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit System Explanation */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Credit System"
            title="How credits work"
            description="Credits give you flexibility in how you use the platform. Use them for characters, books, or a mix of both."
          />
          <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            {creditInfo.map((info, i) => (
              <div
                key={info.title}
                className="card-premium p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <h3 className="text-xl font-bold text-foreground mb-2">{info.title}</h3>
                <p className="text-muted-foreground mb-4">{info.description}</p>
                <ul className="space-y-2">
                  {info.usage.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Need more credits? Additional credit packs available in your account settings.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Pricing FAQs
          </h2>
          <div className="space-y-6">
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the next billing cycle.
              </p>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-2">What happens if I run out of credits?</h3>
              <p className="text-muted-foreground text-sm">
                You can purchase additional credit packs anytime, or wait for your monthly refresh. We'll notify you when you're running low.
              </p>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-2">Do unused credits roll over?</h3>
              <p className="text-muted-foreground text-sm">
                On the Author and Studio plans, unused credits roll over for up to 3 months. Creator plan credits refresh monthly.
              </p>
            </div>
            <div className="card-premium p-6">
              <h3 className="font-semibold text-foreground mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! All new accounts start with a 7-day free trial of the Author plan. No credit card required to start.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-gradient-teal text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start your 7-day free trial
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Try the full Author plan free for 7 days. No credit card required.
          </p>
          <Link to="/app/dashboard">
            <Button variant="gold" size="xl">
              Start free trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
