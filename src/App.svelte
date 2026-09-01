<script lang="ts">
  import dataset from 'virtual:copilot-data';
  import {
    BadgePercent,
    Activity,
    Bot,
    CalendarCheck2,
    CalendarDays,
    CircleCheckBig,
    CodeXml,
    Coins,
    Cpu,
    DollarSign,
    Gauge,
    MessageSquare,
    MessagesSquare,
    Percent,
    ReceiptText,
    Sparkles,
    Trash2,
    TrendingDown,
    TrendingUp,
    Trophy,
    Terminal,
    UserRoundCheck,
    Users,
    Zap,
  } from '@lucide/svelte';
  import { dedupeRecords } from './lib/data/parse';
  import {
    filterByRange,
    fullDateBounds,
    computeKpis,
    computeDailyTrend,
    computeModelUsage,
    computeLanguageUsage,
    computeModelUsageByLanguage,
    computeFeatureUsage,
    computeIdeUsage,
    computeTopUsers,
    computeDailyModelUsage,
    computeWeekendConcern,
    filterCostByKnownUsers,
    filterCostByRange,
    computeCostKpis,
    computeCostByModel,
    computeCostByUser,
    computeTokenPaymentByUser,
    computeDailyCostTrend,
    computeCostEfficiencyByModel,
    type DateRange,
  } from './lib/data/aggregate';
  import KpiCard from './lib/components/KpiCard.svelte';
  import DateRangeControl from './lib/components/DateRangeControl.svelte';
  import TrendChart from './lib/components/TrendChart.svelte';
  import RankBarChart from './lib/components/RankBarChart.svelte';
  import DailyModelUsageChart from './lib/components/DailyModelUsageChart.svelte';
  import LanguageUsageChart from './lib/components/LanguageUsageChart.svelte';
  import ModelByLanguageChart from './lib/components/ModelByLanguageChart.svelte';
  import TokenPaymentByUserChart from './lib/components/TokenPaymentByUserChart.svelte';
  import CostEfficiencyChart from './lib/components/CostEfficiencyChart.svelte';
  import RubberDuck from './lib/components/icons/RubberDuck.svelte';
  import ConcernPanel, { type ConcernItem } from './lib/components/ConcernPanel.svelte';
  import ImportMenu from './lib/components/ImportMenu.svelte';
  import ExportMenu from './lib/components/ExportMenu.svelte';
  import { theme, toggleTheme } from './lib/theme';
  import { uploadedRecords, uploadedCostRecords } from './lib/data/uploadStore';

  let allRecords = $derived.by(() => {
    const { deduped } = dedupeRecords([...dataset.records, ...$uploadedRecords]);
    return deduped;
  });

  let bounds = $derived<DateRange>(fullDateBounds(allRecords) ?? { start: '', end: '' });

  let range = $state<DateRange>({ start: '', end: '' });

  // Seed the selected range from the dataset bounds once they're known.
  $effect(() => {
    if (!range.start && bounds.start) {
      range = { ...bounds };
    }
  });

  let filtered = $derived(range.start ? filterByRange(allRecords, range) : []);

  let kpis = $derived(computeKpis(filtered, allRecords, range.start ? range : undefined));
  let trend = $derived(computeDailyTrend(filtered, range.start ? range : undefined));
  let models = $derived(computeModelUsage(filtered));
  let languages = $derived(computeLanguageUsage(filtered));
  let modelUsageByLanguage = $derived(computeModelUsageByLanguage(filtered));
  let features = $derived(computeFeatureUsage(filtered));
  let ides = $derived(computeIdeUsage(filtered));
  let topUsers = $derived(computeTopUsers(filtered));
  let dailyModelUsage = $derived(computeDailyModelUsage(filtered, range.start ? range : undefined));
  let weekendConcern = $derived(computeWeekendConcern(filtered));

  // Cost CSV exports can include other orgs' users; only keep rows for users
  // already present in the usage report.
  let knownUsernames = $derived(new Set(allRecords.map((r) => r.user_login)));
  let costFilterResult = $derived(
    filterCostByKnownUsers([...dataset.cost.records, ...$uploadedCostRecords], knownUsernames),
  );
  let allCostRecords = $derived(costFilterResult.filtered);
  let filteredCost = $derived(range.start ? filterCostByRange(allCostRecords, range) : []);
  let costKpis = $derived(computeCostKpis(filteredCost));
  let costByModel = $derived(computeCostByModel(filteredCost));
  let costByUser = $derived(computeCostByUser(filteredCost));
  let tokenPaymentByUser = $derived(computeTokenPaymentByUser(filteredCost));
  let costTrend = $derived(computeDailyCostTrend(filteredCost, range.start ? range : undefined));
  let costEfficiencyByModel = $derived(computeCostEfficiencyByModel(filtered, filteredCost));

  // Cross-referenced cost/usage efficiency, only meaningful once both datasets are present.
  let costPerAcceptedSuggestion = $derived(
    kpis.totalAcceptances > 0 ? costKpis.totalNetCost / kpis.totalAcceptances : 0,
  );
  let costPerActiveUser = $derived(kpis.activeUsers > 0 ? costKpis.totalNetCost / kpis.activeUsers : 0);

  let concerns = $derived.by<ConcernItem[]>(() => {
    const list: ConcernItem[] = [];
    if (weekendConcern.concern) {
      list.push({
        title: 'Elevated weekend usage',
        detail: `${weekendConcern.weekendSharePct.toFixed(1)}% of all activity in this range happened on a Saturday or Sunday, across ${weekendConcern.weekendDaysWithActivity.length} weekend day(s). Consider checking in on team workload balance.`,
        severity: 'warning',
      });
    }
    if (kpis.totalSuggestions > 0 && kpis.acceptanceRate < 20) {
      list.push({
        title: 'Low suggestion acceptance rate',
        detail: `Only ${kpis.acceptanceRate.toFixed(1)}% of ${kpis.totalSuggestions.toLocaleString()} generated suggestions were accepted, which may indicate low relevance or limited trust in suggestions.`,
        severity: 'warning',
      });
    }
    if (kpis.totalUsers > 0 && kpis.activeUsers / kpis.totalUsers < 0.5) {
      list.push({
        title: 'Low seat utilization',
        detail: `Only ${kpis.activeUsers} of ${kpis.totalUsers} licensed users showed activity in this range.`,
        severity: 'warning',
      });
    }
    if (dataset.duplicateCount > 0) {
      list.push({
        title: 'Duplicate rows removed',
        detail: `${dataset.duplicateCount} duplicate user/day record(s) were found across ingested files and de-duplicated automatically.`,
        severity: 'info',
      });
    }
    return list;
  });

  function formatNumber(n: number): string {
    return Math.round(n).toLocaleString();
  }

  function formatShare(sharePct: number): string {
    return sharePct > 0 && sharePct < 0.1 ? '<0.1%' : `${sharePct.toFixed(1)}%`;
  }
