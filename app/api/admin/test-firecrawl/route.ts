import { NextRequest, NextResponse } from "next/server";
import { Firecrawl } from "firecrawl";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const client = new Firecrawl({
      apiKey: config["firecrawl.apiKey"] || undefined,
      ...(config["firecrawl.baseUrl"]
        ? { baseUrl: config["firecrawl.baseUrl"] }
        : {}),
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
