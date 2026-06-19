import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isLLMEnabled } from "@/lib/llm/client";
import { analyzeContentGaps } from "@/lib/llm/insights";

export async function POST(request: NextRequest) {
  try {
    const { channelAId, channelBId } = await request.json();

    if (!channelAId || !channelBId) {
      return NextResponse.json(
        { error: "channelAId and channelBId are required" },
        { status: 400 }
      );
    }

    if (!(await isLLMEnabled())) {
      return NextResponse.json(
        { error: "LLM features are disabled" },
        { status: 400 }
      );
    }

    const [channelA, channelB] = await Promise.all([
      prisma.channel.findUnique({
        where: { id: channelAId },
        include: { videos: { orderBy: { publishedAt: "desc" }, take: 50 } },
      }),
      prisma.channel.findUnique({
        where: { id: channelBId },
        include: { videos: { orderBy: { publishedAt: "desc" }, take: 50 } },
      }),
    ]);

    if (!channelA || !channelB) {
      return NextResponse.json(
        { error: "One or both channels not found" },
        { status: 404 }
      );
    }

    const titlesA = channelA.videos.map((v) => v.title);
    const titlesB = channelB.videos.map((v) => v.title);

    const insight = await analyzeContentGaps(
      channelAId,
      channelBId,
      titlesA,
      titlesB
    );

    if (!insight) {
      return NextResponse.json(
        { error: "Not enough data for content gap analysis" },
        { status: 400 }
      );
    }

    const saved = await prisma.channelInsight.create({
      data: {
        channelId: channelAId,
        type: "CONTENT_GAP",
        summary: `Content gap analysis between ${channelA.name} and ${channelB.name}`,
        detail: JSON.stringify(insight),
      },
    });

    return NextResponse.json({ insight: saved });
  } catch (error: any) {
    console.error("Content gap error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
