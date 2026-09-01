<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { RankedItem } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    title: string;
    items: RankedItem[];
    unit?: string;
    prefix?: string;
    color?: string;
    limit?: number;
  }

  let { title, items, unit = '', prefix = '', color = '#2563eb', limit = 8 }: Props = $props();

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
          data: top.map((i) => i.count),
          backgroundColor: color,
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
              return ` ${prefix}${item.count.toLocaleString()}${unit ? ` ${unit}` : ''} (${item.sharePct.toFixed(1)}%)`;
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { display: false } },
      },
    },
  });
</script>

<div class="chart-card">
  <h3>{title}</h3>
  {#if top.length > 0}
    <ChartCanvas {config} height={Math.max(180, top.length * 34)} />
  {:else}
    <p class="empty">No data in this range.</p>
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
  .empty {
    color: var(--muted-text);
    font-size: 0.85rem;
  }
</style>
