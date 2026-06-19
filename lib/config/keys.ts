export const CONFIG_KEYS = {
  APP_NAME: "app.name",
  APP_BASE_URL: "app.baseUrl",
  APP_LOGO_URL: "app.logoUrl",
  APP_FAVICON_URL: "app.faviconUrl",
  APP_MAINTENANCE_MODE: "app.maintenanceMode",

  LLM_PROVIDER: "llm.provider",
  LLM_BASE_URL: "llm.baseUrl",
  LLM_API_KEY: "llm.apiKey",
  LLM_MODEL: "llm.model",
  LLM_MAX_TOKENS: "llm.maxTokens",
  LLM_TEMPERATURE: "llm.temperature",
  LLM_ENABLED: "llm.enabled",

  FIRECRAWL_BASE_URL: "firecrawl.baseUrl",
  FIRECRAWL_API_KEY: "firecrawl.apiKey",
  FIRECRAWL_TIMEOUT: "firecrawl.timeout",
  FIRECRAWL_RETRIES: "firecrawl.retries",
  FIRECRAWL_RATE_LIMIT: "firecrawl.rateLimit",

  POLLING_INTERVAL_MINUTES: "polling.intervalMinutes",
  POLLING_MAX_CHANNELS: "polling.maxChannels",
  POLLING_PAUSE_ON_ERRORS: "polling.pauseOnErrors",
  POLLING_ENABLED: "polling.enabled",

  NOTIF_EMAIL_ENABLED: "notif.email.enabled",
  NOTIF_EMAIL_FROM: "notif.email.fromAddress",
  NOTIF_EMAIL_SMTP_HOST: "notif.email.smtpHost",
  NOTIF_EMAIL_SMTP_PORT: "notif.email.smtpPort",
  NOTIF_EMAIL_SMTP_USER: "notif.email.smtpUser",
  NOTIF_EMAIL_SMTP_PASS: "notif.email.smtpPass",
  NOTIF_SLACK_ENABLED: "notif.slack.enabled",
  NOTIF_DISCORD_ENABLED: "notif.discord.enabled",
  NOTIF_TELEGRAM_BOT_TOKEN: "notif.telegram.botToken",
  NOTIF_TELEGRAM_ENABLED: "notif.telegram.enabled",
  NOTIF_WEBHOOK_ENABLED: "notif.webhook.enabled",
  NOTIF_WEBHOOK_SECRET: "notif.webhook.secretHeader",

  AI_INSIGHTS_ENABLED: "ai.insights.enabled",
  AI_AB_TEST: "ai.abTestDetection.enabled",
  AI_TITLE_PATTERN: "ai.titlePatternAnalysis.enabled",
  AI_CONTENT_GAP: "ai.contentGapAnalysis.enabled",
  AI_COMPETITOR_SUMMARY: "ai.competitorSummary.enabled",
  AI_UPLOAD_SCHEDULE: "ai.uploadScheduleInference.enabled",
  AI_AUTO_SCHEDULE: "ai.autoInsightSchedule",
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
