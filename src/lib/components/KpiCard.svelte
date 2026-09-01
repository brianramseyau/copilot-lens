<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte';

  interface Props {
    label: string;
    value: string;
    sublabel?: string;
    tone?: 'default' | 'warning' | 'good';
    icon?: LucideIcon;
    iconLabel?: string;
  }

  let { label, value, sublabel = '', tone = 'default', icon: Icon, iconLabel = '' }: Props = $props();
</script>

<div class="kpi-card tone-{tone}">
  {#if Icon}
    <span class="kpi-icon" role={iconLabel ? 'img' : undefined} aria-label={iconLabel || undefined} aria-hidden={iconLabel ? undefined : 'true'}>
      <Icon size={22} strokeWidth={2} />
    </span>
  {/if}
  <div class="kpi-label">{label}</div>
  <div class="kpi-value">{value}</div>
  {#if sublabel}<div class="kpi-sublabel">{sublabel}</div>{/if}
</div>

<style>
  .kpi-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.9rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    position: relative;
  }
  .kpi-icon {
    position: absolute;
    top: 0.8rem;
    right: 0.9rem;
    display: grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    color: var(--muted-text);
    font-size: 1.25rem;
    line-height: 1;
  }
  .kpi-card:has(.kpi-icon) .kpi-label { padding-right: 1.8rem; }
  .kpi-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted-text);
  }
  .kpi-value {
    font-size: 1.65rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1.1;
  }
  .kpi-sublabel {
    font-size: 0.75rem;
    color: var(--muted-text);
  }
  .tone-warning {
    border-color: var(--warning-border);
    background: var(--warning-bg);
  }
  .tone-warning .kpi-value {
    color: var(--warning-text);
  }
  .tone-good .kpi-value {
    color: var(--good-text);
  }
</style>
