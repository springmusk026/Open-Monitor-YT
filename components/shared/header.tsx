"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard/feed": "Activity Feed",
  "/dashboard/channels": "Channels",
  "/dashboard/insights": "Insights",
  "/dashboard/alerts": "Alerts",
  "/dashboard/compare": "Compare",
  "/dashboard/admin": "Admin Settings",
};

export function Header() {
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname?.startsWith(path)
  )?.[1] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <ThemeToggle />
      </div>
    </header>
  );
}
