import { chatCompletionJSON } from "@/lib/llm/client";

export interface ContentGapInsight {
  channelAOnly: string[];
  channelBOnly: string[];
  trendingIntersections: string[];
  suggestedIdeas: { topic: string; rationale: string }[];
  reasoning: string;
}

export async function analyzeContentGaps(
  channelAId: string,
  channelBId: string,
  channelATitles: string[],
  channelBTitles: string[]
): Promise<ContentGapInsight | null> {
  if (channelATitles.length < 3 || channelBTitles.length < 3) return null;

  const titlesA = channelATitles.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const titlesB = channelBTitles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  return chatCompletionJSON<ContentGapInsight>(
    `You are a YouTube content strategist. Compare two channels' content and identify gaps and opportunities.

Identify:
- Topics Channel A covers that Channel B doesn't (channelAOnly)
- Topics Channel B covers that Channel A doesn't (channelBOnly)
- Topics trending in both niches (trendingIntersections)
- 3-5 content ideas for Channel A based on gaps, with rationale

Respond with this JSON schema:
{
  "channelAOnly": ["topics only in A"],
  "channelBOnly": ["topics only in B"],
  "trendingIntersections": ["topics in both"],
  "suggestedIdeas": [{"topic": string, "rationale": string}],
  "reasoning": "brief summary"
}`,
    `Channel A (${channelAId}) titles:\n${titlesA}\n\nChannel B (${channelBId}) titles:\n${titlesB}`
  );
}
