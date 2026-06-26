"use client";

import { useState } from "react";
import { formatDistanceToNow } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  PenLine,
  ImageIcon,
  TrendingUp,
  Tag,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/hooks/use-api";
import { DIFF_FIELDS } from "@/types";
import type { DiffField } from "@/types";
import type { LucideIcon } from "lucide-react";

const fieldIcons: Record<DiffField, LucideIcon> = {
  TITLE: PenLine,
  THUMBNAIL: ImageIcon,
  DESCRIPTION: FileText,
  TAGS: Tag,
  VIEW_COUNT: TrendingUp,
  LIKE_COUNT: TrendingUp,
};

const fieldBadgeVariant: Record<DiffField, "default" | "secondary" | "destructive" | "outline"> = {
  TITLE: "default",
  THUMBNAIL: "secondary",
  DESCRIPTION: "outline",
  TAGS: "default",
  VIEW_COUNT: "default",
  LIKE_COUNT: "default",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading, error } = useFeed({
    page,
    limit: 20,
    filter: filter === "ALL" ? undefined : filter,
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-sm text-muted-foreground">
            {total} changes detected
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => { setFilter("ALL"); setPage(1); }}
        >
          ALL
        </Button>
        {DIFF_FIELDS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f.replace("_", " ")}
          </Button>
        ))}
      </motion.div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold text-destructive">Failed to load feed</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add channels and start scraping to see changes here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((feedItem) => {
              const Icon = fieldIcons[feedItem.field] || Upload;
              return (
                <motion.div
                  key={feedItem.id}
                  variants={item}
                  layout
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                >
                  <Card className="transition-colors hover:bg-accent/5">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {feedItem.channel.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {feedItem.channel.handle}
                          </span>
                          <Badge
                            variant={fieldBadgeVariant[feedItem.field] || "secondary"}
                            className="h-5 text-[10px]"
                          >
                            {feedItem.field.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {feedItem.video.title}
                        </p>
                        {(feedItem.oldValue || feedItem.newValue) && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            {feedItem.oldValue && (
                              <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-destructive line-through">
                                {feedItem.oldValue.length > 60
                                  ? feedItem.oldValue.slice(0, 60) + "..."
                                  : feedItem.oldValue}
                              </span>
                            )}
                            {feedItem.oldValue && feedItem.newValue && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            {feedItem.newValue && (
                              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                                {feedItem.newValue.length > 60
                                  ? feedItem.newValue.slice(0, 60) + "..."
                                  : feedItem.newValue}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(feedItem.detectedAt))}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {total > 20 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  );
}
