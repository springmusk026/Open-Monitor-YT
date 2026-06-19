import { Firecrawl } from "firecrawl";
import { getAppConfig } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";

let client: Firecrawl | null = null;

export async function getFirecrawlClient(): Promise<Firecrawl> {
  if (client) return client;

  const [baseUrl, apiKey] = await Promise.all([
    getAppConfig(CONFIG_KEYS.FIRECRAWL_BASE_URL),
    getAppConfig(CONFIG_KEYS.FIRECRAWL_API_KEY),
  ]);

  client = new Firecrawl({
    apiKey: apiKey || undefined,
    ...(baseUrl ? { baseUrl } : {}),
  });

  return client;
}

export function resetFirecrawlClient(): void {
  client = null;
}

/**
 * Extracts the bare handle from various YouTube URL/handle formats:
 * - "https://www.youtube.com/@Fireship" → "Fireship"
 * - "https://www.youtube.com/Fireship" → "Fireship"
 * - "https://m.youtube.com/Fireship?ra=m" → "Fireship"
 * - "@Fireship" → "Fireship"
 * - "Fireship" → "Fireship"
 */
export function normalizeHandle(input: string): string {
  let h = input.trim();
  // Strip YouTube URL prefix
  h = h.replace(/^https?:\/\/(?:www\.|m\.)?youtube\.com\//, "");
  // Strip leading @
  h = h.replace(/^@/, "");
  // Strip trailing slashes and query params
  h = h.replace(/[?/].*$/, "");
  return h;
}

export interface ChannelPageData {
  name: string;
  handle: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  avatarUrl: string;
  bannerUrl: string;
  videos: ScrapedVideo[];
}

export interface ScrapedVideo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
  description?: string;
}

export async function scrapeChannelPage(
  handle: string
): Promise<ChannelPageData> {
  const app = await getFirecrawlClient();
  handle = normalizeHandle(handle);
  const url = `https://www.youtube.com/@${handle}`;

  const result = await app.scrape(url, {
    formats: ["markdown"],
    waitFor: 5000,
  });

  const markdown = (result as any).markdown || "";
  const metadata = (result as any).metadata || {};

  // Extract channel info from metadata (og tags)
  const name = metadata["og:title"] || metadata.ogTitle || 
    (Array.isArray(metadata.name) ? metadata.name[0] : metadata.name) || handle;
  const description = metadata["og:description"] || metadata.ogDescription || "";
  const avatarUrl = metadata["og:image"] || metadata.ogImage || "";

  // Extract videos from markdown
  const videos = parseVideosFromMarkdown(markdown);

  // Extract subscriber count from markdown - only look before "Featured channels" section
  // to avoid picking up subscriber counts from linked/featured channels
  const mainSection = markdown.split(/##\s*\[?Featured channels/i)[0] || markdown;
  const subMatch = mainSection.match(/([\d.]+[KMB]?)\s*subscribers/i);
  const subscriberCount = subMatch ? subMatch[1] : "";

  // Extract video count from markdown - match "N videos" in the Videos section header area
  const vidCountMatch = markdown.match(/(\d[\d,]*)\s*videos\]/i) || markdown.match(/(\d[\d,]*)\s*videos/i);
  const videoCount = vidCountMatch ? vidCountMatch[1].replace(/,/g, "") : "";

  return {
    name,
    handle: `@${handle}`,
    description,
    subscriberCount,
    videoCount,
    avatarUrl,
    bannerUrl: "",
    videos,
  };
}

function parseVideosFromMarkdown(markdown: string): ScrapedVideo[] {
  const videos: ScrapedVideo[] = [];
  const seen = new Set<string>();

  // Pattern: [duration](videoUrl) followed by ### [title](videoUrl) then views/time
  const videoBlockRegex = /\[(\d+:\d+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^)]*\)\s*\n\s*###\s*\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}[^)]*\)\s*\n\s*([^\n]*)/g;

  let match;
  while ((match = videoBlockRegex.exec(markdown)) !== null) {
    const [, duration, videoId, title, metaLine] = match;
    if (seen.has(videoId)) continue;
    seen.add(videoId);

    // Parse view count and time from meta line like "25K views • 37 minutes ago"
    const viewMatch = metaLine.match(/([\d,.]+[KMB]?)\s*views/i);
    const timeMatch = metaLine.match(/•\s*(.+?)$/);

    videos.push({
      youtubeId: videoId,
      title: title.trim(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: timeMatch ? timeMatch[1].trim() : "",
      viewCount: viewMatch ? viewMatch[1] : "",
      duration,
    });
  }

  // Fallback: simpler pattern for videos that don't match the block format
  if (videos.length === 0) {
    const simpleRegex = /###\s*\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^)]*\)\s*\n\s*([^\n]*)/g;
    while ((match = simpleRegex.exec(markdown)) !== null) {
      const [, title, videoId, metaLine] = match;
      if (seen.has(videoId)) continue;
      seen.add(videoId);

      const viewMatch = metaLine.match(/([\d,.]+[KMB]?)\s*views/i);
      const timeMatch = metaLine.match(/•\s*(.+?)$/);
      const durationMatch = markdown.slice(Math.max(0, match.index - 50), match.index).match(/\[(\d+:\d+)\]/);

      videos.push({
        youtubeId: videoId,
        title: title.trim(),
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        publishedAt: timeMatch ? timeMatch[1].trim() : "",
        viewCount: viewMatch ? viewMatch[1] : "",
        duration: durationMatch ? durationMatch[1] : "",
      });
    }
  }

  return videos;
}

export interface VideoPageData {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  duration: string;
  tags: string[];
}

export async function scrapeVideoPage(
  youtubeId: string
): Promise<VideoPageData> {
  const app = await getFirecrawlClient();
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  const result = await app.scrape(url, {
    formats: ["markdown"],
    waitFor: 5000,
  });

  const metadata = (result as any).metadata || {};

  // userInteractionCount: ["likeCount", "viewCount"]
  const interactions = metadata.userInteractionCount;
  let likeCount = "";
  let viewCount = "";
  if (Array.isArray(interactions) && interactions.length >= 2) {
    likeCount = interactions[0];
    viewCount = interactions[1];
  }

  // Parse ISO duration PT5M20S → "5:20"
  const duration = parseIsoDuration(metadata.duration || "");

  // Tags from og:video:tag or keywords
  let tags: string[] = [];
  if (Array.isArray(metadata["og:video:tag"])) {
    tags = metadata["og:video:tag"];
  } else if (Array.isArray(metadata.keywords)) {
    const raw = metadata.keywords[metadata.keywords.length - 1] || "";
    tags = raw.split(",").map((t: string) => t.trim()).filter(Boolean);
  }

  return {
    youtubeId,
    title: metadata["og:title"] || metadata.ogTitle || "",
    description: metadata["og:description"] || metadata.ogDescription || "",
    thumbnailUrl: metadata["og:image"] || metadata.ogImage || `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
    publishedAt: metadata.datePublished || metadata.uploadDate || "",
    viewCount,
    likeCount,
    duration,
    tags,
  };
}

function parseIsoDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
