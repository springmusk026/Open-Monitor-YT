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

const VALID_TRIGGERS = ["NEW_VIDEO", "TITLE_CHANGE", "THUMBNAIL_CHANGE", "SUBSCRIBER_MILESTONE", "DESCRIPTION_CHANGE", "TAGS_CHANGE", "ANY_CHANGE"];
const VALID_NOTIF_CHANNELS = ["EMAIL", "WEBHOOK", "SLACK", "DISCORD", "TELEGRAM"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, trigger, notifChannel, destination } = body;

    if (!trigger || !VALID_TRIGGERS.includes(trigger)) {
      return NextResponse.json({ error: `Invalid trigger. Must be one of: ${VALID_TRIGGERS.join(", ")}` }, { status: 400 });
    }
    if (!notifChannel || !VALID_NOTIF_CHANNELS.includes(notifChannel)) {
      return NextResponse.json({ error: `Invalid notification channel. Must be one of: ${VALID_NOTIF_CHANNELS.join(", ")}` }, { status: 400 });
    }
    if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
      return NextResponse.json({ error: "Destination is required" }, { status: 400 });
    }
    if (notifChannel === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (notifChannel === "WEBHOOK" && !/^https?:\/\/.+/.test(destination)) {
      return NextResponse.json({ error: "Webhook destination must be a valid URL" }, { status: 400 });
    }

    const rule = await prisma.alertRule.create({
      data: {
        channelId: channelId || null,
        trigger,
        notifChannel,
        destination: destination.trim(),
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rule = await prisma.alertRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: "Alert rule not found" }, { status: 404 });
    }

    await prisma.alertRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
