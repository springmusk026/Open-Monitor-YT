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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function analyzeUploadSchedule(
  channelId: string,
  publishDates: string[]
): Promise<UploadScheduleInsight | null> {
  if (publishDates.length < 3) return null;

  // Sort dates descending (most recent first)
  const dates = publishDates
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  if (dates.length < 3) return null;

  // Compute gaps between consecutive uploads (in days)
  const gaps: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const gapMs = dates[i].getTime() - dates[i + 1].getTime();
    gaps.push(gapMs / (1000 * 60 * 60 * 24));
  }

  const averageGapDays = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;
  const longestGap = Math.round(Math.max(...gaps) * 10) / 10;
  const longestStreak = computeLongestStreak(dates, averageGapDays * 1.5);

  // Best day of week: the day with the most uploads
  const dayCounts = new Array(7).fill(0);
  for (const d of dates) dayCounts[d.getDay()]++;
  const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));

  // Best time of hour: average hour
  const hours = dates.map((d) => d.getHours());
  const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);

  // Cadence description
  let cadence: string;
  if (averageGapDays < 1.5) cadence = "Daily";
  else if (averageGapDays < 4) cadence = `Every ${Math.round(averageGapDays)} days`;
  else if (averageGapDays < 8) cadence = "Weekly";
  else if (averageGapDays < 16) cadence = "Bi-weekly";
  else cadence = `Every ${Math.round(averageGapDays)} days`;

  // Hiatus: most recent upload > 3x the average gap
  const daysSinceLast = (Date.now() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
  const isOnHiatus = daysSinceLast > averageGapDays * 3;

  const reasoning = `Based on ${dates.length} videos: average ${averageGapDays} days between uploads, longest gap ${longestGap} days. Most uploads on ${DAY_NAMES[bestDayIndex]}s around ${avgHour}:00 UTC.`;

  return {
    channelId,
    cadence,
    bestDayOfWeek: DAY_NAMES[bestDayIndex],
    bestTimeOfDay: `${avgHour}:00 UTC`,
    averageGapDays,
    longestStreak,
    longestGap,
    isOnHiatus,
    reasoning,
  };
}

function computeLongestStreak(dates: Date[], maxGapDays: number): number {
  let longest = 1;
  let current = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const gap = (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    if (gap <= maxGapDays) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
