"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, TestTube, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useAdminConfig,
  useUpdateAdminConfig,
  useTestLlm,
  useTestFirecrawl,
} from "@/hooks/use-api";

type KeyDef = { key: string; label: string; type: string; options?: string[] };

const SECTIONS: {
  id: string;
  label: string;
  keys: KeyDef[];
  hasTest?: boolean;
  testLabel?: string;
  testKey?: string;
}[] = [
  {
    id: "general",
    label: "General",
    keys: [
      { key: "app.name", label: "App Name", type: "text" },
      { key: "app.baseUrl", label: "Base URL", type: "text" },
      { key: "app.logoUrl", label: "Logo URL", type: "text" },
      { key: "app.faviconUrl", label: "Favicon URL", type: "text" },
      { key: "app.maintenanceMode", label: "Maintenance Mode", type: "toggle" },
    ],
  },
  {
    id: "llm",
    label: "LLM Provider",
    keys: [
      { key: "llm.provider", label: "Provider", type: "select", options: ["OpenAI", "Anthropic", "Ollama", "Groq", "Custom"] },
      { key: "llm.baseUrl", label: "Base URL", type: "text" },
      { key: "llm.apiKey", label: "API Key", type: "password" },
      { key: "llm.model", label: "Model", type: "text" },
      { key: "llm.maxTokens", label: "Max Tokens", type: "number" },
      { key: "llm.temperature", label: "Temperature", type: "number" },
      { key: "llm.enabled", label: "LLM Enabled", type: "toggle" },
    ],
    hasTest: true,
    testLabel: "Test LLM",
    testKey: "llm",
  },
  {
    id: "firecrawl",
    label: "Firecrawl",
    keys: [
      { key: "firecrawl.baseUrl", label: "Base URL", type: "text" },
      { key: "firecrawl.apiKey", label: "API Key", type: "password" },
      { key: "firecrawl.timeout", label: "Timeout (ms)", type: "number" },
      { key: "firecrawl.retries", label: "Retries", type: "number" },
      { key: "firecrawl.rateLimit", label: "Rate Limit", type: "number" },
    ],
    hasTest: true,
    testLabel: "Test Firecrawl",
    testKey: "firecrawl",
  },
  {
    id: "polling",
    label: "Polling",
    keys: [
      { key: "polling.intervalMinutes", label: "Interval (minutes)", type: "number" },
      { key: "polling.maxChannels", label: "Max Channels", type: "number" },
      { key: "polling.pauseOnErrors", label: "Pause on Errors", type: "toggle" },
      { key: "polling.enabled", label: "Polling Enabled", type: "toggle" },
    ],
  },
  {
    id: "ai",
    label: "AI Features",
    keys: [
      { key: "ai.insights.enabled", label: "Insights Enabled", type: "toggle" },
      { key: "ai.abTestDetection.enabled", label: "A/B Test Detection", type: "toggle" },
      { key: "ai.titlePatternAnalysis.enabled", label: "Title Pattern Analysis", type: "toggle" },
      { key: "ai.contentGapAnalysis.enabled", label: "Content Gap Analysis", type: "toggle" },
      { key: "ai.competitorSummary.enabled", label: "Competitor Summary", type: "toggle" },
      { key: "ai.uploadScheduleInference.enabled", label: "Upload Schedule", type: "toggle" },
      { key: "ai.autoInsightSchedule", label: "Auto Schedule (cron)", type: "text" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    keys: [
      { key: "notif.email.enabled", label: "Email Enabled", type: "toggle" },
      { key: "notif.email.fromAddress", label: "From Address", type: "text" },
      { key: "notif.email.smtpHost", label: "SMTP Host", type: "text" },
      { key: "notif.email.smtpPort", label: "SMTP Port", type: "number" },
      { key: "notif.email.smtpUser", label: "SMTP User", type: "text" },
      { key: "notif.email.smtpPass", label: "SMTP Pass", type: "password" },
      { key: "notif.slack.enabled", label: "Slack Enabled", type: "toggle" },
      { key: "notif.discord.enabled", label: "Discord Enabled", type: "toggle" },
      { key: "notif.telegram.enabled", label: "Telegram Enabled", type: "toggle" },
      { key: "notif.telegram.botToken", label: "Telegram Bot Token", type: "password" },
      { key: "notif.webhook.enabled", label: "Webhook Enabled", type: "toggle" },
      { key: "notif.webhook.secretHeader", label: "Webhook Secret Header", type: "text" },
    ],
  },
];

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [localConfig, setLocalConfig] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const { data: serverConfig, isLoading } = useAdminConfig();
  const updateConfig = useUpdateAdminConfig();
  const testLlm = useTestLlm();
  const testFirecrawl = useTestFirecrawl();

  const config: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...(serverConfig || {}), ...localConfig })) {
    config[k] = v ?? "";
  }
  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  function handleChange(key: string, value: string) {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function saveConfig() {
    const payload: Record<string, string> = {};
    for (const section of SECTIONS) {
      for (const keyDef of section.keys) {
        if (keyDef.key in localConfig) {
          payload[keyDef.key] = localConfig[keyDef.key];
        }
      }
    }
    await updateConfig.mutateAsync(payload);
    setLocalConfig({});
    toast.success("Settings saved successfully");
  }

  async function testConnection(sectionId: string) {
    setTestResult(null);
    try {
      const testFn = sectionId === "llm" ? testLlm : testFirecrawl;
      const data = await testFn.mutateAsync(config);
      setTestResult(data.success ? "success" : "error");
      if (data.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch {
      setTestResult("error");
      toast.error("Connection failed");
    }
    setTimeout(() => setTestResult(null), 3000);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your application
          </p>
        </div>
        <Button onClick={saveConfig} disabled={updateConfig.isPending || Object.keys(localConfig).length === 0}>
          {updateConfig.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </motion.div>

      <div className="flex gap-6">
        <motion.nav
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
          className="w-48 shrink-0 space-y-1"
        >
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
          className="flex-1"
        >
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : currentSection ? (
            <Card>
              <CardHeader>
                <CardTitle>{currentSection.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSection.keys.map((keyDef) => (
                  <div key={keyDef.key} className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor={keyDef.key}>{keyDef.label}</Label>
                    <div className="col-span-2">
                      {keyDef.type === "toggle" ? (
                        <Switch
                          checked={config[keyDef.key] === "true"}
                          onCheckedChange={(checked) =>
                            handleChange(keyDef.key, checked ? "true" : "false")
                          }
                        />
                      ) : keyDef.type === "select" ? (
                        <Select
                          value={config[keyDef.key] || ""}
                          onValueChange={(value) => handleChange(keyDef.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={keyDef.label} />
                          </SelectTrigger>
                          <SelectContent>
                            {keyDef.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={keyDef.key}
                          type={keyDef.type}
                          value={config[keyDef.key] || ""}
                          onChange={(e) => handleChange(keyDef.key, e.target.value)}
                          placeholder={keyDef.label}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {currentSection.hasTest && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      disabled={testLlm.isPending || testFirecrawl.isPending}
                      onClick={() => testConnection(currentSection.testKey || currentSection.id)}
                    >
                      {testLlm.isPending || testFirecrawl.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : testResult === "success" ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                      ) : testResult === "error" ? (
                        <XCircle className="mr-2 h-4 w-4 text-destructive" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      {currentSection.testLabel}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
