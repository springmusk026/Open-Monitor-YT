"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Youtube,
  ArrowLeft,
  Users,
  Video,
  Sparkles,
  Clock,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useChannel } from "@/hooks/use-api";

export default function ChannelDetailPage() {
  const params = useParams();
  const channelId = params.id as string;
  const { data: channel, isLoading, error } = useChannel(channelId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <h3 className="text-lg font-semibold text-destructive">Failed to load channel</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Channel not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/channels">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Avatar className="h-12 w-12">
          <AvatarImage src={channel.avatarUrl || undefined} />
          <AvatarFallback>
            <Youtube className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{channel.name}</h1>
          <p className="text-sm text-muted-foreground">{channel.handle}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Subscribers
            </p>
            <p className="mt-1 text-2xl font-bold">
              {channel.subscriberCount
                ? Number(channel.subscriberCount).toLocaleString()
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3 w-3" />
              Videos
            </p>
            <p className="mt-1 text-2xl font-bold">{channel._count.videos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Insights
            </p>
            <p className="mt-1 text-2xl font-bold">
              {channel._count.insights}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last Polled
            </p>
            <p className="mt-1 text-2xl font-bold">
              {channel.lastPolledAt
                ? new Date(channel.lastPolledAt).toLocaleDateString()
                : "Never"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {channel.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {channel.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subscriber Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-end gap-1">
                  {(() => {
                    const recent = channel.snapshots.slice(0, 30).reverse();
                    const max = Math.max(
                      ...recent.map((s) =>
                        s.subscriberCount ? Number(s.subscriberCount) : 0
                      )
                    );
                    return recent.map((snap) => {
                      const count = snap.subscriberCount
                        ? Number(snap.subscriberCount)
                        : 0;
                      const height = max > 0 ? (count / max) * 100 : 0;
                      return (
                        <div
                          key={snap.id}
                          className="flex-1 rounded-t bg-primary/20 transition-colors hover:bg-primary/30"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${count.toLocaleString()} subscribers`}
                        />
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-2">
            {channel.videos.length === 0 ? (
              <Card>
                <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                  No videos tracked yet
                </CardContent>
              </Card>
            ) : (
              channel.videos.map((video) => (
                <Link key={video.id} href={`/dashboard/video/${video.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="flex items-center gap-4 p-3">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-16 w-28 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-28 items-center justify-center rounded-md bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {video.title}
                        </p>
                        <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                          <span>
                            {video.viewCount
                              ? Number(video.viewCount).toLocaleString() + " views"
                              : "—"}
                          </span>
                          <span>
                            {video.publishedAt
                              ? new Date(video.publishedAt).toLocaleDateString()
                              : "—"}
                          </span>
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            {video._count?.diffs || 0} changes
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            {channel.insights.length === 0 ? (
              <Card>
                <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                  No insights generated yet
                </CardContent>
              </Card>
            ) : (
              channel.insights.map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Badge variant="secondary" className="text-[10px]">
                        {insight.type.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(insight.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{insight.summary}</p>
                    {insight.detail && (
                      <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(insight.detail), null, 2);
                          } catch {
                            return insight.detail;
                          }
                        })()}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
