import { Firecrawl } from "firecrawl";
import { getAppConfig } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";

let client: Firecrawl | null = null;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3_000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

interface ScrapeResult {
  markdown?: string;
  metadata?: Record<string, any>;
}

async function scrapeWithRetry(url: string): Promise<ScrapeResult> {
  const app = await getFirecrawlClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await app.scrape(url, {
        formats: ["markdown"],
        waitFor: 5000,
      });
      return result as any;
    } catch (err: any) {
      lastError = err;
      const isRetryable =
        err?.message?.includes("timeout") ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("ETIMEDOUT") ||
        err?.message?.includes("429") ||
        err?.message?.includes("503") ||
        err?.status === 429 ||
        err?.status === 503;

      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(
          `[scraper] Retry ${attempt + 1}/${MAX_RETRIES} for ${url}: ${err.message}`
        );
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("Scrape failed after retries");
}

export async function scrapeChannelPage(
  handle: string
): Promise<ChannelPageData> {
  handle = normalizeHandle(handle);
  const url = `https://www.youtube.com/@${handle}`;

  const result = await scrapeWithRetry(url);
  const markdown = result.markdown || "";
  const metadata = result.metadata || {};

  // Extract channel info from metadata (og tags)
  const name =
    metadata["og:title"] ||
    metadata.ogTitle ||
    (Array.isArray(metadata.name) ? metadata.name[0] : metadata.name) ||
    handle;
  const description =
    metadata["og:description"] || metadata.ogDescription || "";
  const avatarUrl = metadata["og:image"] || metadata.ogImage || "";

  // Extract videos from markdown
  const videos = parseVideosFromMarkdown(markdown);

  // Extract subscriber count - try multiple patterns
  const mainSection =
    markdown.split(/##\s*\[?Featured channels/i)[0] || markdown;
  const subscriberCount = extractSubscriberCount(mainSection);

  // Extract video count - try multiple patterns
  const videoCount = extractVideoCount(markdown);

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

function extractSubscriberCount(text: string): string {
  // Pattern 1: "1.5M subscribers" or "150K subscribers"
  const abbreviated = text.match(
    /([\d,.]+)\s*([KMBkmb])\s*subscribers/i
  );
  if (abbreviated) {
    return abbreviated[1].replace(/,/g, "") + abbreviated[2].toUpperCase();
  }

  // Pattern 2: "1,500,000 subscribers" or "1500000 subscribers"
  const plain = text.match(/([\d,]+)\s+subscribers/i);
  if (plain) {
    return plain[1].replace(/,/g, "");
  }

  // Pattern 3: "1.5M" near "subscribers" (within 30 chars)
  const loose = text.match(/([\d,.]+[KMBkmb]?)\s*subscri/i);
  if (loose) {
    return loose[1].replace(/,/g, "");
  }

  return "";
}

function extractVideoCount(text: string): string {
  // Avoid matching playlist counts like "[243 videos]" by looking for standalone text
  // Pattern 1: "1,234 videos" in channel header area
  const headerSection = text.split(/##\s*\[?Videos/i)[0] || text;
  const plainMatch = headerSection.match(/([\d,]+)\s+videos(?!\])/i);
  if (plainMatch) {
    return plainMatch[1].replace(/,/g, "");
  }

  // Pattern 2: "1.2K videos"
  const abbreviated = headerSection.match(
    /([\d,.]+)\s*([KMBkmb])\s*videos/i
  );
  if (abbreviated) {
    return abbreviated[1].replace(/,/g, "") + abbreviated[2].toUpperCase();
  }

  return "";
}

function parseVideosFromMarkdown(markdown: string): ScrapedVideo[] {
  const videos: ScrapedVideo[] = [];
  const seen = new Set<string>();

  // Primary pattern: [duration](videoUrl) followed by ### [title](videoUrl) then views/time
  const videoBlockRegex =
    /\[(\d+:\d+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^)]*\)\s*\n\s*###\s*\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}[^)]*\)\s*\n\s*([^\n]*)/g;

  let match;
  while ((match = videoBlockRegex.exec(markdown)) !== null) {
    const [, duration, videoId, title, metaLine] = match;
    if (seen.has(videoId)) continue;
    seen.add(videoId);

    const { viewCount, publishedAt } = parseMetaLine(metaLine);

    videos.push({
      youtubeId: videoId,
      title: title.trim(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt,
      viewCount,
      duration,
    });
  }

  // Fallback: simpler pattern for videos that don't match the block format
  if (videos.length === 0) {
    const simpleRegex =
      /###\s*\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^)]*\)\s*\n\s*([^\n]*)/g;
    while ((match = simpleRegex.exec(markdown)) !== null) {
      const [, title, videoId, metaLine] = match;
      if (seen.has(videoId)) continue;
      seen.add(videoId);

      const { viewCount, publishedAt } = parseMetaLine(metaLine);
      const durationMatch = markdown
        .slice(Math.max(0, match.index - 50), match.index)
        .match(/\[(\d+:\d+)\]/);

      videos.push({
        youtubeId: videoId,
        title: title.trim(),
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        publishedAt,
        viewCount,
        duration: durationMatch ? durationMatch[1] : "",
      });
    }
  }

  // Fallback 2: look for any YouTube video links with just a title
  if (videos.length === 0) {
    const linkRegex =
      /\[([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})[^)]*\)/g;
    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, title, videoId] = match;
      if (seen.has(videoId)) continue;
      seen.add(videoId);

      // Try to find duration nearby (within 200 chars before)
      const before = markdown.slice(Math.max(0, match.index - 200), match.index);
      const durationMatch = before.match(/\[(\d+:\d+)\]/);

      // Try to find view count nearby (within 200 chars after)
      const after = markdown.slice(match.index, match.index + 200);
      const viewMatch = after.match(/([\d,.]+[KMBkmb]?)\s*views/i);

      videos.push({
        youtubeId: videoId,
        title: title.trim(),
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        publishedAt: "",
        viewCount: viewMatch ? viewMatch[1].replace(/,/g, "") : "",
        duration: durationMatch ? durationMatch[1] : "",
      });
    }
  }

  return videos;
}

