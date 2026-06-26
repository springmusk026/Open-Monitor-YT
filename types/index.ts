export interface Channel {
  id: string;
  youtubeId: string;
  handle: string | null;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  subscriberCount: string | null;
  videoCount: number | null;
  lastPolledAt: string | null;
  pollingPaused: boolean;
  label: string | null;
}

export interface ChannelWithRelations extends Channel {
  videos: Video[];
  snapshots: ChannelSnapshot[];
  insights: ChannelInsight[];
  _count: { videos: number; insights: number };
}

export interface ChannelListItem extends Channel {
  _count: { videos: number; insights: number };
  snapshots: { subscriberCount: string | null; snappedAt: string }[];
}

export interface ChannelSnapshot {
  id: string;
  channelId: string;
  subscriberCount: string | null;
  videoCount: number | null;
  description: string | null;
  snappedAt: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  channelId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  tags: string[];
  publishedAt: string | null;
  viewCount: string | null;
  likeCount: string | null;
  commentCount: string | null;
  duration: string | null;
  firstSeenAt: string;
  _count?: { diffs: number };
}

export interface VideoDetail extends Video {
  snapshots: VideoSnapshot[];
  diffs: VideoDiff[];
  channel: Pick<Channel, "id" | "name" | "handle" | "avatarUrl">;
}

export interface VideoSnapshot {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  description: string | null;
  tags: string[];
  viewCount: string | null;
  likeCount: string | null;
  snappedAt: string;
}

export interface VideoDiff {
  id: string;
  videoId: string;
  field: DiffField;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
  video: Video & {
    channel: Pick<Channel, "id" | "name" | "handle" | "avatarUrl">;
  };
}

export type DiffField =
  | "TITLE"
  | "THUMBNAIL"
  | "DESCRIPTION"
  | "TAGS"
  | "VIEW_COUNT"
  | "LIKE_COUNT";

export interface ChannelInsight {
  id: string;
  channelId: string;
  type: InsightType;
  summary: string;
  detail: string | null;
  generatedAt: string;
}

export type InsightType =
  | "AB_TEST_DETECTED"
  | "UPLOAD_SCHEDULE"
  | "TITLE_PATTERN"
  | "THUMBNAIL_STYLE"
  | "CONTENT_GAP"
  | "TRENDING_TOPIC"
  | "COMPETITOR_SUMMARY";

export interface AlertRule {
  id: string;
  channelId: string | null;
  trigger: AlertTrigger;
  notifChannel: NotifChannel;
  destination: string;
  enabled: boolean;
}

export type AlertTrigger =
  | "NEW_VIDEO"
  | "TITLE_CHANGE"
  | "THUMBNAIL_CHANGE"
  | "SUBSCRIBER_MILESTONE"
  | "DESCRIPTION_CHANGE"
  | "TAGS_CHANGE"
  | "ANY_CHANGE";

export type NotifChannel =
  | "EMAIL"
  | "WEBHOOK"
  | "SLACK"
  | "DISCORD"
  | "TELEGRAM";

export interface AppConfig {
  [key: string]: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ScrapeJobResponse {
  jobId: string;
  channelId: string;
}

export interface JobStatus {
  jobId: string;
  state: string;
  data: { channelId: string; handle: string } | null;
  progress: number | Record<string, unknown> | null;
  result: { channelId: string; diffs: number } | null;
  failedReason: string | null;
  processedOn: number | null;
  finishedOn: number | null;
}

export interface FeedItem {
  id: string;
  field: DiffField;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
  video: {
    id: string;
    youtubeId: string;
    title: string;
    thumbnailUrl: string | null;
  };
  channel: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
  };
}

export interface ContentGapInsight {
  channelAOnly: string[];
  channelBOnly: string[];
  trendingIntersections: string[];
  suggestedIdeas: { topic: string; rationale: string }[];
  reasoning: string;
}

export const DIFF_FIELDS: DiffField[] = [
  "TITLE",
  "THUMBNAIL",
  "DESCRIPTION",
  "TAGS",
  "VIEW_COUNT",
  "LIKE_COUNT",
];

export const INSIGHT_TYPES: InsightType[] = [
  "AB_TEST_DETECTED",
  "UPLOAD_SCHEDULE",
  "TITLE_PATTERN",
  "THUMBNAIL_STYLE",
  "CONTENT_GAP",
  "TRENDING_TOPIC",
  "COMPETITOR_SUMMARY",
];

export const ALERT_TRIGGERS: AlertTrigger[] = [
  "NEW_VIDEO",
  "TITLE_CHANGE",
  "THUMBNAIL_CHANGE",
  "SUBSCRIBER_MILESTONE",
  "DESCRIPTION_CHANGE",
  "TAGS_CHANGE",
  "ANY_CHANGE",
];

export const NOTIF_CHANNELS: NotifChannel[] = [
  "EMAIL",
  "WEBHOOK",
  "SLACK",
  "DISCORD",
  "TELEGRAM",
];
