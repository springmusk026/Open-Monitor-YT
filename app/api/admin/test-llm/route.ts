import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const ALLOWED_LLM_HOSTS = [
  "api.openai.com",
  "api.anthropic.com",
  "api.groq.com",
  "api.together.xyz",
  "api.fireworks.ai",
  "openrouter.ai",
  "api.mistral.ai",
  "generativelanguage.googleapis.com",
];

function isAllowedBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    // Block private/internal IPs
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
