import { chatCompletionJSON } from "@/lib/llm/client";

export interface ABTestInsight {
  videoId: string;
  testedField: "TITLE" | "THUMBNAIL";
  variants: string[];
  likelyWinner: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

export async function detectABTest(
  videoId: string,
  field: "TITLE" | "THUMBNAIL",
  changes: { oldValue: string; newValue: string; timestamp: string }[]
): Promise<ABTestInsight | null> {
  if (changes.length < 2) return null;

  const changesText = changes
    .map(
      (c, i) =>
        `Change ${i + 1} at ${c.timestamp}:\n  Old: ${c.oldValue}\n  New: ${c.newValue}`
    )
    .join("\n\n");

  const result = await chatCompletionJSON<ABTestInsight>(
    `You are a YouTube analytics expert. Analyze whether the following changes to a video's ${field.toLowerCase()} represent A/B testing behavior.

A/B testing on YouTube typically involves:
- Multiple changes within a short time window (usually within 48h of publish)
- Testing different hooks, keywords, or visual styles
- The "winner" is often correlated with view count increases

Respond with this JSON schema:
{
  "videoId": string,
  "testedField": "TITLE" | "THUMBNAIL",
  "variants": ["list of all variant values tested"],
  "likelyWinner": "the variant that appears to have won",
  "confidence": "HIGH | MEDIUM | LOW",
  "reasoning": "brief explanation of why this looks like A/B testing"
}`,
    `Changes to video ${videoId}:\n\n${changesText}`
  );

  return result;
}
