export type DiffField =
  | "TITLE"
  | "THUMBNAIL"
  | "DESCRIPTION"
  | "TAGS"
  | "VIEW_COUNT"
  | "LIKE_COUNT";

export type DiffResult = {
  field: DiffField;
  oldValue: string | null;
  newValue: string | null;
  changeType: "ADDED" | "MODIFIED" | "REMOVED";
};

export interface SnapshotData {
  title: string;
  thumbnailUrl: string | null;
  description: string | null;
  tags: string[];
  viewCount: string | null;
  likeCount: string | null;
}

export function diffSnapshots(
  prev: SnapshotData,
  next: SnapshotData
): DiffResult[] {
  const results: DiffResult[] = [];

  const titleDiff = diffField("TITLE", prev.title, next.title);
  if (titleDiff) results.push(titleDiff);

  const thumbDiff = diffField(
    "THUMBNAIL",
    prev.thumbnailUrl,
    next.thumbnailUrl
  );
  if (thumbDiff) results.push(thumbDiff);

  const descDiff = diffField("DESCRIPTION", prev.description, next.description);
  if (descDiff) results.push(descDiff);

  const tagsDiff = diffTags(prev.tags, next.tags);
  if (tagsDiff) results.push(tagsDiff);

  const viewDiff = diffField(
    "VIEW_COUNT",
    prev.viewCount,
    next.viewCount
  );
  if (viewDiff) results.push(viewDiff);

  const likeDiff = diffField(
    "LIKE_COUNT",
    prev.likeCount,
    next.likeCount
  );
  if (likeDiff) results.push(likeDiff);

  return results;
}

function diffField(
  field: DiffField,
  oldVal: string | null,
  newVal: string | null
): DiffResult | null {
  const oldStr = oldVal ?? null;
  const newStr = newVal ?? null;

  if (oldStr === newStr) return null;

  let changeType: "ADDED" | "MODIFIED" | "REMOVED";
  if (oldStr === null) changeType = "ADDED";
  else if (newStr === null) changeType = "REMOVED";
  else changeType = "MODIFIED";

  return { field, oldValue: oldStr, newValue: newStr, changeType };
}

function diffTags(oldTags: string[], newTags: string[]): DiffResult | null {
  const oldSet = new Set(oldTags);
  const newSet = new Set(newTags);

  const added = newTags.filter((t) => !oldSet.has(t));
  const removed = oldTags.filter((t) => !newSet.has(t));

  if (added.length === 0 && removed.length === 0) return null;

  return {
    field: "TAGS",
    oldValue: removed.length > 0 ? removed.join(", ") : null,
    newValue: added.length > 0 ? added.join(", ") : null,
    changeType:
      oldTags.length === 0
        ? "ADDED"
        : newTags.length === 0
          ? "REMOVED"
          : "MODIFIED",
  };
}

export function wordDiff(
  oldTitle: string,
  newTitle: string
): { word: string; type: "same" | "added" | "removed" }[] {
  const oldWords = oldTitle.split(/\s+/);
  const newWords = newTitle.split(/\s+/);

  const lcs = buildLCS(oldWords, newWords);
  const result: { word: string; type: "same" | "added" | "removed" }[] = [];

  let oi = 0;
  let ni = 0;
  let li = 0;

  while (oi < oldWords.length || ni < newWords.length) {
    if (
      li < lcs.length &&
      ni < newWords.length &&
      newWords[ni] === lcs[li]
    ) {
      if (oi < oldWords.length && oldWords[oi] === lcs[li]) {
        result.push({ word: oldWords[oi], type: "same" });
        oi++;
        ni++;
        li++;
      } else {
        result.push({ word: newWords[ni], type: "added" });
        ni++;
      }
    } else if (oi < oldWords.length) {
      result.push({ word: oldWords[oi], type: "removed" });
      oi++;
    } else if (ni < newWords.length) {
      result.push({ word: newWords[ni], type: "added" });
      ni++;
    } else {
      break;
    }
  }

  return result;
}

function buildLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const lcs: string[] = [];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
