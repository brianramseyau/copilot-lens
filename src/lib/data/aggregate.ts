import type { CostRecord, UsageRecord } from './types';
import { formatFeatureName, formatLanguageName, formatModelName } from './displayNames';

export interface DateRange {
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD inclusive
}

export function isWeekend(day: string): boolean {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
}

export function filterByRange(records: UsageRecord[], range: DateRange): UsageRecord[] {
  return records.filter((r) => r.day >= range.start && r.day <= range.end);
}

export function daysInRange(range: DateRange): string[] {
  if (!range.start || !range.end || range.start > range.end) return [];
  const days: string[] = [];
  const cursor = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function fullDateBounds(records: UsageRecord[]): DateRange | undefined {
  if (records.length === 0) return undefined;
  let min = records[0].day;
  let max = records[0].day;
  for (const r of records) {
    if (r.day < min) min = r.day;
    if (r.day > max) max = r.day;
  }
  return { start: min, end: max };
}

export interface Kpis {
  activeUsers: number;
  totalUsers: number;
  agentUsers: number;
  agentAdoptionRate: number;
  chatUsers: number;
  chatAdoptionRate: number;
  cliUsers: number;
  cliAdoptionRate: number;
  averageActivityPerActiveUser: number;
  totalInteractions: number;
  totalSuggestions: number;
  totalAcceptances: number;
  acceptanceRate: number;
  totalLocAdded: number;
  totalLocDeleted: number;
  weekendSharePct: number;
  weekendConcern: boolean;
  topModel: { name: string; count: number; sharePct: number } | undefined;
  topFeature: { name: string; count: number; sharePct: number } | undefined;
  activeDays: number;
  totalDaysInRange: number;
  aiCreditsUsed: number;
}

const WEEKEND_CONCERN_THRESHOLD_PCT = 8;

export function computeKpis(records: UsageRecord[], allRecords: UsageRecord[], range?: DateRange): Kpis {
  const userIds = new Set(allRecords.map((r) => r.user_id));
  const activeUserIds = new Set(
    records.filter((r) => r.user_initiated_interaction_count + r.code_generation_activity_count > 0).map((r) => r.user_id),
  );
  const agentUserIds = new Set(records.filter((r) => r.used_agent).map((r) => r.user_id));
  const nonAgentChatFeatures = new Set([
    'chat_panel_ask_mode',
    'chat_panel_custom_mode',
    'chat_panel_plan_mode',
    'chat_inline',
  ]);
  const chatUserIds = new Set(
    records
      .filter((record) =>
        record.totals_by_feature?.some(
          (feature) =>
            nonAgentChatFeatures.has(feature.feature) &&
            feature.user_initiated_interaction_count + feature.code_generation_activity_count > 0,
        ),
      )
      .map((record) => record.user_id),
  );
  const cliUserIds = new Set(records.filter((r) => r.used_cli).map((r) => r.user_id));

  let totalInteractions = 0;
  let totalSuggestions = 0;
  let totalAcceptances = 0;
  let totalLocAdded = 0;
  let totalLocDeleted = 0;
  let weekendInteractions = 0;
  let aiCreditsUsed = 0;
  const activeDaySet = new Set<string>();

  const modelCounts = new Map<string, number>();
  const featureCounts = new Map<string, number>();

  for (const r of records) {
    totalInteractions += r.user_initiated_interaction_count;
    totalSuggestions += r.code_generation_activity_count;
    totalAcceptances += r.code_acceptance_activity_count;
    totalLocAdded += r.loc_added_sum;
    totalLocDeleted += r.loc_deleted_sum;
    aiCreditsUsed += r.ai_credits_used ?? 0;

    if (r.user_initiated_interaction_count + r.code_generation_activity_count > 0) {
      activeDaySet.add(r.day);
      if (isWeekend(r.day)) {
        weekendInteractions += r.user_initiated_interaction_count + r.code_generation_activity_count;
      }
    }

    for (const m of r.totals_by_language_model ?? []) {
      const modelName = formatModelName(m.model);
      modelCounts.set(modelName, (modelCounts.get(modelName) ?? 0) + m.code_generation_activity_count);
    }
    for (const f of r.totals_by_feature ?? []) {
      const featureName = formatFeatureName(f.feature);
      featureCounts.set(featureName, (featureCounts.get(featureName) ?? 0) + f.code_generation_activity_count + f.user_initiated_interaction_count);
    }
  }

  const totalActivity = totalInteractions + totalSuggestions;
  const weekendSharePct = totalActivity > 0 ? (weekendInteractions / totalActivity) * 100 : 0;

  const topModelEntry = [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const modelTotal = [...modelCounts.values()].reduce((a, b) => a + b, 0);
  const topFeatureEntry = [...featureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const featureTotal = [...featureCounts.values()].reduce((a, b) => a + b, 0);

  const totalDaysInRange = range
    ? Math.round((new Date(`${range.end}T00:00:00Z`).getTime() - new Date(`${range.start}T00:00:00Z`).getTime()) / 86_400_000) + 1
    : activeDaySet.size;

  return {
    activeUsers: activeUserIds.size,
    totalUsers: userIds.size,
    agentUsers: agentUserIds.size,
    agentAdoptionRate: activeUserIds.size > 0 ? (agentUserIds.size / activeUserIds.size) * 100 : 0,
    chatUsers: chatUserIds.size,
    chatAdoptionRate: activeUserIds.size > 0 ? (chatUserIds.size / activeUserIds.size) * 100 : 0,
    cliUsers: cliUserIds.size,
    cliAdoptionRate: activeUserIds.size > 0 ? (cliUserIds.size / activeUserIds.size) * 100 : 0,
    averageActivityPerActiveUser: activeUserIds.size > 0 ? totalActivity / activeUserIds.size : 0,
    totalInteractions,
    totalSuggestions,
    totalAcceptances,
    acceptanceRate: totalSuggestions > 0 ? (totalAcceptances / totalSuggestions) * 100 : 0,
    totalLocAdded,
    totalLocDeleted,
    weekendSharePct,
    weekendConcern: weekendSharePct >= WEEKEND_CONCERN_THRESHOLD_PCT,
    topModel: topModelEntry ? { name: topModelEntry[0], count: topModelEntry[1], sharePct: modelTotal > 0 ? (topModelEntry[1] / modelTotal) * 100 : 0 } : undefined,
    topFeature: topFeatureEntry ? { name: topFeatureEntry[0], count: topFeatureEntry[1], sharePct: featureTotal > 0 ? (topFeatureEntry[1] / featureTotal) * 100 : 0 } : undefined,
    activeDays: activeDaySet.size,
    totalDaysInRange,
    aiCreditsUsed,
  };
}

export interface DailyPoint {
  day: string;
  interactions: number;
  suggestions: number;
  acceptances: number;
  activeUsers: number;
  weekend: boolean;
}

export function computeDailyTrend(records: UsageRecord[], range?: DateRange): DailyPoint[] {
  const byDay = new Map<string, DailyPoint & { users: Set<number> }>();
  for (const r of records) {
    let entry = byDay.get(r.day);
    if (!entry) {
      entry = { day: r.day, interactions: 0, suggestions: 0, acceptances: 0, activeUsers: 0, weekend: isWeekend(r.day), users: new Set() };
      byDay.set(r.day, entry);
    }
    entry.interactions += r.user_initiated_interaction_count;
    entry.suggestions += r.code_generation_activity_count;
    entry.acceptances += r.code_acceptance_activity_count;
    if (r.user_initiated_interaction_count + r.code_generation_activity_count > 0) {
      entry.users.add(r.user_id);
    }
  }
  const days = range ? daysInRange(range) : [...byDay.keys()].sort();
  return days.map((day) => {
    const entry = byDay.get(day);
    if (!entry) {
      return { day, interactions: 0, suggestions: 0, acceptances: 0, activeUsers: 0, weekend: isWeekend(day) };
    }
    const { users, ...rest } = entry;
    return { ...rest, activeUsers: users.size };
  });
}

export interface RankedItem {
  name: string;
  count: number;
  sharePct: number;
}

function rankBy(entries: [string, number][]): RankedItem[] {
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  return entries
    .filter(([name, count]) => !!name && count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, sharePct: total > 0 ? (count / total) * 100 : 0 }));
}

export function computeModelUsage(records: UsageRecord[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const m of r.totals_by_language_model ?? []) {
      const modelName = formatModelName(m.model);
      counts.set(modelName, (counts.get(modelName) ?? 0) + m.code_generation_activity_count);
    }
  }
  return rankBy([...counts.entries()]);
}

