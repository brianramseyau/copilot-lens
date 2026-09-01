<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Chart, type ChartConfiguration } from 'chart.js/auto';

  interface Props {
    config: ChartConfiguration;
    height?: number;
  }

  let { config, height = 260 }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | undefined>(undefined);
  let chart: Chart | undefined;

  $effect(() => {
    const cfg = config;
    if (!canvasEl) return;
    if (chart) {
      chart.data = cfg.data;
      chart.options = cfg.options ?? {};
      chart.update();
    } else {
      chart = new Chart(canvasEl, cfg);
    }
  });

  onDestroy(() => {
    chart?.destroy();
    chart = undefined;
  });
</script>

<div class="chart-wrap" style={`height:${height}px`}>
  <canvas bind:this={canvasEl}></canvas>
</div>

<style>
  .chart-wrap {
    position: relative;
    width: 100%;
  }
</style>