function parseMetaLine(metaLine: string): {
  viewCount: string;
  publishedAt: string;
} {
  if (!metaLine) return { viewCount: "", publishedAt: "" };

  // Handle various formats:
  // "25K views • 37 minutes ago"
  // "1,234 views • 2 days ago"
  // "No views • 1 hour ago"
  // "25K views"
  // "Streamed 3 days ago • 1.2K views"
  // "1.2K watching"

  let viewCount = "";
  let publishedAt = "";

  // Try to extract view count - multiple patterns
  const viewPatterns = [
    /([\d,.]+)\s*([KMBkmb])\s*views/i, // "1.5M views"
    /([\d,]+)\s+views/i, // "1,234 views"
    /([\d,.]+)\s*([KMBkmb])\s*watching/i, // "1.2K watching" (live)
    /No\s+views/i, // "No views"
  ];

  for (const pattern of viewPatterns) {
    const m = metaLine.match(pattern);
    if (m) {
      if (m[0].toLowerCase().includes("no views")) {
        viewCount = "0";
      } else if (m[2]) {
        viewCount = m[1].replace(/,/g, "") + m[2].toUpperCase();
      } else {
        viewCount = m[1].replace(/,/g, "");
      }
      break;
    }
  }

  // Try to extract published time
  const timePatterns = [
    /•\s*(.+?)$/, // "• 37 minutes ago"
    /(Streamed\s+.+?)$/, // "Streamed 3 days ago"
    /(\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago)/i,
    /(Premiered\s+.+?)$/i,
  ];

  for (const pattern of timePatterns) {
    const m = metaLine.match(pattern);
    if (m) {
      publishedAt = m[1].trim();
      break;
    }
  }

  return { viewCount, publishedAt };
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
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  const result = await scrapeWithRetry(url);
  const markdown = result.markdown || "";
  const metadata = result.metadata || {};

  // Extract from metadata first
  let likeCount = "";
  let viewCount = "";

  // userInteractionCount: ["likeCount", "viewCount"] - fragile, try multiple approaches
  const interactions = metadata.userInteractionCount;
  if (Array.isArray(interactions) && interactions.length >= 2) {
    likeCount = String(interactions[0] || "");
    viewCount = String(interactions[1] || "");
  }

  // Fallback: extract from markdown if metadata is missing
  if (!viewCount) {
    const viewPatterns = [
      /([\d,.]+)\s*([KMBkmb])\s*views/i,
      /([\d,]+)\s+views/i,
    ];
    for (const pattern of viewPatterns) {
      const m = markdown.match(pattern);
      if (m) {
        viewCount = m[2]
          ? m[1].replace(/,/g, "") + m[2].toUpperCase()
          : m[1].replace(/,/g, "");
        break;
      }
    }
  }

  if (!likeCount) {
    const likePatterns = [
      /([\d,.]+)\s*([KMBkmb])\s*likes/i,
      /([\d,]+)\s+likes/i,
    ];
    for (const pattern of likePatterns) {
      const m = markdown.match(pattern);
      if (m) {
        likeCount = m[2]
          ? m[1].replace(/,/g, "") + m[2].toUpperCase()
          : m[1].replace(/,/g, "");
        break;
      }
    }
  }

  // Parse ISO duration PT5M20S → "5:20"
  let duration = parseIsoDuration(metadata.duration || "");

  // Fallback: extract duration from markdown
  if (!duration) {
    const durationMatch = markdown.match(/\[(\d+:\d+(?::\d+)?)\]/);
    if (durationMatch) {
      duration = durationMatch[1];
    }
  }

  // Tags from og:video:tag or keywords
  let tags: string[] = [];
  if (Array.isArray(metadata["og:video:tag"])) {
    tags = metadata["og:video:tag"];
  } else if (Array.isArray(metadata.keywords)) {
    const raw = metadata.keywords[metadata.keywords.length - 1] || "";
    tags = raw
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  // Fallback: extract tags from markdown hashtags
  if (tags.length === 0) {
    const hashtagMatches = markdown.matchAll(/#(\w+)/g);
    const tagSet = new Set<string>();
    for (const m of hashtagMatches) {
      tagSet.add(m[1]);
    }
    tags = Array.from(tagSet).slice(0, 20);
  }

  return {
    youtubeId,
    title: metadata["og:title"] || metadata.ogTitle || "",
    description: metadata["og:description"] || metadata.ogDescription || "",
    thumbnailUrl:
      metadata["og:image"] ||
      metadata.ogImage ||
      `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
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
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
