<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { DailyPoint, DailyCostPoint } from '../data/aggregate';
  import type { ChartConfiguration, Plugin } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    points: DailyPoint[];
    costTrend?: DailyCostPoint[];
  }

  let { points, costTrend = [] }: Props = $props();

  let costByDay = $derived(new Map(costTrend.map((p) => [p.date, p.cost])));
  let hasCost = $derived(costTrend.length > 0);

  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let weekendColor = $derived($theme === 'dark' ? 'rgba(248, 113, 113, 0.14)' : 'rgba(220, 38, 38, 0.09)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  function fmtDay(day: string): string {
    const d = new Date(`${day}T00:00:00Z`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Shades weekend day columns so spikes outside normal working days stand out.
  const weekendShading: Plugin<'line'> = {
    id: 'weekendShading',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const xScale = scales.x;
      const labels = (chart.data.labels ?? []) as string[];
      const colWidth = xScale.width / Math.max(labels.length, 1);
      ctx.save();
      labels.forEach((_label, i) => {
        if (!points[i]?.weekend) return;
        const center = xScale.getPixelForValue(i);
        ctx.fillStyle = weekendColor;
        ctx.fillRect(center - colWidth / 2, chartArea.top, colWidth, chartArea.bottom - chartArea.top);
      });
      ctx.restore();
    },
  };

  let config: ChartConfiguration<'line'> = $derived({
    type: 'line',
    data: {
      labels: points.map((p) => fmtDay(p.day)),
      datasets: [
        { label: 'Interactions', data: points.map((p) => p.interactions), borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.25, pointRadius: 3 },
        { label: 'Suggestions', data: points.map((p) => p.suggestions), borderColor: '#7c3aed', backgroundColor: '#7c3aed', tension: 0.25, pointRadius: 3 },
        { label: 'Acceptances', data: points.map((p) => p.acceptances), borderColor: '#059669', backgroundColor: '#059669', tension: 0.25, pointRadius: 3 },
        ...(hasCost
          ? [
              {
                label: 'Cost ($)',
                data: points.map((p) => costByDay.get(p.day) ?? 0),
                borderColor: '#f59e0b',
                backgroundColor: '#f59e0b',
                borderDash: [6, 4],
                tension: 0.25,
                pointRadius: 2,
                yAxisID: 'y1',
              },
            ]
          : []),
      ],
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
            afterTitle: (items) => (points[items[0]?.dataIndex ?? 0]?.weekend ? 'Weekend' : ''),
            label: (ctx) =>
              ctx.dataset.label === 'Cost ($)'
                ? ` Cost: $${(ctx.parsed.y as number).toFixed(2)}`
                : ` ${ctx.dataset.label}: ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true, color: textColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
        ...(hasCost
          ? {
              y1: {
                position: 'right' as const,
                beginAtZero: true,
                ticks: { color: textColor, callback: (v: string | number) => `$${v}` },
                grid: { drawOnChartArea: false },
              },
            }
          : {}),
      },
    },
    plugins: [weekendShading],
  });
</script>

<div class="chart-card wide">
  <h3>
    Daily Activity Trend <span class="legend-note">(red shading = weekend{hasCost ? ' · dashed = daily cost' : ''})</span>
  </h3>
  {#if points.length > 0}
    <ChartCanvas {config} height={320} />
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
  .chart-card.wide {
    grid-column: 1 / -1;
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
