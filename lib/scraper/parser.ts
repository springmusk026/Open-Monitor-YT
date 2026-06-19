export function parseSubscriberCount(raw: string): bigint | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.KMBkmb]/g, "").trim();
  const match = cleaned.match(/([\d.]+)\s*([KMBkmb]?)/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
  };

  const result = num * (multipliers[suffix] || 1);
  return BigInt(Math.round(result));
}

export function parseVideoCount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : null;
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

export function parseViewCount(raw: string): bigint | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.KMBkmb]/g, "").trim();
  const match = cleaned.match(/([\d.]+)\s*([KMBkmb]?)/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
  };

  return BigInt(Math.round(num * (multipliers[suffix] || 1)));
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
