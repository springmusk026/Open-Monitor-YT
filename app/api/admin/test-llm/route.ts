import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const client = new OpenAI({
      apiKey: config["llm.apiKey"] || "test",
      baseURL: config["llm.baseUrl"] || "https://api.openai.com/v1",
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