export interface LanguageModelBreakdown {
  languages: string[];
  models: string[];
  counts: Record<string, number[]>;
  percentages: Record<string, number[]>;
}

export function computeLanguageUsage(records: UsageRecord[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const item of record.totals_by_language_model ?? []) {
      if (item.code_generation_activity_count <= 0 || item.language.toLowerCase() === 'others') continue;
      const language = formatLanguageName(item.language);
      counts.set(language, (counts.get(language) ?? 0) + item.code_generation_activity_count);
    }
  }
  return rankBy([...counts.entries()]);
}

export function computeModelUsageByLanguage(records: UsageRecord[]): LanguageModelBreakdown {
  const byLanguage = new Map<string, Map<string, number>>();
  const modelTotals = new Map<string, number>();
  let grandTotal = 0;

  for (const record of records) {
    for (const item of record.totals_by_language_model ?? []) {
      if (
        item.code_generation_activity_count <= 0 ||
        item.language.toLowerCase() === 'others' ||
        item.model.toLowerCase() === 'others'
      ) continue;
      const language = formatLanguageName(item.language);
      const model = formatModelName(item.model);
      const languageModels = byLanguage.get(language) ?? new Map<string, number>();
      languageModels.set(model, (languageModels.get(model) ?? 0) + item.code_generation_activity_count);
      byLanguage.set(language, languageModels);
      modelTotals.set(model, (modelTotals.get(model) ?? 0) + item.code_generation_activity_count);
      grandTotal += item.code_generation_activity_count;
    }
  }

  const languages = [...byLanguage.entries()]
    .sort((a, b) => {
      const totalA = [...a[1].values()].reduce((sum, count) => sum + count, 0);
      const totalB = [...b[1].values()].reduce((sum, count) => sum + count, 0);
      return totalB - totalA;
    })
    .map(([language]) => language);
  const models = [...modelTotals.entries()].sort((a, b) => b[1] - a[1]).map(([model]) => model);
  const counts: Record<string, number[]> = {};
  const percentages: Record<string, number[]> = {};

  for (const model of models) {
    counts[model] = languages.map((language) => byLanguage.get(language)?.get(model) ?? 0);
    percentages[model] = counts[model].map((count) => (grandTotal > 0 ? (count / grandTotal) * 100 : 0));
  }

  return { languages, models, counts, percentages };
}

