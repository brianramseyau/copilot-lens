import type { UsageRecord } from './types.js';

/** Parses raw NDJSON text into records, silently skipping blank/malformed lines. */
export function parseNdjson(text: string): UsageRecord[] {
  const records: UsageRecord[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed) as UsageRecord);
    } catch {
      // Skip malformed / truncated lines rather than failing the whole ingest.
    }
  }
  return records;
}

/** Identity key for a record: one row per user per day. */
export function recordKey(r: UsageRecord): string {
  return `${r.user_id}::${r.day}`;
}

export interface DedupeResult {
  deduped: UsageRecord[];
  duplicateCount: number;
}

/**
 * De-duplicates records by (user_id, day). When the same user/day appears
 * more than once (e.g. overlapping export files), the last occurrence wins.
 */
export function dedupeRecords(records: UsageRecord[]): DedupeResult {
  const map = new Map<string, UsageRecord>();
  let duplicateCount = 0;
  for (const r of records) {
    const key = recordKey(r);
    if (map.has(key)) duplicateCount++;
    map.set(key, r);
  }
  return { deduped: [...map.values()].sort((a, b) => a.day.localeCompare(b.day)), duplicateCount };
}
