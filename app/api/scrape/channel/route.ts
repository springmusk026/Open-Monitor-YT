import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { scrapeChannelPage, normalizeHandle } from "@/lib/scraper/firecrawlClient";
import { parseSubscriberCount, parseVideoCount } from "@/lib/scraper/parser";
import { diffSnapshots } from "@/lib/diff/differ";
import { getScrapeQueue } from "@/lib/queue/queues";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle: rawHandle, channelId } = body;
    const handle = rawHandle ? normalizeHandle(rawHandle) : "";

    if (!handle && !channelId) {
      return NextResponse.json(
        { error: "handle or channelId is required" },
        { status: 400 }
      );
    }

    let channel;
    if (channelId) {
      channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });
    } else {
      channel = await prisma.channel.findFirst({
        where: { handle },
      });
    }

    if (channel) {
      const queue = getScrapeQueue();
      const job = await queue.add(
        "channel-scrape",
        { channelId: channel.id, handle: channel.handle || handle },
        { priority: 1 }
      );
      return NextResponse.json({ jobId: job.id, channelId: channel.id });
    }

    const data = await scrapeChannelPage(handle);
    const subCount = parseSubscriberCount(data.subscriberCount);
    const vidCount = parseVideoCount(data.videoCount);

    channel = await prisma.channel.create({
      data: {
        youtubeId: handle,
        handle,
        name: data.name,
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
        description: data.description,
        subscriberCount: subCount,
        videoCount: vidCount,
      },
    });

    await prisma.channelSnapshot.create({
      data: {
        channelId: channel.id,
        subscriberCount: subCount,
        videoCount: vidCount,
        description: data.description,
      },
    });

    const queue = getScrapeQueue();
    const job = await queue.add(
      "channel-scrape",
      { channelId: channel.id, handle: handle },
      { priority: 1 }
    );

    return NextResponse.json({ jobId: job.id, channelId: channel.id });
  } catch (error: any) {
    console.error("Scrape channel error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
