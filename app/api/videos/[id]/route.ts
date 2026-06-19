import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true, handle: true, avatarUrl: true } },
        snapshots: { orderBy: { snappedAt: "desc" }, take: 30 },
        diffs: { orderBy: { detectedAt: "desc" }, take: 50 },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
