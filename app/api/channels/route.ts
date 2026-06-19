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
    const { name, youtubeId, avatarUrl, bannerUrl, description } = body;
    const handle = normalizeHandle(body.handle || "");

    const channel = await prisma.channel.create({
      data: {
        youtubeId: youtubeId || handle,
        handle,
        name,
        avatarUrl,
        bannerUrl,
        description,
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
