"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Youtube,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Users,
  Video,
  Sparkles,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useChannels,
  useScrapeChannel,
  useUpdateChannel,
  useDeleteChannel,
} from "@/hooks/use-api";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function ChannelsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [addHandle, setAddHandle] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: channels = [], isLoading, error } = useChannels();
  const scrapeChannel = useScrapeChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  async function addChannel() {
    if (!addHandle.trim()) return;
    await scrapeChannel.mutateAsync({
      handle: addHandle.trim(),
      label: addLabel.trim() || undefined,
    });
    setShowAdd(false);
    setAddHandle("");
    setAddLabel("");
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
          <p className="text-sm text-muted-foreground">
            {channels.length} channels tracked
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </motion.div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="@channelhandle or channel URL"
              value={addHandle}
              onChange={(e) => setAddHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChannel()}
            />
            <Input
              placeholder="Label (optional)"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={addChannel}
              disabled={scrapeChannel.isPending || !addHandle.trim()}
            >
              {scrapeChannel.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {scrapeChannel.isPending ? "Adding..." : "Add Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold text-destructive">Failed to load channels</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Youtube className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No channels tracked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first competitor channel to start monitoring.
              </p>
              <Button className="mt-4" onClick={() => setShowAdd(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Channel
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {channels.map((ch) => (
              <motion.div key={ch.id} variants={itemVariant} layout>
                <Card className="group transition-colors hover:bg-accent/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={ch.avatarUrl || undefined} />
                        <AvatarFallback>
                          <Youtube className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/channel/${ch.id}`}
                          className="text-sm font-medium hover:text-primary transition-colors"
                        >
                          {ch.label || ch.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ch.handle}
                        </p>
                      </div>
                      {!ch.pollingPaused && (
                        <div className="flex h-2 w-2 items-center justify-center">
                          <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          Subscribers
                        </p>
                        <p className="font-medium">
                          {ch.subscriberCount
                            ? Number(ch.subscriberCount).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Video className="h-3 w-3" />
                          Videos
                        </p>
                        <p className="font-medium">{ch._count.videos}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Sparkles className="h-3 w-3" />
                          Insights
                        </p>
                        <p className="font-medium">{ch._count.insights}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last polled
                        </p>
                        <p className="font-medium">
                          {ch.lastPolledAt
                            ? new Date(ch.lastPolledAt).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-border pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={scrapeChannel.isPending}
                        onClick={() =>
                          scrapeChannel.mutate({ channelId: ch.id })
                        }
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Scrape
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateChannel.mutate({
                            id: ch.id,
                            pollingPaused: !ch.pollingPaused,
                          })
                        }
                      >
                        {ch.pollingPaused ? (
                          <Play className="mr-1 h-3 w-3" />
                        ) : (
                          <Pause className="mr-1 h-3 w-3" />
                        )}
                        {ch.pollingPaused ? "Resume" : "Pause"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(ch.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this channel and all its tracked data, snapshots, diffs, and insights. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteChannel.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
