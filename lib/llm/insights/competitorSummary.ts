import { chatCompletionJSON } from "@/lib/llm/client";

export interface CompetitorSummaryInsight {
  channelId: string;
  summary: string;
  experimentsRun: string[];
  topicsDoubledDown: string[];
  packagingShifts: string[];
}

export async function generateCompetitorSummary(
  channelId: string,
  recentDiffs: {
    field: string;
    oldValue: string | null;
    newValue: string | null;
    videoTitle: string;
    timestamp: string;
  }[]
): Promise<CompetitorSummaryInsight | null> {
  if (recentDiffs.length < 3) return null;

  const diffsText = recentDiffs
    .map(
      (d) =>
        `[${d.timestamp}] "${d.videoTitle}" - ${d.field}: ${d.oldValue || "N/A"} → ${d.newValue || "N/A"}`
    )
    .join("\n");

  return chatCompletionJSON<CompetitorSummaryInsight>(
    `You are a competitive intelligence analyst. Summarize what this YouTube channel has been doing based on their content changes.

Write a 3-paragraph executive summary covering:
1. What experiments or changes they've been running
2. Topics or themes they're doubling down on
3. Any shifts in their packaging strategy (titles, thumbnails, descriptions)

Respond with this JSON schema:
{
  "channelId": string,
  "summary": "3-paragraph executive summary",
  "experimentsRun": ["list of experiments"],
  "topicsDoubledDown": ["topics"],
  "packagingShifts": ["shifts"]
}`,
    `Channel ${channelId} recent activity diffs:\n\n${diffsText}`
  );
}