</script>

<main>
  <header class="report-header">
    <div>
      <h1>GitHub Copilot Usage Report</h1>
      <p class="subtitle">
        {#if range.start}
          {range.start} → {range.end} · {kpis.activeUsers} of {kpis.totalUsers} seats active
          · generated {new Date().toLocaleString()}
        {/if}
      </p>
    </div>
    <div class="header-actions no-print">
      <button
        type="button"
        class="theme-toggle-btn"
        onclick={toggleTheme}
        aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {$theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
      </button>
      {#if bounds.end}
        <ImportMenu latestDay={bounds.end} />
      {/if}
      <ExportMenu
        {range}
        {kpis}
        {trend}
        {models}
        {languages}
        {modelUsageByLanguage}
        {features}
        {ides}
        {topUsers}
        {dailyModelUsage}
        {concerns}
        sourceSummary={`${dataset.files.length} ingested file(s), ${allRecords.length} unique user/day records`}
        costKpis={allCostRecords.length > 0 ? costKpis : undefined}
        costByModel={allCostRecords.length > 0 ? costByModel : undefined}
        costByUser={allCostRecords.length > 0 ? costByUser : undefined}
        tokenPaymentByUser={allCostRecords.length > 0 ? tokenPaymentByUser : undefined}
        costTrend={allCostRecords.length > 0 ? costTrend : undefined}
        costEfficiencyByModel={allCostRecords.length > 0 ? costEfficiencyByModel : undefined}
      />
    </div>
  </header>

  <section class="controls no-print">
    {#if bounds.start}
      <DateRangeControl bind:range {bounds} />
    {/if}
  </section>

  <ConcernPanel items={concerns} />

  <section class="kpi-grid">
    <KpiCard label="Active Users" value={`${kpis.activeUsers} / ${kpis.totalUsers}`} sublabel="users with activity in range" icon={Users} />
    <KpiCard
      label="Agent Adoption"
      value={`${kpis.agentAdoptionRate.toFixed(0)}%`}
      sublabel={`${kpis.agentUsers} of ${kpis.activeUsers} active users used agent features`}
      icon={Bot}
    />
    <KpiCard
      label="Non-Agent Chat Adoption"
      value={`${kpis.chatAdoptionRate.toFixed(0)}%`}
      sublabel={`${kpis.chatUsers} of ${kpis.activeUsers} active users used Ask, Plan, Custom, or Inline chat`}
      icon={MessagesSquare}
    />
    <KpiCard
      label="CLI Adoption"
      value={`${kpis.cliAdoptionRate.toFixed(0)}%`}
      sublabel={`${kpis.cliUsers} of ${kpis.activeUsers} active users used CLI`}
      icon={Terminal}
    />
    <KpiCard
      label="Average Activity / User"
      value={formatNumber(kpis.averageActivityPerActiveUser)}
      sublabel="interactions + generations per active user"
      icon={Activity}
    />
    <KpiCard
      label="Active Days"
      value={`${kpis.activeDays} / ${kpis.totalDaysInRange}`}
      sublabel="calendar days with recorded activity"
      icon={CalendarCheck2}
    />
    <KpiCard label="Total Interactions" value={formatNumber(kpis.totalInteractions)} sublabel="user-initiated interactions" icon={MessageSquare} />
    <KpiCard label="Suggestions Generated" value={formatNumber(kpis.totalSuggestions)} icon={Sparkles} />
    <KpiCard label="Suggestions Accepted" value={formatNumber(kpis.totalAcceptances)} icon={CircleCheckBig} />
    <KpiCard
      label="Acceptance Rate"
      value={`${kpis.acceptanceRate.toFixed(1)}%`}
      tone={kpis.totalSuggestions > 0 && kpis.acceptanceRate < 20 ? 'warning' : 'good'}
      icon={Gauge}
    />
    <KpiCard label="Net LOC Added" value={formatNumber(kpis.totalLocAdded)} icon={CodeXml} />
    <KpiCard label="Net LOC Deleted" value={formatNumber(kpis.totalLocDeleted)} icon={Trash2} />
    <KpiCard
      label="Weekend Activity Share"
      value={`${kpis.weekendSharePct.toFixed(1)}%`}
      tone={kpis.weekendConcern ? 'warning' : 'default'}
      sublabel="of total activity"
      icon={CalendarDays}
    />
    <KpiCard
      label="Most Used Model"
      value={kpis.topModel?.name ?? '—'}
      sublabel={kpis.topModel ? `${kpis.topModel.sharePct.toFixed(1)}% of model activity` : ''}
      icon={Cpu}
    />
    <KpiCard
      label="Most Used Feature"
      value={kpis.topFeature?.name ?? '—'}
      sublabel={kpis.topFeature ? `${kpis.topFeature.sharePct.toFixed(1)}% of feature activity` : ''}
      icon={Zap}
    />
  </section>

  <section class="charts-grid">
    <TrendChart points={trend} costTrend={allCostRecords.length > 0 ? costTrend : []} />

    <div class="two-col">
      <RankBarChart title="Model Usage" items={models} color="#7c3aed" unit="generations" />
      <RankBarChart title="Feature Usage" items={features} color="#2563eb" unit="activity" />
    </div>

    <RankBarChart title="IDE Usage" items={ides} color="#0891b2" unit="activity" />

    <DailyModelUsageChart usage={dailyModelUsage} />

    <RankBarChart title="Top Users" items={topUsers} color="#059669" unit="activity" limit={10} />
  </section>

  {#if allCostRecords.length > 0}
    <section class="kpi-grid cost-kpis">
      <KpiCard label="Total AI Cost" value={`$${costKpis.totalNetCost.toFixed(2)}`} sublabel="net spend in range" icon={DollarSign} />
      <KpiCard label="Gross AI Cost" value={`$${costKpis.totalGrossCost.toFixed(2)}`} sublabel={`$${costKpis.totalDiscount.toFixed(2)} discounted`} icon={ReceiptText} />
      <KpiCard label="AI Credits Consumed" value={formatNumber(costKpis.totalCreditsUsed)} sublabel="ai-credits" icon={Coins} />
      <KpiCard
        label="Discount Coverage"
        value={`${costKpis.discountCoverageRate.toFixed(1)}%`}
        sublabel={`$${costKpis.totalDiscount.toFixed(2)} of gross cost covered`}
        icon={Percent}
      />
      <KpiCard
        label="Cost / Recorded Acceptance"
        value={`$${costPerAcceptedSuggestion.toFixed(3)}`}
        sublabel="directional proxy; includes non-acceptance activity"
        icon={BadgePercent}
      />
      <div class="cost-model-pair">
        <KpiCard
          label="Highest Cost Model"
          value={costKpis.topModelByCost?.name ?? '—'}
          sublabel={costKpis.topModelByCost ? `$${costKpis.topModelByCost.cost.toFixed(2)} · ${formatShare(costKpis.topModelByCost.sharePct)}` : ''}
          icon={TrendingUp}
        />
        <KpiCard
          label="Lowest Cost Model"
          value={costKpis.lowestModelByCost?.name ?? '—'}
          sublabel={costKpis.lowestModelByCost ? `$${costKpis.lowestModelByCost.cost.toFixed(2)} · ${formatShare(costKpis.lowestModelByCost.sharePct)}` : ''}
          icon={TrendingDown}
        />
      </div>
      <div class="cost-user-pair">
        <KpiCard
          label="Highest Cost User"
          value={costKpis.topUserByCost?.name ?? '—'}
          sublabel={costKpis.topUserByCost ? `$${costKpis.topUserByCost.cost.toFixed(2)} · ${costKpis.topUserByCost.sharePct.toFixed(1)}%` : ''}
          icon={Trophy}
        />
        <KpiCard
          label="Lowest Cost User"
          value={costKpis.lowestUserByCost?.name ?? '—'}
          sublabel={costKpis.lowestUserByCost ? `$${costKpis.lowestUserByCost.cost.toFixed(2)} · ${costKpis.lowestUserByCost.sharePct.toFixed(1)}%` : ''}
          icon={RubberDuck}
          iconLabel="Rubber duck"
        />
      </div>
      <KpiCard label="Cost per Active User" value={`$${costPerActiveUser.toFixed(2)}`} sublabel="net cost ÷ active users" icon={UserRoundCheck} />
    </section>

    <section class="charts-grid">
      <div class="two-col">
        <RankBarChart title="Cost by Model" items={costByModel} color="#dc2626" prefix="$" />
        <RankBarChart title="Cost by User" items={costByUser} color="#0d9488" prefix="$" limit={10} />
      </div>
      <TokenPaymentByUserChart items={tokenPaymentByUser} />
      <CostEfficiencyChart title="Cost / Recorded Acceptance by Model (Proxy)" items={costEfficiencyByModel} />
    </section>
  {/if}

  <section class="charts-grid language-charts">
    <LanguageUsageChart items={languages} />
    <ModelByLanguageChart breakdown={modelUsageByLanguage} />
  </section>

  <footer class="report-footer">
    <p>
      Generated locally in your browser from {dataset.files.length} ingested usage file(s) ({allRecords.length}
      unique user/day records){#if allCostRecords.length > 0}
        · {allCostRecords.length} matched cost record(s){#if costFilterResult.excludedCount > 0}
           (plus {costFilterResult.excludedCount} from other orgs in this Enterprise, excluded)
        {/if}
      {/if}. No data leaves this device.
    </p>
  </footer>
</main>
