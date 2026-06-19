import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { publishedAt: "desc" },
          take: 50,
          include: {
            _count: { select: { diffs: true } },
          },
        },
        snapshots: { orderBy: { snappedAt: "desc" }, take: 30 },
        insights: { orderBy: { generatedAt: "desc" }, take: 20 },
        _count: { select: { videos: true, insights: true } },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const channel = await prisma.channel.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ channel });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.videoDiff.deleteMany({
      where: { video: { channelId: id } },
    });
    await prisma.videoSnapshot.deleteMany({
      where: { video: { channelId: id } },
    });
    await prisma.video.deleteMany({ where: { channelId: id } });
    await prisma.channelSnapshot.deleteMany({ where: { channelId: id } });
    await prisma.channelInsight.deleteMany({ where: { channelId: id } });
    await prisma.alertRule.deleteMany({ where: { channelId: id } });
    await prisma.channel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
