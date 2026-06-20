import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connectionOpts = { connection: { url: redisUrl } };

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, connectionOpts as any);
    queues.set(name, q);
  }
  return q;
}

export function getScrapeQueue(): Queue {
  return getQueue("channel-scrape");
}

export function getVideoScrapeQueue(): Queue {
  return getQueue("video-scrape");
}

export function getInsightQueue(): Queue {
  return getQueue("insight-generate");
}

export function getNotificationQueue(): Queue {
  return getQueue("notification-dispatch");
}
