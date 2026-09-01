<script lang="ts">
  import ChartCanvas from './ChartCanvas.svelte';
  import type { UserTokenPaymentBreakdown } from '../data/aggregate';
  import type { ChartConfiguration } from 'chart.js/auto';
  import { theme } from '../theme';

  interface Props {
    items: UserTokenPaymentBreakdown[];
  }

  let { items }: Props = $props();

  let textColor = $derived($theme === 'dark' ? '#cbd5e1' : '#334155');
  let gridColor = $derived($theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  let tooltipBg = $derived($theme === 'dark' ? '#262b38' : '#1a1f2b');

  const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

  let config: ChartConfiguration<'bar'> = $derived({
    type: 'bar',
    data: {
      labels: items.map((item) => item.username),
      datasets: [
        {
          label: 'Included / discount-covered',
          data: items.map((item) => item.includedTokens),
          backgroundColor: '#16a34a',
          borderRadius: 3,
        },
        {
          label: 'Extra paid',
          data: items.map((item) => item.paidTokens),
          backgroundColor: '#dc2626',
          borderRadius: 3,
        },
      ],
    },
    options: {
      indexAxis: 'y',
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
              const item = items[ctx.dataIndex];
              const value = ctx.datasetIndex === 0 ? item.includedTokens : item.paidTokens;
              const share = item.totalTokens > 0 ? (value / item.totalTokens) * 100 : 0;
              return ` ${ctx.dataset.label}: ${value.toLocaleString()} tokens (${share.toFixed(1)}%)`;
            },
            afterBody: (contexts) => {
              const item = items[contexts[0]?.dataIndex ?? 0];
              return [`Total: ${item.totalTokens.toLocaleString()} tokens`, `Extra paid cost: $${item.paidCost.toFixed(2)}`];
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: textColor, callback: (value) => compact.format(Number(value)) },
          grid: { color: gridColor },
          title: { display: true, text: 'Tokens', color: textColor },
        },
        y: { stacked: true, ticks: { color: textColor }, grid: { display: false } },
      },
    },
  });
</script>

<div class="chart-card wide">
  <h3>Included vs Extra-Paid Token Usage per User</h3>
  <p class="chart-note">
    Tokens are allocated proportionally using each cost row's discount-covered and net-paid amounts; this is an estimate because the export does not tag individual tokens.
  </p>
  {#if items.length > 0}
    <ChartCanvas {config} height={Math.max(320, items.length * 32)} />
  {:else}
    <p class="empty">No token and cost data in this range.</p>
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
</style>
