import api from "./client";
import type {
  ChannelListItem,
  ChannelWithRelations,
  PaginatedResponse,
  FeedItem,
  VideoDiff,
  AlertRule,
  ChannelInsight,
  AppConfig,
  ScrapeJobResponse,
  JobStatus,
  ContentGapInsight,
} from "@/types";

export const channelsApi = {
  list: async () => {
    const { data } = await api.get<{ channels: ChannelListItem[] }>(
      "/channels"
    );
    return data.channels;
  },

  get: async (id: string) => {
    const { data } = await api.get<{ channel: ChannelWithRelations }>(
      `/channels/${id}`
    );
    return data.channel;
  },

  create: async (payload: {
    handle?: string;
    name?: string;
    youtubeId?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    description?: string;
  }) => {
    const { data } = await api.post<{ channel: any }>("/channels", payload);
    return data.channel;
  },

  update: async (id: string, payload: Partial<ChannelListItem>) => {
    const { data } = await api.patch<{ channel: ChannelListItem }>(
      `/channels/${id}`,
      payload
    );
    return data.channel;
  },

  delete: async (id: string) => {
    await api.delete(`/channels/${id}`);
  },
};

export const scrapeApi = {
  channel: async (payload: {
    handle?: string;
    channelId?: string;
  }) => {
    const { data } = await api.post<ScrapeJobResponse>(
      "/scrape/channel",
      payload
    );
    return data;
  },

  status: async (jobId: string) => {
    const { data } = await api.get<JobStatus>(`/scrape/status/${jobId}`);
    return data;
  },
};

export const feedApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    filter?: string;
    channelId?: string;
  }) => {
    const { data } = await api.get<PaginatedResponse<FeedItem>>("/feed", {
      params,
    });
    return data;
  },
};

export const analyzeApi = {
  channel: async (channelId: string) => {
    const { data } = await api.post<{ insights: ChannelInsight[] }>(
      `/analyze/channel/${channelId}`
    );
    return data.insights;
  },

  gap: async (channelAId: string, channelBId: string) => {
    const { data } = await api.post<{ insight: any }>("/analyze/gap", {
      channelAId,
      channelBId,
    });
    if (!data.insight) return null;
    let detail = {};
    try {
      detail = JSON.parse(data.insight.detail || "{}");
    } catch {
      // LLM returned invalid JSON
    }
    return { ...data.insight, detail };
  },
};

export const alertsApi = {
  list: async () => {
    const { data } = await api.get<{ rules: AlertRule[] }>(`/alerts`);
    return data.rules;
  },

  create: async (payload: {
    channelId?: string | null;
    trigger: string;
    notifChannel: string;
    destination: string;
  }) => {
    const { data } = await api.post<{ rule: AlertRule }>("/alerts", payload);
    return data.rule;
  },

  test: async (ruleId: string) => {
    const { data } = await api.post<{ success: boolean; message: string }>(
      "/alerts/test",
      { ruleId }
    );
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/alerts?id=${id}`);
  },
};

export const videosApi = {
  get: async (id: string) => {
    const { data } = await api.get<{ video: any }>(`/videos/${id}`);
    return data.video;
  },
};

export const adminApi = {
  getConfig: async () => {
    const { data } = await api.get<{ config: AppConfig }>("/admin/config");
    return data.config;
  },

  updateConfig: async (config: Record<string, string>) => {
    const { data } = await api.patch<{ success: boolean }>(
      "/admin/config",
      config
    );
    return data;
  },

  testLlm: async (config: Record<string, string>) => {
    const { data } = await api.post<{ success: boolean; error?: string; response?: string }>(
      "/admin/test-llm",
      config
    );
    return data;
  },

  testFirecrawl: async (config: Record<string, string>) => {
    const { data } = await api.post<{ success: boolean; error?: string; title?: string }>(
      "/admin/test-firecrawl",
      config
    );
    return data;
  },
};
