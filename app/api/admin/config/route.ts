import { NextRequest, NextResponse } from "next/server";
import { getAppConfigMany, setAppConfigMany } from "@/lib/config/appConfig";

export async function GET() {
  try {
    const keys = [
      "app.name", "app.baseUrl", "app.logoUrl", "app.faviconUrl",
      "app.maintenanceMode",
      "llm.provider", "llm.baseUrl", "llm.apiKey", "llm.model", "llm.maxTokens",
      "llm.temperature", "llm.enabled",
      "firecrawl.baseUrl", "firecrawl.apiKey", "firecrawl.timeout", "firecrawl.retries",
      "firecrawl.rateLimit",
      "polling.intervalMinutes", "polling.maxChannels",
      "polling.pauseOnErrors", "polling.enabled",
      "ai.insights.enabled", "ai.abTestDetection.enabled",
      "ai.titlePatternAnalysis.enabled", "ai.contentGapAnalysis.enabled",
      "ai.competitorSummary.enabled", "ai.uploadScheduleInference.enabled",
      "ai.autoInsightSchedule",
      "notif.email.enabled", "notif.slack.enabled", "notif.discord.enabled",
      "notif.telegram.enabled", "notif.webhook.enabled",
    ];

    const config = await getAppConfigMany(keys);

    return NextResponse.json({ config });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const entries: Record<string, string> = {};

    for (const [key, value] of Object.entries(body) as [string, string][]) {
      if (key.startsWith("llm.apiKey") || key.startsWith("firecrawl.apiKey") ||
          key.startsWith("notif.email.smtpPass") || key.startsWith("notif.telegram.botToken")) {
        if (value && value !== "••••••••") {
          entries[key] = value;
        }
      } else {
        entries[key] = String(value);
      }
    }

    await setAppConfigMany(entries);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
