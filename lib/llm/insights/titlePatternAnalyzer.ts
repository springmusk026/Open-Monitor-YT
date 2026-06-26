import { chatCompletionJSON } from "@/lib/llm/client";

export interface TitlePatternInsight {
  channelId: string;
  patterns: string[];
  averageTitleLength: number;
  questionVsStatement: string;
  emojiUsage: string;
  powerWords: string[];
  listicleFrequency: string;
  reasoning: string;
}

export async function analyzeTitlePatterns(
  channelId: string,
  titles: string[]
): Promise<TitlePatternInsight | null> {
  if (titles.length < 5) return null;

  const titlesText = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");

  return chatCompletionJSON<TitlePatternInsight>(
    `You are a YouTube content strategist. Analyze the title patterns of this channel's videos.

Identify:
- Recurring patterns (listicles, "I tried X", "vs" comparisons, emotional hooks, how-to, etc.)
- Average title length in characters
- Question vs statement ratio
- Emoji usage frequency and patterns
- Power words that appear frequently
- Listicle frequency (X things, top N, etc.)

Respond with this JSON schema:
{
  "channelId": string,
  "patterns": ["recurring title patterns"],
  "averageTitleLength": number,
  "questionVsStatement": "ratio or description",
  "emojiUsage": "NONE | RARE | FREQUENT",
  "powerWords": ["common power words"],
  "listicleFrequency": "NONE | RARE | FREQUENT",
  "reasoning": "brief explanation"
}`,
    `Channel ${channelId} - Last ${titles.length} video titles:\n${titlesText}`
  );
}
