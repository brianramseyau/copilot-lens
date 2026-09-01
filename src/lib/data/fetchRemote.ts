import { parseNdjson } from './parse';
import type { UsageRecord } from './types';

export interface FetchLatestResult {
  newRecords: UsageRecord[];
  totalFetched: number;
  latestDayBefore: string;
  latestDayAfter: string;
}

/**
 * Fetches an NDJSON export from `url` and returns only the rows for days
 * after `latestDayBefore` (the newest day already present in the report),
 * up to and including today.
 */
export async function fetchLatestExport(url: string, latestDayBefore: string): Promise<FetchLatestResult> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Network request failed. The link may be blocked by CORS, expired, or you may be offline.');
  }
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} ${response.statusText}. The download link may have expired — request a fresh one.`);
  }
  const text = await response.text();
  const records = parseNdjson(text);
  const today = new Date().toISOString().slice(0, 10);
  const newRecords = records.filter((r) => r.day > latestDayBefore && r.day <= today);
  const latestDayAfter = newRecords.reduce((max, r) => (r.day > max ? r.day : max), latestDayBefore);
  return { newRecords, totalFetched: records.length, latestDayBefore, latestDayAfter };
}
