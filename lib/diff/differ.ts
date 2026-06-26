import type { DiffField } from "@/types";

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
