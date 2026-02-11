import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  FolderKanban,
  Globe,
  CreditCard,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { CreditBadge } from "@/components/shared/CreditBadge";
import { demoUserCredits } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
  { icon: Globe, label: "Universes", href: "/app/universes" },
  { icon: Users, label: "Characters", href: "/app/characters" },
  { icon: Library, label: "Knowledge Base", href: "/app/knowledge-base" },
  { icon: FolderKanban, label: "Projects", href: "/app/projects" },
];

const createNavItems = [
  { icon: Plus, label: "New Book", href: "/app/books/new" },
];

const bottomNavItems = [
  { icon: CreditCard, label: "Billing", href: "/app/billing" },
  { icon: Settings, label: "Settings", href: "/app/settings" },
  { icon: HelpCircle, label: "Help", href: "/app/help" },
];

export function AppSidebar() {
  const location = useLocation();
  const { isRTL } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const credits = demoUserCredits;

  const NavLink = ({
    item,
    highlight = false,
  }: {
    item: { icon: typeof LayoutDashboard; label: string; href: string };
    highlight?: boolean;
  }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          isRTL && "flex-row-reverse",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-gold"
            : highlight
            ? "bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className={cn("w-5 h-5 shrink-0", collapsed && "mx-auto")} />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-40",
        isRTL ? "right-0 border-l border-sidebar-border" : "left-0 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("h-16 flex items-center justify-between px-4 border-b border-sidebar-border", isRTL && "flex-row-reverse")}>
        <Link to="/" className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">
              Noor<span className="text-sidebar-primary">Studio</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            isRTL ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            isRTL ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )
          )}
        </button>
      </div>

      {/* Credits Display */}
      {!collapsed && (
        <div className="px-3 py-4 border-b border-sidebar-border">
          <div className="space-y-2">
            <CreditBadge
              type="character"
              current={credits.characterCredits}
              max={credits.characterCreditsMax}
              className="w-full justify-between bg-sidebar-accent border-sidebar-border"
            />
            <CreditBadge
              type="book"
              current={credits.bookCredits}
              max={credits.bookCreditsMax}
              className="w-full justify-between bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Create Section */}
        <div className="mt-6">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Create
            </p>
          )}
          <nav className="space-y-1">
            {createNavItems.map((item) => (
              <NavLink key={item.href} item={item} highlight />
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="py-4 px-3 border-t border-sidebar-border">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent",
            collapsed && "justify-center",
            isRTL && "flex-row-reverse"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold shrink-0">
            A
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Author Demo
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                {credits.plan} Plan
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
