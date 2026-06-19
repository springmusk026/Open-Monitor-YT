import { chatCompletionJSON } from "@/lib/llm/client";

export interface ThumbnailStyleInsight {
  channelId: string;
  dominantStyle: string;
  colorPatterns: string[];
  textOverlayFrequency: string;
  faceForwardFrequency: string;
  emotionPatterns: string[];
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
    `You are a YouTube thumbnail expert. Analyze the thumbnail style patterns of a channel.

For each thumbnail URL provided, describe:
- Visual style (face-forward, text-heavy, object-focused, screenshot-based, etc.)
- Dominant colors
- Text overlay presence and style
- Emotion/expression patterns
- Overall consistency

Respond with JSON matching the required schema.`,
    `Channel ${channelId} - Recent thumbnail URLs:\n${urlsText}`
  );
}
