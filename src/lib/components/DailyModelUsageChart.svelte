<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { DailyModelUsage } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    usage: DailyModelUsage;
  }

  let { usage }: Props = $props();

  const colors = ['#2563eb', '#7c3aed', '#16a34a', '#0891b2', '#d97706'];

  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  function formatDay(day: string): string {
    return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  let config: ChartConfiguration<'line'> = $derived({
    type: 'line',
    data: {
      labels: usage.days.map(formatDay),
      datasets: usage.series.map((series, index) => ({
        label: series.name,
        data: series.percentages,
        borderColor: colors[index % colors.length],
        backgroundColor: `${colors[index % colors.length]}55`,
        fill: true,
        pointRadius: 1.5,
        tension: 0.2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: textColor } },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#e7e9ee',
          callbacks: {
            label: (ctx) => {
              const requests = usage.series[ctx.datasetIndex]?.requests[ctx.dataIndex] ?? 0;
              return ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)}% (${requests.toLocaleString()} requests)`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, color: textColor }, grid: { color: gridColor } },
        y: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: { color: textColor, callback: (value) => `${value}%` },
          grid: { color: gridColor },
        },
      },
    },
  });
</script>

<div class="chart-card wide">
  <h3>Model Usage per Day</h3>
  <p class="chart-note">Daily share of model requests across chat modes, excluding code completions.</p>
  {#if usage.days.length > 0}
    <ChartCanvas {config} height={320} />
  {:else}
    <p class="empty">No chat model request data in this range.</p>
  {/if}
</div>

<style>
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }
  .chart-card.wide {
    grid-column: 1 / -1;
  }
  .chart-card h3 {
    margin: 0 0 0.2rem;
    font-size: 0.9rem;
    color: var(--text-color);
  }
  .chart-note,
  .empty {
    margin: 0 0 0.75rem;
    color: var(--muted-text);
    font-size: 0.75rem;
  }
</style>
