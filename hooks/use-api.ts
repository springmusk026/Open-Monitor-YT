"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { channelsApi, scrapeApi, feedApi, analyzeApi, alertsApi, adminApi, videosApi } from "@/lib/api";

// ─── Channels ──────────────────────────────────────────────

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: channelsApi.list,
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ["channels", id],
    queryFn: () => channelsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: channelsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof channelsApi.update>[1]) =>
      channelsApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["channels", vars.id] });
    },
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: channelsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

// ─── Videos ────────────────────────────────────────────────

export function useVideo(id: string) {
  return useQuery({
    queryKey: ["videos", id],
    queryFn: () => videosApi.get(id),
    enabled: !!id,
  });
}

// ─── Scraping ──────────────────────────────────────────────

export function useScrapeChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scrapeApi.channel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useScrapeStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["scrape-status", jobId],
    queryFn: () => scrapeApi.status(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      if (state === "completed" || state === "failed") return false;
      return 2000;
    },
  });
}

// ─── Feed ──────────────────────────────────────────────────

export function useFeed(params: {
  page?: number;
  limit?: number;
  filter?: string;
  channelId?: string;
}) {
  return useQuery({
    queryKey: ["feed", params],
    queryFn: () => feedApi.list(params),
  });
}

// ─── Analysis ──────────────────────────────────────────────

export function useAnalyzeChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: analyzeApi.channel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels"] }),
  });
}

export function useAnalyzeGap() {
  return useMutation({
    mutationFn: ({
      channelAId,
      channelBId,
    }: {
      channelAId: string;
      channelBId: string;
    }) => analyzeApi.gap(channelAId, channelBId),
  });
}

// ─── Alerts ────────────────────────────────────────────────

export function useAlertRules() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: alertsApi.list,
  });
}

export function useCreateAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlertRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useTestAlertRule() {
  return useMutation({
    mutationFn: alertsApi.test,
  });
}

// ─── Admin ─────────────────────────────────────────────────

export function useAdminConfig() {
  return useQuery({
    queryKey: ["admin-config"],
    queryFn: adminApi.getConfig,
  });
}

export function useUpdateAdminConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-config"] }),
  });
}

export function useTestLlm() {
  return useMutation({
    mutationFn: adminApi.testLlm,
  });
}

export function useTestFirecrawl() {
  return useMutation({
    mutationFn: adminApi.testFirecrawl,
  });
}
