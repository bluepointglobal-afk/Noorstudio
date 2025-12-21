import { AppSidebar } from "./AppSidebar";
import { CreditBadge } from "@/components/shared/CreditBadge";
import { demoUserCredits } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const credits = demoUserCredits;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      {/* Top Bar */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search characters, books, projects..."
              className="pl-10 bg-muted/50 border-border/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <CreditBadge
              type="character"
              current={credits.characterCredits}
              max={credits.characterCreditsMax}
            />
            <CreditBadge
              type="book"
              current={credits.bookCredits}
              max={credits.bookCreditsMax}
            />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-16 min-h-screen">
        {(title || actions) && (
          <div className="border-b border-border bg-background">
            <div className="px-6 py-6 flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
