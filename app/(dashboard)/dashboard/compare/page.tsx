"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChannels, useAnalyzeGap } from "@/hooks/use-api";

export default function ComparePage() {
  const [channelA, setChannelA] = useState("");
  const [channelB, setChannelB] = useState("");

  const { data: channels = [] } = useChannels();
  const analyzeGap = useAnalyzeGap();

  async function runCompare() {
    if (!channelA || !channelB || channelA === channelB) return;
    await analyzeGap.mutateAsync({ channelAId: channelA, channelBId: channelB });
  }

  const result = analyzeGap.data;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Compare Channels</h1>
        <p className="text-sm text-muted-foreground">
          Analyze content gaps between two channels
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Card>
          <CardContent className="flex items-end gap-4 p-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Channel A</label>
              <Select value={channelA} onValueChange={setChannelA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex h-10 items-center">
              <GitCompare className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Channel B</label>
              <Select value={channelB} onValueChange={setChannelB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runCompare}
              disabled={analyzeGap.isPending || !channelA || !channelB || channelA === channelB}
            >
              {analyzeGap.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Compare
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="space-y-4"
        >
          {result.channelAOnly?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-primary">
                  Topics only Channel A covers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.channelAOnly.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.channelBOnly?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-amber-500">
                  Topics only Channel B covers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.channelBOnly.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.trendingIntersections?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-blue-500">
                  Trending Intersections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.trendingIntersections.map((t: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.suggestedIdeas?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-emerald-500">
                  Suggested Content Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.suggestedIdeas.map(
                  (idea: { topic: string; rationale: string }, i: number) => (
                    <div key={i}>
                      <p className="text-sm font-medium">{idea.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {idea.rationale}
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {result.reasoning && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {result.reasoning}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
