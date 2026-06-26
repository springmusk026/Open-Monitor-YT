import { NextRequest, NextResponse } from "next/server";
import { Firecrawl } from "firecrawl";

function isAllowedBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
    if (hostname.startsWith("10.") || hostname.startsWith("172.") || hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("169.254.")) return false;
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const baseUrl = config["firecrawl.baseUrl"];

    if (baseUrl && !isAllowedBaseUrl(baseUrl)) {
      return NextResponse.json({ success: false, error: "Invalid or disallowed base URL" }, { status: 400 });
    }

    const client = new Firecrawl({
      apiKey: config["firecrawl.apiKey"] || undefined,
      ...(baseUrl ? { baseUrl } : {}),
    });

    const result = await client.scrape("https://example.com", {
      formats: ["markdown"],
      maxAge: 0,
    });

    return NextResponse.json({
      success: true,
      title: (result as any).metadata?.title,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
