import OpenAI from "openai";
import { getAppConfig } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";

let client: OpenAI | null = null;
let cachedConfig: { baseUrl: string; apiKey: string; model: string } | null =
  null;

export async function getLLMClient(): Promise<OpenAI> {
  const [baseUrl, apiKey] = await Promise.all([
    getAppConfig(CONFIG_KEYS.LLM_BASE_URL),
    getAppConfig(CONFIG_KEYS.LLM_API_KEY),
  ]);

  const newConfig = {
    baseUrl: baseUrl || "https://api.openai.com/v1",
    apiKey: apiKey || "",
    model: "",
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
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = await getLLMClient();
  const model = await getLLMModel();

  const tempRaw = await getAppConfig(CONFIG_KEYS.LLM_TEMPERATURE);
  const maxTokensRaw = await getAppConfig(CONFIG_KEYS.LLM_MAX_TOKENS);

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? (tempRaw ? parseFloat(tempRaw) : 0.7),
    max_tokens:
      options?.maxTokens ?? (maxTokensRaw ? parseInt(maxTokensRaw) : 2048),
  });

  return response.choices[0]?.message?.content || "";
}

export async function chatCompletionJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const text = await chatCompletion(systemPrompt, userPrompt, options);
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || [
    null,
    text,
  ];
  return JSON.parse(jsonMatch[1]!.trim()) as T;
}
