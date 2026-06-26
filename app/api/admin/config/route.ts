import { NextRequest, NextResponse } from "next/server";
import { getAppConfigMany, setAppConfigMany } from "@/lib/config/appConfig";
import { resetFirecrawlClient } from "@/lib/scraper/firecrawlClient";

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

    // Mask sensitive keys in GET response
    const sensitiveKeys = ["llm.apiKey", "firecrawl.apiKey", "notif.email.smtpPass", "notif.telegram.botToken", "notif.webhook.secretHeader"];
    const masked: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(config)) {
      masked[key] = sensitiveKeys.includes(key) && value ? "••••••••" : value;
    }

    return NextResponse.json({ config: masked });
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

    // Reset cached clients if their config changed
    if (Object.keys(entries).some((k) => k.startsWith("firecrawl."))) {
      resetFirecrawlClient();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
