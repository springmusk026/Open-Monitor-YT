import { chatCompletionJSON } from "@/lib/llm/client";

export interface ThumbnailStyleInsight {
  channelId: string;
  urlPatterns: string[];
  namingConventions: string[];
  consistency: string;
  reasoning: string;
}

export async function analyzeThumbnailStyle(
  channelId: string,
  thumbnailUrls: string[]
): Promise<ThumbnailStyleInsight | null> {
  if (thumbnailUrls.length < 3) return null;

  const urlsText = thumbnailUrls.map((u, i) => `${i + 1}. ${u}`).join("\n");

  return chatCompletionJSON<ThumbnailStyleInsight>(
    `You are a YouTube analytics expert. Analyze the thumbnail URL patterns of a channel.

IMPORTANT: You CANNOT see the actual thumbnail images. Only analyze what can be inferred from the URLs themselves (file naming patterns, CDN paths, resolution indicators, format patterns, etc.). Do NOT guess about visual content like colors, faces, emotions, or text overlays.

Respond with this JSON schema:
{
  "channelId": string,
  "urlPatterns": ["patterns found in the URLs"],
  "namingConventions": ["naming conventions observed"],
  "consistency": "HIGH | MEDIUM | LOW",
  "reasoning": "brief explanation"
}`,
    `Channel ${channelId} - Recent thumbnail URLs:\n${urlsText}`
  );
}
