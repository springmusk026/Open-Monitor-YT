import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ rules });
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
    const { channelId, trigger, notifChannel, destination } = body;

    const rule = await prisma.alertRule.create({
      data: {
        channelId: channelId || null,
        trigger,
        notifChannel,
        destination,
      },
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
