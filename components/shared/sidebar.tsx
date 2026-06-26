"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  Youtube,
  Sparkles,
  Bell,
  GitCompare,
  Settings,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard/feed", label: "Feed", icon: Rss },
  { href: "/dashboard/channels", label: "Channels", icon: Youtube },
  { href: "/dashboard/insights", label: "Insights", icon: Sparkles },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/dashboard/admin", label: "Admin", icon: Settings },
];

const sidebarVariants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card/80 backdrop-blur-xl lg:hidden"
          >
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-border bg-card/50 backdrop-blur-xl lg:block">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Open Monitor YT
        </span>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item, i) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </>
  );
}
