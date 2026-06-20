import OpenAI from "openai";
import { getAppConfig, getAppConfigMany } from "@/lib/config/appConfig";
import { CONFIG_KEYS } from "@/lib/config/keys";

let client: OpenAI | null = null;
let cachedConfig: { baseUrl: string; apiKey: string } | null = null;

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
  const llmClient = await getLLMClient();

  // Batch fetch model + config in one query
  const config = await getAppConfigMany([
    CONFIG_KEYS.LLM_MODEL,
    CONFIG_KEYS.LLM_TEMPERATURE,
    CONFIG_KEYS.LLM_MAX_TOKENS,
  ]);

  const model = config[CONFIG_KEYS.LLM_MODEL] || "gpt-4o";
  const temperature = options?.temperature ??
    (config[CONFIG_KEYS.LLM_TEMPERATURE] ? parseFloat(config[CONFIG_KEYS.LLM_TEMPERATURE]!) : 0.7);
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
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const text = await chatCompletion(systemPrompt, userPrompt, options);

  // Try multiple extraction strategies
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim()) as T;
  }

  // Try to find a JSON object or array directly
  const objectMatch = text.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    return JSON.parse(objectMatch[1].trim()) as T;
  }

  throw new Error(`Failed to parse JSON from LLM response: ${text.slice(0, 200)}`);
}
