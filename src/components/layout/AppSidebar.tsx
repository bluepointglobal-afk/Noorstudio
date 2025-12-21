import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  FolderKanban,
  FileEdit,
  Image,
  Download,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
  { icon: Users, label: "Character Studio", href: "/app/characters" },
  { icon: BookOpen, label: "Book Builder", href: "/app/book-builder" },
  { icon: Library, label: "Knowledge Base", href: "/app/knowledge-base" },
  { icon: FolderKanban, label: "Projects", href: "/app/projects" },
];

const projectNavItems = [
  { icon: FileEdit, label: "Chapter Editor", href: "/app/chapters" },
  { icon: Image, label: "Illustrations", href: "/app/illustrations" },
  { icon: Download, label: "Layout & Export", href: "/app/export" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", href: "/app/settings" },
  { icon: HelpCircle, label: "Help Center", href: "/app/help" },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const NavLink = ({
    item,
  }: {
    item: { icon: typeof LayoutDashboard; label: string; href: string };
  }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-gold"
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
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
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
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Project Navigation */}
        <div className="mt-6">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Current Project
            </p>
          )}
          <nav className="space-y-1">
            {projectNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
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
            collapsed && "justify-center"
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
              <p className="text-xs text-sidebar-foreground/60 truncate">
                author@example.com
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
