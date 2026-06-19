import { chatCompletionJSON } from "@/lib/llm/client";

export interface UploadScheduleInsight {
  channelId: string;
  cadence: string;
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  averageGapDays: number;
  longestStreak: number;
  longestGap: number;
  isOnHiatus: boolean;
  reasoning: string;
}

export async function analyzeUploadSchedule(
  channelId: string,
  publishDates: string[]
): Promise<UploadScheduleInsight | null> {
  if (publishDates.length < 3) return null;

  const datesText = publishDates.join("\n");

  return chatCompletionJSON<UploadScheduleInsight>(
    `You are a YouTube analytics expert. Analyze the upload schedule of a channel based on these publish dates.

Determine:
- Posting cadence (daily, every X days, weekly, bi-weekly, etc.)
- Best day of week to post
- Best time of day (if determinable)
- Average gap between uploads in days
- Longest upload streak (consecutive days with uploads within cadence)
- Longest gap between uploads
- Whether the channel appears to be on hiatus

Respond with JSON matching the required schema.`,
    `Channel ${channelId} publish dates (most recent first):\n${datesText}`
  );
}
