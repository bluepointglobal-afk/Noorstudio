import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search, Users, BookOpen, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBalances, seedDefaultBalancesIfEmpty, CreditBalances } from "@/lib/storage/creditsStore";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function CreditIndicator({ type, current, icon: Icon }: { type: string; current: number; icon: React.ElementType }) {
  const isLow = current < 10;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
        isLow
          ? "bg-destructive/10 text-destructive"
          : "bg-muted hover:bg-muted/80"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{current}</span>
    </div>
  );
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, t } = useLanguage();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [credits, setCredits] = useState<CreditBalances>({ characterCredits: 0, bookCredits: 0, plan: "author" });

  // Load credits on mount and set up refresh
  useEffect(() => {
    seedDefaultBalancesIfEmpty();
    setCredits(getBalances());

    // Refresh credits periodically (every 2 seconds) to catch updates
    const interval = setInterval(() => {
      setCredits(getBalances());
    }, 2000);

    // Listen for storage changes
    const handleStorage = () => setCredits(getBalances());
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar (unchanged behavior) */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer + backdrop */}
      <div className="md:hidden">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "[&>aside]:transition-transform [&>aside]:duration-300 [&>aside]:ease-out [&>aside]:z-50 [&>aside]:w-64 [&>aside]:shadow-xl",
            isRTL ? "[&>aside]:translate-x-full [&>aside]:-translate-x-0" : "[&>aside]:-translate-x-full",
            mobileSidebarOpen && (isRTL ? "[&>aside]:-translate-x-0" : "[&>aside]:translate-x-0")
          )}
        >
          <AppSidebar />

          {mobileSidebarOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-3 z-[60] bg-background/80 backdrop-blur border",
                isRTL ? "right-[15.25rem]" : "left-[15.25rem]"
              )}
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Top Bar */}
      <header
        className={cn(
          "fixed top-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border z-30 flex items-center justify-between px-4 md:px-6",
          isRTL ? "right-0 md:right-64 left-0 md:left-auto" : "left-0 md:left-64 right-0 md:right-auto"
        )}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          {/* Mobile menu button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="relative max-w-md flex-1">
            <Search
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                isRTL ? "right-3" : "left-3"
              )}
            />
            <Input
              placeholder={t("searchPlaceholder")}
              className={cn(isRTL ? "pr-10" : "pl-10", "bg-muted/50 border-border/50")}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Clickable Credits Indicator */}
          <button
            onClick={() => navigate("/app/billing")}
            className="hidden md:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="View billing & credits"
          >
            <CreditIndicator type="character" current={credits.characterCredits} icon={Users} />
            <CreditIndicator type="book" current={credits.bookCredits} icon={BookOpen} />
          </button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("pt-16 min-h-screen", isRTL ? "md:mr-64" : "md:ml-64")}>
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
