import { Queue, Worker } from "bullmq";

let redisUrl: string | null = null;

function getRedisUrl(): string {
  if (!redisUrl) {
    redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  }
  return redisUrl;
}

export function getScrapeQueue(): Queue {
  return new Queue("channel-scrape", {
    connection: { url: getRedisUrl() },
  } as any);
}

export function getVideoScrapeQueue(): Queue {
  return new Queue("video-scrape", {
    connection: { url: getRedisUrl() },
  } as any);
}

export function getInsightQueue(): Queue {
  return new Queue("insight-generate", {
    connection: { url: getRedisUrl() },
  } as any);
}

export function getNotificationQueue(): Queue {
  return new Queue("notification-dispatch", {
    connection: { url: getRedisUrl() },
  } as any);
}

export function createWorker(
  queueName: string,
  handler: (jobData: any) => Promise<any>
): Worker {
  return new Worker(
    queueName,
    async (job) => {
      return handler(job.data);
    },
    { connection: { url: getRedisUrl() } } as any
  );
}
