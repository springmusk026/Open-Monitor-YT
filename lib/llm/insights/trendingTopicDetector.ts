import { chatCompletionJSON } from "@/lib/llm/client";

export interface TrendingTopicInsight {
  topics: { topic: string; recurrenceCount: number; channels: string[] }[];
  timeframe: string;
  reasoning: string;
}

export async function detectTrendingTopics(
  channelData: { channelId: string; channelName: string; titles: string[] }[],
  days: number = 7
): Promise<TrendingTopicInsight | null> {
  if (channelData.length < 2) return null;

  const dataText = channelData
    .map(
      (c) =>
        `Channel: ${c.channelName} (${c.channelId})\nTitles:\n${c.titles.map((t) => `  - ${t}`).join("\n")}`
    )
    .join("\n\n");

  return chatCompletionJSON<TrendingTopicInsight>(
    `You are a YouTube trend analyst. Identify topics that are appearing across multiple channels in the same niche.

Look for:
- Topics/keywords appearing in titles from multiple channels simultaneously
- Themes that suggest a trending event or content wave
- Rank by recurrence count (how many channels cover it)

Respond with this JSON schema:
{
  "topics": [{"topic": string, "recurrenceCount": number, "channels": ["channel names"]}],
  "timeframe": "last ${days} days",
  "reasoning": "brief explanation"
}`,
    `Channel data for trend analysis:\n\n${dataText}`
  );
}
