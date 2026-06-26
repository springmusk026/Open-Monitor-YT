import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAppConfig } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";
import { isLLMEnabled } from "@/lib/llm/client";
import {
  detectABTest,
  analyzeUploadSchedule,
  analyzeTitlePatterns,
  analyzeThumbnailStyle,
  generateCompetitorSummary,
} from "@/lib/llm/insights";

const MAX_AB_TEST_VIDEOS = 10;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;

    if (!(await isLLMEnabled())) {
      return NextResponse.json(
        { error: "LLM features are disabled" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        videos: {
          include: { diffs: true, snapshots: { orderBy: { snappedAt: "desc" }, take: 1 } },
          orderBy: { publishedAt: "desc" },
          take: 50,
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const insights: any[] = [];
    const errors: string[] = [];

    // A/B Test Detection - cap at MAX_AB_TEST_VIDEOS most recent videos with diffs
    const abTestEnabled = await getAppConfig(CONFIG_KEYS.AI_AB_TEST);
    if (abTestEnabled !== "false") {
      try {
        const videosWithDiffs = channel.videos
          .filter((v) => v.diffs.some((d) => d.field === "TITLE" || d.field === "THUMBNAIL"))
          .slice(0, MAX_AB_TEST_VIDEOS);

        for (const video of videosWithDiffs) {
          const titleDiffs = video.diffs
            .filter((d) => d.field === "TITLE" || d.field === "THUMBNAIL")
            .map((d) => ({
              oldValue: d.oldValue || "",
              newValue: d.newValue || "",
              timestamp: d.detectedAt.toISOString(),
            }));

          if (titleDiffs.length >= 2) {
            const hasTitleDiff = video.diffs.some((d) => d.field === "TITLE");
            const insight = await detectABTest(
              video.youtubeId,
              hasTitleDiff ? "TITLE" : "THUMBNAIL",
              titleDiffs.filter((d) => d.oldValue || d.newValue)
            );
            if (insight) insights.push({ ...insight, _type: "AB_TEST_DETECTED" });
          }
        }
      } catch (e: any) {
        errors.push(`AB_TEST_DETECTED: ${e.message}`);
      }
    }

    // Upload Schedule - deterministic computation
    const scheduleEnabled = await getAppConfig(CONFIG_KEYS.AI_UPLOAD_SCHEDULE);
    if (scheduleEnabled !== "false") {
      try {
        const publishDates = channel.videos
          .filter((v) => v.publishedAt)
          .map((v) => v.publishedAt!.toISOString());

        if (publishDates.length >= 3) {
          const insight = await analyzeUploadSchedule(channelId, publishDates);
          if (insight) insights.push({ ...insight, _type: "UPLOAD_SCHEDULE" });
        }
      } catch (e: any) {
        errors.push(`UPLOAD_SCHEDULE: ${e.message}`);
      }
    }

    // Title Pattern Analysis
    const titlePatternEnabled = await getAppConfig(CONFIG_KEYS.AI_TITLE_PATTERN);
    if (titlePatternEnabled !== "false") {
      try {
        const titles = channel.videos.map((v) => v.title);
        if (titles.length >= 5) {
          const insight = await analyzeTitlePatterns(channelId, titles);
          if (insight) insights.push({ ...insight, _type: "TITLE_PATTERN" });
        }
      } catch (e: any) {
        errors.push(`TITLE_PATTERN: ${e.message}`);
      }
    }

    // Thumbnail Style Analysis
    const thumbnailEnabled = await getAppConfig(CONFIG_KEYS.AI_INSIGHTS_ENABLED);
    if (thumbnailEnabled !== "false") {
      try {
        const thumbs = channel.videos
          .filter((v) => v.thumbnailUrl)
          .map((v) => v.thumbnailUrl!);
        if (thumbs.length >= 3) {
          const insight = await analyzeThumbnailStyle(channelId, thumbs);
          if (insight) insights.push({ ...insight, _type: "THUMBNAIL_STYLE" });
        }
      } catch (e: any) {
        errors.push(`THUMBNAIL_STYLE: ${e.message}`);
      }
    }

    // Competitor Summary
    const compSummaryEnabled = await getAppConfig(CONFIG_KEYS.AI_COMPETITOR_SUMMARY);
    if (compSummaryEnabled !== "false") {
      try {
        const recentDiffs = channel.videos
          .flatMap((v) =>
            v.diffs.map((d) => ({
              field: d.field,
              oldValue: d.oldValue,
              newValue: d.newValue,
              videoTitle: v.title,
              timestamp: d.detectedAt.toISOString(),
            }))
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 50);

        if (recentDiffs.length >= 3) {
          const insight = await generateCompetitorSummary(channelId, recentDiffs);
          if (insight) insights.push({ ...insight, _type: "COMPETITOR_SUMMARY" });
        }
      } catch (e: any) {
        errors.push(`COMPETITOR_SUMMARY: ${e.message}`);
      }
    }

    const savedInsights = await Promise.all(
      insights.map((insight) =>
        prisma.channelInsight.create({
          data: {
            channelId,
            type: insight._type,
            summary: insight.summary || insight.likelyWinner || JSON.stringify(insight),
            detail: JSON.stringify(insight),
          },
        })
      )
    );

    return NextResponse.json({ insights: savedInsights, errors: errors.length > 0 ? errors : undefined });
  } catch (error: any) {
    console.error("Analyze channel error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
