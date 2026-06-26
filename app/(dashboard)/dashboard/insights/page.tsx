"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChannels } from "@/hooks/use-api";
import { useQueries } from "@tanstack/react-query";
import { channelsApi } from "@/lib/api";
import { INSIGHT_TYPES } from "@/types";
import type { ChannelInsight } from "@/types";

interface InsightWithChannel extends ChannelInsight {
  channel: { name: string; handle: string | null };
}

export default function InsightsPage() {
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: channels = [] } = useChannels();

  const channelInsights = useQueries({
    queries: channels.map((ch) => ({
      queryKey: ["channels", ch.id],
      queryFn: () => channelsApi.get(ch.id),
    })),
  });

  const allInsights: InsightWithChannel[] = channelInsights
    .flatMap((q) => {
      const channel = channels.find((c) => c.id === q.data?.id);
      return (q.data?.insights || []).map((insight: ChannelInsight) => ({
        ...insight,
        channel: { name: channel?.name || "", handle: channel?.handle || null },
      }));
    })
    .sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

  const isLoading = channelInsights.some((q) => q.isLoading);

  const filtered =
    filter === "ALL"
      ? allInsights
      : allInsights.filter((i) => i.type === filter);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">
            {allInsights.length} insights generated
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
          onClick={() => setFilter("ALL")}
        >
          ALL
        </Button>
        {INSIGHT_TYPES.map((t) => (
          <Button
            key={t}
            variant={filter === t ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter(t)}
          >
            {t.replace(/_/g, " ")}
          </Button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No insights yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Run analysis on your channels to generate insights.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Card className="transition-colors hover:bg-accent/5">
                  <CardContent className="p-4">
                    <div
                      className="flex cursor-pointer items-center justify-between"
                      onClick={() =>
                        setExpanded(
                          expanded === insight.id ? null : insight.id
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {insight.type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {insight.channel.name}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{insight.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.generatedAt).toLocaleDateString()}
                        </span>
                        {expanded === insight.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expanded === insight.id && insight.detail && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { type: "spring" as const, stiffness: 300, damping: 30 },
                            opacity: { duration: 0.15 },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 border-t border-border pt-3">
                            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(insight.detail), null, 2);
                                } catch {
                                  return insight.detail;
                                }
                              })()}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs"
                              onClick={() => {
                                try {
                                  const formatted = JSON.stringify(JSON.parse(insight.detail!), null, 2);
                                  navigator.clipboard.writeText(formatted);
                                } catch {
                                  navigator.clipboard.writeText(insight.detail!);
                                }
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Copy JSON
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
