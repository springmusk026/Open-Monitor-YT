import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { normalizeHandle } from "@/lib/scraper/firecrawlClient";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { videos: true, insights: true } },
        snapshots: { orderBy: { snappedAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ channels });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, youtubeId, avatarUrl, bannerUrl, description, label } = body;
    const handle = normalizeHandle(body.handle || "");

    if (!handle) {
      return NextResponse.json(
        { error: "handle is required" },
        { status: 400 }
      );
    }

    // Check for existing channel with same handle or youtubeId
    const existing = await prisma.channel.findFirst({
      where: {
        OR: [
          { handle },
          { youtubeId: youtubeId || handle },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Channel already exists", channelId: existing.id },
        { status: 409 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        youtubeId: youtubeId || handle,
        handle,
        name: name || handle,
        avatarUrl,
        bannerUrl,
        description,
        label,
      },
    });

    return NextResponse.json({ channel });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
