import OpenAI from "openai";
import { getAppConfig, getAppConfigMany } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";

let client: OpenAI | null = null;
let cachedConfig: { baseUrl: string; apiKey: string } | null = null;

const LLM_TIMEOUT_MS = 60_000;

export async function getLLMClient(): Promise<OpenAI> {
  const [baseUrl, apiKey] = await Promise.all([
    getAppConfig(CONFIG_KEYS.LLM_BASE_URL),
    getAppConfig(CONFIG_KEYS.LLM_API_KEY),
  ]);

  const newConfig = {
    baseUrl: baseUrl || "https://api.openai.com/v1",
    apiKey: apiKey || "",
  };

  if (
    !client ||
    !cachedConfig ||
    cachedConfig.baseUrl !== newConfig.baseUrl ||
    cachedConfig.apiKey !== newConfig.apiKey
  ) {
    client = new OpenAI({
      apiKey: newConfig.apiKey,
      baseURL: newConfig.baseUrl,
      timeout: LLM_TIMEOUT_MS,
      maxRetries: 2,
    });
    cachedConfig = newConfig;
  }

  return client;
}

export async function getLLMModel(): Promise<string> {
  const model = await getAppConfig(CONFIG_KEYS.LLM_MODEL);
  return model || "gpt-4o";
}

export async function isLLMEnabled(): Promise<boolean> {
  const enabled = await getAppConfig(CONFIG_KEYS.LLM_ENABLED);
  return enabled !== "false";
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<string> {
  const llmClient = await getLLMClient();

  const config = await getAppConfigMany([
    CONFIG_KEYS.LLM_MODEL,
    CONFIG_KEYS.LLM_TEMPERATURE,
    CONFIG_KEYS.LLM_MAX_TOKENS,
  ]);

  const model = options?.model || config[CONFIG_KEYS.LLM_MODEL] || "gpt-4o";
  const temperature = options?.temperature ??
    (config[CONFIG_KEYS.LLM_TEMPERATURE] ? parseFloat(config[CONFIG_KEYS.LLM_TEMPERATURE]!) : 0.2);
  const maxTokens = options?.maxTokens ??
    (config[CONFIG_KEYS.LLM_MAX_TOKENS] ? parseInt(config[CONFIG_KEYS.LLM_MAX_TOKENS]!) : 2048);

  const response = await llmClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0]?.message?.content || "";
}

export async function chatCompletionJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<T> {
  const llmClient = await getLLMClient();

  const config = await getAppConfigMany([
    CONFIG_KEYS.LLM_MODEL,
    CONFIG_KEYS.LLM_TEMPERATURE,
    CONFIG_KEYS.LLM_MAX_TOKENS,
  ]);

  const model = options?.model || config[CONFIG_KEYS.LLM_MODEL] || "gpt-4o";
  const temperature = options?.temperature ??
    (config[CONFIG_KEYS.LLM_TEMPERATURE] ? parseFloat(config[CONFIG_KEYS.LLM_TEMPERATURE]!) : 0.2);
  const maxTokens = options?.maxTokens ??
    (config[CONFIG_KEYS.LLM_MAX_TOKENS] ? parseInt(config[CONFIG_KEYS.LLM_MAX_TOKENS]!) : 2048);

  const response = await llmClient.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content || "";

  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T;
      } catch {
        // Fall through to error
      }
    }

    // Fallback: try to find a JSON object (non-greedy, brace-balanced)
    const firstBrace = text.indexOf("{");
    if (firstBrace !== -1) {
      let depth = 0;
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === "{") depth++;
        if (text[i] === "}") depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(firstBrace, i + 1)) as T;
          } catch {
            // Fall through to error
          }
          break;
        }
      }
    }

    throw new Error(`Failed to parse JSON from LLM response: ${text.slice(0, 300)}`);
  }
}
