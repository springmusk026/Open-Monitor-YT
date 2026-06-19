"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Clock,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideo } from "@/hooks/use-api";

const FIELD_LABELS: Record<string, string> = {
  TITLE: "Title",
  THUMBNAIL: "Thumbnail",
  DESCRIPTION: "Description",
  TAGS: "Tags",
  VIEW_COUNT: "View Count",
  LIKE_COUNT: "Like Count",
};

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { data: video, isLoading } = useVideo(videoId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Video not found
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
          <Link href={`/dashboard/channel/${video.channelId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight truncate">
            {video.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {video.channel?.name} · {video.channel?.handle}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1.5 h-3 w-3" />
            YouTube
          </a>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {video.thumbnailUrl && (
          <Card className="sm:col-span-2">
            <CardContent className="p-3">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full rounded-md object-cover"
              />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" /> Views
            </p>
            <p className="mt-1 text-2xl font-bold">
              {video.viewCount ? Number(video.viewCount).toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Duration
            </p>
            <p className="mt-1 text-2xl font-bold">{video.duration || "—"}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowRightLeft className="h-4 w-4" />
              Change History ({video.diffs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!video.diffs || video.diffs.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No changes detected yet
              </p>
            ) : (
              video.diffs.map((diff: any) => (
                <div
                  key={diff.id}
                  className="rounded-lg border p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {FIELD_LABELS[diff.field] || diff.field}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(diff.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  {diff.field === "THUMBNAIL" ? (
                    <div className="flex gap-2">
                      {diff.oldValue && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">Before</p>
                          <img src={diff.oldValue} className="h-16 rounded" />
                        </div>
                      )}
                      {diff.newValue && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground">After</p>
                          <img src={diff.newValue} className="h-16 rounded" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs space-y-0.5">
                      {diff.oldValue && (
                        <p className="text-red-500 line-through truncate">
                          {diff.oldValue}
                        </p>
                      )}
                      {diff.newValue && (
                        <p className="text-green-500 truncate">
                          {diff.newValue}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {video.snapshots && video.snapshots.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                View Count Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-1">
                {video.snapshots
                  .slice(0, 30)
                  .reverse()
                  .map((snap: any) => {
                    const count = snap.viewCount ? Number(snap.viewCount) : 0;
                    const max = Math.max(
                      ...video.snapshots.map((s: any) =>
                        s.viewCount ? Number(s.viewCount) : 0
                      )
                    );
                    const height = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div
                        key={snap.id}
                        className="flex-1 rounded-t bg-primary/20 hover:bg-primary/30 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${count.toLocaleString()} views`}
                      />
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
