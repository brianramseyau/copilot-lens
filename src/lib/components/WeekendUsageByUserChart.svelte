<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { WeekendUserBreakdown } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    items: WeekendUserBreakdown[];
    limit?: number;
  }

  let { items, limit = 10 }: Props = $props();

  let byActivity = $derived(
    items
      .filter((i) => i.activity > 0)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, limit),
  );
  let byCost = $derived(
    items
      .filter((i) => i.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit),
  );

  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  function barConfig(rows: WeekendUserBreakdown[], key: 'activity' | 'cost', color: string): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.username),
        datasets: [{ data: rows.map((r) => r[key]), backgroundColor: color, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#ffffff',
            bodyColor: '#e7e9ee',
            callbacks: {
              label: (ctx) => {
                const value = rows[ctx.dataIndex][key];
                return key === 'cost' ? ` Weekend cost: $${value.toFixed(2)}` : ` Weekend activity: ${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: textColor, callback: key === 'cost' ? (v) => `$${v}` : undefined },
            grid: { color: gridColor },
          },
          y: { ticks: { color: textColor }, grid: { display: false } },
        },
      },
    };
  }

  let activityConfig = $derived(barConfig(byActivity, 'activity', '#dc2626'));
  let costConfig = $derived(barConfig(byCost, 'cost', '#f59e0b'));
</script>

<div class="chart-card">
  <h3>Weekend Activity by User <span class="legend-note">(Saturday/Sunday)</span></h3>
  {#if byActivity.length > 0}
    <ChartCanvas config={activityConfig} height={Math.max(180, byActivity.length * 34)} />
  {:else}
    <p class="empty">No weekend activity in this range.</p>
  {/if}
</div>

<div class="chart-card">
  <h3>Weekend Cost by User <span class="legend-note">(Saturday/Sunday)</span></h3>
  {#if byCost.length > 0}
    <ChartCanvas config={costConfig} height={Math.max(180, byCost.length * 34)} />
  {:else}
    <p class="empty">No weekend cost data in this range.</p>
  {/if}
</div>

<style>
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }
  .chart-card h3 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: var(--text-color);
  }
  .legend-note {
    font-weight: 400;
    font-size: 0.75rem;
    color: var(--muted-text);
  }
  .empty {
    color: var(--muted-text);
    font-size: 0.85rem;
  }
</style>
