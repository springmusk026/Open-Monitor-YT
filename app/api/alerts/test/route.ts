import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { ruleId } = await request.json();

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    let success = false;
    let error: string | null = null;

    try {
      if (rule.notifChannel === "WEBHOOK") {
        const res = await fetch(rule.destination, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "test",
            trigger: rule.trigger,
            message: "This is a test notification from OpenMonitorYT",
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(10_000),
        });
        success = res.ok;
        if (!res.ok) error = `Webhook returned ${res.status}`;
      } else if (rule.notifChannel === "DISCORD") {
        const res = await fetch(rule.destination, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🔔 **Test Notification** — OpenMonitorYT alert test for trigger: \`${rule.trigger}\``,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        success = res.ok;
        if (!res.ok) error = `Discord returned ${res.status}`;
      } else if (rule.notifChannel === "SLACK") {
        const res = await fetch(rule.destination, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🔔 *Test Notification* — OpenMonitorYT alert test for trigger: \`${rule.trigger}\``,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        success = res.ok;
        if (!res.ok) error = `Slack returned ${res.status}`;
      } else if (rule.notifChannel === "TELEGRAM") {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: rule.destination,
            text: `🔔 Test Notification — OpenMonitorYT alert test for trigger: ${rule.trigger}`,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        success = res.ok;
        if (!res.ok) error = `Telegram returned ${res.status}`;
      } else if (rule.notifChannel === "EMAIL") {
        // Email sending not yet implemented
        success = false;
        error = "Email notifications are not yet implemented";
      } else {
        success = false;
        error = `Unknown notification channel: ${rule.notifChannel}`;
      }
    } catch (e: any) {
      success = false;
      error = e.message || "Request failed";
    }

    return NextResponse.json({
      success,
      message: success
        ? `Test notification sent to ${rule.destination} via ${rule.notifChannel}`
        : `Failed to send test notification: ${error}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
