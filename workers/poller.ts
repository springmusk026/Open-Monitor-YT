import { Worker, Queue } from "bullmq";
import { prisma } from "../lib/db/prisma.js";
import { scrapeChannelPage, scrapeVideoPage, normalizeHandle } from "../lib/scraper/firecrawlClient.js";
import { parseSubscriberCount, parseVideoCount, parseViewCount, validateScrapedData } from "../lib/scraper/parser.js";
import { diffSnapshots, SnapshotData } from "../lib/diff/differ.js";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connectionOpts = { connection: { url: redisUrl } };

const scrapeQueue = new Queue("channel-scrape", connectionOpts as any);

const DEFAULT_INTERVAL_MS = 60_000;
const JOB_ATTEMPTS = 3;
const JOB_BACKOFF = { type: "exponential" as const, delay: 5_000 };

// Read polling interval from DB, fallback to 60s
async function getPollingIntervalMs(): Promise<number> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: "polling.intervalMinutes" } });
    if (row?.value) {
      const mins = parseInt(row.value);
      if (!isNaN(mins) && mins > 0) return mins * 60_000;
    }
  } catch {}
  return DEFAULT_INTERVAL_MS;
}

// Read max channels from DB, fallback to unlimited
async function getMaxChannels(): Promise<number> {
  try {
    const row = await prisma.appConfig.findUnique({ where: { key: "polling.maxChannels" } });
    if (row?.value) {
      const max = parseInt(row.value);
      if (!isNaN(max) && max > 0) return max;
    }
  } catch {}
  return Infinity;
}

// Remove existing repeat jobs before adding to avoid duplicates on restart
async function setupTickSchedule() {
  const existing = await scrapeQueue.getRepeatableJobs();
  for (const job of existing) {
    await scrapeQueue.removeRepeatableByKey(job.key);
  }
  const interval = await getPollingIntervalMs();
  await scrapeQueue.add("tick", {}, { repeat: { every: interval } });
  console.log(`[worker] Polling interval set to ${interval / 1000}s`);
}
setupTickSchedule();

