<script lang="ts">
  import { buildStandaloneHtml, type ExportData } from '../export/htmlExport';
  import { downloadTextFile } from '../utils/download';

  let {
    range,
    kpis,
    trend,
    models,
    languages,
    modelUsageByLanguage,
    features,
    ides,
    topUsers,
    dailyModelUsage,
    concerns,
    sourceSummary,
    costKpis,
    costByModel,
    costByUser,
    tokenPaymentByUser,
    costTrend,
    costEfficiencyByModel,
    weekendUsageByUser,
  }: ExportData = $props();

  let open = $state(false);

  function printPdf() {
    open = false;
    window.print();
  }

  function exportHtml() {
    const html = buildStandaloneHtml({
      range,
      kpis,
      trend,
      models,
      languages,
      modelUsageByLanguage,
      features,
      ides,
      topUsers,
      dailyModelUsage,
      concerns,
      sourceSummary,
      costKpis,
      costByModel,
      costByUser,
      tokenPaymentByUser,
      costTrend,
      costEfficiencyByModel,
      weekendUsageByUser,
    });
    downloadTextFile(`copilot-usage-report_${range.start}_to_${range.end}.html`, html, 'text/html');
    open = false;
  }
</script>

<svelte:window
  onclick={(e) => {
    if (!open) return;
    const insideMenu = e.composedPath().some((el) => el instanceof HTMLElement && el.classList.contains('export-menu'));
    if (!insideMenu) open = false;
  }}
/>

<div class="export-menu">
  <button type="button" class="export-btn" onclick={() => (open = !open)}>⬇ Export ▾</button>
  {#if open}
    <div class="export-popover">
      <button type="button" onclick={printPdf}>🖨️ Print / Save as PDF</button>
      <button type="button" onclick={exportHtml}>📄 Export interactive HTML</button>
    </div>
  {/if}
</div>

<style>
  .export-menu {
    position: relative;
  }
  .export-btn {
    padding: 0.5rem 0.9rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-color);
    font: inherit;
    cursor: pointer;
  }
  .export-btn:hover {
    background: var(--hover-bg);
  }
  .export-popover {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 10;
    min-width: 220px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.4rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .export-popover button {
    text-align: left;
    font: inherit;
    font-size: 0.85rem;
    padding: 0.5rem 0.6rem;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-color);
    cursor: pointer;
    white-space: nowrap;
  }
  .export-popover button:hover {
    background: var(--hover-bg);
  }
</style>
