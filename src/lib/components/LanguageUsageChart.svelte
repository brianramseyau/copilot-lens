<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { RankedItem } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    items: RankedItem[];
  }

  let { items }: Props = $props();

  let colors = $derived(items.map((_item, index) => `hsl(${28 + (index * 47) % 332} 88% ${48 + (index % 3) * 8}%)`));
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  let config: ChartConfiguration<'doughnut'> = $derived({
    type: 'doughnut',
    data: {
      labels: items.map((item) => item.name),
      datasets: [{
        data: items.map((item) => item.count),
        backgroundColor: colors,
        borderColor: $theme === 'dark' ? '#1b1f2a' : '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
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
              const item = items[ctx.dataIndex];
              return ` ${item.name}: ${item.sharePct.toFixed(1)}% (${item.count.toLocaleString()} generations)`;
            },
          },
        },
      },
    },
  });
</script>

<div class="chart-card wide">
  <h3>Language Usage</h3>
  <p class="chart-note">Distribution of all languages represented in model generation activity.</p>
  {#if items.length > 0}
    <div class="language-layout">
      <div class="donut"><ChartCanvas {config} height={340} /></div>
      <ul class="language-legend">
        {#each items as item, index (item.name)}
          <li>
            <span class="swatch" style={`background:${colors[index]}`}></span>
            <span class="language-name">{item.name}</span>
            <span class="language-share">{item.sharePct.toFixed(1)}%</span>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="empty">No language data in this range.</p>
  {/if}
</div>

<style>
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }
  .chart-card.wide { grid-column: 1 / -1; }
  .chart-card h3 { margin: 0 0 0.2rem; font-size: 0.9rem; color: var(--text-color); }
  .chart-note, .empty { margin: 0 0 0.75rem; color: var(--muted-text); font-size: 0.75rem; }
  .language-layout { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(180px, 0.8fr); gap: 1rem; align-items: center; }
  .donut { min-width: 0; }
  .language-legend { list-style: none; margin: 0; padding: 0 0.25rem 0 0; max-height: 340px; overflow-y: auto; }
  .language-legend li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; gap: 0.45rem; align-items: center; padding: 0.22rem 0; font-size: 0.75rem; }
  .swatch { width: 10px; height: 10px; }
  .language-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .language-share { color: var(--muted-text); font-variant-numeric: tabular-nums; }
  @media (max-width: 720px) {
    .language-layout { grid-template-columns: 1fr; }
    .language-legend { max-height: 220px; }
  }
</style>