const tickWorker = new Worker(
  "tick",
  async () => {
    // Check if polling is globally enabled
    const enabled = await prisma.appConfig.findUnique({ where: { key: "polling.enabled" } });
    if (enabled?.value === "false") return;

    const maxChannels = await getMaxChannels();
    const channels = await prisma.channel.findMany({
      where: { pollingPaused: false },
      take: Number.isFinite(maxChannels) ? maxChannels : undefined,
      orderBy: { lastPolledAt: "asc" },
    });

    for (const channel of channels) {
      await scrapeQueue.add(
        "channel-scrape",
        { channelId: channel.id, handle: channel.handle },
        {
          priority: 1,
          attempts: JOB_ATTEMPTS,
          backoff: JOB_BACKOFF,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );
    }
  },
  connectionOpts as any
);

const scrapeWorker = new Worker(
  "channel-scrape",
  async (job) => {
    const { channelId, handle } = job.data;
    if (!channelId || !handle) {
      return { skipped: true };
    }
    const normalizedHandle = normalizeHandle(handle);
    console.log(`[worker] Scraping channel ${channelId} (@${normalizedHandle})`);

    // Verify channel still exists
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      console.log(`[worker] Channel ${channelId} no longer exists, skipping`);
      return { channelId, skipped: true };
    }

    try {
      const data = await scrapeChannelPage(normalizedHandle);
      const subCount = parseSubscriberCount(data.subscriberCount);
      const vidCount = parseVideoCount(data.videoCount);

      // Log data quality warnings
      const warnings = validateScrapedData(data);
      if (warnings.length > 0) {
        console.warn(`[worker] Data quality warnings for ${normalizedHandle}:`, warnings);
      }

      // Update channel metadata
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          name: data.name,
          avatarUrl: data.avatarUrl,
          bannerUrl: data.bannerUrl,
          description: data.description,
          subscriberCount: subCount,
          videoCount: vidCount,
          lastPolledAt: new Date(),
        },
      });

      // Snapshot deduplication: only create if data changed from last snapshot
      const lastChannelSnapshot = await prisma.channelSnapshot.findFirst({
        where: { channelId },
        orderBy: { snappedAt: "desc" },
      });

      const channelDataChanged = !lastChannelSnapshot ||
        lastChannelSnapshot.subscriberCount !== subCount ||
        lastChannelSnapshot.videoCount !== vidCount ||
        lastChannelSnapshot.description !== data.description;

      if (channelDataChanged) {
        await prisma.channelSnapshot.create({
          data: {
            channelId,
            subscriberCount: subCount,
            videoCount: vidCount,
            description: data.description,
          },
        });
      }

      // Batch fetch all existing videos for this channel in one query
      const existingVideos = await prisma.video.findMany({
        where: {
          channelId,
          youtubeId: { in: data.videos.map((v) => v.youtubeId) },
        },
        include: {
          snapshots: { orderBy: { snappedAt: "desc" }, take: 1 },
        },
      });

      const existingVideoMap = new Map(existingVideos.map((v) => [v.youtubeId, v]));

      const allDiffs: any[] = [];
      const videoOps: Promise<any>[] = [];

      for (const scrapedVideo of data.videos) {
        let video = existingVideoMap.get(scrapedVideo.youtubeId);

        let viewCount = parseViewCount(scrapedVideo.viewCount);
        let likeCount: bigint | null = null;
        let description: string | null = scrapedVideo.description || null;
        let tags: string[] = [];
        let publishedAt: Date | null = null;
        let title = scrapedVideo.title;
        let thumbnailUrl = scrapedVideo.thumbnailUrl;
        let duration = scrapedVideo.duration;

        // For new videos, scrape the individual video page for full details
        if (!video) {
          try {
            const videoData = await scrapeVideoPage(scrapedVideo.youtubeId);
            viewCount = parseViewCount(videoData.viewCount) ?? viewCount;
            likeCount = parseViewCount(videoData.likeCount);
            description = videoData.description || description;
            tags = videoData.tags;
            title = videoData.title || title;
            thumbnailUrl = videoData.thumbnailUrl || thumbnailUrl;
            duration = videoData.duration || duration;
            if (videoData.publishedAt) {
              const d = new Date(videoData.publishedAt);
              if (!isNaN(d.getTime())) publishedAt = d;
            }
          } catch (e: any) {
            console.warn(`[worker] Video page scrape failed for ${scrapedVideo.youtubeId}: ${e.message}`);
          }

          video = await prisma.video.create({
            data: {
              youtubeId: scrapedVideo.youtubeId,
              channelId,
              title,
              description,
              thumbnailUrl,
              tags,
              publishedAt,
              viewCount,
              likeCount,
              duration,
            },
            include: {
              snapshots: { orderBy: { snappedAt: "desc" }, take: 1 },
            },
          });
        } else {
          // For existing videos, preserve DB values for fields not available from channel page
          tags = video.tags || [];
          description = video.description || null;
          likeCount = video.likeCount;
        }

        const prevSnapshot = video.snapshots[0];
        const nextSnapshotData: SnapshotData = {
          title,
          thumbnailUrl,
          description,
          tags,
          viewCount: viewCount?.toString() || null,
          likeCount: likeCount?.toString() || null,
        };

        if (prevSnapshot) {
          const prevData: SnapshotData = {
            title: prevSnapshot.title,
            thumbnailUrl: prevSnapshot.thumbnailUrl,
            description: prevSnapshot.description,
            tags: prevSnapshot.tags,
            viewCount: prevSnapshot.viewCount?.toString() || null,
            likeCount: prevSnapshot.likeCount?.toString() || null,
          };

          const diffs = diffSnapshots(prevData, nextSnapshotData);
          for (const diff of diffs) {
            allDiffs.push({
              videoId: video.id,
              field: diff.field,
              oldValue: diff.oldValue,
              newValue: diff.newValue,
            });
          }
        }

        // Snapshot deduplication: only create if video data changed
        const videoDataChanged = !prevSnapshot ||
          prevSnapshot.title !== title ||
          prevSnapshot.thumbnailUrl !== thumbnailUrl ||
          prevSnapshot.description !== description ||
          JSON.stringify(prevSnapshot.tags) !== JSON.stringify(tags) ||
          prevSnapshot.viewCount?.toString() !== viewCount?.toString() ||
          prevSnapshot.likeCount?.toString() !== likeCount?.toString();

        if (videoDataChanged) {
          videoOps.push(
            prisma.videoSnapshot.create({
              data: {
                videoId: video.id,
                title,
                thumbnailUrl,
                description,
                tags,
                viewCount,
                likeCount,
              },
            })
          );
        }

        // Always update the video's current state
        videoOps.push(
          prisma.video.update({
            where: { id: video.id },
            data: {
              title,
              thumbnailUrl,
              viewCount,
              likeCount,
              duration,
            },
          })
        );
      }

      // Batch insert all diffs in a single transaction
      if (allDiffs.length > 0) {
        videoOps.push(
          prisma.videoDiff.createMany({
            data: allDiffs,
          }) as any
        );
      }

      // Execute all video operations in a single transaction
      if (videoOps.length > 0) {
        await prisma.$transaction(videoOps as any);
      }

      if (allDiffs.length > 0) {
        console.log(`[worker] Found ${allDiffs.length} diffs for ${normalizedHandle}`);
      }

      return { channelId, diffs: allDiffs.length };
    } catch (error: any) {
      console.error(`[worker] Scrape failed for ${normalizedHandle}:`, error.message);

      // Count recent consecutive failures (snapshots in last 10 minutes = 0 means all recent polls failed)
      const recentSuccess = await prisma.channelSnapshot.count({
        where: {
          channelId,
          snappedAt: { gte: new Date(Date.now() - 10 * 60_000) },
        },
      });

      if (recentSuccess === 0) {
        // Check if job has been retried enough times
        const attempts = job.attemptsMade || 0;
        if (attempts >= JOB_ATTEMPTS - 1) {
          await prisma.channel.update({
            where: { id: channelId },
            data: { pollingPaused: true },
          });
          console.log(`[worker] Paused polling for ${normalizedHandle} after ${attempts + 1} failures`);
        }
      }

      throw error;
    }
  },
  { ...connectionOpts, concurrency: 3 } as any
);

scrapeWorker.on("completed", (job) => {
  if (job.data.handle) console.log(`[worker] Completed scrape for ${normalizeHandle(job.data.handle)}`);
});

scrapeWorker.on("failed", (job, err) => {
  if (job?.data.handle) console.error(`[worker] Failed: ${normalizeHandle(job.data.handle)} - ${err.message}`);
});

console.log("[worker] Poller started. Waiting for jobs...");

process.on("SIGTERM", async () => {
  console.log("[worker] Shutting down...");
  await scrapeWorker.close();
  await tickWorker.close();
  process.exit(0);
});