export function computeFeatureUsage(records: UsageRecord[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const f of r.totals_by_feature ?? []) {
      const featureName = formatFeatureName(f.feature);
      counts.set(featureName, (counts.get(featureName) ?? 0) + f.code_generation_activity_count + f.user_initiated_interaction_count);
    }
  }
  return rankBy([...counts.entries()]);
}

export function computeIdeUsage(records: UsageRecord[]): RankedItem[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const i of r.totals_by_ide ?? []) {
      // Guard against malformed ide labels such as stray version strings.
      if (!/^[a-z0-9_-]+$/i.test(i.ide)) continue;
      counts.set(i.ide, (counts.get(i.ide) ?? 0) + i.user_initiated_interaction_count + i.code_generation_activity_count);
    }
  }
  return rankBy([...counts.entries()]);
}

export interface UserRankedItem extends RankedItem {
  interactions: number;
  suggestions: number;
  acceptances: number;
}

export function computeTopUsers(records: UsageRecord[], limit = 10): UserRankedItem[] {
  const byUser = new Map<string, { interactions: number; suggestions: number; acceptances: number }>();
  for (const r of records) {
    const entry = byUser.get(r.user_login) ?? { interactions: 0, suggestions: 0, acceptances: 0 };
    entry.interactions += r.user_initiated_interaction_count;
    entry.suggestions += r.code_generation_activity_count;
    entry.acceptances += r.code_acceptance_activity_count;
    byUser.set(r.user_login, entry);
  }
  const total = [...byUser.values()].reduce((sum, v) => sum + v.interactions + v.suggestions, 0);
  return [...byUser.entries()]
    .map(([name, v]) => ({
      name,
      count: v.interactions + v.suggestions,
      sharePct: total > 0 ? ((v.interactions + v.suggestions) / total) * 100 : 0,
      ...v,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface DailyModelSeries {
  name: string;
  percentages: number[];
  requests: number[];
}

export interface DailyModelUsage {
  days: string[];
  series: DailyModelSeries[];
}

export function computeDailyModelUsage(records: UsageRecord[], range?: DateRange, modelLimit = 4): DailyModelUsage {
  const byDay = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();

  for (const record of records) {
    const dayModels = byDay.get(record.day) ?? new Map<string, number>();
    for (const item of record.totals_by_model_feature ?? []) {
      if (item.feature === 'code_completion') continue;
      const requests = item.user_initiated_interaction_count;
      if (requests <= 0) continue;
      const modelName = formatModelName(item.model);
      dayModels.set(modelName, (dayModels.get(modelName) ?? 0) + requests);
      totals.set(modelName, (totals.get(modelName) ?? 0) + requests);
    }
    byDay.set(record.day, dayModels);
  }

  const days = range ? daysInRange(range) : [...byDay.keys()].sort();
  const topModels = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, modelLimit)
    .map(([name]) => name);
  const topModelSet = new Set(topModels);
  const seriesNames = [...topModels, 'Other Models'];
  const requestSeries = new Map(seriesNames.map((name) => [name, [] as number[]]));

  for (const day of days) {
    const dayModels = byDay.get(day) ?? new Map<string, number>();
    const dayValues = new Map(seriesNames.map((name) => [name, 0]));
    for (const [name, count] of dayModels) {
      const seriesName = topModelSet.has(name) ? name : 'Other Models';
      dayValues.set(seriesName, (dayValues.get(seriesName) ?? 0) + count);
    }
    for (const name of seriesNames) requestSeries.get(name)?.push(dayValues.get(name) ?? 0);
  }

  return {
    days,
    series: seriesNames.map((name) => {
      const requests = requestSeries.get(name) ?? [];
      return {
        name,
        requests,
        percentages: requests.map((count, index) => {
          const total = seriesNames.reduce((sum, seriesName) => sum + (requestSeries.get(seriesName)?.[index] ?? 0), 0);
          return total > 0 ? (count / total) * 100 : 0;
        }),
      };
    }),
  };
}

export interface WeekendConcern {
  weekendActivity: number;
  weekdayActivity: number;
  weekendSharePct: number;
  concern: boolean;
  weekendDaysWithActivity: { day: string; activity: number }[];
}

export function computeWeekendConcern(records: UsageRecord[]): WeekendConcern {
  let weekendActivity = 0;
  let weekdayActivity = 0;
  const dayActivity = new Map<string, number>();
  for (const r of records) {
    const activity = r.user_initiated_interaction_count + r.code_generation_activity_count;
    if (activity === 0) continue;
    if (isWeekend(r.day)) {
      weekendActivity += activity;
      dayActivity.set(r.day, (dayActivity.get(r.day) ?? 0) + activity);
    } else {
      weekdayActivity += activity;
    }
  }
  const total = weekendActivity + weekdayActivity;
  const weekendSharePct = total > 0 ? (weekendActivity / total) * 100 : 0;
  return {
    weekendActivity,
    weekdayActivity,
    weekendSharePct,
    concern: weekendSharePct >= WEEKEND_CONCERN_THRESHOLD_PCT,
    weekendDaysWithActivity: [...dayActivity.entries()]
      .map(([day, activity]) => ({ day, activity }))
      .sort((a, b) => b.activity - a.activity),
  };
}

export interface WeekendUserBreakdown {
  username: string;
  activity: number;
  cost: number;
}

/**
 * Per-user activity and net cost restricted to Saturday/Sunday days only,
 * so weekend usage concerns can be traced back to specific users.
 */
export function computeWeekendUsageByUser(usageRecords: UsageRecord[], costRecords: CostRecord[]): WeekendUserBreakdown[] {
  const byUser = new Map<string, WeekendUserBreakdown>();
  const entry = (username: string) => {
    let e = byUser.get(username);
    if (!e) {
      e = { username, activity: 0, cost: 0 };
      byUser.set(username, e);
    }
    return e;
  };

  for (const r of usageRecords) {
    if (!isWeekend(r.day)) continue;
    const activity = r.user_initiated_interaction_count + r.code_generation_activity_count;
    if (activity === 0) continue;
    entry(r.user_login).activity += activity;
  }
  for (const r of costRecords) {
    if (!isWeekend(r.date)) continue;
    entry(r.username).cost += r.net_amount;
  }

  return [...byUser.values()]
    .map((e) => ({ ...e, cost: round2(e.cost) }))
    .filter((e) => e.activity > 0 || e.cost > 0)
    .sort((a, b) => b.activity - a.activity || b.cost - a.cost);
}

export interface CostFilterResult {
  filtered: CostRecord[];
  excludedCount: number;
}

/**
 * Cost exports can include other organizations' users. Keep only the rows
 * for usernames that are already present in the ingested usage report.
 */
export function filterCostByKnownUsers(records: CostRecord[], knownUsernames: Set<string>): CostFilterResult {
  const filtered: CostRecord[] = [];
  let excludedCount = 0;
  for (const r of records) {
    if (knownUsernames.has(r.username)) {
      filtered.push(r);
    } else {
      excludedCount++;
    }
  }
  return { filtered, excludedCount };
}

export function filterCostByRange(records: CostRecord[], range: DateRange): CostRecord[] {
  return records.filter((r) => r.date >= range.start && r.date <= range.end);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface CostKpis {
  totalNetCost: number;
  totalGrossCost: number;
  totalDiscount: number;
  discountCoverageRate: number;
  totalCreditsUsed: number;
  topModelByCost: { name: string; cost: number; sharePct: number } | undefined;
  lowestModelByCost: { name: string; cost: number; sharePct: number } | undefined;
  topUserByCost: { name: string; cost: number; sharePct: number } | undefined;
  lowestUserByCost: { name: string; cost: number; sharePct: number } | undefined;
}

export function computeCostKpis(records: CostRecord[]): CostKpis {
  let totalNetCost = 0;
  let totalGrossCost = 0;
  let totalDiscount = 0;
  let totalCreditsUsed = 0;
  const modelCosts = new Map<string, number>();
  const userCosts = new Map<string, number>();

  for (const r of records) {
    totalNetCost += r.net_amount;
    totalGrossCost += r.gross_amount;
    totalDiscount += r.discount_amount;
    totalCreditsUsed += r.quantity;
    const modelName = formatModelName(stripAutoPrefix(r.model));
    modelCosts.set(modelName, (modelCosts.get(modelName) ?? 0) + r.net_amount);
    userCosts.set(r.username, (userCosts.get(r.username) ?? 0) + r.net_amount);
  }

  const sortedModelCosts = [...modelCosts.entries()].filter(([, cost]) => cost > 0).sort((a, b) => b[1] - a[1]);
  const topModelEntry = sortedModelCosts[0];
  const lowestModelEntry = sortedModelCosts.at(-1);
  const sortedUserCosts = [...userCosts.entries()].filter(([, cost]) => cost > 0).sort((a, b) => b[1] - a[1]);
  const topUserEntry = sortedUserCosts[0];
  const lowestUserEntry = sortedUserCosts.at(-1);

  return {
    totalNetCost: round2(totalNetCost),
    totalGrossCost: round2(totalGrossCost),
    totalDiscount: round2(totalDiscount),
    discountCoverageRate: totalGrossCost > 0 ? (totalDiscount / totalGrossCost) * 100 : 0,
    totalCreditsUsed: round2(totalCreditsUsed),
    topModelByCost: topModelEntry
      ? { name: topModelEntry[0], cost: round2(topModelEntry[1]), sharePct: totalNetCost > 0 ? (topModelEntry[1] / totalNetCost) * 100 : 0 }
      : undefined,
    lowestModelByCost: lowestModelEntry
      ? { name: lowestModelEntry[0], cost: round2(lowestModelEntry[1]), sharePct: totalNetCost > 0 ? (lowestModelEntry[1] / totalNetCost) * 100 : 0 }
      : undefined,
    topUserByCost: topUserEntry
      ? { name: topUserEntry[0], cost: round2(topUserEntry[1]), sharePct: totalNetCost > 0 ? (topUserEntry[1] / totalNetCost) * 100 : 0 }
      : undefined,
    lowestUserByCost: lowestUserEntry
      ? { name: lowestUserEntry[0], cost: round2(lowestUserEntry[1]), sharePct: totalNetCost > 0 ? (lowestUserEntry[1] / totalNetCost) * 100 : 0 }
      : undefined,
  };
}

export function computeCostByModel(records: CostRecord[]): RankedItem[] {
  const costs = new Map<string, number>();
  for (const r of records) {
    // "Auto: X" and "X" are the same underlying model, just invoked via auto-routing.
    const name = formatModelName(stripAutoPrefix(r.model));
    costs.set(name, (costs.get(name) ?? 0) + r.net_amount);
  }
  return rankBy([...costs.entries()].map(([name, cost]) => [name, round2(cost)]));
}

export function computeCostByUser(records: CostRecord[], limit = 10): RankedItem[] {
  const costs = new Map<string, number>();
  for (const r of records) {
    costs.set(r.username, (costs.get(r.username) ?? 0) + r.net_amount);
  }
  return rankBy([...costs.entries()].map(([name, cost]) => [name, round2(cost)])).slice(0, limit);
}

export interface UserTokenPaymentBreakdown {
  username: string;
  includedTokens: number;
  paidTokens: number;
  totalTokens: number;
  paidCost: number;
}

export function computeTokenPaymentByUser(records: CostRecord[]): UserTokenPaymentBreakdown[] {
  const byUser = new Map<string, UserTokenPaymentBreakdown>();

  for (const record of records) {
    const totalTokens = record.input + record.output + record.cache_read + record.cache_write;
    if (totalTokens <= 0) continue;

    const costBasis = record.discount_amount + record.net_amount;
    const includedRatio = costBasis > 0 ? Math.min(1, Math.max(0, record.discount_amount / costBasis)) : 0;
    const includedTokens = totalTokens * includedRatio;
    const entry = byUser.get(record.username) ?? {
      username: record.username,
      includedTokens: 0,
      paidTokens: 0,
      totalTokens: 0,
      paidCost: 0,
    };
    entry.includedTokens += includedTokens;
    entry.paidTokens += totalTokens - includedTokens;
    entry.totalTokens += totalTokens;
    entry.paidCost += record.net_amount;
    byUser.set(record.username, entry);
  }

  return [...byUser.values()]
    .map((entry) => ({
      ...entry,
      includedTokens: Math.round(entry.includedTokens),
      paidTokens: Math.round(entry.paidTokens),
      totalTokens: Math.round(entry.totalTokens),
      paidCost: round2(entry.paidCost),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export interface DailyCostPoint {
  date: string;
  cost: number;
}

export function computeDailyCostTrend(records: CostRecord[], range?: DateRange): DailyCostPoint[] {
  const costs = new Map<string, number>();
  for (const r of records) {
    costs.set(r.date, (costs.get(r.date) ?? 0) + r.net_amount);
  }
  const days = range ? daysInRange(range) : [...costs.keys()].sort();
  return days.map((date) => ({ date, cost: round2(costs.get(date) ?? 0) }));
}

function stripAutoPrefix(model: string): string {
  return model.replace(/^Auto:\s*/i, '');
}

/**
 * The usage report and the cost export name the same model differently
 * (e.g. usage: "claude-4.6-sonnet", cost: "Claude Sonnet 4.6"). Build an
 * order-independent key so the two can be matched on a best-effort basis.
 */
function canonicalModelKey(model: string): string {
  return stripAutoPrefix(model)
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter(Boolean)
    .sort()
    .join('-');
}

export interface ModelEfficiencyItem {
  name: string;
  costPerAcceptance: number;
  totalCost: number;
  acceptedCount: number;
}

/**
 * Cross-references usage acceptances with cost spend per model (best-effort
 * matched by canonical model key). Models present in only one of the two
 * datasets are omitted rather than guessed at.
 */
export function computeCostEfficiencyByModel(usageRecords: UsageRecord[], costRecords: CostRecord[]): ModelEfficiencyItem[] {
  const acceptedByModel = new Map<string, number>();
  for (const r of usageRecords) {
    for (const m of r.totals_by_language_model ?? []) {
      const key = canonicalModelKey(m.model);
      acceptedByModel.set(key, (acceptedByModel.get(key) ?? 0) + m.code_acceptance_activity_count);
    }
  }

  const costByModel = new Map<string, { display: string; cost: number }>();
  for (const r of costRecords) {
    const key = canonicalModelKey(r.model);
    const entry = costByModel.get(key) ?? { display: formatModelName(stripAutoPrefix(r.model)), cost: 0 };
    entry.cost += r.net_amount;
    costByModel.set(key, entry);
  }

  const items: ModelEfficiencyItem[] = [];
  for (const [key, costEntry] of costByModel) {
    const accepted = acceptedByModel.get(key);
    if (!accepted) continue;
    items.push({
      name: costEntry.display,
      totalCost: round2(costEntry.cost),
      acceptedCount: accepted,
      costPerAcceptance: round2(costEntry.cost / accepted),
    });
  }
  return items.sort((a, b) => b.costPerAcceptance - a.costPerAcceptance);
}
