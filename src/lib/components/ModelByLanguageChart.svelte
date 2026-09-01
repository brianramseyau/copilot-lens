<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { LanguageModelBreakdown } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    breakdown: LanguageModelBreakdown;
  }

  let { breakdown }: Props = $props();

  let colors = $derived(breakdown.models.map((_model, index) => `hsl(${28 + (index * 47) % 332} 88% ${48 + (index % 3) * 8}%)`));
  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  let config: ChartConfiguration<'bar'> = $derived({
    type: 'bar',
    data: {
      labels: breakdown.languages,
      datasets: breakdown.models.map((model, index) => ({
        label: model,
        data: breakdown.percentages[model],
        backgroundColor: colors[index],
        borderWidth: 0,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: '#ffffff',
          bodyColor: '#e7e9ee',
          callbacks: {
            label: (ctx) => {
              const model = breakdown.models[ctx.datasetIndex];
              const count = breakdown.counts[model]?.[ctx.dataIndex] ?? 0;
              return ` ${model}: ${(ctx.parsed.y as number).toFixed(1)}% (${count.toLocaleString()} generations)`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true, ticks: { color: textColor, maxRotation: 45, minRotation: 0 }, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { color: textColor, callback: (value) => `${value}%` }, grid: { color: gridColor } },
      },
    },
  });
</script>

<div class="chart-card wide">
  <h3>Model Usage per Language</h3>
  <p class="chart-note">Share of all generation activity by language and model; every language and model is shown.</p>
  {#if breakdown.languages.length > 0}
    <ul class="model-legend">
      {#each breakdown.models as model, index (model)}
        <li><span class="swatch" style={`background:${colors[index]}`}></span>{model}</li>
      {/each}
    </ul>
    <div class="chart-scroll">
      <div style={`min-width:${Math.max(640, breakdown.languages.length * 82)}px`}>
        <ChartCanvas {config} height={Math.max(300, breakdown.models.length * 18)} />
      </div>
    </div>
  {:else}
    <p class="empty">No language/model data in this range.</p>
  {/if}
</div>

<style>
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    min-width: 0;
  }
  .chart-card.wide { grid-column: 1 / -1; }
  .chart-card h3 { margin: 0 0 0.2rem; font-size: 0.9rem; color: var(--text-color); }
  .chart-note, .empty { margin: 0 0 0.75rem; color: var(--muted-text); font-size: 0.75rem; }
  .model-legend { list-style: none; margin: 0 0 0.6rem; padding: 0.2rem 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 0.3rem 0.75rem; max-height: 88px; overflow-y: auto; }
  .model-legend li { display: flex; align-items: center; gap: 0.4rem; min-width: 0; font-size: 0.7rem; }
  .swatch { width: 10px; height: 10px; flex: 0 0 auto; }
  .chart-scroll { overflow-x: auto; }
</style>
