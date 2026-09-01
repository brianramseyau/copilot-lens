import type { CostRecord } from './types.js';

/** Parses RFC4180-ish CSV text (quoted fields, escaped "" quotes, embedded commas/newlines). */
export function parseCsvText(rawText: string): string[][] {
  // Strip a leading UTF-8 BOM (common in Excel-exported CSVs) so header lookups match.
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function num(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Parses an AI usage cost export (CSV) into typed records, keyed off the header row. */
export function parseCostCsv(text: string): CostRecord[] {
  const rows = parseCsvText(text);
  if (rows.length < 2) return [];
  const header = rows[0];
  const col = (name: string) => header.indexOf(name);
  const idx = {
    date: col('date'),
    username: col('username'),
    product: col('product'),
    sku: col('sku'),
    model: col('model'),
    quantity: col('quantity'),
    unit_type: col('unit_type'),
    applied_cost_per_quantity: col('applied_cost_per_quantity'),
    gross_amount: col('gross_amount'),
    discount_amount: col('discount_amount'),
    net_amount: col('net_amount'),
    total_monthly_quota: col('total_monthly_quota'),
    organization: col('organization'),
    repository: col('repository'),
    cost_center_name: col('cost_center_name'),
    aic_quantity: col('aic_quantity'),
    aic_gross_amount: col('aic_gross_amount'),
    input: col('input'),
    output: col('output'),
    cache_read: col('cache_read'),
    cache_write: col('cache_write'),
  };

  const records: CostRecord[] = [];
  for (const r of rows.slice(1)) {
    if (r.length <= 1) continue;
    records.push({
      date: r[idx.date] ?? '',
      username: r[idx.username] ?? '',
      product: r[idx.product] ?? '',
      sku: r[idx.sku] ?? '',
      model: r[idx.model] ?? '',
      quantity: num(r[idx.quantity]),
      unit_type: r[idx.unit_type] ?? '',
      applied_cost_per_quantity: num(r[idx.applied_cost_per_quantity]),
      gross_amount: num(r[idx.gross_amount]),
      discount_amount: num(r[idx.discount_amount]),
      net_amount: num(r[idx.net_amount]),
      total_monthly_quota: num(r[idx.total_monthly_quota]),
      organization: r[idx.organization] ?? '',
      repository: r[idx.repository] ?? '',
      cost_center_name: r[idx.cost_center_name] ?? '',
      aic_quantity: num(r[idx.aic_quantity]),
      aic_gross_amount: num(r[idx.aic_gross_amount]),
      input: num(r[idx.input]),
      output: num(r[idx.output]),
      cache_read: num(r[idx.cache_read]),
      cache_write: num(r[idx.cache_write]),
    });
  }
  return records;
}

/** Identity key for a cost row: one row per user/day/model/sku combination. */
export function costRecordKey(r: CostRecord): string {
  return `${r.date}::${r.username}::${r.model}::${r.sku}`;
}

export interface CostDedupeResult {
  deduped: CostRecord[];
  duplicateCount: number;
}

/** De-duplicates cost rows by (date, username, model, sku); last occurrence wins. */
export function dedupeCostRecords(records: CostRecord[]): CostDedupeResult {
  const map = new Map<string, CostRecord>();
  let duplicateCount = 0;
  for (const r of records) {
    const key = costRecordKey(r);
    if (map.has(key)) duplicateCount++;
    map.set(key, r);
  }
  return { deduped: [...map.values()].sort((a, b) => a.date.localeCompare(b.date)), duplicateCount };
}
