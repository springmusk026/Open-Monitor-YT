import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const channelId = searchParams.get("channelId");
    const filter = searchParams.get("filter");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (channelId) {
      where.video = { channelId };
    }
    if (filter && filter !== "ALL") {
      if (filter === "AI_INSIGHTS") {
        return NextResponse.json({ items: [], total: 0, page, limit });
      }
      where.field = filter;
    }

    const [diffs, total] = await Promise.all([
      prisma.videoDiff.findMany({
        where,
        include: {
          video: {
            include: {
              channel: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { detectedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.videoDiff.count({ where }),
    ]);

    const items = diffs.map((d) => ({
      id: d.id,
      field: d.field,
      oldValue: d.oldValue,
      newValue: d.newValue,
      detectedAt: d.detectedAt,
      video: {
        id: d.video.id,
        youtubeId: d.video.youtubeId,
        title: d.video.title,
        thumbnailUrl: d.video.thumbnailUrl,
      },
      channel: d.video.channel,
    }));

    return NextResponse.json({ items, total, page, limit });
  } catch (error: any) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
