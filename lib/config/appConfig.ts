import { prisma } from "@/lib/db/prisma";

const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function getAppConfig(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const row = await prisma.appConfig.findUnique({ where: { key } });
  if (!row) return null;

  cache.set(key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS });
  return row.value;
}

export async function getAppConfigMany(
  keys: string[]
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const toFetch: string[] = [];

  for (const key of keys) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      result[key] = cached.value;
    } else {
      toFetch.push(key);
    }
  }

  if (toFetch.length > 0) {
    const rows = await prisma.appConfig.findMany({
      where: { key: { in: toFetch } },
    });
    const now = Date.now();
    for (const row of rows) {
      cache.set(row.key, { value: row.value, expiresAt: now + CACHE_TTL_MS });
      result[row.key] = row.value;
    }
    for (const key of toFetch) {
      if (!(key in result)) result[key] = null;
    }
  }

  return result;
}

export async function setAppConfig(
  key: string,
  value: string
): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  cache.delete(key);
}

export async function setAppConfigMany(
  entries: Record<string, string>
): Promise<void> {
  const ops = Object.entries(entries).map(([key, value]) =>
    prisma.appConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  );
  await prisma.$transaction(ops);
  for (const key of Object.keys(entries)) {
    cache.delete(key);
  }
}

export async function deleteAppConfig(key: string): Promise<void> {
  await prisma.appConfig.delete({ where: { key } });
  cache.delete(key);
}

export function getConfigTyped<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
