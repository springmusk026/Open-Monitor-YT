import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function isAllowedBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block localhost and loopback
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") return false;
    // Block IPv4-mapped IPv6 loopback
    if (hostname.startsWith("::ffff:127.") || hostname === "::ffff:0:1") return false;
    // Block private/internal ranges
    if (hostname.startsWith("10.") || hostname.startsWith("172.") || hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("169.254.")) return false;
    // Block metadata endpoints
    if (hostname === "metadata.google.internal" || hostname === "169.254.169.254") return false;
    // Block internal domains
    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;
    // Validate 172.16-31.x.x range
    const parts = hostname.split(".");
    if (parts[0] === "172") {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const baseUrl = config["llm.baseUrl"] || "https://api.openai.com/v1";

    if (!isAllowedBaseUrl(baseUrl)) {
      return NextResponse.json({ success: false, error: "Invalid or disallowed base URL" }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey: config["llm.apiKey"] || "test",
      baseURL: baseUrl,
      timeout: 15_000,
    });

    const model = config["llm.model"] || "gpt-4o";
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Say 'Connection successful'" }],
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      response: response.choices[0]?.message?.content,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
