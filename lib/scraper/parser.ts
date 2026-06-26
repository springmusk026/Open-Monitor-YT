/**
 * Parse a human-readable count string into a bigint.
 * Handles: "1.5M", "150K", "1,234,567", "1234567", "1.234K", "0"
 */
export function parseSubscriberCount(raw: string): bigint | null {
  return parseCount(raw);
}

export function parseVideoCount(raw: string): number | null {
  const parsed = parseCount(raw);
  return parsed !== null ? Number(parsed) : null;
}

export function parseViewCount(raw: string): bigint | null {
  return parseCount(raw);
}

/**
 * Core parser: converts "1.5M", "150,000", "1.234K", etc. to bigint.
 * Returns null for empty/invalid input.
 */
function parseCount(raw: string): bigint | null {
  if (!raw || typeof raw !== "string") return null;

  // Normalize: trim, lowercase
  const s = raw.trim();
  if (!s || s === "No views" || s === "no views") return null;

  // Try abbreviated format: "1.5M", "150K", "1.234B"
  const abbrMatch = s.match(
    /^([\d,.]+)\s*([KMBkmb])\s*$/
  );
  if (abbrMatch) {
    const numStr = abbrMatch[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;
    const suffix = abbrMatch[2].toUpperCase();
    const multipliers: Record<string, number> = {
      K: 1_000,
      M: 1_000_000,
      B: 1_000_000_000,
    };
    const result = num * (multipliers[suffix] || 1);
    return BigInt(Math.round(result));
  }

  // Try plain number: "1234567" or "1,234,567"
  const plainMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*$/);
  if (plainMatch) {
    const numStr = plainMatch[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;
    return BigInt(Math.round(num));
  }

  // Try decimal with suffix attached: "1.5M" without space
  const noSpaceMatch = s.match(
    /^([\d,.]+)([KMBkmb])$/
  );
  if (noSpaceMatch) {
    const numStr = noSpaceMatch[1].replace(/,/g, "");
    const num = parseFloat(numStr);
    if (isNaN(num)) return null;
    const suffix = noSpaceMatch[2].toUpperCase();
    const multipliers: Record<string, number> = {
      K: 1_000,
      M: 1_000_000,
      B: 1_000_000_000,
    };
    const result = num * (multipliers[suffix] || 1);
    return BigInt(Math.round(result));
  }

  return null;
}

export function parseDuration(raw: string): string | null {
  if (!raw) return null;
  const parts = raw.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }

  return `${seconds}s`;
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function isChannelDeleted(markdown: string): boolean {
  const indicators = [
    "This channel doesn't exist",
    "This channel is not available",
    "is not available",
    "page not found",
  ];
  return indicators.some((i) => markdown.toLowerCase().includes(i.toLowerCase()));
}

/**
 * Validate that parsed data has minimum required fields.
 * Returns an array of warning messages for missing/invalid data.
 */
export function validateScrapedData(data: {
  name?: string;
  subscriberCount?: string;
  videoCount?: string;
  videos?: { youtubeId: string; title: string; viewCount: string }[];
}): string[] {
  const warnings: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    warnings.push("Channel name is empty");
  }

  if (!data.subscriberCount) {
    warnings.push("Subscriber count not found - YouTube may have changed page format");
  }

  if (!data.videoCount) {
    warnings.push("Video count not found");
  }

  if (data.videos && data.videos.length === 0) {
    warnings.push("No videos found - page format may have changed");
  }

  if (data.videos) {
    const missingViews = data.videos.filter(
      (v) => !v.viewCount || v.viewCount === "0"
    );
    if (missingViews.length > data.videos.length * 0.5) {
      warnings.push(
        `${missingViews.length}/${data.videos.length} videos missing view counts`
      );
    }
  }

  return warnings;
}
