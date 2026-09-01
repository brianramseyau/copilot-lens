<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { ModelEfficiencyItem } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    title: string;
    items: ModelEfficiencyItem[];
    limit?: number;
  }

  let { title, items, limit = 8 }: Props = $props();

  let top = $derived(items.slice(0, limit));

  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  let config: ChartConfiguration<'bar'> = $derived({
    type: 'bar',
    data: {
      labels: top.map((i) => i.name),
      datasets: [
        {
          label: title,
          data: top.map((i) => i.costPerAcceptance),
          backgroundColor: '#f59e0b',
          borderRadius: 4,
        },
      ],
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
              const item = top[ctx.dataIndex];
              return ` $${item.costPerAcceptance.toFixed(2)} per accepted suggestion \u00b7 $${item.totalCost.toFixed(2)} total \u00b7 ${item.acceptedCount.toLocaleString()} accepted`;
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { color: textColor, callback: (v) => `$${v}` }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { display: false } },
      },
    },
  });
</script>

<div class="chart-card">
  <h3>{title}</h3>
  <p class="chart-note">Cost includes chat and agent activity that may not create an acceptance event.</p>
  {#if top.length > 0}
    <ChartCanvas {config} height={Math.max(180, top.length * 34)} />
  {:else}
    <p class="empty">Not enough overlapping usage/cost data by model to compare yet.</p>
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
    margin: 0 0 0.2rem;
    font-size: 0.9rem;
    color: var(--text-color);
  }
  .chart-note {
    margin: 0 0 0.75rem;
    color: var(--muted-text);
    font-size: 0.75rem;
  }
  .empty {
    color: var(--muted-text);
    font-size: 0.85rem;
  }
</style>
